import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Log from '../models/Log.js';
import authMiddleware from '../middleware/auth.js';
import {
  runCommunityVerificationSubmit,
  isAlumniZeroTrustVerified,
  hasVerificationFieldChanges,
  buildProfileFingerprint
} from '../services/alumniVerification.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeDomainEntry = (domain) => String(domain || '').trim().toLowerCase();
const parseDomains = (value) =>
  String(value || '')
    .split(',')
    .map(normalizeDomainEntry)
    .filter(Boolean);
const DEFAULT_STUDENT_DOMAINS = ['.ac.in', '.edu.in', '.edu'];
const DEFAULT_ALUMNI_DOMAINS = ['gmail.com'];

const isDomainAllowed = (emailDomain, allowedDomains) => {
  const normalizedDomain = normalizeDomainEntry(emailDomain);
  if (!normalizedDomain || !allowedDomains.length) return false;

  return allowedDomains.some((allowed) => {
    if (!allowed) return false;
    if (allowed.startsWith('.')) return normalizedDomain.endsWith(allowed);
    return normalizedDomain === allowed;
  });
};

const serializeUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  picture: user.picture,
  role: user.role,
  enrollment: user.enrollment,
  branch: user.branch,
  year: user.year,
  semester: user.semester,
  profilePictureUpdated: user.profilePictureUpdated,
  collegeName: user.collegeName,
  course: user.course,
  graduationYear: user.graduationYear,
  company: user.company,
  jobRole: user.jobRole,
  resumeUrl: user.resumeUrl,
  resumeDocumentId: user.resumeDocumentId,
  latitude: user.latitude,
  longitude: user.longitude,
  mapVisible: user.mapVisible,
  alumniVerification: user.alumniVerification,
  alumniVerified: isAlumniZeroTrustVerified(user),
  subscription: user.subscription
    ? {
        plan: user.subscription.plan,
        status: user.subscription.status
      }
    : undefined,
  usage: user.usage,
  github: user.github,
  linkedin: user.linkedin,
  skills: user.skills,
  xp: user.xp,
  level: user.level,
  streak: user.streak,
  lastActive: user.lastActive,
  badges: user.badges,
  // Student-specific
  cgpa: user.cgpa,
  // Alumni & shared professional
  contactNo: user.contactNo,
  passoutYear: user.passoutYear,
  messageForStudents: user.messageForStudents,
  portfolioUrl: user.portfolioUrl,
  city: user.city,
  state: user.state,
  allowDirectMessages: user.allowDirectMessages !== undefined ? user.allowDirectMessages : true,
  showProfileDetails: user.showProfileDetails !== undefined ? user.showProfileDetails : true
});

router.post('/google', async (req, res) => {
  const { token } = req.body;
  const COLLEGE_DOMAIN = process.env.COLLEGE_DOMAIN;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, hd } = payload;

    const ALUMNI_DOMAIN = process.env.ALUMNI_DOMAIN;
    const studentAllowedDomains = parseDomains(process.env.COLLEGE_ALLOWED_DOMAINS || COLLEGE_DOMAIN);
    const alumniAllowedDomains = parseDomains(process.env.ALUMNI_ALLOWED_DOMAINS || ALUMNI_DOMAIN);
    const safeStudentDomains = studentAllowedDomains.length ? studentAllowedDomains : DEFAULT_STUDENT_DOMAINS;
    const safeAlumniDomains = alumniAllowedDomains.length ? alumniAllowedDomains : DEFAULT_ALUMNI_DOMAINS;

    let role = 'student';
    const emailLower = (email || '').toLowerCase();
    const emailDomain = emailLower.includes('@') ? emailLower.split('@')[1] : '';
    const adminEmails = process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
      : [];

    if (adminEmails.includes(emailLower)) {
      role = 'admin';
    } else if (isDomainAllowed(emailDomain, safeAlumniDomains)) {
      role = 'alumni';
    }

    if (role !== 'admin' && role !== 'alumni' && !isDomainAllowed(emailDomain, safeStudentDomains)) {
      return res.status(403).json({
        message: `Access is restricted to authorized student domains: ${safeStudentDomains.join(', ')}.`
      });
    }

    let finalName = name || 'User';
    let extractedEnrollment = '';

    const parts = finalName.trim().split(/\s+/);
    if (parts.length > 1) {
      const potentialEnrollment = parts[0];
      if (potentialEnrollment.length > 5 && /\d/.test(potentialEnrollment)) {
        extractedEnrollment = potentialEnrollment;
        finalName = parts.slice(1).join(' ');
      }
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email,
        name: finalName,
        picture,
        domain: hd || emailDomain || 'public',
        role,
        enrollment: extractedEnrollment,
        profilePictureUpdated: false,
        alumniVerification: role === 'alumni' ? { status: 'unverified' } : undefined
      });
    } else {
      user.lastActive = new Date();
      if ((!user.enrollment || user.enrollment === '') && extractedEnrollment) {
        user.enrollment = extractedEnrollment;
        user.name = finalName;
      }

        if (role === 'admin' && user.role !== 'admin') {
        user.role = 'admin';
      }

      if (role === 'alumni' && user.role === 'student') {
        user.role = 'alumni';
        user.alumniVerification = user.alumniVerification || { status: 'unverified' };
      }

      await user.save();
    }

    const authToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, domain: user.domain },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    try {
      await Log.create({
        action: 'User Login',
        user: user.email,
        details: `Role: ${user.role}`
      });
    } catch (logError) {
      console.error('Logging Error:', logError);
    }

    res.status(200).json({
      success: true,
      data: {
        token: authToken,
        user: serializeUser(user)
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Authentication failed. Please try again.' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      enrollment,
      branch,
      year,
      semester,
      picture,
      skills,
      github,
      linkedin,
      currentStudyTopic,
      company,
      collegeName,
      course,
      graduationYear,
      contactNo,
      passoutYear,
      jobRole,
      messageForStudents,
      portfolioUrl,
      resumeUrl,
      resumeDocumentId,
      cgpa,
      mapVisible,
      allowDirectMessages,
      showProfileDetails
    } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const incomingUpdates = {
      name,
      branch,
      collegeName,
      course,
      graduationYear,
      linkedin,
      company,
      jobRole,
      resumeUrl,
      resumeDocumentId
    };

    if (
      user.role === 'alumni' &&
      user.alumniVerification?.status === 'verified' &&
      hasVerificationFieldChanges(user, incomingUpdates)
    ) {
      return res.status(403).json({
        message: 'Verified alumni identity fields are locked. Contact admin to request changes.',
        code: 'VERIFIED_PROFILE_LOCKED'
      });
    }

    if (user.role === 'alumni' && hasVerificationFieldChanges(user, incomingUpdates)) {
      user.alumniVerification = {
        ...(user.alumniVerification?.toObject?.() || user.alumniVerification || {}),
        status: 'unverified',
        decision: null,
        trustScore: 0,
        trustBreakdown: {},
        resumeExtracted: {},
        extractionSource: null,
        rejectionReason: 'Profile or resume updated. AI trust score will be recalculated on next verification.',
        checks: [],
        verifiedAt: null,
        rejectedAt: null,
        verifiedBy: null,
        lastRecalculatedAt: new Date()
      };
    }

    if (name && user.role === 'alumni') user.name = String(name).trim();

    if (enrollment && user.role !== 'alumni') {
      if (!user.enrollment) {
        user.enrollment = enrollment;
      }
    }

    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (semester) user.semester = semester;

    if (picture) {
      if (!user.profilePictureUpdated) {
        user.picture = picture;
        user.profilePictureUpdated = true;
      } else {
        console.log(`Security: User ${user.email} attempted to bypass one-time selfie lock.`);
      }
    }

    if (skills) {
      user.skills = Array.isArray(skills)
        ? skills
        : typeof skills === 'string'
          ? skills.split(',').map((s) => s.trim()).filter(Boolean)
          : skills;
    }
    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (currentStudyTopic) user.currentStudyTopic = currentStudyTopic;
    if (company !== undefined) {
      const trimmedCompany = String(company).trim();
      user.company = trimmedCompany.toLowerCase() === 'other' ? '' : trimmedCompany;
    }
    if (collegeName !== undefined) user.collegeName = collegeName;
    if (course !== undefined) user.course = course;
    if (graduationYear !== undefined) user.graduationYear = graduationYear;
    if (contactNo !== undefined) user.contactNo = contactNo;
    if (passoutYear !== undefined) user.passoutYear = passoutYear;
    if (jobRole !== undefined) {
      const trimmedRole = String(jobRole).trim();
      user.jobRole = trimmedRole.toLowerCase() === 'other' ? '' : trimmedRole;
    }
    if (messageForStudents !== undefined) user.messageForStudents = messageForStudents;
    if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl;
    if (resumeUrl !== undefined) user.resumeUrl = resumeUrl;
    if (resumeDocumentId !== undefined) user.resumeDocumentId = resumeDocumentId || null;
    if (cgpa !== undefined) user.cgpa = cgpa;
    if (mapVisible !== undefined) user.mapVisible = Boolean(mapVisible);
    if (allowDirectMessages !== undefined) user.allowDirectMessages = Boolean(allowDirectMessages);
    if (showProfileDetails !== undefined) user.showProfileDetails = Boolean(showProfileDetails);

    await user.save();

    try {
      await Log.create({
        action: 'Profile Update',
        user: user.email,
        details: `Updated profile fields for role ${user.role}`
      });
    } catch (e) {}

    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.post('/alumni/submit-verification', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'alumni') {
      return res.status(400).json({ message: 'Only alumni accounts can submit verification.' });
    }

    if (user.alumniVerification?.status === 'pending' && user.alumniVerification?.decision === 'additional_proof_required') {
      // allow re-submit when additional proof is required
    } else if (user.alumniVerification?.status === 'pending') {
      return res.status(400).json({
        message: 'Your profile is already under AI verification review.',
        pending: true,
        user
      });
    }

    if (user.alumniVerification?.status === 'verified') {
      return res.status(400).json({
        message: 'Your alumni account is already verified.',
        verified: true,
        user
      });
    }

    const verification = await runCommunityVerificationSubmit(user);
    const now = new Date();

    user.alumniVerification = {
      status: verification.status,
      decision: verification.decision,
      submittedAt: now,
      verifiedAt: verification.verifiedAt || (verification.status === 'verified' ? now : null),
      rejectedAt: verification.rejectedAt || (verification.status === 'rejected' ? now : null),
      rejectionReason: verification.rejectionReason || '',
      profileFingerprint: verification.profileFingerprint,
      verifiedBy: verification.verifiedBy,
      trustScore: verification.trustScore,
      trustBreakdown: verification.trustBreakdown,
      resumeExtracted: verification.resumeExtracted,
      extractionSource: verification.extractionSource,
      lastRecalculatedAt: now,
      checks: verification.checks
    };

    if (verification.status === 'verified') {
      const hasBadge = (user.badges || []).some((badge) => badge.name === 'Verified Alumni');
      if (!hasBadge) {
        user.badges = [
          ...(user.badges || []),
          { name: 'Verified Alumni', icon: 'shield-check', earnedDate: now }
        ];
      }
    }

    await user.save();

    try {
      await Log.create({
        action: 'Alumni AI Verification',
        user: user.email,
        details: `Status: ${verification.status}, Trust Score: ${verification.trustScore}`
      });
    } catch (e) {}

    res.json({
      success: verification.status === 'verified' || verification.status === 'pending',
      verified: verification.status === 'verified',
      pending: verification.status === 'pending',
      user: serializeUser(user),
      verification: user.alumniVerification,
      trustScore: verification.trustScore,
      message:
        verification.message ||
        (verification.status === 'verified'
          ? 'AI verification passed. Verified Alumni badge granted.'
          : verification.rejectionReason)
    });
  } catch (error) {
    console.error('Alumni verification error:', error);
    res.status(500).json({ message: 'Failed to process alumni verification' });
  }
});

router.get('/alumni/verification-status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fingerprint = buildProfileFingerprint(user);
    const fingerprintMismatch =
      user.alumniVerification?.status === 'verified' &&
      user.alumniVerification?.profileFingerprint &&
      user.alumniVerification.profileFingerprint !== fingerprint;

    if (fingerprintMismatch) {
      user.alumniVerification.status = 'unverified';
      user.alumniVerification.decision = null;
      user.alumniVerification.trustScore = 0;
      user.alumniVerification.rejectionReason =
        'Profile or resume changed after verification. Continuous trust monitoring requires re-verification.';
      user.alumniVerification.lastRecalculatedAt = new Date();
      await user.save();
    }

    res.json({
      success: true,
      verified: isAlumniZeroTrustVerified(user),
      verification: user.alumniVerification,
      fingerprintMismatch
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch verification status' });
  }
});

router.post('/location', authMiddleware, async (req, res) => {
  try {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required.' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Coordinates are out of valid range.' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.latitude = latitude;
    user.longitude = longitude;
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      latitude: user.latitude,
      longitude: user.longitude
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Failed to update live location' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
