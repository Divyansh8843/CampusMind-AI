import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: {
    type: String
  },
  domain: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  enrollment: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  },
  semester: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: ['Python', 'Java', 'React', 'Communication'] // Default foundational skills
  },
  profilePictureUpdated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Social Links
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  // Gamification
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  // Study Buddy Features
  currentStudyTopic: { type: String, index: true }, 
  lastStudyActive: { type: Date },
  badges: [{ 
    name: String, 
    icon: String, 
    earnedDate: { type: Date, default: Date.now } 
  }],
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  // Business & Subscription Features
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'monthly', 'yearly'], 
      default: 'free' 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'canceled', 'past_due'], 
      default: 'active' 
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    startDate: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date }
  },
  usage: {
    resumeAnalysis: { type: Number, default: 0 },
    mockInterviews: { type: Number, default: 0 },
    resetDate: { type: Date, default: Date.now }
  }
});

// Indexes for Global Scalability (Leaderboard)
UserSchema.index({ xp: -1 });              // Fast global queries
UserSchema.index({ branch: 1, xp: -1 });   // Fast filtered queries
UserSchema.index({ year: 1, xp: -1 });     // Fast filtered queries by Year
UserSchema.index({ skills: 1, xp: -1 });   // Fast filtered queries by Skill

export default mongoose.model('User', UserSchema);
