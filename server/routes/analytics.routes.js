import express from "express";
import authMiddleware from "../middleware/auth.js";
import User from "../models/User.js";
import Document from "../models/Document.js";
import Resume from "../models/Resume.js";
import InterviewResult from "../models/InterviewResult.js";
import Chat from "../models/Chat.js";
import { TeamRequest } from "../models/TeamRequest.js";

const router = express.Router();

// GET /api/analytics/leaderboard - Global Leaderboard (High Scale)
router.get("/leaderboard", authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const branch = req.query.branch || 'All';
        const skip = (page - 1) * limit;

        // Optimized Query using Indexes
        const query = { role: 'student' };
        if (branch !== 'All') {
            query.branch = branch;
        }
        if (req.query.year && req.query.year !== 'All Years') {
            query.year = req.query.year;
        }
        if (req.query.skill && req.query.skill !== 'All Skills') {
            query.skills = { $regex: req.query.skill, $options: 'i' };
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ xp: -1 }) // Uses Index { branch: 1, xp: -1 } or { xp: -1 }
                .skip(skip)
                .limit(limit)
                .select('name picture branch xp enrollment year skills')
                .lean(),
            User.countDocuments(query)
        ]);

        // Map xp to totalXP for frontend compatibility if needed, 
        // though we can also just update frontend. Let's map it.
        const leaderboard = users.map(u => ({
            ...u,
            totalXP: u.xp || 0
        }));

        res.json({ 
            success: true, 
            leaderboard,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
});

// GET /api/analytics/me - Student's own usage & Update XP (Lazy Sync)
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Parallel Fetch
        const [user, docCount, resumeCount, interviewCount, chatCount, interviewSum] = await Promise.all([
            User.findById(userId).select("usage subscription xp branch"),
            Document.countDocuments({ userId }),
            Resume.countDocuments({ userId }),
            InterviewResult.countDocuments({ userId }),
            Chat.countDocuments({ userId }),
            InterviewResult.aggregate([
                { $match: { userId: new Date(userId) } }, // No cast needed usually, but safe
                 // Wait, userId in mongoose is ObjectId.
                 // aggregate match needs ObjectId matching. 
                 // Mongoose handles it if passed correctly, but aggregate is raw.
                 // Better to use find/reduce for simplicity if not massive, OR just sum score.
                 // Actually aggregate is best.
                 // { $match: { userId: mongoose.Types.ObjectId(userId) } }
            ])
        ]);

        const matchCount = await TeamRequest.countDocuments({ 
            status: 'matched', 
            $or: [{ userId }, { matchedWith: userId }] 
        });

        // Better Interview Sum Logic
        const interviews = await InterviewResult.find({ userId }).select('score');
        const totalInterviewScore = interviews.reduce((acc, curr) => acc + (curr.score || 0), 0);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Calculate XP
        const newXP = totalInterviewScore + (resumeCount * 20) + (docCount * 5) + (matchCount * 100);
        
        // Update User XP if changed (Lazy Sync)
        if (user.xp !== newXP) {
            user.xp = newXP;
            await user.save();
        }

        const FREE_LIMIT = 3;
        const resumeRemaining = ['monthly', 'yearly'].includes(user.subscription?.plan) && user.subscription?.status === 'active'
            ? Infinity : Math.max(0, FREE_LIMIT - (user.usage?.resumeAnalysis || 0));
        const interviewRemaining = ['monthly', 'yearly'].includes(user.subscription?.plan) && user.subscription?.status === 'active'
            ? Infinity : Math.max(0, FREE_LIMIT - (user.usage?.mockInterviews || 0));

        // Recent items
        const recentResumes = await Resume.find({ userId }).sort({ timestamp: -1 }).limit(5).lean();
        const recentInterviews = await InterviewResult.find({ userId }).sort({ timestamp: -1 }).limit(5).lean();

        res.json({
            success: true,
            data: {
                xp: newXP,
                usage: {
                    resumeAnalysis: user.usage?.resumeAnalysis || 0,
                    mockInterviews: user.usage?.mockInterviews || 0,
                    resumeRemaining,
                    interviewRemaining,
                    isPremium: ['monthly', 'yearly'].includes(user.subscription?.plan)
                },
                totals: {
                    documents: docCount,
                    resumeAnalyses: resumeCount,
                    interviews: interviewCount,
                    chatSessions: chatCount
                },
                recentResumes: recentResumes.map(r => ({ score: r.score, timestamp: r.timestamp, topic: r.jobDescription })),
                recentInterviews: recentInterviews.map(i => ({ score: i.score, type: i.type, topic: i.topic, timestamp: i.timestamp }))
            }
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
});

export default router;
