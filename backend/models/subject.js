const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [5, 'Credits cannot exceed 5'],
  },
  year: {
    type: String,
    required: [true, 'Academic year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 2,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Computer Science', 'Software Engineering', 'Information Technology'],
  },
  category: {
    type: String,
    enum: ['Lecture', 'Practical', 'General', 'Management', 'Project'],
    default: 'Lecture',
  },
  hasPractical: {
    type: Boolean,
    default: false,
  },
  practicalCode: {
    type: String,
    uppercase: true,
    trim: true,
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(v) {
        if (!v) return true;
        const user = await mongoose.model('User').findById(v);
        return user && user.role === 'lecturer';
      },
      message: 'Invalid lecturer',
    },
  },
  description: {
    type: String,
    default: '',
  },
  syllabus: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper function to get semester number (1-8)
subjectSchema.virtual('semesterNumber').get(function() {
  const yearMap = {
    '1st Year': 1,
    '2nd Year': 2,
    '3rd Year': 3,
    '4th Year': 4
  };
  const yearNum = yearMap[this.year] || 0;
  return (yearNum - 1) * 2 + this.semester;
});

// Compound index for unique subject per year-semester-department
subjectSchema.index({ code: 1, year: 1, semester: 1, department: 1 }, { unique: true });

// Index for efficient queries
subjectSchema.index({ year: 1, semester: 1 });
subjectSchema.index({ department: 1, year: 1, semester: 1 });
subjectSchema.index({ category: 1 });

module.exports = mongoose.model('Subject', subjectSchema);