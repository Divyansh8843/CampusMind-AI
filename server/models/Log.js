import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  user: {
    type: String, // Email or Name
    required: true
  },
  details: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Auto-expire logs after 30 days to keep DB clean
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Log', LogSchema);
