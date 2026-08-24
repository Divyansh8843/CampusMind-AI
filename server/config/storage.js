import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "20", 10);
const UPLOAD_ROOT = path.resolve(__dirname, "..", "uploads");
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

const ensureUploadDir = async (targetDir) => {
  await fs.mkdir(targetDir, { recursive: true });
};

const isAllowedFile = (file) => {
  const ext = sanitizeExtension(file?.originalname || "");
  return allowedMimeTypes.has(file?.mimetype) || Boolean(ext);
};

const getServerBaseUrl = () =>
  (
    process.env.SERVER_PUBLIC_URL ||
    `http://127.0.0.1:${process.env.PORT || 3000}`
  )
    .trim()
    .replace(/\/$/, "");

// Setup Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

// Legacy export to prevent breaking other files expecting isS3Configured
export const isS3Configured = isCloudinaryConfigured;

const buildLocalFileName = (userId, originalName) => {
  const ext = sanitizeExtension(originalName);
  const base = sanitizeBaseName(originalName);
  return path.posix.join(
    "documents",
    String(userId),
    `${Date.now()}-${base}${ext}`,
  );
};

const uploadToCloudinary = async (file, userId) => {
  return new Promise((resolve, reject) => {
    const ext = sanitizeExtension(file.originalname);
    const base = sanitizeBaseName(file.originalname);
    const filename = `${Date.now()}-${base}${ext}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `documents/${userId}`,
        public_id: filename,
        resource_type: "raw",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          provider: CLOUDINARY_PROVIDER,
          filename: result.public_id,
          url: result.secure_url,
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
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
      if (process.env.NODE_ENV === "production" && process.env.CLOUDINARY_FALLBACK_TO_LOCAL !== "true") {
        console.error(`Cloudinary upload fatal error: ${error.message}`);
        throw new Error(`Cloudinary Upload Failed: ${error.message}. Please check credentials.`);
      }
      console.warn(`Cloudinary upload failed (${error.message}). Falling back to local storage.`);
      return uploadLocally(file, userId);
    }
  }

  if (process.env.NODE_ENV === "production" && process.env.CLOUDINARY_FALLBACK_TO_LOCAL !== "true") {
    throw new Error("Production Error: Cloudinary is not configured in the environment variables!");
  }
  return uploadLocally(file, userId);
};

const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: "raw" }, (error, result) => {
      if (error) return reject(error);
      console.log(`Deleted ${publicId} from Cloudinary`);
      resolve(result);
    });
  });
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
    if (provider === CLOUDINARY_PROVIDER || provider === "s3") {
      console.log(`Deleting Cloudinary file: ${filename}`);
      await deleteFromCloudinary(filename);
      return;
    }

    if (provider === LOCAL_PROVIDER) {
      console.log(`Deleting local file: ${filename}`);
      await deleteLocalFile(filename);
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
