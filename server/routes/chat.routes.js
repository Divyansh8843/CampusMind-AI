import express from "express";
import rateLimit from "express-rate-limit";
import authMiddleware from "../middleware/auth.js";
import {
  callAiService,
  isAiUnavailableError,
  summarizeAiError,
} from "../services/aiGateway.js";
import { validatePromptInput, validateSupportScope, validateStudyScope } from "../middleware/aiSafety.js";
import { buildLegalContextForSupport } from "../data/platformLegal.js";

import Chat from "../models/Chat.js";
import Document from "../models/Document.js";
import User from "../models/User.js";
import { buildStudyDocumentQuery } from "../utils/documentFilters.js";

const router = express.Router();

const guestSupportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many support requests. Please try again shortly." },
});

// GET /api/chat/wakeup - Proactively wake up the AI service from hibernate
router.get("/wakeup", async (req, res) => {
  try {
    // Fire-and-forget ping to the AI service's health endpoint
    // We catch errors silently so the frontend doesn't need to know if it's currently asleep
    const baseUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    fetch(`${baseUrl}/health`).catch(() => {});
    return res.status(200).json({ status: "waking_up" });
  } catch (error) {
    return res.status(200).json({ status: "error_ignored" });
  }
});

const SUPPORT_FALLBACK_RESPONSES = [
  {
    match: /privacy|data|personal information|retention|cookies/i,
    reply:
      "**CampusMind AI Privacy Policy Summary:**\n\nWe collect account data (name, email, college domain), academic files you upload, and optional browser geolocation for the India Live Map.\n\n🔒 Key points:\n• We do NOT sell your personal data\n• Uploaded documents are stored securely and only accessible to you\n• Location data is never stored on our servers\n• You can delete your account and all data at any time\n\nRead the full Privacy Policy at **/privacy** on our website.",
  },
  {
    match: /terms|acceptable use|liability|termination|refund/i,
    reply:
      "**CampusMind AI Terms of Service Summary:**\n\n• Students must sign in with authorized college domains (.ac.in, .edu.in, .edu)\n• Alumni require Google OAuth + AI-powered verification\n• AI-generated content is for educational assistance only — not guaranteed advice\n• Subscriptions auto-renew; cancel anytime before renewal\n• Accounts violating acceptable use policies may be terminated\n\nRead the full Terms of Service at **/terms** on our website.",
  },
  {
    match: /price|plan|subscription|cost|pay|free|premium/i,
    reply:
      "**CampusMind AI Pricing Plans:**\n\n🆓 **Free Plan** — Core study chat, resume upload, basic interview practice\n💼 **Monthly Plan** — Full AI features: unlimited study sessions, AI mock interviews, alumni network, live jobs & hackathons, priority AI responses\n🎓 **Yearly Plan** — Everything in Monthly at a discounted rate\n\nVisit the **Pricing** page for live plan details and checkout.",
  },
  {
    match: /alumni|mentor|verify|verification|trust score/i,
    reply:
      "**CampusMind Alumni Verification (AI-Powered):**\n\n1. Sign in with Gmail and complete your alumni profile\n2. Upload your resume (PDF/Word)\n3. Click **Run AI Verification**\n\nThe **Trust Score Engine** compares your profile against your resume:\n• Name match: 15 pts\n• College match: 25 pts\n• Degree & Branch: 25 pts\n• Graduation year: 15 pts\n• Company/Work history: 10 pts\n• LinkedIn profile: 10 pts\n\n✅ **Score ≥ 90** → Verified Alumni (automatic)\n⏳ **Score 70–89** → Pending — additional proof required\n❌ **Score < 70** → Failed — update resume/profile and retry",
  },
  {
    match: /login|sign in|google|student|account|register/i,
    reply:
      "**CampusMind AI Sign-In Guide:**\n\n🎓 **Students** → Sign in with your college Google account (must end in .ac.in, .edu.in, or .edu). No separate registration needed.\n\n👨‍💼 **Alumni** → Sign in with Gmail, then complete your profile and run AI Verification to unlock alumni features.\n\n🔑 All authentication is handled through **Google OAuth** — no passwords to remember.",
  },
  {
    match: /feature|what.*can|what.*do|platform|campusmind offer|tell me about|overview|introduce/i,
    reply:
      "**CampusMind AI — Full Platform Features:**\n\n📚 **AI Study Chat** — Chat with your uploaded documents (PDFs, notes, slides). Ask exam questions and get context-aware answers.\n\n📝 **Resume Analyzer** — AI reviews your resume against job descriptions, finds skill gaps, and suggests ATS-friendly improvements.\n\n🎙️ **Mock Interviews** — AI-powered technical & HR interview practice with real-time feedback and scoring.\n\n💼 **Jobs Board** — Curated internship and job listings for students and fresh graduates.\n\n🏆 **Hackathons** — Discover and join coding competitions and tech events.\n\n📅 **AI Study Planner** — Generate personalized study schedules and roadmaps.\n\n🎓 **Alumni Network** — Verified alumni connect with students for mentorship and referrals.\n\n🗺️ **India Live Map** — See other CampusMind users across India in real time (privacy-first, opt-in).\n\n🔐 **AI Alumni Verification** — Trust Score Engine auto-verifies alumni using resume + profile matching.",
  },
  {
    match: /resume|interview|job|hackathon/i,
    reply:
      "**CampusMind AI Career Tools:**\n\n📝 **Resume Analyzer** — Upload your resume and a job description. AI identifies skill gaps and suggests stronger bullet points.\n\n🎙️ **Mock Interviews** — Practice technical & HR rounds with an AI interviewer. Get scored and receive feedback after each answer.\n\n💼 **Jobs** — Browse internships and entry-level positions curated for students.\n\n🏆 **Hackathons** — Find upcoming coding competitions and tech challenges.",
  },
];

const buildSupportFallback = (message = "") => {
  const matched = SUPPORT_FALLBACK_RESPONSES.find((item) => item.match.test(message));
  if (matched) return matched.reply;
  return "Hello! I'm **CampusMind AI Support**. I can help you with:\n\n• 🔐 Login & account setup\n• 💰 Pricing & subscription plans\n• 🎓 Alumni verification process\n• 📝 Resume tools & mock interviews\n• 💼 Jobs & hackathons\n• 🛡️ Privacy policy (/privacy)\n• 📜 Terms of service (/terms)\n• ✨ Platform features & how-tos\n\nWhat would you like to know?";
};

const buildSupportContextChunks = (message = "") => {
  const { privacyText, termsText } = buildLegalContextForSupport();
  const chunks = [
    {
      source: "CampusMind Support Knowledge Base",
      content:
        "Alumni verification is AI-powered: Google OAuth → profile completion → resume intelligence → trust score (name 15, college 25, degree 15, branch 10, graduation year 15, company 10, LinkedIn 10). Score ≥ 90 = verified automatically. Score 70–89 = pending/additional proof. Below 70 = failed. Continuous trust monitoring recalculates on profile/resume updates. Privacy: /privacy. Terms: /terms.",
    },
    {
      source: "CampusMind Platform Overview",
      content:
        "CampusMind AI is an India-wide academic platform with study chat (RAG on uploaded documents), resume analyzer, mock interviews, jobs, hackathons, planner, AI alumni verification with trust scoring, and live India map using browser geolocation. Privacy Policy: /privacy. Terms of Service: /terms.",
    },
  ];

  if (/privacy|data|personal|retention|location|cookies|collect/i.test(message)) {
    chunks.unshift({ source: "Privacy Policy", content: privacyText.slice(0, 4500) });
  }
  if (/terms|acceptable|liability|termination|refund|eligibility|service/i.test(message)) {
    chunks.unshift({ source: "Terms of Service", content: termsText.slice(0, 4500) });
  }

  return chunks.slice(0, 5);
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "about",
  "based",
  "batao",
  "for",
  "from",
  "how",
  "i",
  "is",
  "ki",
  "kya",
  "me",
  "my",
  "of",
  "on",
  "please",
  "summary",
  "the",
  "to",
  "with",
]);
const MAX_CONTEXT_CHUNKS = 6;
const CHUNK_SIZE = 1200;

const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const splitIntoChunks = (text = "") => {
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const chunks = [];
  for (let start = 0; start < cleaned.length; start += CHUNK_SIZE) {
    chunks.push(cleaned.slice(start, start + CHUNK_SIZE));
  }
  return chunks;
};

const buildStudyContextChunks = async (userId, message) => {
  const user = await User.findById(userId).select("resumeDocumentId").lean();
  const docs = await Document.find(buildStudyDocumentQuery(userId, user?.resumeDocumentId))
    .select("+textContent originalName uploadDate")
    .sort({ uploadDate: -1 })
    .lean();

  const queryTokens = tokenize(message);
  const rankedChunks = [];

  docs.forEach((doc) => {
    const sourceName = doc.originalName || "Uploaded document";
    const sourceText =
      `${sourceName} ${(doc.textContent || "").slice(0, 1000)}`.toLowerCase();
    const sourceBonus = queryTokens.reduce(
      (score, token) => score + (sourceText.includes(token) ? 2 : 0),
      0,
    );

    splitIntoChunks(doc.textContent).forEach((chunk, index) => {
      const loweredChunk = chunk.toLowerCase();
      const tokenScore = queryTokens.reduce(
        (score, token) => score + (loweredChunk.includes(token) ? 3 : 0),
        0,
      );
      const score = sourceBonus + tokenScore;
      if (score > 0 || (!queryTokens.length && index === 0)) {
        rankedChunks.push({
          source: sourceName,
          content: chunk,
          score,
          recency: new Date(doc.uploadDate || 0).getTime(),
        });
      }
    });
  });

  return rankedChunks
    .sort((a, b) => b.score - a.score || b.recency - a.recency)
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map(({ source, content }) => ({ source, content }));
};

const buildStudyFallbackResponse = (contextChunks) => {
  if (!contextChunks.length) {
    return "I could not find matching text in your uploaded documents. Please upload the relevant file or try a more specific question.";
  }

  const excerpts = contextChunks
    .slice(0, 3)
    .map(
      (chunk, index) =>
        `${index + 1}. ${chunk.source}: ${chunk.content.slice(0, 280).trim()}${chunk.content.length > 280 ? "..." : ""}`,
    )
    .join("\n");

  return [
    "AI service is temporarily unavailable, but I found these relevant excerpts from your uploaded documents:",
    excerpts,
  ].join("\n\n");
};

// GET /api/chat/history - Get User Chat History (Paginated)
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const type = req.query.type || "study";
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const query = { userId: req.user.userId };
    if (type !== "all") query.type = type;

    const history = await Chat.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      history: history.reverse(),
      hasMore: history.length === limit,
      page,
    });
  } catch (error) {
    console.error("Chat History Error:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// GET /api/chat/sessions - Get Chat Sessions (grouped by date)
router.get("/sessions", authMiddleware, async (req, res) => {
  try {
    const type = req.query.type || "study";

    const query = { userId: req.user.userId };
    if (type !== "all") query.type = type;

    const chats = await Chat.find(query).sort({ timestamp: -1 }).limit(100);

    const sessionsMap = {};
    chats.forEach((chat) => {
      const date = new Date(chat.timestamp).toLocaleDateString();
      if (!sessionsMap[date]) {
        sessionsMap[date] = {
          date,
          messages: [],
          messageCount: 0,
        };
      }
      sessionsMap[date].messages.push({
        role: chat.role,
        content: chat.content,
        timestamp: chat.timestamp,
      });
      sessionsMap[date].messageCount += 1;
    });

    const sessions = Object.values(sessionsMap).sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    res.json({ sessions });
  } catch (error) {
    console.error("Chat Sessions Error:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
});

// POST /api/chat/guest - Public support chat (no authentication required)
router.post("/guest", guestSupportLimiter, async (req, res) => {
  try {
    const { message, type = "support" } = req.body;
    if (type !== "support") {
      return res.status(400).json({ message: "Guest chat supports support queries only." });
    }

    const safety = validatePromptInput(message);
    if (!safety.ok) {
      return res.status(400).json({ message: safety.reason });
    }

    const scope = validateSupportScope(message);
    if (!scope.allowed) {
      return res.json({ response: scope.message, scoped: true });
    }

    try {
      const aiResponse = await callAiService(
        "/chat",
        {
          message,
          type: "support",
          user_id: "guest",
          context_chunks: buildSupportContextChunks(message),
        },
        { timeout: 45000 },
      );

      let finalResponse =
        aiResponse?.data?.response ||
        buildSupportFallback(message);

      if (finalResponse !== null && typeof finalResponse === "object") {
        finalResponse = finalResponse.content || JSON.stringify(finalResponse);
      }

      return res.json({ response: finalResponse });
    } catch (aiError) {
      console.error("Guest support AI error:", aiError?.message || aiError);
      return res.json({
        response: buildSupportFallback(message),
        degraded: true,
      });
    }
  } catch (error) {
    console.error("Guest Chat Error:", error);
    return res.status(500).json({ message: "Support bot failed to respond" });
  }
});

// POST /api/chat - Advanced Local Agentic RAG Response
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message, type = "study" } = req.body;
    const userId = req.user.userId;

    const safety = validatePromptInput(message);

    if (!safety.ok) {
      return res.status(400).json({
        message: safety.reason,
      });
    }

    const contextChunks =
      type === "study" ? await buildStudyContextChunks(userId, message) : [];

    if (type === "support") {
      const scope = validateSupportScope(message);
      if (!scope.allowed) {
        await Chat.create({ userId, role: "user", content: message, type });
        await Chat.create({ userId, role: "assistant", content: scope.message, type });
        return res.json({ response: scope.message, scoped: true });
      }
    }

    if (type === "study") {
      const scope = validateStudyScope(message, contextChunks.length > 0);
      if (!scope.allowed) {
        await Chat.create({ userId, role: "user", content: message, type });
        await Chat.create({ userId, role: "assistant", content: scope.message, type });
        return res.json({ response: scope.message, scoped: true });
      }
    }

    const supportChunks = type === "support" ? buildSupportContextChunks(message) : [];

    // Production-safe chunks
    const safeChunks = (type === "study" ? contextChunks : supportChunks)
      .slice(0, 5)
      .map((chunk) => ({
        source: String(chunk.source || "CampusMind").slice(0, 500),
        content: String(chunk.content || "").slice(0, 5000),
      }));

    try {
      const aiResponse = await callAiService(
        "/chat",
        {
          message,
          type,
          user_id: userId,
          context_chunks: safeChunks,
        },
        {
          timeout: 60000,
        },
      );

      let finalResponse =
        aiResponse?.data?.response ||
        "I'm having trouble connecting to my brain.";

      if (finalResponse !== null && typeof finalResponse === "object") {
        finalResponse = finalResponse.content || JSON.stringify(finalResponse);
      }

      await Chat.create({
        userId,
        role: "user",
        content: message,
        type,
      });

      await Chat.create({
        userId,
        role: "assistant",
        content: finalResponse,
        type,
      });

      return res.json({
        response: finalResponse,
      });
    } catch (aiError) {
      console.error("========== AI ERROR ==========");
      console.error(aiError?.response?.data);
      console.error(aiError?.message);
      console.error(aiError);
      console.error("==============================");

      if (!isAiUnavailableError(aiError)) {
        console.error("AI Service Error:", summarizeAiError(aiError));
      }

      const fallbackResponse =
        type === "study"
          ? buildStudyFallbackResponse(safeChunks)
          : "AI service is temporarily unavailable. Please try again in a moment.";

      await Chat.create({
        userId,
        role: "user",
        content: message,
        type,
      });

      await Chat.create({
        userId,
        role: "assistant",
        content: fallbackResponse,
        type,
      });

      return res.json({
        response: fallbackResponse,
        degraded: true,
      });
    }
  } catch (error) {
    console.error("Chat Error:", error);

    return res.status(500).json({
      message: "Agent failed to process request",
    });
  }
});

export default router;
