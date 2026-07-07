import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "20", 10);
const CLOUDINARY_TIMEOUT_MS = parseInt(
  process.env.CLOUDINARY_TIMEOUT_MS || "120000",
  10,
);
const UPLOAD_ROOT = path.resolve(__dirname, "..", "uploads");
const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";
const LOCAL_PROVIDER = "local";
const CLOUDINARY_PROVIDER = "cloudinary";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

const allowedExtensions = new Set([
  ".pdf",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".json",
]);

const sanitizeBaseName = (name = "document") =>
  name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document";

const sanitizeExtension = (name = "") => {
  const ext = path.extname(name).toLowerCase();
  return allowedExtensions.has(ext) ? ext : "";
};

const sanitizeFolderPath = (folder = "campusmind") => {
  const normalized = String(folder)
    .split(/[\\/]+/)
    .map((segment) => sanitizeBaseName(segment))
    .filter(Boolean);

  return normalized.join("/") || "campusmind";
};

const ensureUploadDir = async (targetDir) => {
  await fs.mkdir(targetDir, { recursive: true });
};

const isAllowedFile = (file) => {
  const ext = sanitizeExtension(file?.originalname || "");
  return allowedMimeTypes.has(file?.mimetype) || Boolean(ext);
};

const buildLocalFileName = (userId, originalName) => {
  const ext = sanitizeExtension(originalName);
  const base = sanitizeBaseName(originalName);
  return path.posix.join(
    "documents",
    String(userId),
    `${Date.now()}-${base}${ext}`,
  );
};

const getServerBaseUrl = () =>
  (
    process.env.SERVER_PUBLIC_URL ||
    `http://127.0.0.1:${process.env.PORT || 3000}`
  )
    .trim()
    .replace(/\/$/, "");

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );

const shouldFallbackToLocal = () =>
  String(process.env.CLOUDINARY_FALLBACK_TO_LOCAL || "true").toLowerCase() !==
  "false";

const shouldFallbackToLocalOnError = (error) => {
  if (!shouldFallbackToLocal()) return false;
  return Boolean(error?.code || error?.response?.status || error?.message);
};

const signCloudinaryParams = (params) => {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const serialized = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
};

const buildCloudinaryTarget = (userId, originalName) => {
  const baseFolder = sanitizeFolderPath(
    process.env.CLOUDINARY_FOLDER || "campusmind",
  );
  return {
    folder: path.posix.join(baseFolder, "documents", String(userId)),
    publicId: `${Date.now()}-${sanitizeBaseName(originalName)}`,
  };
};

const uploadToCloudinary = async (file, userId) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const { folder, publicId } = buildCloudinaryTarget(userId, file.originalname);
  const timestamp = Math.floor(Date.now() / 1000);
  const resourceType = "raw";

  const signature = signCloudinaryParams({
    folder,
    public_id: publicId,
    timestamp,
  });

  const form = new FormData();
  form.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const { data } = await axios.post(
    `${CLOUDINARY_API_BASE}/${cloudName}/${resourceType}/upload`,
    form,
    {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: CLOUDINARY_TIMEOUT_MS,
    },
  );

  return {
    provider: CLOUDINARY_PROVIDER,
    filename: data.public_id || path.posix.join(folder, publicId),
    url: data.secure_url,
    bytes: data.bytes || file.size,
    resourceType,
  };
};

const uploadLocally = async (file, userId) => {
  const relativeName = buildLocalFileName(userId, file.originalname);
  const targetPath = path.join(UPLOAD_ROOT, relativeName);
  await ensureUploadDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, file.buffer);

  return {
    provider: LOCAL_PROVIDER,
    filename: relativeName.replace(/\\/g, "/"),
    url: `${getServerBaseUrl()}/uploads/${relativeName.replace(/\\/g, "/")}`,
    bytes: file.size,
    resourceType: "raw",
  };
};

export const storeUploadedFile = async (file, { userId }) => {
  if (!file?.buffer?.length) {
    throw new Error("No file buffer found for upload.");
  }

  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(file, userId);
    } catch (error) {
      const shouldFallback = shouldFallbackToLocalOnError(error);
      const cloudinaryMessage =
        error?.response?.data?.error?.message ||
        error?.response?.headers?.["x-cld-error"] ||
        error?.message ||
        "Unknown Cloudinary error";

      if (!shouldFallback) {
        throw error;
      }

      console.warn(
        `Cloudinary upload failed (${cloudinaryMessage}). Falling back to local storage.`,
      );
      return uploadLocally(file, userId);
    }
  }

  return uploadLocally(file, userId);
};

const deleteFromCloudinary = async (publicId) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = signCloudinaryParams({
    public_id: publicId,
    timestamp,
  });

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/raw/destroy`,
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 20000,
    },
  );

  console.log("Cloudinary delete response:", response.data);

  return response.data;
};

const deleteLocalFile = async (filename) => {
  const absolutePath = path.join(UPLOAD_ROOT, filename);
  await fs.unlink(absolutePath);
};

export const deleteStoredAsset = async (doc) => {
  const provider = doc?.storageProvider || doc?.provider || "local";
  const filename = doc?.filename;

  if (!filename) {
    console.log("No filename found");
    return;
  }

  try {
    if (provider === "cloudinary") {
      console.log("Deleting Cloudinary file:", filename);

      await deleteFromCloudinary(filename);

      console.log("Cloudinary file deleted successfully");

      return;
    }

    if (provider === "local") {
      console.log("Deleting local file:", filename);

      await deleteLocalFile(filename);

      console.log("Local file deleted successfully");
    }
  } catch (error) {
    console.error("Storage deletion error:", error);

    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};

export const resolveDocumentViewUrl = (doc) => {
  if (doc?.url) return doc.url;
  if (doc?.filename)
    return `${getServerBaseUrl()}/uploads/${String(doc.filename).replace(/\\/g, "/")}`;
  return null;
};

const fileFilter = (req, file, cb) => {
  if (!isAllowedFile(file)) {
    cb(
      new Error("Unsupported file type. Use PDF, DOCX, TXT, MD, CSV, or JSON."),
    );
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter,
});

export { UPLOAD_ROOT };
export default upload;
