import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message: { type: String },
  rejectMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ConnectionRequest', connectionRequestSchema);
