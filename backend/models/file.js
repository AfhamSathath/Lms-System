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

  // From File Type dropdown
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: [
      'lecture_notes',
      'tutorial',
      'assignment',
      'past_paper',
      'syllabus',
      'reading_material',
      'lab_manual',
      'project_guideline',
      'announcement',
      'supplementary_material',
      'presentation',
      'handout',
      'solution',
      'reference',
      'other'
    ],
    default: 'other'
  },

  // From Select Course
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },

  // From Academic Year dropdown
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },

  // From Semester dropdown
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 2
  },

  // Tags input
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Description textarea
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },

  // Checkbox
  isPublic: {
    type: Boolean,
    default: false
  },

  // Download counter
  downloads: {
    type: Number,
    default: 0
  },

  // Uploader
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
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


// 🔹 Virtual: File URL
fileSchema.virtual('url').get(function () {
  return `/uploads/${this.filename}`;
});


// 🔹 Virtual: File Extension
fileSchema.virtual('extension').get(function () {
  return this.originalName.split('.').pop();
});


// 🔹 Virtual: Formatted Size
fileSchema.virtual('sizeFormatted').get(function () {
  const bytes = this.size;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
});


// 🔹 Indexes
fileSchema.index({ course: 1, semester: 1, academicYear: 1 });
fileSchema.index({ fileType: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ isPublic: 1, isActive: 1 });

module.exports = mongoose.model('File', fileSchema);