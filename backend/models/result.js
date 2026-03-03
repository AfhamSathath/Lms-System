const mongoose = require('mongoose');
const { calculateGrade } = require('../utils/gradecalculator');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    validate: {
      validator: async function(v) {
        const user = await mongoose.model('User').findById(v);
        return user && user.role === 'student';
      },
      message: 'Invalid student',
    },
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
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
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'assignment', 'supplementary'],
    required: [true, 'Exam type is required'],
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: 0,
    max: 100,
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F'],
  },
  gradePoint: {
    type: Number,
    min: 0,
    max: 4,
  },
  status: {
    type: String,
    enum: ['pass', 'fail'],
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate grade before saving
resultSchema.pre('save', function(next) {
  const gradeInfo = calculateGrade(this.marks);
  this.grade = gradeInfo.grade;
  this.gradePoint = gradeInfo.gradePoint;
  this.status = gradeInfo.status;
  next();
});

// Ensure unique result per student per subject per exam type per year-semester
resultSchema.index({ student: 1, subject: 1, examType: 1, year: 1, semester: 1 }, { unique: true });

// Compound index for efficient queries
resultSchema.index({ student: 1, year: 1, semester: 1 });
resultSchema.index({ year: 1, semester: 1 });
resultSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Result', resultSchema);