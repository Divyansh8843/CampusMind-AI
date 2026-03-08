import express from 'express';
import axios from 'axios';
import Post from '../models/Post.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

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
            domain,
            $or: [
                { role: 'alumni' },
                { year: { $gte: 3 } }
            ]
        })
        .sort({ xp: -1 })
        .limit(20)
        .select('name role year picture xp company branch skills _id');

        const graphData = alumni.map(u => ({
            _id: u._id,
            id: u._id,
            name: u.name,
            role: u.company ? `${u.role || 'Engineer'} @ ${u.company}` : `Senior ${u.branch || 'Student'}`,
            year: u.year || 2024,
            img: u.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
            skills: u.skills,
            branch: u.branch,
            company: u.company
        }));

        res.json({ success: true, data: graphData });
    } catch (err) {
        console.error("Alumni Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch alumni network" });
    }
});

// POST /api/community/mentorship-email - AI-drafted cold email for alumni mentorship
router.post('/mentorship-email', authMiddleware, async (req, res) => {
    try {
        const { alumniId, myInterests } = req.body;
        const me = await User.findById(req.user.userId);
        const alumni = await User.findById(alumniId);
        if (!me || !alumni) return res.status(404).json({ message: 'User not found' });
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const { data } = await axios.post(`${aiUrl}/draft-mentorship-email`, {
            alumni_name: alumni.name,
            alumni_company: alumni.company || '',
            alumni_role: alumni.role || 'Professional',
            my_name: me.name,
            my_interests: myInterests || me.skills?.slice(0, 3).join(', ') || 'technology',
            my_branch: me.branch || 'my branch'
        }, { timeout: 10000 });
        res.json({ success: true, email: data.email, subject: data.subject });
    } catch (err) {
        console.error('Mentorship email error:', err);
        res.status(500).json({ message: 'Failed to draft email' });
    }
});

// POST a new question
router.post('/', authMiddleware, async (req, res) => {
    try {
        // req.user has { userId: ... }
        const user = await User.findById(req.user.userId);
        if(!user) return res.status(404).json({message: "User not found"});

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
