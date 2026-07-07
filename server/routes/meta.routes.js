import express from 'express';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import InterviewResult from '../models/InterviewResult.js';
import { COURSES, BRANCHES, COMPANIES, JOB_ROLES } from '../data/academicOptions.js';
import indianColleges from '../data/indianColleges.json' with { type: 'json' };
import axios from 'axios';

const router = express.Router();

let publicStatsCache = { data: null, expiresAt: 0 };
const PUBLIC_STATS_TTL_MS = 30 * 1000;

// GET /api/meta/academic-options - Courses, branches, companies, roles (no auth)
router.get('/academic-options', async (req, res) => {
  res.json({
    success: true,
    data: {
      courses: COURSES,
      branches: BRANCHES,
      companies: COMPANIES,
      jobRoles: JOB_ROLES
    }
  });
});

// GET /api/meta/colleges - Searchable Indian colleges list (no auth)
router.get('/colleges', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    let results = indianColleges;
    if (query) {
      results = indianColleges.filter((name) => name.toLowerCase().includes(query));
    }

    res.json({
      success: true,
      total: results.length,
      data: results.slice(0, limit)
    });
  } catch (err) {
    console.error('Colleges search error:', err);
    res.status(500).json({ success: false, message: 'Failed to search colleges' });
  }
});

// GET /api/meta/public-stats - Live platform stats for landing hero (no auth)
router.get('/public-stats', async (req, res) => {
  try {
    const now = Date.now();
    if (publicStatsCache.data && publicStatsCache.expiresAt > now) {
      return res.json({ success: true, ...publicStatsCache.data, cached: true });
    }

    const [students, documents, verifiedAlumni, interviews] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Document.countDocuments(),
      User.countDocuments({ role: 'alumni', 'alumniVerification.status': 'verified' }),
      InterviewResult.countDocuments()
    ]);

    const payload = {
      updatedAt: new Date().toISOString(),
      stats: {
        students,
        documents,
        alumni: verifiedAlumni,
        interviews
      }
    };

    publicStatsCache = { data: payload, expiresAt: now + PUBLIC_STATS_TTL_MS };
    res.json({ success: true, ...payload, cached: false });
  } catch (err) {
    console.error('Public stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch live stats' });
  }
});

// Synchronized Global Pomodoro Timer Logic
const POMODORO_CYCLE_MS = 30 * 60 * 1000; // 30 minutes per cycle
const FOCUS_MSECS = 25 * 60 * 1000;       // 25 minutes focus
const BREAK_MSECS = 5 * 60 * 1000;        // 5 minutes break

// In-memory active meta-campus rooms caching to be incredibly fast
const activeUsers = new Map();

router.post('/join', authMiddleware, async (req, res) => {
    try {
        const { topic } = req.body;
        const userId = req.user.userId;
        
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
        activeUsers.delete(req.user.userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// GET /api/meta/ai-health - basic AI runtime observability (admin only)
router.get('/ai-health', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin only' });
        }
        const aiUrl = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').trim();
        const start = Date.now();
        const response = await axios.get(`${aiUrl}/health`, { timeout: 5000 });
        const latencyMs = Date.now() - start;
        res.json({
            success: true,
            latencyMs,
            ai: response.data
        });
    } catch (err) {
        res.status(503).json({
            success: false,
            message: 'AI service health check failed',
            error: err.message
        });
    }
});

export default router;
