// controllers/notificationController.js
const Notification = require('../models/notification');
const User = require('../models/user');
const Course = require('../models/subject');
const Enrollment = require('../models/Enrollment');
const Department = require('../models/Department');
const mongoose = require('mongoose');

// @desc    Get user notifications with filters
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { 
      type, 
      priority, 
      isRead, 
      startDate, 
      endDate,
      page = 1,
      limit = 20,
      sortBy = '-createdAt'
    } = req.query;

    let query = { 
      $or: [
        { user: req.user.id },
        { targetUsers: req.user.id },
        { 
          targetRoles: req.user.role,
          $or: [
            { targetDepartments: { $in: [req.user.department] } },
            { targetDepartments: { $exists: false } }
          ]
        }
      ]
    };

    // Apply filters
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .populate('sender', 'name email role profilePicture')
      .populate('relatedEntity.entity')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    // Mark notifications as delivered
    await Notification.updateMany(
      { 
        _id: { $in: notifications.map(n => n._id) },
        deliveredAt: null 
      },
      { deliveredAt: new Date() }
    );

    res.json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { targetUsers: req.user.id }
      ]
    })
    .populate('sender', 'name email role profilePicture')
    .populate('relatedEntity.entity');

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    // Mark as read if not already
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      notification
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
      { 
        _id: req.params.id, 
        $or: [
          { user: req.user.id },
          { targetUsers: req.user.id }
        ]
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark multiple notifications as read
// @route   PUT /api/notifications/read-multiple
// @access  Private
exports.markMultipleAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide notification IDs' 
      });
    }

    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        $or: [
          { user: req.user.id },
          { targetUsers: req.user.id }
        ]
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
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
    const result = await Notification.updateMany(
      { 
        $or: [
          { user: req.user.id },
          { targetUsers: req.user.id }
        ],
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.modifiedCount
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
      $or: [
        { user: req.user.id },
        { targetUsers: req.user.id },
        { 
          targetRoles: req.user.role,
          $or: [
            { targetDepartments: { $in: [req.user.department] } },
            { targetDepartments: { $exists: false } }
          ]
        }
      ],
      isRead: false
    });

    // Get counts by priority
    const byPriority = await Notification.aggregate([
      {
        $match: {
          $or: [
            { user: req.user.id },
            { targetUsers: req.user.id },
            { 
              targetRoles: req.user.role,
              $or: [
                { targetDepartments: { $in: [req.user.department] } },
                { targetDepartments: { $exists: false } }
              ]
            }
          ],
          isRead: false
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by type
    const byType = await Notification.aggregate([
      {
        $match: {
          $or: [
            { user: req.user.id },
            { targetUsers: req.user.id },
            { 
              targetRoles: req.user.role,
              $or: [
                { targetDepartments: { $in: [req.user.department] } },
                { targetDepartments: { $exists: false } }
              ]
            }
          ],
          isRead: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      count,
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
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
      $or: [
        { user: req.user.id },
        { targetUsers: req.user.id }
      ]
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
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
    const result = await Notification.deleteMany({
      $or: [
        { user: req.user.id },
        { targetUsers: req.user.id }
      ]
    });

    res.json({
      success: true,
      message: 'All notifications cleared',
      count: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences');
    
    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        email: true,
        push: true,
        inApp: true,
        types: {
          course: true,
          enrollment: true,
          grade: true,
          announcement: true,
          deadline: true,
          system: true
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
exports.updatePreferences = async (req, res, next) => {
  try {
    const { email, push, inApp, types } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        notificationPreferences: {
          email: email !== undefined ? email : true,
          push: push !== undefined ? push : true,
          inApp: inApp !== undefined ? inApp : true,
          types: types || {
            course: true,
            enrollment: true,
            grade: true,
            announcement: true,
            deadline: true,
            system: true
          }
        }
      },
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send notification (Admin only)
// @route   POST /api/notifications/send
// @access  Private/Admin
exports.sendNotification = async (req, res, next) => {
  try {
    const { 
      recipientType, // 'users', 'roles', 'departments', 'courses', 'all'
      recipients, // array of IDs or roles
      title,
      message,
      type = 'announcement',
      priority = 'medium',
      action,
      expiresAt
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and message are required' 
      });
    }

    let targetUsers = [];
    let targetRoles = [];
    let targetDepartments = [];

    // Build recipient list based on type
    switch (recipientType) {
      case 'users':
        targetUsers = recipients;
        break;
      
      case 'roles':
        targetRoles = recipients;
        break;
      
      case 'departments':
        targetDepartments = recipients;
        // Get all users in these departments
        const deptUsers = await User.find({
          department: { $in: recipients },
          isActive: true
        }).select('_id');
        targetUsers = deptUsers.map(u => u._id);
        break;
      
      case 'courses':
        // Get all students enrolled in these courses
        const enrollments = await Enrollment.find({
          course: { $in: recipients },
          enrollmentStatus: 'enrolled'
        }).populate('student');
        targetUsers = [...new Set(enrollments.map(e => e.student._id))];
        
        // Also get lecturers
        const courses = await Course.find({
          _id: { $in: recipients }
        }).populate('lecturers');
        const lecturers = courses.flatMap(c => c.lecturers.map(l => l._id));
        targetUsers = [...new Set([...targetUsers, ...lecturers])];
        break;
      
      case 'all':
        // Send to all active users
        const allUsers = await User.find({ isActive: true }).select('_id');
        targetUsers = allUsers.map(u => u._id);
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid recipient type' 
        });
    }

    // Create notifications
    const notifications = targetUsers.map(userId => ({
      user: userId,
      title,
      message,
      type,
      priority,
      sender: req.user.id,
      action,
      expiresAt,
      metadata: {
        recipientType,
        recipients,
        sentBy: req.user.id
      }
    }));

    const result = await Notification.insertMany(notifications);

    // Send email/push notifications based on user preferences
    // This would be handled by a background job
    // await notificationQueue.add({ notifications: result });

    res.status(201).json({
      success: true,
      message: `Notification sent to ${result.length} users`,
      count: result.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course announcement
// @route   POST /api/notifications/course/:courseId/announcement
// @access  Private (Lecturer, HOD, Admin)
exports.createCourseAnnouncement = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, message, priority = 'medium', attachments } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check permissions
    const isLecturer = course.lecturers.some(l => l.toString() === req.user.id);
    if (!isLecturer && !['admin', 'hod', 'dean'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Get all enrolled students
    const enrollments = await Enrollment.find({
      course: courseId,
      enrollmentStatus: 'enrolled'
    }).populate('student');

    const studentIds = enrollments.map(e => e.student._id);

    // Create notifications for students
    const notifications = studentIds.map(studentId => ({
      user: studentId,
      title: `[${course.courseCode}] ${title}`,
      message,
      type: 'course',
      priority,
      sender: req.user.id,
      relatedEntity: {
        entityType: 'Course',
        entity: courseId
      },
      action: {
        type: 'link',
        url: `/courses/${courseId}/announcements`
      },
      metadata: {
        courseCode: course.courseCode,
        courseName: course.courseName,
        attachments
      }
    }));

    // Also notify other lecturers
    const lecturerIds = course.lecturers.filter(l => l.toString() !== req.user.id);
    lecturerIds.forEach(lecturerId => {
      notifications.push({
        user: lecturerId,
        title: `[${course.courseCode}] New Announcement: ${title}`,
        message: `A new announcement has been posted in ${course.courseName}`,
        type: 'course',
        priority: 'low',
        sender: req.user.id,
        relatedEntity: {
          entityType: 'Course',
          entity: courseId
        }
      });
    });

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Announcement sent to ${studentIds.length} students`,
      count: studentIds.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create grade notification
// @route   POST /api/notifications/grade/:enrollmentId
// @access  Private (Lecturer)
exports.createGradeNotification = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { message } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student')
      .populate('course', 'courseCode courseName');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enrollment not found' 
      });
    }

    // Create notification for student
    await Notification.create({
      user: enrollment.student._id,
      title: `Grade Posted: ${enrollment.course.courseCode}`,
      message: message || `Your grade for ${enrollment.course.courseName} has been posted.`,
      type: 'grade',
      priority: 'high',
      sender: req.user.id,
      relatedEntity: {
        entityType: 'Enrollment',
        entity: enrollmentId
      },
      action: {
        type: 'link',
        url: `/grades/${enrollmentId}`
      },
      metadata: {
        courseCode: enrollment.course.courseCode,
        courseName: enrollment.course.courseName,
        grade: enrollment.grade,
        totalMarks: enrollment.totalMarks
      }
    });

    res.status(201).json({
      success: true,
      message: 'Grade notification sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create deadline notification
// @route   POST /api/notifications/deadline
// @access  Private (Lecturer, Admin)
exports.createDeadlineNotification = async (req, res, next) => {
  try {
    const { 
      courseId, 
      title, 
      description, 
      deadline,
      type = 'assignment',
      targetYears,
      targetSemesters
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Build query for target students
    let studentQuery = {
      role: 'student',
      isActive: true
    };

    if (targetYears && targetYears.length > 0) {
      studentQuery.yearOfStudy = { $in: targetYears };
    }

    if (targetSemesters && targetSemesters.length > 0) {
      studentQuery.semester = { $in: targetSemesters };
    }

    // Get students based on course enrollment
    const enrollments = await Enrollment.find({
      course: courseId,
      enrollmentStatus: 'enrolled'
    }).populate('student');

    const studentIds = enrollments
      .filter(e => {
        const student = e.student;
        if (targetYears && !targetYears.includes(student.yearOfStudy)) return false;
        if (targetSemesters && !targetSemesters.includes(student.semester)) return false;
        return true;
      })
      .map(e => e.student._id);

    // Create notifications
    const notifications = studentIds.map(studentId => ({
      user: studentId,
      title: `Upcoming Deadline: ${title}`,
      message: description,
      type: 'deadline',
      priority: 'high',
      sender: req.user.id,
      relatedEntity: {
        entityType: 'Course',
        entity: courseId
      },
      action: {
        type: 'deadline',
        url: `/courses/${courseId}/assignments`
      },
      metadata: {
        courseCode: course.courseCode,
        courseName: course.courseName,
        deadline,
        type
      },
      expiresAt: new Date(deadline)
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Deadline notification sent to ${studentIds.length} students`,
      count: studentIds.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private (Admin, HOD)
exports.getNotificationStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await Notification.aggregate([
      { $match: dateFilter },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          readStats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                read: { $sum: { $cond: ['$isRead', 1, 0] } },
                unread: { $sum: { $cond: ['$isRead', 0, 1] } }
              }
            }
          ],
          dailyStats: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
          ],
          topSenders: [
            {
              $group: {
                _id: '$sender',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'sender'
              }
            },
            { $unwind: '$sender' },
            {
              $project: {
                'sender.name': 1,
                'sender.email': 1,
                count: 1
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create system notification (internal)
// @access  Internal
exports.createSystemNotification = async (userId, title, message, type = 'system', metadata = {}) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority: 'medium',
      metadata: {
        ...metadata,
        system: true
      }
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
};

// @desc    Create bulk notifications (internal)
// @access  Internal
exports.createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      ...notificationData,
      createdAt: new Date()
    }));

    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// @desc    Clean up old notifications
// @route   DELETE /api/notifications/cleanup
// @access  Private (Admin)
exports.cleanupOldNotifications = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

