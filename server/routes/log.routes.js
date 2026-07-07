import express from "express";
import Log from "../models/Log.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Log Activity
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

// GET All Logs (Admin Only)
router.get("/all", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            Log.find().sort({ timestamp: -1 }).skip(skip).limit(limit),
            Log.countDocuments()
        ]);

        res.json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching logs" });
    }
});

export default router;
