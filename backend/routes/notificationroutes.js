const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/notificationController');

router.use(protect);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.put('/read-all', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);
router.delete('/clear-all', controller.clearAll);
router.delete('/:id', controller.deleteNotification);

router.post('/send', authorize('admin'), controller.sendNotification);

module.exports = router;