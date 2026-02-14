import express from "express";
import axios from "axios";
// import fs from "fs"; // No longer needed
import FormData from "form-data";
import Document from "../models/Document.js";
import Log from "../models/Log.js";
import authMiddleware from "../middleware/auth.js";
import redisClient from "../config/redis.js";
import upload from "../config/s3.js"; // IMPORT S3 UPLOADER
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const router = express.Router();

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const CACHE_TTL = 3600;

// GET /api/upload/stats - Admin Only
router.get("/stats", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Admin only" });

        const stats = await Document.aggregate([
            { 
                $group: { 
                    _id: null, 
                    totalSize: { $sum: "$size" }, 
                    totalCount: { $sum: 1 },
                    avgSize: { $avg: "$size" }
                } 
            }
        ]);
        
        res.json({ success: true, stats: stats[0] || { totalSize: 0, totalCount: 0, avgSize: 0 } });
    } catch (e) {
        console.error("Doc Stats Error:", e);
        res.status(500).json({ message: "Stats failed" });
    }
});

// Helper to clear user specific cache
const clearUserCache = async (userId) => {
    try {
        if (redisClient.isOpen) {
             await redisClient.del(`docs:${userId}`);
        }
    } catch (e) {
        console.error("Redis Cache Clear Error:", e);
    }
};

// POST /api/upload - Upload to S3 + Local AI Indexing
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  console.log("File uploaded to S3:", req.file.location);

  try {
    // 1. Local Agentic Indexing (No External API Key)
    // Fetch file from S3 to Memory for Extraction
    let extractedText = "";
    
    if (req.file.mimetype === "application/pdf") {
  try {
    const pdfResponse = await axios.get(req.file.location, {
      responseType: "arraybuffer",
    });

    const pdfParse = (await import("pdf-parse")).default;

    const buffer = Buffer.from(pdfResponse.data);
    const data = await pdfParse(buffer);

    extractedText = data.text?.substring(0, 50000) || "";
    console.log(`Extracted ${extractedText.length} chars from PDF`);
  } catch (err) {
    console.error("PDF Parsing Failed:", err.message);
    extractedText = "Text extraction failed or file is image-based.";
  }

    } else {
        // For TXT/MD/JS etc.
        try {
            const textBuffer = await axios.get(req.file.location, { responseType: 'text' });
            extractedText = typeof textBuffer.data === 'string' ? textBuffer.data.substring(0, 50000) : "";
        } catch (e) {
            console.log("Text fetch failed");
        }
    }

    // 2. Save document record to DB with Text Content
    const newDoc = new Document({
      userId: req.user.userId,
      filename: req.file.key, // S3 Key
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size,
      url: req.file.location, // Store S3 URL
      textContent: extractedText || ""
    });

    await newDoc.save();

    // 3. Log
    await Log.create({
        user: req.user.email,
        action: 'File Upload (S3)',
        details: req.file.originalname,
        timestamp: new Date()
    });

    // 4. Cache
    await clearUserCache(req.user.userId);

    res.status(200).json({ success: true, document: newDoc });

  } catch (error) {
    console.error("Upload/Indexing Error:", error);
    
    // Try to delete from S3 if AI indexing fails
    try {
      if (req.file && req.file.key) {
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: req.file.key
        }));
        console.log("Cleaned up S3 file after indexing failure");
      }
    } catch (cleanupError) {
      console.error("S3 cleanup error:", cleanupError);
    }
    
    res.status(500).json({ 
      message: "Failed to process upload", 
      error: error.response?.data?.detail || error.message 
    });
  }
});

// GET /api/upload/all - Admin only - Fetch all documents (Paginated)
router.get("/all", authMiddleware, async (req, res) => {
  try {
      if (req.user.role !== "admin") {
          return res.status(403).json({ message: "Access denied. Admin only." });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const { search, branch } = req.query;
      const skip = (page - 1) * limit;

      const matchStage = {};
      if (branch && branch !== 'All') {
          matchStage['userDetails.branch'] = branch;
      }
      if (search) {
          matchStage.$or = [
              { originalName: { $regex: search, $options: 'i' } },
              { 'userDetails.name': { $regex: search, $options: 'i' } },
              { 'userDetails.email': { $regex: search, $options: 'i' } },
              { 'userDetails.enrollment': { $regex: search, $options: 'i' } }
          ];
      }

      const result = await Document.aggregate([
          {
              $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'userDetails'
              }
          },
          { $unwind: '$userDetails' }, // Ensures only docs with valid users are shown
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
                              userId: {
                                  _id: '$userDetails._id',
                                  name: '$userDetails.name',
                                  email: '$userDetails.email',
                                  branch: '$userDetails.branch',
                                  enrollment: '$userDetails.enrollment'
                              }
                          }
                      }
                  ]
              }
          }
      ]);

      const documents = result[0].data;
      const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

      res.status(200).json({ 
          success: true, 
          documents,
          pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
          }
      });
  } catch (error) {
      console.error("Fetch All Docs Error:", error);
      res.status(500).json({ message: "Failed to fetch all documents" });
  }
});

// GET /api/upload (Paginated + Filters)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const { search, type } = req.query;
    const skip = (page - 1) * limit;
    
    // Create Cache Key based on all params
    const cacheKey = `docs:${req.user.userId}:${page}:${search || ''}:${type || ''}`;

    if (redisClient.isOpen) {
        const cachedDocs = await redisClient.get(cacheKey);
        if (cachedDocs) {
            return res.status(200).json(JSON.parse(cachedDocs));
        }
    }

    const query = { userId: req.user.userId };
    if (search) {
        query.originalName = { $regex: search, $options: 'i' };
    }
    if (type && type !== 'All') {
        // e.g. .pdf, .docx. Simple contains or endsWith check
        query.originalName = { $regex: type, $options: 'i' };
    }

    const [documents, total] = await Promise.all([
        Document.find(query)
            .sort({ uploadDate: -1 })
            .skip(skip)
            .limit(limit),
        Document.countDocuments(query)
    ]);
    
    const response = { 
        success: true, 
        documents, 
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        },
        cached: false 
    };

    if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify({ ...response, cached: true }));
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Fetch Docs Error:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

// DELETE /api/upload/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
      const query = { _id: req.params.id };
      if (req.user.role !== 'admin') {
          query.userId = req.user.userId;
      }

      const doc = await Document.findOneAndDelete(query);
      
      if (!doc) {
          return res.status(404).json({ message: "Document not found" });
      }

      // Delete from S3
      if (doc.filename) {
          await s3.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: doc.filename
          }));
      }

      await Log.create({
        user: req.user.email,
        action: 'File Delete (S3)',
        details: doc.originalName,
        timestamp: new Date()
    });

      if (redisClient.isOpen) {
          await redisClient.del(`docs:${doc.userId}`);
      }

      res.json({ success: true, message: "Document deleted" });
  } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ message: "Failed to delete document" });
  }
});

export default router;
