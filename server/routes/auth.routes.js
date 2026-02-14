import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Log from '../models/Log.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Determine Role (Check this FIRST to allow admins from outside domain)
    let role = 'student';
    const emailLower = email.toLowerCase();
    const adminEmails = process.env.ADMIN_EMAILS 
        ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) 
        : [];
    
    if (adminEmails.includes(emailLower)) {
        role = 'admin';
    }

    // Verify domain if specified (Skip check for Admins)
    if (role !== 'admin' && COLLEGE_DOMAIN && hd !== COLLEGE_DOMAIN) {
      return res.status(403).json({ 
        message: `Create functionality is restricted strictly to ${COLLEGE_DOMAIN} email addresses. Please sign in with your college credentials.` 
      });
    }

    // Parse Enrollment and Name logic
    // Pattern: 0901CS231043 DIVYANSh AgRAWAl
    let finalName = name;
    let extractedEnrollment = '';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
        const potentialEnrollment = parts[0];
        // Heuristic: Alphanumeric, > 5 chars, contains numbers
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
        picture, // Store initial picture
        domain: hd || 'public',
        role: role,
        enrollment: extractedEnrollment,
        profilePictureUpdated: false
      });
    } else {
        // Correct name/enrollment if missing
        if ((!user.enrollment || user.enrollment === '') && extractedEnrollment) {
            user.enrollment = extractedEnrollment;
            user.name = finalName;
        }
        
        // Promote to admin if needed
        if (role === 'admin' && user.role !== 'admin') {
             user.role = 'admin';
             await user.save();
        } else {
             // Ensure legacy students stay students, admins stay admins
             if (role === 'admin' && user.role === 'student') {
                user.role = 'admin';
                await user.save();
             }
        }
    }

    const authToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log the login event
    try {
        await Log.create({
            action: 'User Login',
            user: user.email,
            details: `Role: ${user.role}`
        });
    } catch (logError) {
        console.error("Logging Error:", logError);
    }

    res.status(200).json({
      success: true,
      data: {
        token: authToken,
        user: {
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
          subscription: user.subscription,
          usage: user.usage
        }
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Authentication failed. Please try again.' });
  }
});

// Update Profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { enrollment, branch, year, semester, picture, skills, github, linkedin, currentStudyTopic } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Enrollment: Update ONLY if not already set (Read-only once set)
        if (enrollment && !user.enrollment) {
            user.enrollment = enrollment;
        }

        // Always allow updating these fields
        if (branch) user.branch = branch;
        if (year) user.year = year;
        if (semester) user.semester = semester;
        if (picture) {
             user.picture = picture;
             user.profilePictureUpdated = true;
        }
        if (skills) user.skills = skills;
        if (github) user.github = github;
        if (linkedin) user.linkedin = linkedin;
        if (currentStudyTopic) user.currentStudyTopic = currentStudyTopic;

        await user.save();

        // Log Profile Update
        try {
            await Log.create({
                action: 'Profile Update',
                user: user.email,
                details: `Updated fields: ${enrollment ? 'enrollment ' : ''}${picture ? 'picture ' : ''}`
            });
        } catch (e) {}

        res.json({ success: true, user });
    } catch (error) {
        console.error("Profile Update Error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

// Get Profile (Me) - real-time data including subscription & usage
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ success: true, user: user.toObject() });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
