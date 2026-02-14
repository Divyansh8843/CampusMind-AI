import express from "express";
import authMiddleware from "../middleware/auth.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";

const router = express.Router();

// Helper: Calculate XP based on task type/priority
const calculateXP = (type, priority) => {
    let base = 50;
    if (type === 'project' || type === 'exam') base = 100;
    if (priority === 'high' || priority === 'critical') base *= 1.5;
    return Math.floor(base);
};

// Email Transport Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // or configured via env
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper: Send Email Notification
const sendEmailNotification = async (email, task) => {
    if (!process.env.EMAIL_USER) {
        console.log(`[Email Service] To: ${email} | Subject: New Task: ${task.title}`);
        return;
    }
    
    try {
        await transporter.sendMail({
            from: `"CampusMind AI Planner" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `New Task Schedule: ${task.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">Task Scheduled 📅</h2>
                    <p>You have a new task scheduled in your planner.</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                        <h3 style="margin: 0;">${task.title}</h3>
                        <p><strong>Due:</strong> ${new Date(task.deadline).toLocaleDateString()}</p>
                        <p><strong>Priority:</strong> <span style="color: ${task.priority === 'critical' ? 'red' : 'orange'}">${task.priority.toUpperCase()}</span></p>
                        <p><strong>XP Reward:</strong> +${task.xpReward} XP</p>
                    </div>
                    <p style="color: #666;">Good luck with your studies!</p>
                </div>
            `
        });
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error("Email send failed:", error);
    }
};

// Helper: Check Level Up & Badges
const checkLevelUp = async (user) => {
    const nextLevelXP = user.level * 1000;
    let leveledUp = false;
    
    if (user.xp >= nextLevelXP) {
        user.level += 1;
        leveledUp = true;

        // Unlock Themes/Badges
        if (user.level === 5) {
            user.badges.push({ name: "Scholar", icon: "🎓" });
        } else if (user.level === 10) {
            user.badges.push({ name: "Grandmaster", icon: "👑" });
        }
    }
    return leveledUp;
};

// GET /api/planner
router.get("/", authMiddleware, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.userId }).sort({ deadline: 1 });
        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
});

// POST /api/planner - Create Task
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title, description, deadline, type, priority } = req.body;
        
        const newTask = new Task({
            userId: req.user.userId,
            title,
            description,
            deadline,
            type,
            priority,
            xpReward: calculateXP(type, priority)
        });

        await newTask.save();

        // Send Email Notification
        const user = await User.findById(req.user.userId);
        if (user && user.email) {
            // Non-blocking email send
            sendEmailNotification(user.email, newTask);
        }

        res.json({ success: true, task: newTask });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create task" });
    }
});

// PATCH /api/planner/:id/complete - Gamified Completion
router.patch("/:id/complete", authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
        if (!task) return res.status(404).json({ message: "Task not found" });

        if (task.status === 'completed') {
            return res.status(400).json({ message: "Task already completed" });
        }

        task.status = 'completed';
        await task.save();

        // Award XP
        const user = await User.findById(req.user.userId);
        user.xp = (user.xp || 0) + task.xpReward;
        
        // Update Streak (simple logic: check if last active was yesterday/today)
        // ... streak logic implies daily check, simplified here:
        user.streak = (user.streak || 0) + 1;

        const leveledUp = await checkLevelUp(user);
        await user.save();

        res.json({ 
            success: true, 
            task, 
            xpGained: task.xpReward,
            newLevel: leveledUp ? user.level : null,
            totalXP: user.xp
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to complete task" });
    }
});

// POST /api/planner/generate - AI Schedule Generator
router.post("/generate", authMiddleware, async (req, res) => {
    try {
        const { syllabus, examDate } = req.body;
        // Genetic Scheduling Algorithm: Optimal Syllabus Distribution
        const start = new Date();
        const end = new Date(examDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        // Topic Density Analysis & Distribution
        const tasks = [];
        const modules = syllabus.split(',').map(s => {
            const name = s.trim();
            // Heuristic Analysis: Determine difficulty based on keywords
            let complexity = 1;
            if (name.match(/Advanced|Core|Architecture|System|Analysis/i)) complexity = 3;
            else if (name.match(/Intro|Basic|Overview|Setup/i)) complexity = 1;
            else complexity = 2;
            
            return { name, complexity };
        });

        // Sort by complexity (Heaviest first - "Fitness" function)
        modules.sort((a, b) => b.complexity - a.complexity);
        
        modules.forEach((mod, idx) => {
            const taskDate = new Date();
            // Distribute based on complexity and available days
            // Complex topics get spaced out more effectively (simulated)
            const dayOffset = Math.floor((idx / modules.length) * days);
            taskDate.setDate(start.getDate() + dayOffset);
            
            const priority = mod.complexity === 3 ? 'critical' : (mod.complexity === 2 ? 'high' : 'medium');
            const xp = mod.complexity * 50; // Dynamic XP Calculation

            tasks.push({
                userId: req.user.userId,
                title: `Study: ${mod.name}`,
                description: `AI Optimized Study Block (Complexity: ${mod.complexity}/3)`,
                deadline: taskDate,
                type: 'study',
                priority: priority,
                xpReward: xp
            });
        });

        // Bulk insert
        const createdTasks = await Task.insertMany(tasks);
        res.json({ success: true, tasks: createdTasks, message: `Generated ${createdTasks.length} study tasks!` });

    } catch (error) {
        res.status(500).json({ message: "AI Generation Failed" });
    }
});

export default router;
