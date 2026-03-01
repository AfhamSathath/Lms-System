const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  filename: {
    type: String,
    required: [true, 'Stored filename is required'],
    unique: true,
    trim: true
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: [
      'lecture_notes', 'tutorial', 'assignment', 'past_paper', 
      'syllabus', 'reading_material', 'lab_manual', 'project_guideline',
      'announcement', 'supplementary_material', 'presentation', 'handout',
      'solution', 'reference', 'other'
    ],
    default: 'other'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  yearOfStudy: {
    type: Number,
    required: [true, 'Year of study is required'],
    min: 1,
    max: 5
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 2
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloads: {
    type: Number,
    default: 0,
    min: 0
  },
  downloadHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file URL
fileSchema.virtual('url').get(function() {
  return `/uploads/${this.filename}`;
});

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop();
});

// Virtual for formatted size
fileSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
});

// Pre-save middleware
fileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  if (!this.academicYear) {
    const year = new Date().getFullYear();
    this.academicYear = `${year}/${year + 1}`;
  }
  
  next();
});

// Indexes for efficient queries
fileSchema.index({ course: 1, fileType: 1, yearOfStudy: 1, semester: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ downloads: -1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ department: 1, faculty: 1 });
fileSchema.index({ isPublic: 1, isActive: 1 });
fileSchema.index({ filename: 1 }, { unique: true });

module.exports = mongoose.model('File', fileSchema);