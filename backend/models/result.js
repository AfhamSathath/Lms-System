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
    validate: {
      validator: async function(v) {
        const subject = await mongoose.model('Subject').findById(v);
        return subject !== null;
      },
      message: 'Invalid subject',
    },
  },
  year: {
    type: String,
    required: [true, 'Academic year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    validate: {
      validator: async function(v) {
        // If we have a subject, validate that the year matches the subject's year
        if (this.subject) {
          const subject = await mongoose.model('Subject').findById(this.subject);
          if (subject && subject.year && subject.year !== v) {
            return false;
          }
        }
        return true;
      },
      message: 'Year must match the subject\'s academic year',
    },
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 2,
    validate: {
      validator: async function(v) {
        // If we have a subject, validate that the semester matches the subject's semester
        if (this.subject) {
          const subject = await mongoose.model('Subject').findById(this.subject);
          if (subject && subject.semester && subject.semester !== v) {
            return false;
          }
        }
        return true;
      },
      message: 'Semester must match the subject\'s semester',
    },
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
  isLocked: {
    type: Boolean,
    default: false,
    description: 'When true, year and semester cannot be modified',
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User who locked the result',
  },
  lockedAt: {
    type: Date,
    description: 'When the result was locked',
  },
  lockReason: {
    type: String,
    maxlength: 500,
    description: 'Reason for locking the result',
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
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastModifiedAt: {
    type: Date,
  },
});

// Calculate grade before saving
resultSchema.pre('save', function(next) {
  const gradeInfo = calculateGrade(this.marks);
  this.grade = gradeInfo.grade;
  this.gradePoint = gradeInfo.gradePoint;
  this.status = gradeInfo.status;
  
  // Auto-lock year and semester if subject is set
  if (this.subject && !this.isLocked) {
    this.isLocked = true;
  }
  
  // Update last modified timestamp
  this.lastModifiedAt = new Date();
  
  next();
});

// Pre-update middleware to enforce locks
resultSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  const doc = await this.model.findOne(this.getQuery());
  
  // Check if trying to modify locked fields
  if (doc && doc.isLocked) {
    // If update contains year or semester and they're different from current values
    if (update.year && update.year !== doc.year) {
      throw new Error('Cannot modify year: Result is locked');
    }
    if (update.semester && update.semester !== doc.semester) {
      throw new Error('Cannot modify semester: Result is locked');
    }
  }
  
  // Validate subject-year-semester consistency
  if (update.subject || update.year || update.semester) {
    const subjectId = update.subject || doc.subject;
    const year = update.year || doc.year;
    const semester = update.semester || doc.semester;
    
    if (subjectId && year && semester) {
      const subject = await mongoose.model('Subject').findById(subjectId);
      if (subject) {
        if (subject.year && subject.year !== year) {
          throw new Error(`Year ${year} does not match subject's year ${subject.year}`);
        }
        if (subject.semester && subject.semester !== semester) {
          throw new Error(`Semester ${semester} does not match subject's semester ${subject.semester}`);
        }
      }
    }
  }
  
  // Update last modified timestamp
  update.lastModifiedAt = new Date();
  
  next();
});

// Ensure unique result per student per subject per exam type per year-semester
resultSchema.index({ student: 1, subject: 1, examType: 1, year: 1, semester: 1 }, { unique: true });

// Compound index for efficient queries
resultSchema.index({ student: 1, year: 1, semester: 1 });
resultSchema.index({ year: 1, semester: 1 });
resultSchema.index({ publishedAt: -1 });
resultSchema.index({ isLocked: 1 }); // Index for filtering locked/unlocked results
resultSchema.index({ lockedBy: 1 }); // Index for finding results locked by a user

// Virtual for checking if result can be edited
resultSchema.virtual('canEdit').get(function() {
  return !this.isLocked;
});

// Method to lock a result
resultSchema.methods.lock = async function(userId, reason = '') {
  this.isLocked = true;
  this.lockedBy = userId;
  this.lockedAt = new Date();
  this.lockReason = reason;
  return this.save();
};

// Method to unlock a result (admin only)
resultSchema.methods.unlock = async function() {
  this.isLocked = false;
  this.lockedBy = null;
  this.lockedAt = null;
  this.lockReason = null;
  return this.save();
};

// Static method to bulk lock/unlock results
resultSchema.statics.bulkLock = async function(filter, userId, lock = true, reason = '') {
  const update = {
    isLocked: lock,
    ...(lock ? {
      lockedBy: userId,
      lockedAt: new Date(),
      lockReason: reason
    } : {
      lockedBy: null,
      lockedAt: null,
      lockReason: null
    })
  };
  
  return this.updateMany(filter, update);
};

// Static method to validate subject-year-semester consistency
resultSchema.statics.validateConsistency = async function(studentId, subjectId, year, semester) {
  const subject = await mongoose.model('Subject').findById(subjectId);
  if (!subject) {
    throw new Error('Subject not found');
  }
  
  if (subject.year && subject.year !== year) {
    throw new Error(`Year ${year} does not match subject's year ${subject.year}`);
  }
  
  if (subject.semester && subject.semester !== semester) {
    throw new Error(`Semester ${semester} does not match subject's semester ${subject.semester}`);
  }
  
  return true;
};

module.exports = mongoose.model('Result', resultSchema);