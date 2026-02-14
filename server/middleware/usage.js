import User from "../models/User.js";

export const checkUsageLimit = (feature) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user is on a paid plan, bypass limits
      if (['monthly', 'yearly'].includes(user.subscription.plan) && user.subscription.status === 'active') {
        return next();
      }

      // Free Tier Limits
      const FREE_LIMIT = 3;
      let currentUsage = 0;

      if (feature === 'resume') {
        currentUsage = user.usage.resumeAnalysis || 0;
      } else if (feature === 'interview') {
        currentUsage = user.usage.mockInterviews || 0;
      }

      if (currentUsage >= FREE_LIMIT) {
        return res.status(403).json({ 
          message: "Free limit reached. Upgrade to Premium for unlimited access.",
          upgradeRequired: true 
        });
      }

      // Allow request (incrementing usage should happen in the controller/route logic after success)
      next();

    } catch (error) {
      console.error("Usage Check Error:", error);
      res.status(500).json({ message: "Server error checking subscription status" });
    }
  };
};

export const incrementUsage = async (userId, feature) => {
    try {
        const updateField = {};
        if (feature === 'resume') updateField['usage.resumeAnalysis'] = 1;
        if (feature === 'interview') updateField['usage.mockInterviews'] = 1;

        await User.findByIdAndUpdate(userId, { $inc: updateField });
    } catch (error) {
        console.error("Increment Usage Error:", error);
    }
};
