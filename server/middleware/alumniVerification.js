import User from '../models/User.js';
import { isAlumniZeroTrustVerified } from '../services/alumniVerification.js';

export const requireVerifiedAlumni = async (req, res, next) => {
  try {
    if (req.user?.role !== 'alumni') return next();

    const user = await User.findById(req.user.userId).select('role alumniVerification');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!isAlumniZeroTrustVerified(user)) {
      return res.status(403).json({
        message: 'AI alumni verification required before accessing this resource.',
        code: 'ALUMNI_VERIFICATION_REQUIRED',
        status: user.alumniVerification?.status || 'unverified',
        checks: user.alumniVerification?.checks || []
      });
    }

    next();
  } catch (error) {
    console.error('Alumni verification middleware error:', error);
    res.status(500).json({ message: 'Verification check failed' });
  }
};
