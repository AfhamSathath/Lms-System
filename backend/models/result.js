const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
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
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['midterm', 'final', 'quiz', 'assignment', 'supplementary', 'special', 'practical', 'viva']
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0, 'Marks cannot be less than 0'],
    max: [100, 'Marks cannot exceed 100']
  },
  continuousAssessment: {
    type: Number,
    min: 0,
    max: 100
  },
  finalExam: {
    type: Number,
    min: 0,
    max: 100
  },
  practical: {
    type: Number,
    min: 0,
    max: 100
  },
  assignment: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F']
  },
  gradePoint: {
    type: Number,
    min: 0,
    max: 4.0
  },
  status: {
    type: String,
    enum: ['pass', 'fail', 'incomplete', 'withdrawn'],
    default: 'pass'
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
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Grader information is required']
  },
  gradedAt: {
    type: Date,
    default: Date.now
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: Date,
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: Date,
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

// Virtual for percentage
resultSchema.virtual('percentage').get(function() {
  return this.marks.toFixed(2);
});

// Pre-save middleware
resultSchema.pre('save', function(next) {
  if (this.isModified('marks')) {
    if (this.marks >= 85) this.grade = 'A+';
    else if (this.marks >= 80) this.grade = 'A';
    else if (this.marks >= 75) this.grade = 'A-';
    else if (this.marks >= 70) this.grade = 'B+';
    else if (this.marks >= 65) this.grade = 'B';
    else if (this.marks >= 60) this.grade = 'B-';
    else if (this.marks >= 55) this.grade = 'C+';
    else if (this.marks >= 50) this.grade = 'C';
    else if (this.marks >= 45) this.grade = 'C-';
    else if (this.marks >= 40) this.grade = 'D+';
    else if (this.marks >= 35) this.grade = 'D';
    else if (this.marks >= 30) this.grade = 'E';
    else this.grade = 'F';
    
    const gradePointsMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'E': 0.5,
      'F': 0.0
    };
    this.gradePoint = gradePointsMap[this.grade];
    
    this.status = this.grade === 'F' ? 'fail' : 'pass';
  }
  
  next();
});

// Indexes for efficient queries
resultSchema.index({ student: 1, academicYear: 1, semester: 1 });
resultSchema.index({ course: 1, academicYear: 1, semester: 1 });
resultSchema.index({ department: 1, academicYear: 1, semester: 1 });
resultSchema.index({ faculty: 1, academicYear: 1, semester: 1 });
resultSchema.index({ publishedAt: -1 });
resultSchema.index({ grade: 1 });
resultSchema.index({ isPublished: 1, isApproved: 1 });

// Compound unique index to prevent duplicate results
resultSchema.index(
  { student: 1, course: 1, examType: 1, academicYear: 1, semester: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('Result', resultSchema);