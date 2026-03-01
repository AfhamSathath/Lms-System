const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'admin', 'hod', 'dean', 'registrar'],
    default: 'student'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  
  // Student specific fields
  yearOfStudy: {
    type: Number,
    min: 1,
    max: 5
  },
  semester: {
    type: Number,
    min: 1,
    max: 2
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  academicStatus: {
    type: String,
    enum: ['active', 'probation', 'suspended', 'graduated', 'withdrawn'],
    default: 'active'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  expectedGraduation: Date,
  
  // Lecturer specific fields
  lecturerRank: {
    type: String,
    enum: ['professor', 'associate_professor', 'senior_lecturer', 'lecturer', 'assistant_lecturer', 'tutorial_fellow']
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    field: String
  }],
  specialization: [String],
  coursesTaught: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  researchAreas: [String],
  officeLocation: String,
  consultationHours: [{
    day: String,
    startTime: String,
    endTime: String
  }],
  
  // HOD specific fields
  isHOD: {
    type: Boolean,
    default: false
  },
  hodSince: Date,
  
  // Dean specific fields
  isDean: {
    type: Boolean,
    default: false
  },
  deanSince: Date,
  facultyManaged: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  
  // Personal Information
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid phone number']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Account management
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
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

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ registrationNumber: 1 });
userSchema.index({ department: 1, role: 1 });
userSchema.index({ faculty: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = Date.now() - 1000;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after JWT issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Generate registration number for students
userSchema.pre('save', async function(next) {
  if (this.role === 'student' && !this.registrationNumber) {
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await mongoose.model('User').countDocuments({ 
      role: 'student',
      registrationNumber: new RegExp(`^${year}`)
    });
    this.registrationNumber = `${year}${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

// Remove password when converting to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);