// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Primary recipient (individual user)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  
  // For broadcast notifications
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetRoles: [{
    type: String,
    enum: ['student', 'lecturer', 'hod', 'dean', 'admin', 'registrar']
  }],
  targetDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  targetFaculties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  }],
  targetCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Notification content
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  summary: {
    type: String,
    maxlength: [200, 'Summary cannot exceed 200 characters']
  },
  
  // Notification type
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'result', 'grade', 'file', 'timetable', 'exam', 'class',
      'alert', 'announcement', 'deadline', 'reminder', 'system',
      'enrollment', 'course', 'assignment', 'event', 'warning',
      'info', 'success', 'error', 'achievement', 'certificate'
    ],
    default: 'info'
  },
  
  // Priority and importance
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    },
    device: String,
    ipAddress: String
  }],
  
  // Delivery status
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  deliveryError: String,
  
  // Action links
  action: {
    type: {
      type: String,
      enum: ['link', 'button', 'modal', 'none']
    },
    url: String,
    label: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Related entity in the system
  relatedEntity: {
    entityType: {
      type: String,
      enum: [
        'User', 'Course', 'Result', 'File', 'Timetable',
        'Enrollment', 'Assignment', 'Event', 'Certificate',
        'Department', 'Faculty', 'Payment'
      ]
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.entityType'
    }
  },
  
  // Rich metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        // Prevent excessive metadata size
        return JSON.stringify(v).length <= 10000;
      },
      message: 'Metadata too large'
    }
  },
  
  // Icon and visual
  icon: {
    type: String,
    default: 'bell'
  },
  color: {
    type: String,
    enum: ['blue', 'green', 'yellow', 'red', 'purple', 'gray'],
    default: 'blue'
  },
  
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: String,
  senderRole: String,
  
  // Expiration
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30); // Default 30 days
      return date;
    }
  },
  
  // Schedule for future sending
  scheduledFor: Date,
  
  // Grouping
  groupId: String, // For grouping related notifications
  isGrouped: {
    type: Boolean,
    default: false
  },
  
  // Silent mode (no push notification)
  isSilent: {
    type: Boolean,
    default: false
  },
  
  // Read receipt required
  requireReceipt: {
    type: Boolean,
    default: false
  },
  
  // Reactions (like, important, etc.)
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'important', 'thanks', 'question']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Thread/reply functionality
  parentNotification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for formatted date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual for read status
notificationSchema.virtual('readStatus').get(function() {
  if (this.isRead) return 'read';
  if (this.deliveredAt) return 'delivered';
  return 'sent';
});

// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ targetUsers: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL index
notificationSchema.index({ scheduledFor: 1 }, { sparse: true });
notificationSchema.index({ groupId: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entity': 1 });
notificationSchema.index({ sender: 1 });

// Compound indexes for common queries
notificationSchema.index({ user: 1, type: 1, isRead: 1 });
notificationSchema.index({ targetRoles: 1, targetDepartments: 1, createdAt: -1 });
notificationSchema.index({ user: 1, priority: 1, createdAt: -1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set sender info if not provided
  if (this.sender && !this.senderName) {
    // This will be populated later, but we can set a placeholder
    this.senderName = 'System';
  }
  
  // Set summary from message if not provided
  if (!this.summary && this.message) {
    this.summary = this.message.substring(0, 150) + 
      (this.message.length > 150 ? '...' : '');
  }
  
  // Set icon based on type
  if (!this.icon) {
    const iconMap = {
      'result': 'clipboard-list',
      'grade': 'star',
      'file': 'document',
      'timetable': 'calendar',
      'exam': 'pencil',
      'class': 'academic-cap',
      'alert': 'exclamation',
      'announcement': 'megaphone',
      'deadline': 'clock',
      'reminder': 'bell',
      'system': 'cog',
      'enrollment': 'user-plus',
      'course': 'book-open',
      'assignment': 'document-text',
      'event': 'calendar',
      'warning': 'exclamation-triangle',
      'info': 'information-circle',
      'success': 'check-circle',
      'error': 'x-circle',
      'achievement': 'trophy',
      'certificate': 'badge-check'
    };
    this.icon = iconMap[this.type] || 'bell';
  }
  
  // Set color based on priority
  if (!this.color) {
    const colorMap = {
      'urgent': 'red',
      'high': 'yellow',
      'medium': 'blue',
      'low': 'gray'
    };
    this.color = colorMap[this.priority] || 'blue';
  }
  
  next();
});

// Static methods
notificationSchema.statics.markAsRead = async function(userId, notificationIds) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds },
      $or: [
        { user: userId },
        { targetUsers: userId }
      ]
    },
    { 
      isRead: true, 
      readAt: new Date(),
      $addToSet: {
        readBy: { user: userId, readAt: new Date() }
      }
    }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { 
      $or: [
        { user: userId },
        { targetUsers: userId }
      ],
      isRead: false
    },
    { 
      isRead: true, 
      readAt: new Date(),
      $addToSet: {
        readBy: { user: userId, readAt: new Date() }
      }
    }
  );
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    $or: [
      { user: userId },
      { targetUsers: userId }
    ],
    isRead: false
  });
};

notificationSchema.statics.createForUser = async function(userId, data) {
  return this.create({
    user: userId,
    ...data,
    createdAt: new Date()
  });
};

notificationSchema.statics.createForUsers = async function(userIds, data) {
  const notifications = userIds.map(userId => ({
    user: userId,
    ...data,
    createdAt: new Date()
  }));
  
  return this.insertMany(notifications);
};

notificationSchema.statics.createBroadcast = async function(target, data) {
  const notificationData = {
    ...data,
    createdAt: new Date()
  };
  
  switch (target.type) {
    case 'role':
      notificationData.targetRoles = [target.value];
      break;
    case 'department':
      notificationData.targetDepartments = [target.value];
      break;
    case 'faculty':
      notificationData.targetFaculties = [target.value];
      break;
    case 'course':
      notificationData.targetCourses = [target.value];
      break;
    case 'all':
      // No specific target, will be handled by query
      break;
  }
  
  return this.create(notificationData);
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    type,
    isRead,
    priority,
    limit = 20,
    skip = 0,
    sort = '-createdAt'
  } = options;
  
  const query = {
    $or: [
      { user: userId },
      { targetUsers: userId },
      {
        targetRoles: { $in: [await getUserRole(userId)] },
        $or: [
          { targetDepartments: { $exists: false } },
          { targetDepartments: { $in: [await getUserDepartment(userId)] } }
        ]
      }
    ]
  };
  
  if (type) query.type = type;
  if (isRead !== undefined) query.isRead = isRead;
  if (priority) query.priority = priority;
  
  return this.find(query)
    .populate('sender', 'name email role profilePicture')
    .populate('relatedEntity.entity')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Helper function to get user role (to be implemented with User model)
async function getUserRole(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId).select('role');
  return user?.role;
}

// Helper function to get user department
async function getUserDepartment(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId).select('department');
  return user?.department;
}

// Instance methods
notificationSchema.methods.markAsRead = async function(userId) {
  this.isRead = true;
  this.readAt = new Date();
  
  this.readBy.push({
    user: userId,
    readAt: new Date()
  });
  
  return this.save();
};

notificationSchema.methods.markAsDelivered = async function() {
  this.isDelivered = true;
  this.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.addReaction = async function(userId, reactionType) {
  // Check if user already reacted
  const existingReaction = this.reactions.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.type = reactionType;
  } else {
    this.reactions.push({
      user: userId,
      type: reactionType
    });
  }
  
  return this.save();
};

notificationSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
  return this.save();
};

notificationSchema.methods.addReply = async function(replyData) {
  const reply = await this.model('Notification').create({
    ...replyData,
    parentNotification: this._id
  });
  
  this.replies.push(reply._id);
  await this.save();
  
  return reply;
};

notificationSchema.methods.getReactionCount = function(type) {
  return this.reactions.filter(r => r.type === type).length;
};

// Statics for creating specific notification types
notificationSchema.statics.createGradeNotification = async function(studentId, result) {
  const course = await mongoose.model('Course').findById(result.course);
  
  return this.create({
    user: studentId,
    type: 'grade',
    priority: result.grade === 'F' ? 'high' : 'medium',
    title: `Grade Posted: ${course?.courseCode}`,
    message: `Your grade for ${course?.courseName} has been posted. Grade: ${result.grade}`,
    relatedEntity: {
      entityType: 'Result',
      entity: result._id
    },
    action: {
      type: 'link',
      url: `/results/${result._id}`,
      label: 'View Result'
    },
    metadata: {
      courseCode: course?.courseCode,
      courseName: course?.courseName,
      grade: result.grade,
      marks: result.marks
    }
  });
};

notificationSchema.statics.createExamNotification = async function(studentId, timetable) {
  const course = await mongoose.model('Course').findById(timetable.courses[0]);
  
  return this.create({
    user: studentId,
    type: 'exam',
    priority: 'high',
    title: `Exam Schedule: ${course?.courseCode}`,
    message: `${course?.courseName} exam scheduled on ${timetable.date.toLocaleDateString()} at ${timetable.startTime} in ${timetable.venue}`,
    relatedEntity: {
      entityType: 'Timetable',
      entity: timetable._id
    },
    action: {
      type: 'link',
      url: `/timetables/${timetable._id}`,
      label: 'View Details'
    },
    metadata: {
      date: timetable.date,
      time: timetable.startTime,
      venue: timetable.venue,
      courseCode: course?.courseCode
    }
  });
};

notificationSchema.statics.createDeadlineNotification = async function(studentId, assignment) {
  const course = await mongoose.model('Course').findById(assignment.course);
  
  return this.create({
    user: studentId,
    type: 'deadline',
    priority: 'high',
    title: `Upcoming Deadline: ${assignment.title}`,
    message: `${assignment.title} for ${course?.courseName} is due on ${assignment.dueDate.toLocaleDateString()}`,
    relatedEntity: {
      entityType: 'Assignment',
      entity: assignment._id
    },
    action: {
      type: 'link',
      url: `/assignments/${assignment._id}`,
      label: 'View Assignment'
    },
    metadata: {
      courseCode: course?.courseCode,
      dueDate: assignment.dueDate,
      title: assignment.title
    }
  });
};

notificationSchema.statics.createAnnouncement = async function(target, announcement) {
  const notificationData = {
    type: 'announcement',
    priority: announcement.priority || 'medium',
    title: announcement.title,
    message: announcement.message,
    sender: announcement.sender,
    action: announcement.action,
    metadata: announcement.metadata
  };
  
  if (target.type === 'department') {
    notificationData.targetDepartments = [target.id];
  } else if (target.type === 'course') {
    notificationData.targetCourses = [target.id];
  } else if (target.type === 'role') {
    notificationData.targetRoles = [target.role];
  } else if (target.type === 'users') {
    notificationData.targetUsers = target.userIds;
  }
  
  return this.create(notificationData);
};

// TTL index for automatic cleanup
notificationSchema.index(
  { createdAt: 1 }, 
  { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days
);

module.exports = mongoose.model('Notification', notificationSchema);