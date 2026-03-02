const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'admin'],
    default: 'student',
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  lecturerId: {
    type: String,
    unique: true,
    sparse: true,
  },
  department: {
    type: String,
    required: function() {
      return this.role !== 'admin';
    },
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: function() {
      return this.role === 'student';
    },
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid phone number'],
  },
  address: String,
  profilePicture: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password when converting to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);