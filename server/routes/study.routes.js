import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Update current study topic
router.post('/topic', authMiddleware, async (req, res) => {
    try {
        const { topic } = req.body;
        await User.findByIdAndUpdate(req.user.userId, { 
            currentStudyTopic: topic,
            lastStudyActive: new Date()
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to update topic" });
    }
});

// Find Study Buddies (Peer Match)
router.get('/match', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user.currentStudyTopic) {
            return res.json({ peers: [], message: "Set a study topic first!" });
        }

        // Find users studying same topic in last 24 hours
        // Match by Topic OR Skills overlap
        const query = {
            _id: { $ne: req.user.userId },
            // Active in last 24 hours (Study or General)
            $or: [
                { lastStudyActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
                { lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            ]
        };

        const orConditions = [];
        if (user.currentStudyTopic) {
            orConditions.push({ currentStudyTopic: { $regex: user.currentStudyTopic, $options: 'i' } });
        }
        if (user.skills && user.skills.length > 0) {
            orConditions.push({ skills: { $in: user.skills } });
        }
        
        // If we have criteria, enforce them. If not, just finding active users is okay for now (or fail).
        if (orConditions.length > 0) {
            query.$and = [{ $or: orConditions }];
        }

        const peers = await User.find(query)
            .select('name picture currentStudyTopic level skills')
            .limit(10);

        res.json({ peers });
    } catch (error) {
        console.error("Peer Match Error:", error);
        res.status(500).json({ message: "Failed to find peers" });
    }
});

export default router;
