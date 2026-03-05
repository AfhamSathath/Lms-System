const mongoose = require('mongoose');

const subjectFileSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },

  department: {
    type: String,
    required: [true, 'Department is required']
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },

  title: {
    type: String,
    required: [true, 'File title is required'],
    trim: true
  },

  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },

  filePath: {
    type: String,
    required: [true, 'File path is required']
  },

  fileName: {
    type: String,
    required: [true, 'File name is required']
  },

  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },

  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },

  fileType: {
    type: String,
    enum: [
      'lecture_notes',
      'slides',
      'lab_manual',
      'assignment',
      'past_paper',
      'solution',
      'reference',
      'syllabus',
      'curriculum',
      'grading_rubric',
      'reading_material',
      'video_link',
      'other'
    ],
    required: [true, 'File type is required']
  },

  academicYear: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    required: [true, 'Academic year is required']
  },

  semester: {
    type: Number,
    enum: [1, 2],
    required: [true, 'Semester is required']
  },

  topic: {
    type: String,
    trim: true,
    default: ''
  },

  weekNumber: {
    type: Number,
    min: 1,
    max: 16,
    default: null
  },

  version: {
    type: Number,
    default: 1
  },

  isPublished: {
    type: Boolean,
    default: true
  },

  downloadCount: {
    type: Number,
    default: 0
  },

  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  courseOutcomes: [{
    type: String,
    trim: true
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for display file size
subjectFileSchema.virtual('displayFileSize').get(function () {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (this.fileSize === 0) return '0 B';
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Index for efficient queries
subjectFileSchema.index({ subject: 1, semester: 1, academicYear: 1 });
subjectFileSchema.index({ uploadedBy: 1, isActive: 1 });
subjectFileSchema.index({ department: 1, fileType: 1 });
subjectFileSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SubjectFile', subjectFileSchema);
