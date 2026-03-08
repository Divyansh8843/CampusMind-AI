import express from 'express';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';
import PeerRequest from '../models/PeerRequest.js';

const router = express.Router();

// GET /api/peers - List other logged-in students (for Peer Match)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const students = await User.find({
      _id: { $ne: userId },
      role: 'student'
    })
      .sort({ lastActive: -1, xp: -1 })
      .limit(50)
      .select('name picture branch year skills currentStudyTopic lastActive _id');

    res.json({ success: true, data: students });
  } catch (err) {
    console.error('Peers fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch peers' });
  }
});

// POST /api/peers/request - Send peer match request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { toUserId, topic } = req.body;
    const fromUserId = req.user.userId;
    if (!toUserId) return res.status(400).json({ message: 'toUserId required' });

    const existing = await PeerRequest.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
      status: 'pending'
    });
    if (existing) return res.status(400).json({ message: 'Request already sent' });

    const request = await PeerRequest.create({
      fromUser: fromUserId,
      toUser: toUserId,
      topic: topic || 'Concept explanation',
      status: 'pending'
    });
    const populated = await PeerRequest.findById(request._id)
      .populate('fromUser', 'name picture')
      .populate('toUser', 'name picture');
    res.status(201).json({ success: true, request: populated });
  } catch (err) {
    console.error('Peer request error:', err);
    res.status(500).json({ message: 'Failed to send request' });
  }
});

// GET /api/peers/requests - My pending (incoming + outgoing)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [incoming, outgoing] = await Promise.all([
      PeerRequest.find({ toUser: userId, status: 'pending' })
        .populate('fromUser', 'name picture branch year skills')
        .sort({ createdAt: -1 }),
      PeerRequest.find({ fromUser: userId, status: 'pending' })
        .populate('toUser', 'name picture branch year skills')
        .sort({ createdAt: -1 })
    ]);
    res.json({ success: true, incoming, outgoing });
  } catch (err) {
    console.error('Peer requests fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// POST /api/peers/requests/:id/accept - Accept a peer request
router.post('/requests/:id/accept', authMiddleware, async (req, res) => {
  try {
    const request = await PeerRequest.findOne({
      _id: req.params.id,
      toUser: req.user.userId,
      status: 'pending'
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();
    const populated = await PeerRequest.findById(request._id)
      .populate('fromUser', 'name picture')
      .populate('toUser', 'name picture');
    res.json({ success: true, request: populated });
  } catch (err) {
    console.error('Accept error:', err);
    res.status(500).json({ message: 'Failed to accept' });
  }
});

// POST /api/peers/requests/:id/reject
router.post('/requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    const request = await PeerRequest.findOne({
      _id: req.params.id,
      toUser: req.user.userId,
      status: 'pending'
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ message: 'Failed to reject' });
  }
});

export default router;
