import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Document from '../models/Document.js';
import authMiddleware from '../middleware/auth.js';
import { requireVerifiedAlumni } from '../middleware/alumniVerification.js';
import { callAiService } from '../services/aiGateway.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import nodemailer from 'nodemailer';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

const router = express.Router();

const mentorshipEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: parseInt(process.env.MENTORSHIP_EMAIL_LIMIT || '5', 10),
    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => req.user?.userId || 'anonymous',

    message: {
        message: 'Mentorship email limit reached. Try again later.'
    }
});

const toMapMarker = (user, roleLabel) => {
    if (!Number.isFinite(user.latitude) || !Number.isFinite(user.longitude)) {
        return null;
    }

    return {
        id: user._id,
        name: user.name,
        role: user.role,
        roleLabel,
        branch: user.branch || '',
        collegeName: user.collegeName || '',
        company: user.company || '',
        jobRole: user.jobRole || '',
        graduationYear: user.graduationYear || user.passoutYear || '',
        picture: user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        lat: user.latitude,
        lng: user.longitude,
        verified: user.role === 'alumni' ? user.alumniVerification?.status === 'verified' : true,
        lastActive: user.lastActive
    };
};

// GET all community posts (Filtered by Domain)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const domain = req.user.domain;
        const posts = await Post.find({ domain }).sort({ createdAt: -1 }).limit(50);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET Alumni / Seniors (Filtered by College Domain)
router.get('/alumni', authMiddleware, async (req, res) => {
    try {
        const domain = req.user.domain;
        const alumni = await User.find({
            $or: [
                { role: 'alumni', 'alumniVerification.status': 'verified' },
                { year: { $gte: 3 }, domain }
            ]
        })
            .sort({ xp: -1 })
            .limit(20)
            .select('name role year picture xp company branch skills email linkedin contactNo passoutYear jobRole messageForStudents portfolioUrl resumeUrl _id collegeName allowDirectMessages showProfileDetails');

        // Fetch connection requests involving the current user
        const connections = await ConnectionRequest.find({
            $or: [
                { senderId: req.user.userId },
                { receiverId: req.user.userId }
            ]
        });

        const graphData = alumni.map(u => {
            let connectionStatus = 'none';
            let connectionId = null;
            let rejectMessage = null;
            const conn = connections.find(c =>
                (c.senderId.toString() === req.user.userId && c.receiverId.toString() === u._id.toString()) ||
                (c.receiverId.toString() === req.user.userId && c.senderId.toString() === u._id.toString())
            );
            if (conn) {
                connectionStatus = conn.status;
                connectionId = conn._id;
                rejectMessage = conn.rejectMessage;
            }

            return {
                _id: u._id,
                id: u._id,
                name: u.name,
                role: u.company ? `${u.role || 'Engineer'} @ ${u.company}` : `Senior ${u.branch || 'Student'}`,
                year: u.year || 2024,
                img: u.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
                skills: u.skills,
                branch: u.branch,
                company: u.company,
                jobRole: u.jobRole,
                collegeName: u.collegeName || 'College not listed',
                allowDirectMessages: u.allowDirectMessages !== false,
                showProfileDetails: u.showProfileDetails !== false,
                email: (connectionStatus === 'accepted' && u.showProfileDetails !== false) ? u.email : null,
                linkedin: (connectionStatus === 'accepted' && u.showProfileDetails !== false) ? u.linkedin : null,
                contactNo: (connectionStatus === 'accepted' && u.showProfileDetails !== false && req.user.role !== 'student') ? u.contactNo : null,
                passoutYear: u.passoutYear,
                messageForStudents: u.messageForStudents,
                portfolioUrl: (connectionStatus === 'accepted' && u.showProfileDetails !== false) ? u.portfolioUrl : null,
                resumeUrl: (connectionStatus === 'accepted' && u.showProfileDetails !== false) ? u.resumeUrl : null,
                connectionStatus,
                connectionId,
                rejectMessage,
                isSender: conn ? conn.senderId.toString() === req.user.userId : false
            };
        });

        res.json({ success: true, data: graphData });
    } catch (err) {
        console.error("Alumni Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch alumni network" });
    }
});

// GET live India-wide alumni + student map data
router.get('/alumni/map', authMiddleware, async (req, res) => {
    try {
        const [verifiedAlumni, activeStudents] = await Promise.all([
            User.find({
                role: 'alumni',
                'alumniVerification.status': 'verified',
                mapVisible: { $ne: false },
                latitude: { $exists: true, $ne: null },
                longitude: { $exists: true, $ne: null }
            })
                .select('name role branch collegeName company jobRole latitude longitude graduationYear passoutYear picture alumniVerification lastActive enrollment')
                .sort({ lastActive: -1 })
                .limit(500),
            User.find({
                role: 'student',
                mapVisible: { $ne: false },
                latitude: { $exists: true, $ne: null },
                longitude: { $exists: true, $ne: null }
            })
                .select('name role branch collegeName latitude longitude year picture lastActive enrollment')
                .sort({ lastActive: -1 })
                .limit(500)
        ]);

        const markers = [
            ...verifiedAlumni.map((user) => toMapMarker(user, user.company ? `${user.jobRole || 'Alumni'} @ ${user.company}` : 'Verified Alumni')),
            ...activeStudents.map((user) => toMapMarker(user, `Student • ${user.branch || 'Branch N/A'} • Year ${user.year || 'N/A'}`))
        ].filter(Boolean);

        res.json({
            success: true,
            updatedAt: new Date().toISOString(),
            total: markers.length,
            stats: {
                alumni: verifiedAlumni.length,
                students: activeStudents.length
            },
            data: markers
        });
    } catch (err) {
        console.error('Alumni map error:', err);
        res.status(500).json({ message: 'Failed to fetch live alumni map data' });
    }
});

// POST /api/community/mentorship-email - AI-drafted cold email for alumni mentorship
router.post('/mentorship-email', authMiddleware, async (req, res) => {
    try {
        const { alumniId, myInterests } = req.body;
        const me = await User.findById(req.user.userId);
        const alumni = await User.findById(alumniId);
        if (!me || !alumni) return res.status(404).json({ message: 'User not found' });

        let resumeText = '';
        if (me.resumeDocumentId) {
            try {
                const doc = await Document.findById(me.resumeDocumentId).select('+textContent');
                if (doc) resumeText = doc.textContent || '';
            } catch (docErr) {
                console.error('Failed to load student resume text:', docErr);
            }
        }

        let emailData;
        try {
            const { data } = await callAiService('/draft-mentorship-email', {
                alumni_name: String(alumni.name || ''),
                alumni_company: String(alumni.company || ''),
                alumni_role: String(alumni.jobRole || alumni.role || 'Professional'),
                student_name: String(me.name || ''),
                student_college: String(me.collegeName || 'our college'),
                student_course: String(me.course || ''),
                student_branch: String(me.branch || 'my branch'),
                student_year: String(me.year || ''),
                student_cgpa: String(me.cgpa || ''),
                student_skills: Array.isArray(me.skills) ? me.skills : [],
                my_interests: String(myInterests || (me.skills && me.skills.length ? me.skills.slice(0, 3).join(', ') : 'technology')),
                resume_text: String(resumeText || '')
            }, { timeout: 15000 });
            emailData = data;
        } catch (aiError) {
            console.error('AI Service down, using highly professional fallback draft:', aiError.message);
            // Fallback Professional Draft
            const companyContext = alumni.company ? ` at ${alumni.company}` : '';
            const roleContext = alumni.jobRole || alumni.role || 'Professional';
            const courseBranch = (me.course && me.branch) ? `${me.course} in ${me.branch}` : (me.branch || 'my branch');
            const collegeContext = me.collegeName ? ` at ${me.collegeName}` : '';
            emailData = {
                subject: `Connecting: ${me.name} (${courseBranch})`,
                email: `Hi ${alumni.name},\n\nI hope you're having a great week.\n\nMy name is ${me.name}, and I'm currently studying ${courseBranch}${collegeContext}. I recently came across your profile and have been genuinely following your career journey. I am incredibly inspired by the work you're doing as a ${roleContext}${companyContext}.\n\nI'm very passionate about ${myInterests || me.skills?.slice(0, 3).join(', ') || 'tech and career growth'} and am actively trying to bridge the gap between my academic studies and what the industry actually expects. Given your expertise, I was wondering if you might be open to a brief 10-15 minute chat or willing to share a quick piece of advice? \n\nI've attached a link to my complete profile and resume below for some context. I completely understand if you're swamped right now, but even a short response would mean a lot to me as I navigate my early career.\n\nThank you so much for your time and for paving the way for students like us.\n\nBest,\n${me.name}`
            };
        }
        res.json({ success: true, email: emailData.email, subject: emailData.subject });
    } catch (err) {
        console.error('Mentorship email error:', err);
        res.status(500).json({ message: 'Failed to draft email' });
    }
});

// POST /api/community/send-mentorship-email-direct - Send direct message to alumni via platform
router.post('/send-mentorship-email-direct', authMiddleware, mentorshipEmailLimiter, async (req, res) => {
    try {
        const { alumniId, subject, message } = req.body;
        const safeSubject = String(subject || '').trim().slice(0, 200);
        const safeMessage = String(message || '').trim().slice(0, 2000);

        if (!alumniId || !safeSubject || !safeMessage) {
            return res.status(400).json({ message: 'Alumni, subject, and message are required.' });
        }

        const sender = await User.findById(req.user.userId);
        const receiver = await User.findById(alumniId);

        if (!sender || !receiver || !receiver.email) {
            return res.status(404).json({ message: "User or receiver email not found" });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"${sender.name} via CampusMind" <${process.env.EMAIL_USER}>`,
            replyTo: sender.email,
            to: receiver.email,
            subject: safeSubject,
            text: safeMessage,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h3 style="color: #4f46e5;">New Mentorship Request from ${escapeHtml(sender.name)}</h3>
                <p>Hello ${escapeHtml(receiver.name)},</p>
                <p>You have received a new direct message from <strong>${escapeHtml(sender.name)}</strong> (${escapeHtml(sender.email)}) via CampusMind:</p>
                <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0; border-radius: 4px;">
                    ${escapeHtml(safeMessage).replace(/\n/g, '<br/>')}
                </div>
                <p>You can reply directly to this email to contact ${escapeHtml(sender.name)}.</p>
                <p>Best Regards,<br>CampusMind Network</p>
            </div>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
        console.error('Send mentorship email error:', err);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

// POST /api/community/connect - Send Connection Request
router.post('/connect', authMiddleware, async (req, res) => {
    try {
        const { receiverId } = req.body;
        if (req.user.userId === receiverId) return res.status(400).json({ message: "Cannot connect to yourself" });

        const existing = await ConnectionRequest.findOne({
            $or: [
                { senderId: req.user.userId, receiverId },
                { senderId: receiverId, receiverId: req.user.userId }
            ]
        });
        if (existing) {
            if (existing.status === 'rejected') {
                existing.status = 'pending';
                existing.rejectMessage = '';
                existing.senderId = req.user.userId;
                existing.receiverId = receiverId;
                await existing.save();
                return res.json({ success: true, connection: existing });
            }
            return res.status(400).json({ message: "Connection request already exists" });
        }

        const reqDoc = await ConnectionRequest.create({
            senderId: req.user.userId,
            receiverId
        });
        res.json({ success: true, connection: reqDoc });
    } catch (err) {
        res.status(500).json({ message: "Failed to send request" });
    }
});

// GET /api/community/connections - Get pending requests for me
router.get('/connections', authMiddleware, async (req, res) => {
    try {
        const requests = await ConnectionRequest.find({
            $or: [{ receiverId: req.user.userId }, { senderId: req.user.userId }]
        })
            .populate('senderId', 'name picture branch year role skills company github linkedin resumeUrl enrollment cgpa contactNo passoutYear jobRole portfolioUrl messageForStudents xp collegeName allowDirectMessages showProfileDetails')
            .populate('receiverId', 'name picture branch year role skills company github linkedin resumeUrl enrollment cgpa contactNo passoutYear jobRole portfolioUrl messageForStudents xp collegeName allowDirectMessages showProfileDetails');
        res.json({ success: true, requests });
    } catch (err) {
        res.status(500).json({ message: "Failed to get requests" });
    }
});

// POST /api/community/connect/:id/accept - Accept connection request
router.post('/connect/:id/accept', authMiddleware, requireVerifiedAlumni, async (req, res) => {
    try {
        const request = await ConnectionRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.receiverId.toString() !== req.user.userId) return res.status(403).json({ message: "Unauthorized" });

        request.status = 'accepted';
        await request.save();
        res.json({ success: true, message: "Request accepted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to accept request" });
    }
});

// POST /api/community/connect/:id/reject - Reject connection request
router.post('/connect/:id/reject', authMiddleware, requireVerifiedAlumni, async (req, res) => {
    try {
        const request = await ConnectionRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });
        if (request.receiverId.toString() !== req.user.userId) return res.status(403).json({ message: "Unauthorized" });

        const { rejectMessage } = req.body;
        request.status = 'rejected';
        if (rejectMessage) request.rejectMessage = rejectMessage;
        await request.save();
        res.json({ success: true, message: "Request rejected" });
    } catch (err) {
        res.status(500).json({ message: "Failed to reject request" });
    }
});

// POST /api/community/become-alumni - Join the alumni network
router.post('/become-alumni', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.role = 'alumni';
        user.alumniVerification = {
            status: 'unverified',
            checks: [],
            rejectionReason: ''
        };
        await user.save();
        res.json({ success: true, message: "Alumni role assigned. Complete AI verification to unlock access." });
    } catch (err) {
        res.status(500).json({ message: "Failed to become alumni" });
    }
});

// POST a new question
router.post('/', authMiddleware, async (req, res) => {
    try {
        // req.user has { userId: ... }
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const newPost = new Post({
            author: user._id,
            authorName: user.name,
            authorRole: user.role,
            authorAvatar: user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
            title: req.body.title,
            content: req.body.content,
            tags: req.body.tags || [],
            domain: user.domain
        });

        // Award XP for asking
        user.xp = (user.xp || 0) + 5;
        await user.save();

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST an answer
router.post('/:id/answer', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const user = await User.findById(req.user.userId);

        if (!post) return res.status(404).json({ message: "Post not found" });
        if (!user) return res.status(404).json({ message: "User not found" });

        const newAnswer = {
            author: user._id,
            authorName: user.name,
            content: req.body.content,
            upvotes: 0
        };

        post.answers.push(newAnswer);
        await post.save();

        // Award XP for answering
        user.xp = (user.xp || 0) + 10;
        await user.save();

        res.status(201).json(post);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST rate/upvote (Question or Answer)
router.post('/:id/rate', authMiddleware, async (req, res) => {
    try {
        const { answerId } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ message: "Post not found" });

        let targetAuthorId = null;

        if (answerId) {
            // Rate Answer
            const answer = post.answers.id(answerId);
            if (!answer) return res.status(404).json({ message: "Answer not found" });
            answer.upvotes += 1;
            targetAuthorId = answer.author;
            if (answer.upvotes > 5) answer.isTop = true;
            if (targetAuthorId) await User.findByIdAndUpdate(targetAuthorId, { $inc: { xp: 2 } });
        } else {
            // Rate Question
            post.upvotes += 1;
            targetAuthorId = post.author;
        }

        await post.save();

        // Notify Author (Optional - could add notification logic here)
        // Ensure not notifying self? Upvote usually okay.

        res.json(post);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
