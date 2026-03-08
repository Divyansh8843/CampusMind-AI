import express from "express";
import axios from "axios";
import authMiddleware from "../middleware/auth.js";

import Chat from "../models/Chat.js";
import Document from "../models/Document.js";

const router = express.Router();

// GET /api/chat/history - Get User Chat History (Paginated)
router.get("/history", authMiddleware, async (req, res) => {
    try {
        const type = req.query.type || 'study'; 
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const history = await Chat.find({ userId: req.user.userId, type: type })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
            
        res.json({ 
            history: history.reverse(),
            hasMore: history.length === limit,
            page: page
        });
    } catch (error) {
        console.error("Chat History Error:", error);
        res.status(500).json({ message: "Failed to fetch history" });
    }
});

// GET /api/chat/sessions - Get Chat Sessions (grouped by date)
router.get("/sessions", authMiddleware, async (req, res) => {
    try {
        const type = req.query.type || 'study';
        const chats = await Chat.find({ userId: req.user.userId, type: type })
            .sort({ timestamp: -1 })
            .limit(100);
        
        const sessionsMap = {};
        chats.forEach(chat => {
            const date = new Date(chat.timestamp).toLocaleDateString();
            if (!sessionsMap[date]) {
                sessionsMap[date] = {
                    date,
                    messages: [],
                    messageCount: 0
                };
            }
            sessionsMap[date].messages.push({
                role: chat.role,
                content: chat.content,
                timestamp: chat.timestamp
            });
            sessionsMap[date].messageCount++;
        });
        
        const sessions = Object.values(sessionsMap).sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        res.json({ sessions });
    } catch (error) {
        console.error("Chat Sessions Error:", error);
        res.status(500).json({ message: "Failed to fetch sessions" });
    }
});

// POST /api/chat - Advanced Local Agentic RAG Response
router.post("/", authMiddleware, async (req, res) => {
  try {
      const { message, type = 'study' } = req.body;
      const userId = req.user.userId;

      // 1. Call Python AI Service
      try {
          const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
          const aiResponse = await axios.post(`${aiUrl}/chat`, {
              message: message,
              type: type
          });

          let finalResponse = aiResponse.data.response || "I'm having trouble connecting to my brain.";
          if (finalResponse !== null && typeof finalResponse === 'object') {
              finalResponse = finalResponse.content || JSON.stringify(finalResponse);
          }

          // 2. Save User Message
          await Chat.create({
              userId: userId,
              role: 'user',
              content: message,
              type: type
          });

          // 3. Save AI Response
          await Chat.create({
              userId: userId,
              role: 'assistant',
              content: finalResponse,
              type: type
          });

          res.json({ response: finalResponse });

      } catch (aiError) {
          console.error("AI Service Error:", aiError.message);
          // Fallback if Python service is down
          res.json({ response: "⚠️ AI Service is offline. Please start the python backend (cd ai-service && python -m app.main)" });
      }

  } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ message: "Agent failed to process request" });
  }
});

export default router;
