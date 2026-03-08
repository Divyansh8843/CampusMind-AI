import express from 'express';
import multer from 'multer';
import axios from 'axios';
import authMiddleware from '../middleware/auth.js';
import Syllabus from '../models/Syllabus.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/syllabus/upload - Upload syllabus PDF, AI parses and creates subjects/topics
router.post('/upload', authMiddleware, upload.single('syllabus'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    let text = '';
    if (req.file.mimetype === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString('utf8');
    }
    if (!text || text.length < 50) return res.status(400).json({ message: 'Could not extract text from syllabus' });

    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    let parsed;
    try {
      const aiRes = await axios.post(`${aiUrl}/parse-syllabus`, { text: text.substring(0, 15000) }, { timeout: 30000 });
      parsed = aiRes.data;
    } catch (e) {
      parsed = fallbackParseSyllabus(text);
    }

    const subjects = (parsed.subjects || []).map(s => ({
      name: s.name || 'Subject',
      topics: (s.topics || []).map(t => ({ name: typeof t === 'string' ? t : (t.name || t), completed: false })),
      progress: 0
    }));

    let syllabus = await Syllabus.findOne({ userId: req.user.userId });
    if (syllabus) {
      syllabus.title = parsed.title || syllabus.title;
      syllabus.subjects = subjects;
      syllabus.fileUrl = syllabus.fileUrl;
      syllabus.updatedAt = new Date();
      await syllabus.save();
    } else {
      syllabus = await Syllabus.create({
        userId: req.user.userId,
        title: parsed.title || 'My Syllabus',
        subjects,
        updatedAt: new Date()
      });
    }
    res.json({ success: true, syllabus });
  } catch (err) {
    console.error('Syllabus upload error:', err);
    res.status(500).json({ message: 'Failed to process syllabus' });
  }
});

function fallbackParseSyllabus(text) {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const subjects = [];
  let current = null;
  for (const line of lines) {
    if (line.length < 3) continue;
    const upper = line.toUpperCase();
    const looksLikeUnit = /^(UNIT|MODULE|CHAPTER|PART)\s*[-:]?\s*\d+/i.test(line) || /^\d+\.\s+/.test(line);
    if (looksLikeUnit && line.length < 80) {
      if (current) subjects.push(current);
      current = { name: line, topics: [] };
    } else if (current && line.length > 2) {
      current.topics.push(line);
    } else if (!current && line.length > 4) {
      const sub = subjects.find(s => s.name === 'General');
      if (!sub) subjects.push({ name: 'General', topics: [line] });
      else sub.topics.push(line);
    }
  }
  if (current) subjects.push(current);
  if (subjects.length === 0) subjects.push({ name: 'Syllabus', topics: lines.slice(0, 30) });
  return { title: 'My Syllabus', subjects };
}

// GET /api/syllabus - Get current user's syllabus (real-time)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const syllabus = await Syllabus.findOne({ userId: req.user.userId });
    res.json({ success: true, syllabus: syllabus || null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch syllabus' });
  }
});

// PATCH /api/syllabus/topic - Mark a topic complete (sync with study/lecture)
router.patch('/topic', authMiddleware, async (req, res) => {
  try {
    const { subjectIndex, topicIndex, completed } = req.body;
    const syllabus = await Syllabus.findOne({ userId: req.user.userId });
    if (!syllabus || !syllabus.subjects[subjectIndex]) return res.status(404).json({ message: 'Syllabus not found' });
    const subject = syllabus.subjects[subjectIndex];
    if (!subject.topics[topicIndex]) return res.status(404).json({ message: 'Topic not found' });
    subject.topics[topicIndex].completed = completed !== false;
    subject.topics[topicIndex].completedAt = completed !== false ? new Date() : null;
    const done = subject.topics.filter(t => t.completed).length;
    subject.progress = subject.topics.length ? Math.round((done / subject.topics.length) * 100) : 0;
    syllabus.updatedAt = new Date();
    await syllabus.save();
    res.json({ success: true, syllabus });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update topic' });
  }
});

export default router;
