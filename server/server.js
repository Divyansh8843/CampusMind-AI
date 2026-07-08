import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import axios from "axios";

import chatRoutes from "./routes/chat.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import authRoutes from "./routes/auth.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import logRoutes from "./routes/log.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import plannerRoutes from "./routes/planner.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import hackathonRoutes from "./routes/hackathon.routes.js";
import studyRoutes from "./routes/study.routes.js";
import communityRoutes from "./routes/community.routes.js";
import peersRoutes from "./routes/peers.routes.js";
import syllabusRoutes from "./routes/syllabus.routes.js";
import metaRoutes from "./routes/meta.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { UPLOAD_ROOT, isCloudinaryConfigured } from "./config/storage.js";
import { getMongoUri, validateStartupEnv } from "./utils/startupValidation.js";
import { getAiServiceUrl, initAiProcessManager } from "./services/aiGateway.js";

const startupErrors = validateStartupEnv();
if (startupErrors.length) {
  console.error("Startup configuration errors:");
  startupErrors.forEach((message) => console.error(` - ${message}`));
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || (isProduction ? "300" : "2000"), 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || "30", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Please try again later.",
});

app.use("/api/auth/google", authLimiter);
app.use("/api/", apiLimiter);
app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.JSON_BODY_LIMIT || "10mb",
  }),
);

if (!isProduction) {
  app.use("/uploads", express.static(UPLOAD_ROOT));
}

app.get("/api/health", async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  let aiOk = false;

  try {
    const aiResponse = await axios.get(`${getAiServiceUrl()}/ready`, { timeout: 4000 });
    aiOk = aiResponse.status === 200;
  } catch {
    aiOk = false;
  }

  const healthy = mongoOk && aiOk;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? "OK" : "degraded",
    checks: {
      mongo: mongoOk ? "up" : "down",
      ai: aiOk ? "up" : "down",
    },
  });
});

app.use("/api/payment", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/log", logRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/peers", peersRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/meta", metaRoutes);

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack || err.message);
  const isClientError =
    err?.name === "MulterError" ||
    /unsupported file type/i.test(err?.message || "") ||
    /file too large/i.test(err?.message || "");
  res.status(isClientError ? 400 : 500).json({
    success: false,
    message: isClientError ? err.message : "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const MONGO_URI = getMongoUri();

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Auto-start the Python AI service (no manual start needed)
    initAiProcessManager().catch((err) =>
      console.warn("[AI Manager] Non-fatal startup error:", err?.message || err)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`CampusMind server running on http://127.0.0.1:${PORT}`);
  console.log(`Storage: ${isCloudinaryConfigured() ? "cloudinary" : "local"}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
