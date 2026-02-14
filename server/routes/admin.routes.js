import express from 'express';
import User from '../models/User.js';
import Log from '../models/Log.js';
import Document from '../models/Document.js';
import Resume from '../models/Resume.js';
import InterviewResult from '../models/InterviewResult.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Admin Middleware
const adminCheck = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin only." });
    }
};

router.get('/stats', authMiddleware, adminCheck, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        
        // Active Sessions (Unique users logged in within last 30 minutes)
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        const activeUsers = await Log.distinct("user", { 
            action: "User Login", 
            timestamp: { $gte: thirtyMinsAgo } 
        });
        const activeSessions = activeUsers.length || 0;
        
        // Fetch Real Logs
        const logs = await Log.find().sort({ timestamp: -1 }).limit(20);

        // Format logs for frontend
        const formattedLogs = logs.map(log => ({
            id: log._id,
            action: log.action,
            user: log.user,
            time: log.timestamp.toISOString(),
            details: log.details
        }));

        res.json({
            success: true,
            stats: {
                totalUsers: userCount,
                activeSessions,
                premiumUsers: await User.countDocuments({ "subscription.plan": { $in: ['monthly', 'yearly'] } }),
                revenueEstimate: (await User.countDocuments({ "subscription.plan": 'monthly' }) * 9) + (await User.countDocuments({ "subscription.plan": 'yearly' }) * 99),
                systemStatus: "Healthy",
                uptime: process.uptime()
            },
            logs: formattedLogs
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch admin stats" });
    }
});

router.get('/users', authMiddleware, adminCheck, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { branch, year, search } = req.query;
        const skip = (page - 1) * limit;

        let query = { role: 'student' };
        
        if (branch && branch !== 'All') query.branch = branch;
        if (year && year !== 'All') query.year = year;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { enrollment: { $regex: search, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-googleId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query)
        ]);
        
        res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// GET Full Student Profile, Logs, Documents, Resumes, and Interview Results
router.get('/users/:id/full-details', authMiddleware, adminCheck, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-googleId');
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch Logs (Activity) by Email
        const logs = await Log.find({ user: user.email }).sort({ timestamp: -1 }).limit(50);

        // Fetch Documents by User ID (Limited to 50 recent)
        const documents = await Document.find({ userId: user._id }).sort({ uploadDate: -1 }).limit(50);
        
        // Fetch Resume History (Limited to 50 recent)
        const resumes = await Resume.find({ userId: user._id }).sort({ timestamp: -1 }).limit(50);

        // Fetch Interview Results (Limited to 50 recent)
        const interviewResults = await InterviewResult.find({ userId: user._id }).sort({ timestamp: -1 }).limit(50);

        res.json({
            success: true,
            data: {
                user,
                logs,
                documents,
                resumes,
                interviewResults
            }
        });

    } catch (error) {
        console.error("Fetch Full Details Error:", error);
        res.status(500).json({ message: "Failed to fetch user details" });
    }
});

router.delete('/users/:id', authMiddleware, adminCheck, async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ message: "User not found" });

        if (userToDelete.role === 'admin') {
            return res.status(403).json({ message: "Cannot delete an administrator account." });
        }

        await User.findByIdAndDelete(req.params.id);

        try {
            await Log.create({
                action: 'User Deleted',
                user: req.user.email, // Admin who performed action
                details: `Deleted user: ${userToDelete.email}`
            });
        } catch (e) {}

        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
});

export default router;
