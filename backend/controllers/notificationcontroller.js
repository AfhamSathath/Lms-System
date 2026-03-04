const Notification = require('../models/notification');
const NotificationService = require('../services/notificationService');

// GET all notifications
exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort('-createdAt')
    .limit(50);

  res.json({
    success: true,
    notifications,
  });
};

// GET unread count
exports.getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    isRead: false,
  });

  res.json({ success: true, count });
};

// MARK single as read
exports.markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.json({ success: true });
};

// MARK all as read
exports.markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.json({ success: true });
};

// DELETE one
exports.deleteNotification = async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.json({ success: true });
};

// CLEAR all
exports.clearAll = async (req, res) => {
  await Notification.deleteMany({ user: req.user.id });
  res.json({ success: true });
};

// ADMIN send notification
exports.sendNotification = async (req, res) => {
  const { recipientIds, role, title, message, type, priority, link } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message required' });
  }

  if (recipientIds?.length > 0) {
    await NotificationService.notifyMany(recipientIds, {
      title,
      message,
      type,
      priority,
      link,
    });
  } else if (role) {
    await NotificationService.broadcastToRole(role, {
      title,
      message,
      type,
      priority,
      link,
    });
  } else {
    return res.status(400).json({ message: 'Provide recipients or role' });
  }

  res.json({ success: true });
};