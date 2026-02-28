const Notification = require('../models/notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification (internal use)
// @access  Internal
exports.createNotification = async (userId, title, message, type = 'general', priority = 'medium', metadata = {}) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      metadata,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// @desc    Send custom notification to list of users
// @route   POST /api/notifications/send
// @access  Private/Admin
exports.sendNotification = async (req, res, next) => {
  try {
    const { recipientIds, title, message, type = 'general', priority = 'medium', metadata = {} } = req.body;
    if (!recipientIds || recipientIds.length === 0) {
      return res.status(400).json({ message: 'At least one recipient required' });
    }

    const notifications = recipientIds.map(id => ({
      user: id,
      title,
      message,
      type,
      priority,
      metadata,
    }));

    await Notification.insertMany(notifications);

    res.json({ success: true, message: 'Notifications sent' });
  } catch (error) {
    next(error);
  }
};