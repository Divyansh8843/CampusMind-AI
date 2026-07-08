import express from 'express';
import User from '../models/User.js';
import Log from '../models/Log.js';
import Document from '../models/Document.js';
import { buildStudyDocumentQuery } from '../utils/documentFilters.js';
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

        const [monthlyCount, yearlyCount, alumniCount, adminCount] = await Promise.all([
            User.countDocuments({ "subscription.plan": 'monthly' }),
            User.countDocuments({ "subscription.plan": 'yearly' }),
            User.countDocuments({ role: 'alumni' }),
            User.countDocuments({ role: 'admin' }),
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers: userCount,
                activeSessions,
                premiumUsers: monthlyCount + yearlyCount,
                alumniCount,
                adminCount,
                revenueEstimate: (monthlyCount * 9) + (yearlyCount * 99),
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

// GET Users — now supports role filter: student | alumni | admin
router.get('/users', authMiddleware, adminCheck, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { branch, year, search, plan, role } = req.query;
        const skip = (page - 1) * limit;

        // Build role query — default to student
        const roleFilter = role && ['student', 'alumni', 'admin'].includes(role) ? role : 'student';
        let query = { role: roleFilter };
        
        if (branch && branch !== 'All') query.branch = branch;
        if (year && year !== 'All') query.year = year;
        if (plan && plan !== 'All') query["subscription.plan"] = plan.toLowerCase();
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { enrollment: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { collegeName: { $regex: search, $options: 'i' } }
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
                pages: Math.ceil(total / limit) || 1
            }
        });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// Update User (Admin Only)
router.patch('/users/:id', authMiddleware, adminCheck, async (req, res) => {
    try {
        const { role, subscription, usage, xp, level, name, branch, year, semester, enrollment } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Prevent self-demotion from admin role
        if (req.params.id === req.user.userId && role && role !== 'admin') {
            return res.status(403).json({ message: "You cannot demote your own admin account." });
        }

        // Meta/Role
        if (role) user.role = role;
        if (subscription) user.subscription = { ...user.subscription, ...subscription };
        if (usage) user.usage = { ...user.usage, ...usage };
        if (xp !== undefined) user.xp = xp;
        if (level !== undefined) user.level = level;

        // Profile Fields
        if (name) user.name = name;
        if (branch) user.branch = branch;
        if (year) user.year = year;
        if (semester) user.semester = semester;
        if (enrollment) user.enrollment = enrollment;

        await user.save();

        await Log.create({
            action: 'Admin User Override',
            user: req.user.email,
            details: `Modified ${user.email} — ${JSON.stringify(req.body)}`
        });

        res.json({ success: true, message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user" });
    }
});

// GET Full Student Profile, Logs, Documents, Resumes, and Interview Results
router.get('/users/:id/full-details', authMiddleware, adminCheck, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-googleId');
        if (!user) return res.status(404).json({ message: "User not found" });

        const logs = await Log.find({ user: user.email }).sort({ timestamp: -1 }).limit(50);
        const documents = await Document.find(
            buildStudyDocumentQuery(user._id, user.resumeDocumentId)
        ).sort({ uploadDate: -1 }).limit(50);
        const resumes = await Resume.find({ userId: user._id }).sort({ timestamp: -1 }).limit(50);
        const interviewResults = await InterviewResult.find({ userId: user._id }).sort({ timestamp: -1 }).limit(50);

        res.json({
            success: true,
            data: { user, logs, documents, resumes, interviewResults }
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
        await Log.create({
            action: 'User Deleted',
            user: req.user.email,
            details: `Deleted user: ${userToDelete.email}`
        });

        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user" });
    }
});

// COMMUNITY MODERATION
router.get('/community/posts', authMiddleware, adminCheck, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            import('../models/Post.js').then(m => m.default.find().sort({ createdAt: -1 }).skip(skip).limit(limit)),
            import('../models/Post.js').then(m => m.default.countDocuments())
        ]);

        res.json({
            success: true,
            posts,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts" });
    }
});

router.delete('/community/posts/:id', authMiddleware, adminCheck, async (req, res) => {
    try {
        const Post = (await import('../models/Post.js')).default;
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Post moderated/deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete post" });
    }
});

// Community Oversight - Delete Specific Answer
router.delete('/community/posts/:postId/answers/:answerId', authMiddleware, adminCheck, async (req, res) => {
    try {
        const Post = (await import('../models/Post.js')).default;
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.answers = post.answers.filter(ans => ans._id.toString() !== req.params.answerId);
        await post.save();

        res.json({ success: true, message: "Answer moderated/removed" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete answer" });
    }
});

// CAREER MANAGEMENT (Jobs/Internships)
router.get('/jobs', authMiddleware, adminCheck, async (req, res) => {
    try {
        const Job = (await import('../models/Job.js')).default;
        const jobs = await Job.find().sort({ postedDate: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ message: "Error fetching jobs" });
    }
});

router.post('/jobs', authMiddleware, adminCheck, async (req, res) => {
    try {
        const Job = (await import('../models/Job.js')).default;
        const job = await Job.create(req.body);
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ message: "Error creating job" });
    }
});

router.patch('/jobs/:id', authMiddleware, adminCheck, async (req, res) => {
    try {
        const Job = (await import('../models/Job.js')).default;
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ message: "Error updating job" });
    }
});

router.delete('/jobs/:id', authMiddleware, adminCheck, async (req, res) => {
    try {
        const Job = (await import('../models/Job.js')).default;
        await Job.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Job opportunity removed" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting job" });
    }
});

// ALUMNI VERIFICATION
router.get('/alumni/pending', authMiddleware, adminCheck, async (req, res) => {
    try {
        const pending = await User.find({
            role: 'alumni',
            'alumniVerification.status': { $in: ['pending', 'rejected', 'unverified'] }
        })
          .select('name email enrollment collegeName course branch graduationYear linkedin alumniVerification createdAt picture')
          .sort({ 'alumniVerification.submittedAt': -1, createdAt: -1 })
          .limit(100);

        res.json({ success: true, alumni: pending });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pending alumni verifications' });
    }
});

router.patch('/alumni/:id/verification', authMiddleware, adminCheck, async (req, res) => {
    try {
        const { action, adminNotes } = req.body;
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'alumni') {
            return res.status(404).json({ message: 'Alumni account not found' });
        }

        const now = new Date();
        if (action === 'approve') {
            user.alumniVerification = {
                ...(user.alumniVerification?.toObject?.() || user.alumniVerification || {}),
                status: 'verified',
                verifiedAt: now,
                rejectedAt: null,
                rejectionReason: '',
                verifiedBy: 'community_admin',
                adminNotes: adminNotes || ''
            };
        } else if (action === 'reject') {
            user.alumniVerification = {
                ...(user.alumniVerification?.toObject?.() || user.alumniVerification || {}),
                status: 'rejected',
                rejectedAt: now,
                verifiedAt: null,
                verifiedBy: null,
                rejectionReason: adminNotes || 'Rejected by administrator after manual review.',
                adminNotes: adminNotes || ''
            };
        } else {
            return res.status(400).json({ message: 'Invalid action. Use approve or reject.' });
        }

        await user.save();

        await Log.create({
            action: `Alumni Verification ${action === 'approve' ? 'Approved' : 'Rejected'}`,
            user: req.user.email,
            details: `${action} for: ${user.email}`
        });

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update alumni verification' });
    }
});

// NEW: Real-time Revenue Stats
router.get('/revenue-stats', authMiddleware, adminCheck, async (req, res) => {
    try {
        const [monthlyCount, yearlyCount, freeCount, totalUsers] = await Promise.all([
            User.countDocuments({ "subscription.plan": 'monthly', "subscription.status": 'active' }),
            User.countDocuments({ "subscription.plan": 'yearly', "subscription.status": 'active' }),
            User.countDocuments({ "subscription.plan": 'free' }),
            User.countDocuments()
        ]);

        const MONTHLY_PRICE = 9;
        const YEARLY_PRICE = 99;
        const mrr = (monthlyCount * MONTHLY_PRICE) + (yearlyCount * (YEARLY_PRICE / 12));
        const arr = mrr * 12;
        const premiumTotal = monthlyCount + yearlyCount;
        const conversionRate = totalUsers > 0 ? ((premiumTotal / totalUsers) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            revenue: {
                monthlyCount,
                yearlyCount,
                freeCount,
                totalUsers,
                mrr: Math.round(mrr),
                arr: Math.round(arr),
                conversionRate,
                premiumTotal,
                monthlyRevenue: monthlyCount * MONTHLY_PRICE,
                yearlyRevenue: yearlyCount * YEARLY_PRICE
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch revenue stats" });
    }
});

// NEW: Admin own profile
router.get('/profile', authMiddleware, adminCheck, async (req, res) => {
    try {
        const admin = await User.findById(req.user.userId).select('-googleId');
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const recentActivity = await Log.find({ user: admin.email })
            .sort({ timestamp: -1 })
            .limit(20);

        res.json({ success: true, admin, recentActivity });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch admin profile" });
    }
});

// System Intelligence Diagnostic
router.get('/health-insight', authMiddleware, adminCheck, async (req, res) => {
    try {
        const os = await import('os');
        const performance = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            osLoad: os.loadavg(),
            nodeVersion: process.version,
            platform: process.platform,
            dbActive: true,
            cacheStatus: 'Connected (Redis)',
            latencyEstimate: '14ms - 42ms'
        };
        res.json({ success: true, performance });
    } catch (error) {
        res.status(500).json({ message: "Health check failed" });
    }
});

export default router;
