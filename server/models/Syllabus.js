import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topics: [topicSchema],
  progress: { type: Number, default: 0 }
});

const syllabusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'My Syllabus' },
  subjects: [subjectSchema],
  fileUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

syllabusSchema.index({ userId: 1 });

export default mongoose.model('Syllabus', syllabusSchema);
