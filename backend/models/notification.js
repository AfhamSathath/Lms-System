const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    message: {
      type: String,
      required: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: [
        'RESULT_PUBLISHED',
        'FILE_UPLOADED',
        'TIMETABLE_UPDATED',
        'SYSTEM_ALERT',
        'GENERAL',
        'ASSIGNMENT',
        'assignment'
      ],
      default: 'GENERAL',
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'NORMAL', 'normal'],
      default: 'MEDIUM',
    },

    link: {
      type: String, // frontend redirect link
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    metadata: mongoose.Schema.Types.Mixed,

    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // auto delete
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);