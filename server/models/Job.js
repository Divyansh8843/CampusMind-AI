import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  type: { type: String, default: 'Internship' }, // Internship, Full-time
  description: { type: String }, // Summary from scrape
  skills: [{ type: String }],
  link: { type: String, required: true, unique: true }, // Apply link
  source: { type: String, default: 'Aggregator' }, // LinkedIn, Indeed, etc.
  postedDate: { type: Date, default: Date.now },
  batch: [{ type: String }], // e.g. ["2025", "2026"]
  minGPA: { type: Number },
  isActive: { type: Boolean, default: true }
});

// Index for search
JobSchema.index({ title: 'text', company: 'text', skills: 'text' });

export default mongoose.model('Job', JobSchema);
