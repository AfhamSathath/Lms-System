const Activity = require('../models/Activity');

const logActivity = (action) => async (req, res, next) => {
  try {
    if (req.user) {
      await Activity.create({
        user: req.user._id,
        action
      });
    }
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
  next();
};

module.exports = logActivity;