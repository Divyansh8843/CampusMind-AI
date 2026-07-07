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
    enum: ['student', 'admin', 'alumni'],
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
  // Social & Professional Links
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  company: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  course: { type: String, default: '' },
  jobRole: { type: String, default: '' },
  contactNo: { type: String, default: '' },
  passoutYear: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  mapVisible: { type: Boolean, default: true },
  allowDirectMessages: { type: Boolean, default: true },
  showProfileDetails: { type: Boolean, default: true },
  alumniVerification: {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    profileFingerprint: { type: String, default: '' },
    verifiedBy: { type: String, enum: ['system', 'admin', 'community_admin', null], default: null },
    adminNotes: { type: String, default: '' },
    trustScore: { type: Number, default: 0 },
    decision: {
      type: String,
      enum: ['incomplete', 'resume_unreadable', 'verified', 'additional_proof_required', 'failed', null],
      default: null
    },
    extractionSource: { type: String, enum: ['ai', 'heuristic', null], default: null },
    resumeExtracted: {
      name: String,
      college: String,
      degree: String,
      branch: String,
      graduation_year: String,
      company: String,
      job_title: String
    },
    trustBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastRecalculatedAt: { type: Date },
    checks: [{
      key: String,
      passed: Boolean,
      message: String
    }]
  },
  cgpa: { type: Number },
  messageForStudents: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  resumeDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
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
UserSchema.index({ role: 1, 'alumniVerification.status': 1 });
UserSchema.index({ state: 1, city: 1 });

export default mongoose.model('User', UserSchema);
