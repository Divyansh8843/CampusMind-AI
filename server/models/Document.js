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
  storageProvider: {
    type: String,
    enum: ['cloudinary', 'local', 's3'],
    default: 'local'
  },
  textContent: {
    type: String,
    select: false // Optimization: Don't load by default unless requested (keep payload small)
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['study', 'resume'],
    default: 'study'
  }
});

DocumentSchema.index({ userId: 1, uploadDate: -1 });
DocumentSchema.index({ userId: 1, category: 1, uploadDate: -1 });

export default mongoose.model('Document', DocumentSchema);
