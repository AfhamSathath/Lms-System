const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  clearAll,
  sendNotification,
} =notificationController= require('../controllers/notificationcontroller');

// All routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/clear-all', clearAll);
router.delete('/:id', deleteNotification);

// Admin endpoint for sending notifications to specific users
const { authorize } = require('../middleware/auth');
const notification = require('../models/notification');
router.post('/send', authorize('admin'), sendNotification);

module.exports = router;