import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    // required: true // Optional for backward compatibility if needed
  },
  textContent: {
    type: String,
    select: false // Optimization: Don't load by default unless requested (keep payload small)
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Document', DocumentSchema);
