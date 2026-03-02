const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    minlength: [2, 'Department name must be at least 2 characters'],
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true, // Fixed: changed from toUpperCase to uppercase
    trim: true,
    minlength: [2, 'Department code must be at least 2 characters'],
    maxlength: [20, 'Department code cannot exceed 20 characters']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hodStartDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // If hodEndDate exists, hodStartDate should be before it
        if (this.hodEndDate && value >= this.hodEndDate) {
          return false;
        }
        return true;
      },
      message: 'HOD start date must be before end date'
    }
  },
  hodEndDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // If hodStartDate exists, hodEndDate should be after it
        if (this.hodStartDate && value <= this.hodStartDate) {
          return false;
        }
        return true;
      },
      message: 'HOD end date must be after start date'
    }
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 
      'Please enter a valid email'
    ]
  },
  contactPhone: {
    type: String,
    match: [
      /^[0-9]{10}$|^[0-9]{3}-[0-9]{3}-[0-9]{4}$|^\+[0-9]{1,3}[0-9]{10}$/, 
      'Please enter a valid phone number (10 digits, 123-456-7890, or +1XXXXXXXXXX)'
    ]
  },
  officeLocation: {
    type: String,
    trim: true,
    maxlength: [200, 'Office location cannot exceed 200 characters']
  },
  establishedYear: {
    type: Number,
    min: [1800, 'Established year must be after 1800'],
    max: [new Date().getFullYear(), 'Established year cannot be in the future']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      'Please enter a valid URL'
    ]
  },
  budget: {
    allocated: {
      type: Number,
      min: [0, 'Allocated budget cannot be negative'],
      default: 0
    },
    spent: {
      type: Number,
      min: [0, 'Spent budget cannot be negative'],
      default: 0
    },
    fiscalYear: {
      type: String,
      match: [/^\d{4}-\d{4}$/, 'Fiscal year must be in format YYYY-YYYY']
    }
  },
  facilities: [{
    name: String,
    description: String,
    capacity: Number,
    location: String
  }],
  achievements: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    date: Date,
    type: {
      type: String,
      enum: ['academic', 'research', 'sports', 'cultural', 'other']
    },
    awardedBy: String
  }],
  programs: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['undergraduate', 'graduate', 'doctoral', 'diploma', 'certificate']
    },
    duration: {
      years: Number,
      semesters: Number
    },
    credits: {
      type: Number,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  stats: {
    totalStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    totalFaculty: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCourses: {
      type: Number,
      default: 0,
      min: 0
    },
    totalLecturers: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
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

// Virtual populate with counts
departmentSchema.virtual('lecturers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  match: { role: 'lecturer', isActive: true },
  options: { sort: { lastName: 1, firstName: 1 } }
});

departmentSchema.virtual('lecturerCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  match: { role: 'lecturer', isActive: true },
  count: true
});

departmentSchema.virtual('students', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  match: { role: 'student', isActive: true },
  options: { sort: { lastName: 1, firstName: 1 } }
});

departmentSchema.virtual('studentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  match: { role: 'student', isActive: true },
  count: true
});

departmentSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'department',
  match: { isActive: true },
  options: { sort: { code: 1 } }
});

departmentSchema.virtual('courseCount', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'department',
  match: { isActive: true },
  count: true
});

// Pre-save middleware to update stats
departmentSchema.pre('save', async function(next) {
  // If this is a new department or code/name changed, you might want to trigger stats update
  this.updatedAt = Date.now();
  next();
});

// Pre-remove middleware
departmentSchema.pre('remove', async function(next) {
  // Check if department has any active dependencies
  const User = mongoose.model('User');
  const Course = mongoose.model('Course');
  
  const hasUsers = await User.exists({ department: this._id, isActive: true });
  const hasCourses = await Course.exists({ department: this._id, isActive: true });
  
  if (hasUsers || hasCourses) {
    next(new Error('Cannot delete department with active users or courses'));
  }
  next();
});

// Instance methods
departmentSchema.methods = {
  // Get current HOD
  async getCurrentHOD() {
    if (!this.headOfDepartment) return null;
    
    const hod = await mongoose.model('User')
      .findById(this.headOfDepartment)
      .select('firstName lastName email profilePicture');
    
    return {
      ...hod.toObject(),
      startDate: this.hodStartDate,
      endDate: this.hodEndDate,
      isCurrent: !this.hodEndDate || this.hodEndDate > new Date()
    };
  },

  // Update stats
  async updateStats() {
    const User = mongoose.model('User');
    const Course = mongoose.model('Course');
    
    const [studentCount, lecturerCount, courseCount] = await Promise.all([
      User.countDocuments({ department: this._id, role: 'student', isActive: true }),
      User.countDocuments({ department: this._id, role: 'lecturer', isActive: true }),
      Course.countDocuments({ department: this._id, isActive: true })
    ]);
    
    this.stats = {
      totalStudents: studentCount,
      totalLecturers: lecturerCount,
      totalFaculty: lecturerCount, // Faculty includes lecturers
      totalCourses: courseCount
    };
    
    return this.save();
  },

  // Check if department has capacity for more students
  hasCapacity(maxStudents = 1000) {
    return this.stats.totalStudents < maxStudents;
  }
};

// Static methods
departmentSchema.statics = {
  // Get department statistics
  async getStats(filters = {}) {
    const match = { isActive: true, ...filters };
    
    const stats = await this.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'departmentUsers'
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'department',
          as: 'departmentCourses'
        }
      },
      {
        $group: {
          _id: null,
          totalDepartments: { $sum: 1 },
          totalStudents: {
            $sum: {
              $size: {
                $filter: {
                  input: '$departmentUsers',
                  as: 'user',
                  cond: { $eq: ['$$user.role', 'student'] }
                }
              }
            }
          },
          totalFaculty: {
            $sum: {
              $size: {
                $filter: {
                  input: '$departmentUsers',
                  as: 'user',
                  cond: { $in: ['$$user.role', ['faculty', 'lecturer']] }
                }
              }
            }
          },
          totalCourses: { $sum: { $size: '$departmentCourses' } },
          departments: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          total: '$totalDepartments',
          active: '$totalDepartments',
          totalStudents: 1,
          totalFaculty: 1,
          totalCourses: 1,
          departments: {
            $map: {
              input: '$departments',
              as: 'dept',
              in: {
                id: '$$dept._id',
                name: '$$dept.name',
                code: '$$dept.code',
                studentCount: {
                  $size: {
                    $filter: {
                      input: '$$dept.departmentUsers',
                      as: 'user',
                      cond: { $eq: ['$$user.role', 'student'] }
                    }
                  }
                },
                facultyCount: {
                  $size: {
                    $filter: {
                      input: '$$dept.departmentUsers',
                      as: 'user',
                      cond: { $in: ['$$user.role', ['faculty', 'lecturer']] }
                    }
                  }
                },
                courseCount: { $size: '$$dept.departmentCourses' },
                hod: '$$dept.headOfDepartment',
                isActive: '$$dept.isActive'
              }
            }
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      active: 0,
      totalStudents: 0,
      totalFaculty: 0,
      totalCourses: 0,
      departments: []
    };
  },

  // Find departments with low student count
  findLowEnrollment(threshold = 50) {
    return this.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department',
          as: 'students'
        }
      },
      {
        $addFields: {
          studentCount: {
            $size: {
              $filter: {
                input: '$students',
                as: 'student',
                cond: { $eq: ['$$student.role', 'student'] }
              }
            }
          }
        }
      },
      { $match: { studentCount: { $lt: threshold }, isActive: true } },
      { $sort: { studentCount: 1 } },
      { $project: { name: 1, code: 1, studentCount: 1 } }
    ]);
  },

  // Bulk update status
  async bulkUpdateStatus(departmentIds, status) {
    return this.updateMany(
      { _id: { $in: departmentIds } },
      { $set: { isActive: status, updatedAt: new Date() } }
    );
  }
};

// Indexes for better query performance
departmentSchema.index({ faculty: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ name: 1 });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ 'stats.totalStudents': -1 });
departmentSchema.index({ 'stats.totalCourses': -1 });

module.exports = mongoose.model('Department', departmentSchema);