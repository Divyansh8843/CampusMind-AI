import express from 'express';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Synchronized Global Pomodoro Timer Logic
const POMODORO_CYCLE_MS = 30 * 60 * 1000; // 30 minutes per cycle
const FOCUS_MSECS = 25 * 60 * 1000;       // 25 minutes focus
const BREAK_MSECS = 5 * 60 * 1000;        // 5 minutes break

// In-memory active meta-campus rooms caching to be incredibly fast
const activeUsers = new Map();

router.post('/join', authMiddleware, async (req, res) => {
    try {
        const { topic } = req.body;
        const userId = req.user.id;
        
        // Update user in DB for persistence and profile metrics
        const user = await User.findById(userId);
        if (user) {
            user.currentStudyTopic = topic || 'General Study';
            user.lastStudyActive = new Date();
            await user.save();
            
            // Register in real-time fast-access map
            activeUsers.set(userId, {
                id: userId,
                name: user.name,
                picture: user.picture,
                topic: topic || 'General Study',
                lastPing: Date.now()
            });
        }
        
        // Clean up stale users (inactive for > 2 mins without ping)
        for (let [id, data] of activeUsers.entries()) {
            if (Date.now() - data.lastPing > 2 * 60 * 1000) {
                activeUsers.delete(id);
            }
        }
        
        // Calculate Global Synchronized Pomodoro State
        const now = Date.now();
        const cycleElapsed = now % POMODORO_CYCLE_MS;
        
        let phase = 'focus';
        let timeRemaining = 0;
        
        if (cycleElapsed < FOCUS_MSECS) {
            phase = 'focus';
            timeRemaining = FOCUS_MSECS - cycleElapsed;
        } else {
            phase = 'break';
            timeRemaining = POMODORO_CYCLE_MS - cycleElapsed;
        }
        
        // Fetch all current active students connected
        const students = Array.from(activeUsers.values());

        res.json({
            success: true,
            timer: {
                phase, // 'focus' | 'break'
                timeRemaining, // ms
                cycleDuration: phase === 'focus' ? FOCUS_MSECS : BREAK_MSECS
            },
            students: students
        });

    } catch (err) {
        console.error("MetaCampus Error:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/leave', authMiddleware, async (req, res) => {
    try {
        activeUsers.delete(req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

export default router;
