import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET all community posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
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
            tags: req.body.tags || []
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
            // Mark as top check
            if (answer.upvotes > 5) answer.isTop = true; 
        } else {
            // Rate Question
            post.upvotes += 1;
            targetAuthorId = post.author;
        }

        await post.save();

        // Award XP to AUTHOR
        if (targetAuthorId) {
            const author = await User.findById(targetAuthorId);
            if (author) {
                author.xp = (author.xp || 0) + 2; 
                await author.save();
            }
        }

        res.json(post);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
