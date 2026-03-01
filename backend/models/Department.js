const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    toUpperCase: true,
    trim: true
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
  hodStartDate: Date,
  hodEndDate: Date,
  
  contactEmail: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid phone number']
  },
  officeLocation: String,
  establishedYear: Number,
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate
departmentSchema.virtual('lecturers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  match: { role: 'lecturer', isActive: true }
});

departmentSchema.virtual('students', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  match: { role: 'student', isActive: true }
});

departmentSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'department'
});

departmentSchema.index({ faculty: 1 });
departmentSchema.index({ code: 1 });

module.exports = mongoose.model('Department', departmentSchema);