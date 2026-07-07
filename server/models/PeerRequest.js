import mongoose from 'mongoose';

const PeerRequestSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  topic: { type: String, default: 'Concept explanation' },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
});

PeerRequestSchema.index({ toUser: 1, status: 1 });
PeerRequestSchema.index({ fromUser: 1, status: 1 });

export default mongoose.model('PeerRequest', PeerRequestSchema);
