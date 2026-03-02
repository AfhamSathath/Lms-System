const Activity = require('../models/Activity');
const User = require('../models/user');

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private (Admin, HOD, Dean, Registrar)
exports.getActivities = async (req, res, next) => {
  try {
    const { user, page = 1, limit = 10, sortBy = '-createdAt' } = req.query;
    const query = {};

    // Filter by user if provided
    if (user) query.user = user;

    // Role-based access: restrict non-admin users to their own activities or their department/faculty
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const activities = await Activity.find(query)
      .populate('user', 'name email role department faculty')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(query);

    res.json({
      success: true,
      count: activities.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private (Admin or self)
exports.getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('user', 'name email role');

    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    // Non-admins can only see their own activities
    if (req.user.role !== 'admin' && activity.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Create activity
// @route   POST /api/activities
// @access  Private
exports.createActivity = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!action) return res.status(400).json({ success: false, message: 'Action is required' });

    const activity = await Activity.create({
      user: req.user._id,
      action
    });

    res.status(201).json({ success: true, message: 'Activity created', activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private (Admin only)
exports.updateActivity = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can update activities' });
    }

    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    res.json({ success: true, message: 'Activity updated', activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private (Admin only)
exports.deleteActivity = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can delete activities' });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    await activity.deleteOne();
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    next(error);
  }
};