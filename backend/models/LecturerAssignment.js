const mongoose = require('mongoose');

const lecturerAssignmentSchema = new mongoose.Schema({
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lecturer is required'],
    validate: {
      validator: async function(v) {
        const user = await mongoose.model('User').findById(v);
        return user && (user.role === 'lecturer' || user.role === 'hod');
      },
      message: 'Invalid lecturer'
    }
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },

  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
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

  // Curriculum Requirements
  curriculum: {
    totalLectures: {
      type: Number,
      required: [true, 'Total lectures required'],
      min: 1
    },
    totalPracticals: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    lecturesCompleted: {
      type: Number,
      default: 0
    },
    practicalsCompleted: {
      type: Number,
      default: 0
    },
    assignmentsCompleted: {
      type: Number,
      default: 0
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Qualification Requirements
  qualifications: {
    minimumQualification: {
      type: String,
      enum: ['B.Tech', 'M.Tech', 'Ph.D', 'B.Sc', 'M.Sc'],
      required: [true, 'Minimum qualification required']
    },
    hasQualification: {
      type: Boolean,
      default: false
    },
    qualificationProof: {
      type: String,
      default: ''
    }
  },

  // Teaching Materials
  materialsUploaded: {
    lectureNotes: {
      type: Number,
      default: 0
    },
    slidesPerLecture: {
      type: Number,
      default: 0
    },
    labManuals: {
      type: Number,
      default: 0
    },
    pastPapers: {
      type: Number,
      default: 0
    },
    referenceLinks: {
      type: Number,
      default: 0
    }
  },

  status: {
    type: String,
    enum: ['assigned', 'active', 'completed', 'suspended'],
    default: 'assigned'
  },

  assignedDate: {
    type: Date,
    default: Date.now
  },

  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },

  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },

  notes: {
    type: String,
    maxlength: 1000
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

// Virtual for assignment status
lecturerAssignmentSchema.virtual('isCurrentAssignment').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Index for efficient queries
lecturerAssignmentSchema.index({ lecturer: 1, department: 1, subject: 1, semester: 1, academicYear: 1 }, { unique: true });
lecturerAssignmentSchema.index({ department: 1, academicYear: 1, semester: 1 });
lecturerAssignmentSchema.index({ lecturer: 1, isActive: 1 });

module.exports = mongoose.model('LecturerAssignment', lecturerAssignmentSchema);
