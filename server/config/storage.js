import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "20", 10);
const UPLOAD_ROOT = path.resolve(__dirname, "..", "uploads");
const LOCAL_PROVIDER = "local";
const S3_PROVIDER = "s3";

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

// Setup AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  },
});

export const isS3Configured = () =>
  Boolean(
    process.env.AWS_BUCKET_NAME &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );

// Legacy export to prevent breaking upload.routes.js
export const isCloudinaryConfigured = isS3Configured;

const buildLocalFileName = (userId, originalName) => {
  const ext = sanitizeExtension(originalName);
  const base = sanitizeBaseName(originalName);
  return path.posix.join(
    "documents",
    String(userId),
    `${Date.now()}-${base}${ext}`,
  );
};

const uploadToS3 = async (file, userId) => {
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || "us-east-1";
  const ext = sanitizeExtension(file.originalname);
  const base = sanitizeBaseName(file.originalname);
  const key = `documents/${userId}/${Date.now()}-${base}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return {
    provider: S3_PROVIDER,
    filename: key,
    url: url,
    bytes: file.size,
    resourceType: "raw",
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

  if (isS3Configured()) {
    try {
      return await uploadToS3(file, userId);
    } catch (error) {
      console.warn(`S3 upload failed (${error.message}). Falling back to local storage.`);
      return uploadLocally(file, userId);
    }
  }

  return uploadLocally(file, userId);
};

const deleteFromS3 = async (key) => {
  const bucket = process.env.AWS_BUCKET_NAME;
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3.send(command);
  console.log(`Deleted ${key} from S3 bucket ${bucket}`);
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
    if (provider === S3_PROVIDER || provider === "cloudinary") {
      // If it was labeled cloudinary in old DB, we assume it's S3 now due to migration, or we just try S3 delete. 
      // Safest is to just call deleteFromS3.
      console.log(`Deleting S3 file: ${filename}`);
      await deleteFromS3(filename);
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
