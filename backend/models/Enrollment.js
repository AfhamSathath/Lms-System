const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
  semester: {
    type: Number,
    enum: [1, 2],
    required: [true, 'Semester is required']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  enrollmentStatus: {
    type: String,
    enum: ['enrolled', 'dropped', 'completed', 'failed', 'incomplete'],
    default: 'enrolled'
  },
  
  // Grades
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
  totalMarks: {
    type: Number,
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F']
  },
  gradePoints: {
    type: Number,
    min: 0,
    max: 4.0
  },
  
  // Attendance
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    }
  }],
  attendancePercentage: Number,
  
  // Assessment components
  assessments: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'midterm', 'project', 'presentation', 'lab'],
      required: true
    },
    date: Date,
    marks: Number,
    maxMarks: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    submitted: {
      type: Boolean,
      default: false
    },
    submittedDate: Date,
    graded: {
      type: Boolean,
      default: false
    },
    gradedDate: Date,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Withdrawal information
  withdrawalDate: Date,
  withdrawalReason: String,
  
  // Remarks
  remarks: String,
  
  // Graded by
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedDate: Date,
  
  // Transcript visible
  visibleOnTranscript: {
    type: Boolean,
    default: true
  },
  
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

// Ensure one enrollment per student per course per semester
enrollmentSchema.index(
  { student: 1, course: 1, academicYear: 1, semester: 1 }, 
  { unique: true }
);

enrollmentSchema.index({ course: 1, enrollmentStatus: 1 });
enrollmentSchema.index({ student: 1, academicYear: 1, semester: 1 });

// Calculate total marks and grade before save
enrollmentSchema.pre('save', function(next) {
  if (this.continuousAssessment !== undefined && this.finalExam !== undefined) {
    this.totalMarks = (this.continuousAssessment + this.finalExam) / 2;
    
    // Calculate grade based on total marks
    if (this.totalMarks >= 85) this.grade = 'A+';
    else if (this.totalMarks >= 80) this.grade = 'A';
    else if (this.totalMarks >= 75) this.grade = 'A-';
    else if (this.totalMarks >= 70) this.grade = 'B+';
    else if (this.totalMarks >= 65) this.grade = 'B';
    else if (this.totalMarks >= 60) this.grade = 'B-';
    else if (this.totalMarks >= 55) this.grade = 'C+';
    else if (this.totalMarks >= 50) this.grade = 'C';
    else if (this.totalMarks >= 45) this.grade = 'C-';
    else if (this.totalMarks >= 40) this.grade = 'D+';
    else if (this.totalMarks >= 35) this.grade = 'D';
    else if (this.totalMarks >= 30) this.grade = 'E';
    else this.grade = 'F';
    
    // Calculate grade points
    const gradePointsMap = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'E': 0.5,
      'F': 0.0
    };
    this.gradePoints = gradePointsMap[this.grade];
  }
  
  // Calculate attendance percentage
  if (this.attendance && this.attendance.length > 0) {
    const total = this.attendance.length;
    const present = this.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    this.attendancePercentage = (present / total) * 100;
  }
  
  next();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);