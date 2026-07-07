import mongoose from 'mongoose';

const InterviewResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
      type: String,
      enum: ['mock', 'aptitude'],
      required: true
  },
  topic: {
      type: String,
      required: true
  },
  score: {
    type: Number,
    required: true
  },
  feedback: {
      type: String // Detailed feedback or simple message
  },
  details: {
      type: Object // Full feedback object for mocks
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const InterviewResult = mongoose.model('InterviewResult', InterviewResultSchema);
export default InterviewResult;
