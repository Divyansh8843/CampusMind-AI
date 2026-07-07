import express from "express";
import authMiddleware from "../middleware/auth.js";
import InterviewResult from "../models/InterviewResult.js";
import { callAiService } from "../services/aiGateway.js";
import { validatePromptInput } from "../middleware/aiSafety.js";

import { checkUsageLimit, incrementUsage } from "../middleware/usage.js";

const router = express.Router();

// POST /api/interview/chat
router.post("/chat", authMiddleware, async (req, res) => {
  try {
      const { history, user_response, topic } = req.body;
      const safety = validatePromptInput(user_response || topic || "");
      if (!safety.ok) {
          return res.status(400).json({ message: safety.reason });
      }
      
      const response = await callAiService("/interview", {
        history: history || [],
        user_response: user_response || "",
        topic: topic || "Computer Science Fundamentals"
      });
      
      res.json(response.data);
  } catch (error) {
      console.error("Interview Agent Error:", error?.message);
      // Graceful degradation when AI service is unavailable
      return res.json({
        response: "The AI interview assistant is temporarily warming up. Please wait a moment and try again. Your session is preserved.",
        degraded: true,
      });
  }
});

// POST /api/interview/aptitude
router.post("/aptitude", authMiddleware, async (req, res) => {
    try {
        const { topic } = req.body;
        const safety = validatePromptInput(topic || "General Aptitude");
        if (!safety.ok) {
            return res.status(400).json({ message: safety.reason });
        }
        const response = await callAiService("/aptitude", {
            topic: topic || "General Aptitude"
        });
        res.json(response.data);
    } catch (error) {
        console.error("Aptitude Gen Error:", error?.message);
        return res.json({
            questions: [],
            message: "Aptitude test generation is temporarily unavailable. Please try again in a moment.",
            degraded: true,
        });
    }
});

// POST /api/interview/feedback - Generate & Save Mock Interview Result (with optional voice transcript for filler analysis)
router.post("/feedback", authMiddleware, checkUsageLimit('interview'), async (req, res) => {
    try {
        const { history, topic, user_transcript } = req.body;
        const response = await callAiService("/feedback", {
            history,
            topic,
            user_transcript: user_transcript || ""
        });
        
        await incrementUsage(req.user.userId, 'interview');
        
        const feedbackData = response.data;

        // Save Result
        await InterviewResult.create({
            userId: req.user.userId,
            type: 'mock',
            topic,
            score: feedbackData.score || 0,
            feedback: feedbackData.feedback,
            details: feedbackData
        });

        res.json(feedbackData);
    } catch (error) {
        console.error("Feedback Gen Error:", error);
        res.status(500).json({ message: "Failed to generate feedback" });
    }
});

// POST /api/interview/save - Save Aptitude Result
router.post("/save", authMiddleware, async (req, res) => {
    try {
        const { type, topic, score, feedback } = req.body;
        
        await InterviewResult.create({
            userId: req.user.userId,
            type: type || 'aptitude',
            topic,
            score,
            feedback
        });

        res.json({ success: true, message: "Result saved" });
    } catch (error) {
        console.error("Save Result Error:", error);
        res.status(500).json({ message: "Failed to save result" });
    }
});

export default router;
