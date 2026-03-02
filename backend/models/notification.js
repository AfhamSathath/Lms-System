const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  type: {
    type: String,
    enum: ['result', 'file', 'timetable', 'alert', 'general'],
    default: 'general',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // Auto delete after 30 days
  },
});

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);