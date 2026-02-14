import express from "express";
import Log from "../models/Log.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/log", authMiddleware, async (req, res) => {
    try {
        const { action, details } = req.body;
        
        await Log.create({
            user: req.user.email,
            action: action || "Feature Access",
            details: details || "",
            timestamp: new Date()
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Log Error:", error);
        res.status(500).json({ message: "Failed to log activity" });
    }
});

export default router;
