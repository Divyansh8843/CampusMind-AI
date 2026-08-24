import express from "express";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import Document from "../models/Document.js";
import Log from "../models/Log.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";
import redisClient from "../config/redis.js";
import { buildStudyDocumentQuery } from "../utils/documentFilters.js";
import upload, {
  deleteStoredAsset,
  isCloudinaryConfigured,
  resolveDocumentViewUrl,
  storeUploadedFile,
  UPLOAD_ROOT,
} from "../config/storage.js";
import { callAiService } from "../services/aiGateway.js";

const router = express.Router();
const CACHE_TTL = 3600;

const extractTextFromFile = async (file) => {
  if (!file?.buffer?.length) return "";

  const lowerName = (file.originalname || "").toLowerCase();
  const maxChars = 100000;

  if (file.mimetype === "application/pdf" || lowerName.endsWith(".pdf")) {
    try {
      const pdfParse = (await import("../utils/pdf-wrapper.cjs")).default;
      const data = await pdfParse(file.buffer);
      return (data.text || "").slice(0, maxChars);
    } catch (error) {
      console.error("PDF extraction failed:", error.message);
      return "";
    }
  }

  if (
    file.mimetype.startsWith("text/") ||
    [".txt", ".md", ".csv", ".json"].some((ext) => lowerName.endsWith(ext))
  ) {
    return file.buffer.toString("utf8").slice(0, maxChars);
  }

  return "";
};

const clearUserCache = async (userId) => {
  if (!redisClient.isOpen) return;

  try {
    const keys = [];

    for await (const key of redisClient.scanIterator({
      MATCH: `docs:${userId}*`,
      COUNT: 100,
    })) {
      if (key) keys.push(key);
    }

    if (keys.length > 0) {
      // Use raw sendCommand to bypass any wrapper signature bugs in node-redis v4/v5
      await redisClient.sendCommand(['DEL', ...keys.map(k => String(k))]);
      console.log(`Cleared ${keys.length} cache keys for user ${userId}`);
    }
  } catch (error) {
    // Non-fatal — cache miss is acceptable
    console.warn("Redis cache clear warning:", error.message);
  }
};

const decorateDocument = (doc) => {
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    ...plain,
    viewUrl: resolveDocumentViewUrl(plain),
  };
};

const getAiErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Unknown AI sync error";

const syncDocumentToAi = async (doc, userId, file) => {
  try {
    await callAiService("/upload", {
      file_url: doc.url,
      user_id: String(userId),
      document_id: String(doc._id),
      document_name: doc.originalName,
      content_type: doc.fileType,
    });
    return { method: "remote_url" };
  } catch (urlError) {
    if (!file?.buffer?.length) {
      throw urlError;
    }

    const form = new FormData();
    form.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    form.append("user_id", String(userId));
    form.append("document_id", String(doc._id));
    form.append("document_name", doc.originalName);

    try {
      await callAiService("/upload", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      return {
        method: "direct_file_upload",
        recoveredFrom: getAiErrorMessage(urlError),
      };
    } catch (fileError) {
      throw new Error(
        `URL indexing failed: ${getAiErrorMessage(urlError)}. Direct file indexing failed: ${getAiErrorMessage(fileError)}`,
      );
    }
  }
};

const removeDocumentFromAi = async (doc, userId) => {
  try {
    await callAiService("/documents/delete", {
      document_id: String(doc._id),
      user_id: String(userId || doc.userId),
    });
  } catch (error) {
    console.error("AI document cleanup error:", error.message);
  }
};

const buildUserDocQuery = (userId, search, type, resumeDocumentId = null) =>
  buildStudyDocumentQuery(userId, resumeDocumentId, { search, type });

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const stats = await Document.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$size" },
          totalCount: { $sum: 1 },
          avgSize: { $avg: "$size" },
        },
      },
    ]);

    res.json({
      success: true,
      stats: stats[0] || { totalSize: 0, totalCount: 0, avgSize: 0 },
      storageProvider: isCloudinaryConfigured() ? "cloudinary" : "local",
    });
  } catch (error) {
    console.error("Doc stats error:", error);
    res.status(500).json({ message: "Stats failed" });
  }
});

router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  let storedAsset = null;
  let documentRecord = null;

  try {
    const category = req.body?.category === "resume" ? "resume" : "study";
    storedAsset = await storeUploadedFile(req.file, {
      userId: req.user.userId,
    });
    const extractedText = await extractTextFromFile(req.file);

    documentRecord = await Document.create({
      userId: req.user.userId,
      filename: storedAsset.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      size: storedAsset.bytes || req.file.size,
      url: storedAsset.url,
      storageProvider: storedAsset.provider,
      textContent: extractedText,
      category,
    });

    await Log.create({
      user: req.user.email,
      action: `File Upload (${storedAsset.provider})`,
      details: req.file.originalname,
      timestamp: new Date(),
    });

    await clearUserCache(req.user.userId);

    let aiSyncStatus = category === "resume" ? "skipped" : "indexed";
    let aiSyncMessage = category === "resume" ? "Profile resume stored separately from study documents." : "";
    if (category !== "resume") {
      try {
        const aiSyncResult = await syncDocumentToAi(
          documentRecord,
          req.user.userId,
          req.file,
        );
        if (aiSyncResult?.method === "direct_file_upload") {
          aiSyncMessage = "Indexed through direct file upload fallback.";
        }
      } catch (aiError) {
        aiSyncStatus = "deferred";
        aiSyncMessage = aiError?.response?.data?.detail || aiError.message;
        console.error("AI indexing deferred:", aiSyncMessage);
      }
    }

    res.status(200).json({
      success: true,
      document: decorateDocument(documentRecord),
      indexing: {
        status: aiSyncStatus,
        message: aiSyncMessage || undefined,
      },
    });
  } catch (error) {
    console.error("Upload processing error:", error);
    const statusCode =
      error?.response?.status && error.response.status < 500
        ? error.response.status
        : 500;

    if (documentRecord?._id) {
      await Document.deleteOne({ _id: documentRecord._id }).catch(() => null);
    }

    if (storedAsset) {
      await deleteStoredAsset({
        filename: storedAsset.filename,
        storageProvider: storedAsset.provider,
      }).catch((cleanupError) =>
        console.error("Stored asset cleanup error:", cleanupError.message),
      );
    }

    res.status(statusCode).json({
      message: "Failed to process upload",
      error: error.response?.data?.detail || error.message,
    });
  }
});

router.get("/all", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const { search, branch } = req.query;
    const skip = (page - 1) * limit;
    const matchStage = {};

    if (branch && branch !== "All") {
      matchStage["userDetails.branch"] = branch;
    }

    if (search) {
      matchStage.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { "userDetails.name": { $regex: search, $options: "i" } },
        { "userDetails.email": { $regex: search, $options: "i" } },
        { "userDetails.enrollment": { $regex: search, $options: "i" } },
      ];
    }

    const result = await Document.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      { $match: matchStage },
      { $sort: { uploadDate: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                originalName: 1,
                uploadDate: 1,
                size: 1,
                fileType: 1,
                url: 1,
                filename: 1,
                storageProvider: 1,
                userId: {
                  _id: "$userDetails._id",
                  name: "$userDetails.name",
                  email: "$userDetails.email",
                  branch: "$userDetails.branch",
                  enrollment: "$userDetails.enrollment",
                },
              },
            },
          ],
        },
      },
    ]);

    const documents = (result[0]?.data || []).map((doc) =>
      decorateDocument(doc),
    );
    const total = result[0]?.metadata?.[0]?.total || 0;

    res.status(200).json({
      success: true,
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Fetch all docs error:", error);
    res.status(500).json({ message: "Failed to fetch all documents" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
    const skip = (page - 1) * limit;
    const { search, type } = req.query;

    const user = await User.findById(req.user.userId).select("resumeDocumentId").lean();
    const query = buildUserDocQuery(req.user.userId, search, type, user?.resumeDocumentId);

    const [total, documents] = await Promise.all([
      Document.countDocuments(query),
      Document.find(query).sort({ uploadDate: -1 }).skip(skip).limit(limit),
    ]);

    res.json({
      success: true,
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Document fetch error:", error.message);

    res.status(500).json({
      message: "Failed to fetch documents",
    });
  }
});

router.get("/file/:id", authMiddleware, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") {
      query.userId = req.user.userId;
    }

    const doc = await Document.findOne(query);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (doc.storageProvider === "cloudinary" && doc.url) {
      return res.redirect(doc.url);
    }

    const absolutePath = path.join(UPLOAD_ROOT, doc.filename);
    if (!absolutePath.startsWith(UPLOAD_ROOT)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.setHeader("Content-Type", doc.fileType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(doc.originalName || "document")}"`,
    );
    return fs.createReadStream(absolutePath).pipe(res);
  } catch (error) {
    console.error("File stream error:", error.message);
    res.status(500).json({ message: "Failed to retrieve file" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const query = { _id: req.params.id };

    if (req.user.role !== "admin") {
      query.userId = req.user.userId;
    }

    const doc = await Document.findOneAndDelete(query);

    if (!doc) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    console.log("Deleting document:");
    console.log({
      mongoId: doc._id,
      filename: doc.filename,
      provider: doc.storageProvider,
      url: doc.url,
    });

    await clearUserCache(doc.userId);

    await deleteStoredAsset(doc);

    await removeDocumentFromAi(doc, req.user.userId);

    res.json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    console.error("Delete doc error:", error);

    res.status(500).json({
      message: "Failed to delete document",
    });
  }
});

export default router;
