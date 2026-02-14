import express from "express";
import axios from "axios";
import authMiddleware from "../middleware/auth.js";
import InterviewResult from "../models/InterviewResult.js";

import { checkUsageLimit, incrementUsage } from "../middleware/usage.js";

const router = express.Router();

// POST /api/interview/chat
router.post("/chat", authMiddleware, async (req, res) => {
  try {
      const { history, user_response, topic } = req.body;
      
      const response = await axios.post(process.env.AI_SERVICE_URL + "/interview", {
        history: history || [],
        user_response: user_response || "",
        topic: topic || "Computer Science Fundamentals"
      });
      
      res.json(response.data);
  } catch (error) {
      console.error("Interview Agent Error:", error);
      res.status(500).json({ message: "Failed to communicate with Interview Agent" });
  }
});

// POST /api/interview/aptitude
router.post("/aptitude", authMiddleware, async (req, res) => {
    try {
        const { topic } = req.body;
        const response = await axios.post(process.env.AI_SERVICE_URL + "/aptitude", {
            topic: topic || "General Aptitude"
        });
        res.json(response.data);
    } catch (error) {
        console.error("Aptitude Gen Error:", error);
        res.status(500).json({ message: "Failed to generate aptitude test" });
    }
});

// POST /api/interview/feedback - Generate & Save Mock Interview Result
// This is the "End Interview" step, so we count usage here.
router.post("/feedback", authMiddleware, checkUsageLimit('interview'), async (req, res) => {
    try {
        const { history, topic } = req.body;
        const response = await axios.post(process.env.AI_SERVICE_URL + "/feedback", {
            history,
            topic
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
