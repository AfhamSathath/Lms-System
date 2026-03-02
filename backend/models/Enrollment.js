const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'subject',
    required: [true, 'Course is required'],
    index: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    validate: {
      validator: function(v) {
        // Validate format like "2023-2024"
        return /^\d{4}-\d{4}$/.test(v);
      },
      message: 'Academic year must be in format YYYY-YYYY'
    }
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
    enum: ['enrolled', 'dropped', 'completed', 'failed', 'incomplete', 'waitlisted'],
    default: 'enrolled',
    index: true
  },
  
  // Waitlist information
  waitlistPosition: {
    type: Number,
    min: 1
  },
  waitlistDate: Date,
  
  // Grades
  continuousAssessment: {
    type: Number,
    min: [0, 'Continuous assessment cannot be less than 0'],
    max: [100, 'Continuous assessment cannot exceed 100'],
    default: 0,
    set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
  },
  finalExam: {
    type: Number,
    min: [0, 'Final exam cannot be less than 0'],
    max: [100, 'Final exam cannot exceed 100'],
    default: 0,
    set: v => Math.round(v * 100) / 100
  },
  totalMarks: {
    type: Number,
    min: [0, 'Total marks cannot be less than 0'],
    max: [100, 'Total marks cannot exceed 100'],
    default: 0,
    set: v => Math.round(v * 100) / 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F', 'I', 'W', 'AU', '']
  },
  gradePoints: {
    type: Number,
    min: 0,
    max: 4.0,
    default: 0,
    set: v => Math.round(v * 100) / 100
  },
  
  // Grade mappings for calculation
  gradeMappings: {
    type: Map,
    of: Number,
    default: {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'E': 0.5,
      'F': 0.0, 'I': 0.0, 'W': 0.0, 'AU': 0.0
    }
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
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    remarks: String
  }],
  attendancePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Assessment components
  assessments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'midterm', 'project', 'presentation', 'lab', 'final'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    marksObtained: {
      type: Number,
      min: 0,
      default: 0
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      validate: {
        validator: function(v) {
          // Sum of weights for all assessments shouldn't exceed 100
          if (this.assessments) {
            const totalWeight = this.assessments.reduce((sum, a) => sum + (a.weight || 0), 0) + v;
            return totalWeight <= 100;
          }
          return true;
        },
        message: 'Total assessment weight cannot exceed 100%'
      }
    },
    submitted: {
      type: Boolean,
      default: false
    },
    submittedDate: Date,
    submissionUrl: String,
    submissionFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    },
    graded: {
      type: Boolean,
      default: false
    },
    gradedDate: Date,
    marksPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: {
      type: String,
      trim: true
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isLate: {
      type: Boolean,
      default: false
    },
    latePenalty: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  
  // Payment information
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'waived', 'refunded'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  paymentDate: Date,
  paymentReference: String,
  
  // Withdrawal information
  withdrawalDate: Date,
  withdrawalReason: {
    type: String,
    trim: true
  },
  withdrawalApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  withdrawalApprovedAt: Date,
  
  // Remarks and notes
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  internalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
  },
  
  // Grading metadata
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedDate: Date,
  lastGradedAssessment: Date,
  
  // Transcript visibility
  visibleOnTranscript: {
    type: Boolean,
    default: true
  },
  
  // Audit fields
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

// Ensure one enrollment per student per course per semester
enrollmentSchema.index(
  { student: 1, course: 1, academicYear: 1, semester: 1 }, 
  { unique: true }
);

// Additional indexes for query performance
enrollmentSchema.index({ course: 1, enrollmentStatus: 1, semester: 1, academicYear: 1 });
enrollmentSchema.index({ student: 1, academicYear: 1, semester: 1, enrollmentStatus: 1 });
enrollmentSchema.index({ enrollmentStatus: 1, waitlistPosition: 1 });
enrollmentSchema.index({ grade: 1 });
enrollmentSchema.index({ 'assessments.graded': 1, 'assessments.type': 1 });
enrollmentSchema.index({ paymentStatus: 1 });
enrollmentSchema.index({ createdAt: -1 });

// Compound index for attendance queries
enrollmentSchema.index({ 'attendance.date': 1, 'attendance.status': 1 });

// Pre-save middleware for calculations
enrollmentSchema.pre('save', function(next) {
  try {
    // Calculate total marks from continuous assessment and final exam
    if (this.continuousAssessment !== undefined && this.finalExam !== undefined) {
      // Calculate weighted average (adjust weights as needed)
      const caWeight = 0.4; // 40% for continuous assessment
      const examWeight = 0.6; // 60% for final exam
      
      this.totalMarks = (this.continuousAssessment * caWeight) + (this.finalExam * examWeight);
      
      // Round to 2 decimal places
      this.totalMarks = Math.round(this.totalMarks * 100) / 100;
      
      // Calculate grade based on total marks
      this.calculateGradeFromMarks();
    }
    
    // Calculate marks from assessments if they exist
    if (this.assessments && this.assessments.length > 0) {
      this.calculateFromAssessments();
    }
    
    // Calculate attendance percentage
    this.calculateAttendancePercentage();
    
    // Update last graded assessment date
    const gradedAssessments = this.assessments.filter(a => a.graded === true);
    if (gradedAssessments.length > 0) {
      this.lastGradedAssessment = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware to handle updates
enrollmentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Instance methods
enrollmentSchema.methods = {
  // Calculate grade from marks
  calculateGradeFromMarks() {
    const marks = this.totalMarks;
    
    if (marks >= 85) this.grade = 'A+';
    else if (marks >= 80) this.grade = 'A';
    else if (marks >= 75) this.grade = 'A-';
    else if (marks >= 70) this.grade = 'B+';
    else if (marks >= 65) this.grade = 'B';
    else if (marks >= 60) this.grade = 'B-';
    else if (marks >= 55) this.grade = 'C+';
    else if (marks >= 50) this.grade = 'C';
    else if (marks >= 45) this.grade = 'C-';
    else if (marks >= 40) this.grade = 'D+';
    else if (marks >= 35) this.grade = 'D';
    else if (marks >= 30) this.grade = 'E';
    else this.grade = 'F';
    
    // Calculate grade points
    this.gradePoints = this.gradeMappings.get(this.grade) || 0;
  },
  
  // Calculate from assessments
  calculateFromAssessments() {
    let totalWeightedMarks = 0;
    let totalWeight = 0;
    
    this.assessments.forEach(assessment => {
      if (assessment.graded && assessment.marksObtained !== undefined) {
        const marksPercentage = (assessment.marksObtained / assessment.maxMarks) * 100;
        const weightedMarks = (marksPercentage * assessment.weight) / 100;
        totalWeightedMarks += weightedMarks;
        totalWeight += assessment.weight;
        
        // Update marks percentage for each assessment
        assessment.marksPercentage = Math.round(marksPercentage * 100) / 100;
      }
    });
    
    if (totalWeight > 0) {
      this.totalMarks = (totalWeightedMarks / totalWeight) * 100;
      this.totalMarks = Math.round(this.totalMarks * 100) / 100;
      this.calculateGradeFromMarks();
    }
  },
  
  // Calculate attendance percentage
  calculateAttendancePercentage() {
    if (this.attendance && this.attendance.length > 0) {
      const total = this.attendance.length;
      const present = this.attendance.filter(a => 
        a.status === 'present' || a.status === 'late'
      ).length;
      
      this.attendancePercentage = Math.round((present / total) * 100 * 100) / 100;
    } else {
      this.attendancePercentage = 0;
    }
  },
  
  // Add attendance record
  addAttendance(date, status, markedBy, remarks = '') {
    if (!this.attendance) {
      this.attendance = [];
    }
    
    // Check if attendance for this date already exists
    const existingIndex = this.attendance.findIndex(a => 
      a.date.toDateString() === date.toDateString()
    );
    
    const attendanceRecord = {
      date,
      status,
      markedBy,
      markedAt: new Date(),
      remarks
    };
    
    if (existingIndex >= 0) {
      this.attendance[existingIndex] = attendanceRecord;
    } else {
      this.attendance.push(attendanceRecord);
    }
    
    this.calculateAttendancePercentage();
    return this;
  },
  
  // Add assessment result
  addAssessment(assessmentData) {
    if (!this.assessments) {
      this.assessments = [];
    }
    
    // Check if assessment with same name exists
    const existingIndex = this.assessments.findIndex(a => 
      a.name === assessmentData.name && a.type === assessmentData.type
    );
    
    if (existingIndex >= 0) {
      this.assessments[existingIndex] = {
        ...this.assessments[existingIndex],
        ...assessmentData,
        updatedAt: new Date()
      };
    } else {
      this.assessments.push({
        ...assessmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    this.calculateFromAssessments();
    return this;
  },
  
  // Withdraw from course
  withdraw(reason, approvedBy) {
    this.enrollmentStatus = 'dropped';
    this.withdrawalDate = new Date();
    this.withdrawalReason = reason;
    this.withdrawalApprovedBy = approvedBy;
    this.withdrawalApprovedAt = new Date();
    return this;
  },
  
  // Check if student can drop course
  canDrop() {
    const enrollmentDate = new Date(this.enrollmentDate);
    const now = new Date();
    const daysEnrolled = Math.floor((now - enrollmentDate) / (1000 * 60 * 60 * 24));
    
    // Can drop within first 14 days of semester
    return daysEnrolled <= 14 && this.enrollmentStatus === 'enrolled';
  }
};

// Static methods
enrollmentSchema.statics = {
  // Get enrollment statistics
  async getStats(filters = {}) {
    const match = { ...filters };
    
    const stats = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: { $cond: [{ $eq: ['$enrollmentStatus', 'enrolled'] }, 1, 0] }
          },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$enrollmentStatus', 'completed'] }, 1, 0] }
          },
          droppedEnrollments: {
            $sum: { $cond: [{ $eq: ['$enrollmentStatus', 'dropped'] }, 1, 0] }
          },
          failedEnrollments: {
            $sum: { $cond: [{ $eq: ['$enrollmentStatus', 'failed'] }, 1, 0] }
          },
          waitlistedEnrollments: {
            $sum: { $cond: [{ $eq: ['$enrollmentStatus', 'waitlisted'] }, 1, 0] }
          },
          averageGrade: { $avg: '$gradePoints' },
          averageAttendance: { $avg: '$attendancePercentage' },
          totalAssessments: { $sum: { $size: { $ifNull: ['$assessments', []] } } },
          gradedAssessments: {
            $sum: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$assessments', []] },
                  as: 'assessment',
                  cond: { $eq: ['$$assessment.graded', true] }
                }
              }
            }
          },
          enrollments: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          total: '$totalEnrollments',
          active: '$activeEnrollments',
          completed: '$completedEnrollments',
          dropped: '$droppedEnrollments',
          failed: '$failedEnrollments',
          waitlisted: '$waitlistedEnrollments',
          averageGrade: 1,
          averageAttendance: 1,
          totalAssessments: 1,
          gradedAssessments: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedEnrollments', { $max: ['$totalEnrollments', 1] }] },
              100
            ]
          },
          successRate: {
            $multiply: [
              {
                $divide: [
                  { $add: ['$completedEnrollments', '$activeEnrollments'] },
                  { $max: ['$totalEnrollments', 1] }
                ]
              },
              100
            ]
          },
          recentEnrollments: {
            $slice: ['$enrollments', 10]
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      active: 0,
      completed: 0,
      dropped: 0,
      failed: 0,
      waitlisted: 0,
      averageGrade: 0,
      averageAttendance: 0,
      totalAssessments: 0,
      gradedAssessments: 0,
      completionRate: 0,
      successRate: 0,
      recentEnrollments: []
    };
  },
  
  // Get enrollment trends
  async getTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$enrollmentStatus'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          enrollments: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          date: '$_id',
          total: 1,
          enrollments: 1,
          _id: 0
        }
      }
    ]);
  },
  
  // Bulk update enrollment status
  async bulkUpdateStatus(enrollmentIds, status, updatedBy) {
    return this.updateMany(
      { _id: { $in: enrollmentIds } },
      {
        $set: {
          enrollmentStatus: status,
          updatedBy: updatedBy,
          updatedAt: new Date()
        }
      }
    );
  },
  
  // Get grade distribution for a course
  async getGradeDistribution(courseId, academicYear, semester) {
    return this.aggregate([
      {
        $match: {
          course: mongoose.Types.ObjectId(courseId),
          academicYear: academicYear,
          semester: semester,
          enrollmentStatus: { $in: ['completed', 'enrolled'] }
        }
      },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          grade: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { grade: 1 } }
    ]);
  },
  
  // Get student's GPA
  async getStudentGPA(studentId, academicYear = null) {
    const match = {
      student: mongoose.Types.ObjectId(studentId),
      enrollmentStatus: { $in: ['completed', 'enrolled'] }
    };
    
    if (academicYear) {
      match.academicYear = academicYear;
    }
    
    const result = await this.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $group: {
          _id: '$student',
          totalGradePoints: {
            $sum: {
              $multiply: ['$gradePoints', '$courseInfo.credits']
            }
          },
          totalCredits: { $sum: '$courseInfo.credits' },
          courses: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          gpa: {
            $cond: [
              { $eq: ['$totalCredits', 0] },
              0,
              { $divide: ['$totalGradePoints', '$totalCredits'] }
            ]
          },
          totalCredits: 1,
          totalGradePoints: 1,
          courseCount: { $size: '$courses' }
        }
      }
    ]);
    
    return result[0] || { gpa: 0, totalCredits: 0, totalGradePoints: 0, courseCount: 0 };
  }
};

// Virtual for course details
enrollmentSchema.virtual('courseDetails', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true
});

// Virtual for student details
enrollmentSchema.virtual('studentDetails', {
  ref: 'User',
  localField: 'student',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);