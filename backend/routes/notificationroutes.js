// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getNotifications,
  getNotification,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  clearAll,
  getPreferences,
  updatePreferences,
  sendNotification,
  createCourseAnnouncement,
  createGradeNotification,
  createDeadlineNotification,
  getNotificationStats,
  cleanupOldNotifications
} =  notificationController = require('../controllers/notificationcontroller');

// All routes require authentication
router.use(protect);

// ==================== Basic Notification Routes ====================

// Get all notifications with filters
router.get('/', getNotifications);

// Get single notification
router.get('/:id', getNotification);

// Get unread count with statistics
router.get('/stats/unread', getUnreadCount);

// Get notification statistics (admin/hod/dean only)
router.get('/stats/overview', authorize('admin', 'hod', 'dean'), getNotificationStats);

// ==================== Read Status Routes ====================

// Mark single notification as read
router.put('/:id/read', markAsRead);

// Mark multiple notifications as read
router.put('/read/multiple', markMultipleAsRead);

// Mark all notifications as read
router.put('/read/all', markAllAsRead);

// ==================== Preference Routes ====================

// Get user notification preferences
router.get('/preferences/me', getPreferences);

// Update user notification preferences
router.put('/preferences/me', updatePreferences);

// ==================== Deletion Routes ====================

// Delete single notification
router.delete('/:id', deleteNotification);

// Clear all notifications
router.delete('/clear/all', clearAll);

// Cleanup old notifications (admin only)
router.delete('/admin/cleanup', authorize('admin'), cleanupOldNotifications);

// ==================== Admin Broadcast Routes ====================

// Send custom notification to users/roles/departments
router.post('/admin/send', 
  authorize('admin', 'hod', 'dean', 'registrar'), 
  sendNotification
);

// ==================== Course-Specific Notification Routes ====================

// Create course announcement (lecturer/hod/admin)
router.post('/course/:courseId/announcement', 
  authorize('lecturer', 'hod', 'admin', 'dean'), 
  createCourseAnnouncement
);

// Create grade notification (lecturer/hod/admin)
router.post('/grade/:enrollmentId', 
  authorize('lecturer', 'hod', 'admin'), 
  createGradeNotification
);

// Create deadline notification (lecturer/hod/admin)
router.post('/deadline', 
  authorize('lecturer', 'hod', 'admin'), 
  createDeadlineNotification
);

// ==================== Batch Operation Routes ====================

// Mark multiple notifications as read (alternative endpoint with query params)
router.put('/read/batch', async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide notification IDs' 
      });
    }
    
    const notificationIds = ids.split(',');
    req.body = { notificationIds };
    return markMultipleAsRead(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Delete multiple notifications
router.delete('/batch', async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide notification IDs' 
      });
    }
    
    const notificationIds = ids.split(',');
    const Notification = require('../models/notification');
    
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      $or: [
        { user: req.user.id },
        { targetUsers: req.user.id }
      ]
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} notifications`,
      count: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Department/Faculty Broadcast Routes ====================

// Send notification to department (hod/dean/admin)
router.post('/department/:departmentId/send', 
  authorize('hod', 'dean', 'admin'), 
  async (req, res, next) => {
    try {
      const { departmentId } = req.params;
      const { title, message, type, priority } = req.body;
      
      req.body = {
        recipientType: 'departments',
        recipients: [departmentId],
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'medium'
      };
      
      return sendNotification(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Send notification to faculty (dean/admin)
router.post('/faculty/:facultyId/send', 
  authorize('dean', 'admin'), 
  async (req, res, next) => {
    try {
      const { facultyId } = req.params;
      const { title, message, type, priority } = req.body;
      
      // Get all departments in faculty
      const Department = require('../models/Department');
      const departments = await Department.find({ faculty: facultyId }).select('_id');
      
      req.body = {
        recipientType: 'departments',
        recipients: departments.map(d => d._id),
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'medium'
      };
      
      return sendNotification(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Role-Based Broadcast Routes ====================

// Send notification to all students (hod/dean/admin)
router.post('/role/students/send', 
  authorize('hod', 'dean', 'admin'), 
  async (req, res, next) => {
    try {
      const { title, message, type, priority, department } = req.body;
      
      req.body = {
        recipientType: 'roles',
        recipients: ['student'],
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'medium',
        metadata: { department }
      };
      
      return sendNotification(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Send notification to all lecturers (hod/dean/admin)
router.post('/role/lecturers/send', 
  authorize('hod', 'dean', 'admin'), 
  async (req, res, next) => {
    try {
      const { title, message, type, priority, department } = req.body;
      
      req.body = {
        recipientType: 'roles',
        recipients: ['lecturer'],
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'medium',
        metadata: { department }
      };
      
      return sendNotification(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Send notification to all staff (admin only)
router.post('/role/staff/send', 
  authorize('admin'), 
  async (req, res, next) => {
    try {
      const { title, message, type, priority } = req.body;
      
      req.body = {
        recipientType: 'roles',
        recipients: ['lecturer', 'hod', 'dean', 'admin', 'registrar'],
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'medium'
      };
      
      return sendNotification(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Course-Specific Batch Routes ====================

// Send notification to all students in a course (lecturer/hod/admin)
router.post('/course/:courseId/students/send', 
  authorize('lecturer', 'hod', 'admin'), 
  async (req, res, next) => {
    try {
      const { courseId } = req.params;
      const { title, message, type, priority } = req.body;
      
      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.find({
        course: courseId,
        enrollmentStatus: 'enrolled'
      }).populate('student');
      
      const studentIds = enrollments.map(e => e.student._id);
      
      req.body = {
        recipientType: 'users',
        recipients: studentIds,
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'medium',
        metadata: { courseId }
      };
      
      return sendNotification(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// Send notification to all students in a year (hod/dean/admin)
router.post('/year/:year/semester/:semester/send', 
  authorize('hod', 'dean', 'admin'), 
  async (req, res, next) => {
    try {
      const { year, semester } = req.params;
      const { department, title, message, type, priority } = req.body;
      
      const User = require('../models/user');
      let query = {
        role: 'student',
        yearOfStudy: parseInt(year),
        semester: parseInt(semester)
      };
      
      if (department) {
        query.department = department;
      } else if (req.user.role === 'hod') {
        query.department = req.user.department;
      }
      
      const students = await User.find(query).select('_id');
      
      req.body = {
        recipientType: 'users',
        recipients: students.map(s => s._id),
        title,
        message,
        type: type || 'announcement',
        priority: priority || 'medium',
        metadata: { year, semester, department }
      };
      
      return sendNotification(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

// ==================== WebSocket Connection Route ====================

// Get WebSocket connection token for real-time notifications
router.get('/ws/token', (req, res) => {
  try {
    // Generate a temporary token for WebSocket authentication
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token in Redis/cache with expiration (5 minutes)
    // This would be implemented with Redis in production
    
    res.json({
      success: true,
      token,
      expiresIn: 300 // 5 minutes
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Email Notification Settings ====================

// Update email notification settings
router.put('/settings/email', async (req, res, next) => {
  try {
    const { emailEnabled, emailFrequency, emailTypes } = req.body;
    
    const User = require('../models/user');
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        'notificationPreferences.email': emailEnabled,
        'notificationPreferences.emailFrequency': emailFrequency,
        'notificationPreferences.emailTypes': emailTypes
      },
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      message: 'Email settings updated successfully',
      settings: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Push Notification Settings ====================

// Register push notification token
router.post('/push/register', async (req, res, next) => {
  try {
    const { token, device } = req.body;
    
    const User = require('../models/user');
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        'notificationPreferences.pushTokens': {
          token,
          device,
          registeredAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Unregister push notification token
router.delete('/push/unregister/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const User = require('../models/user');
    await User.findByIdAndUpdate(req.user.id, {
      $pull: {
        'notificationPreferences.pushTokens': { token }
      }
    });

    res.json({
      success: true,
      message: 'Push token unregistered successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Test Notification Route ====================

// Send test notification (for debugging)
router.post('/test', async (req, res, next) => {
  try {
    const Notification = require('../models/notification');
    
    const testNotification = await Notification.create({
      user: req.user.id,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly.',
      type: 'info',
      priority: 'low',
      sender: req.user.id,
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      notification: testNotification
    });
  } catch (error) {
    next(error);
  }
});

// ==================== Export Routes ====================

// Export notifications (admin only)
router.get('/export/csv', 
  authorize('admin', 'hod', 'dean'), 
  async (req, res, next) => {
    try {
      const { fromDate, toDate, type } = req.query;
      
      let query = {};
      
      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) query.createdAt.$lte = new Date(toDate);
      }
      
      if (type) query.type = type;
      
      // Role-based filters
      if (req.user.role === 'hod') {
        query.targetDepartments = req.user.department;
      } else if (req.user.role === 'dean') {
        query.targetFaculties = req.user.facultyManaged;
      }
      
      const Notification = require('../models/notification');
      const notifications = await Notification.find(query)
        .populate('sender', 'name email')
        .populate('targetUsers', 'name email')
        .sort('-createdAt');
      
      // Generate CSV
      const createCsvWriter = require('csv-writer').createObjectCsvStringifier;
      const csvWriter = createCsvWriter({
        header: [
          { id: 'id', title: 'ID' },
          { id: 'title', title: 'Title' },
          { id: 'message', title: 'Message' },
          { id: 'type', title: 'Type' },
          { id: 'priority', title: 'Priority' },
          { id: 'sender', title: 'Sender' },
          { id: 'createdAt', title: 'Created At' },
          { id: 'readCount', title: 'Read Count' }
        ]
      });
      
      const records = notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message.substring(0, 100) + (n.message.length > 100 ? '...' : ''),
        type: n.type,
        priority: n.priority,
        sender: n.sender?.name || 'System',
        createdAt: n.createdAt.toISOString(),
        readCount: n.readBy?.length || 0
      }));
      
      const csvString = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=notifications-${new Date().toISOString().slice(0,10)}.csv`);
      res.send(csvString);
      
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;