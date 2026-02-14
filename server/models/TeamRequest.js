import mongoose from 'mongoose';

const TeamRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  hackathonId: {
    type: String,
    required: true
  },
  hackathonTitle: {
    type: String,
    required: true
  },
  myRole: {
    type: String,
    required: true
  },
  lookingFor: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'expired'],
    default: 'pending'
  },
  matchedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Auto-expire requests after 30 days
  }
});

// Index for fast matching queries
TeamRequestSchema.index({ hackathonId: 1, status: 1, lookingFor: 1, myRole: 1 });

export const TeamRequest = mongoose.model('TeamRequest', TeamRequestSchema);
