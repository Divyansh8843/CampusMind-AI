import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  analysis: {
    type: Object, // Store full JSON analysis
    required: true
  },
  jobDescription: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Resume', ResumeSchema);
