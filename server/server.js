import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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

const app = express();

// 1. Security Headers (Helmet)
// Helps protect from well-known web vulnerabilities like XSS, clickjacking, etc.
app.use(helmet());

// 2. Enhanced CORS
// In a real production environment, 'origin' should be set to the specific client URL (e.g., https://campusmind.college.edu)
// For local testing/demo, we keep it flexible but safe.
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

import paymentRoutes from "./routes/payment.routes.js";

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// SPECIAL: Mount Webhook before express.json() to ensure raw body
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Routes
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
// 5. Robust Error Handling
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected securely"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit if DB connection fails
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running securely on http://localhost:${PORT}`));
app.get("/health", (req, res) => {
   res.status(200).json({
      status: "OK",
      message: "API is running"
   });
});