const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    toUpperCase: true,
    trim: true
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Course credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6']
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
  
  // Course levels
  level: {
    type: String,
    enum: ['100', '200', '300', '400', '500', '600', '700'],
    required: [true, 'Course level is required']
  },
  semester: {
    type: Number,
    enum: [1, 2],
    required: [true, 'Semester is required']
  },
  
  // Instructors
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lecturers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teachingAssistants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Assessment structure
  assessmentStructure: {
    continuousAssessment: {
      weight: {
        type: Number,
        min: 0,
        max: 100,
        default: 40
      },
      components: [{
        name: String,
        weight: Number,
        maxMarks: Number
      }]
    },
    finalExam: {
      weight: {
        type: Number,
        min: 0,
        max: 100,
        default: 60
      },
      duration: {
        type: Number,
        default: 3
      } // in hours
    },
    practical: {
      weight: Number,
      components: [{
        name: String,
        weight: Number,
        maxMarks: Number
      }]
    }
  },
  
  // Schedule
  lectureHours: Number,
  tutorialHours: Number,
  practicalHours: Number,
  
  // Enrollment
  maxStudents: {
    type: Number,
    default: 100
  },
  currentEnrollment: {
    type: Number,
    default: 0
  },
  enrollmentStatus: {
    type: String,
    enum: ['open', 'closed', 'waitlist'],
    default: 'open'
  },
  
  // Academic year
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional details
  learningOutcomes: [String],
  textbooks: [{
    title: String,
    author: String,
    edition: String,
    isbn: String,
    required: {
      type: Boolean,
      default: true
    }
  }],
  syllabus: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

courseSchema.index({ courseCode: 1 });
courseSchema.index({ department: 1, level: 1, semester: 1 });
courseSchema.index({ lecturers: 1 });

module.exports = mongoose.model('Course', courseSchema);