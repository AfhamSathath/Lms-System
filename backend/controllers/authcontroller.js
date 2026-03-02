const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, studentId, lecturerId, department, semester } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if student/lecturer ID is unique
    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    if (role === 'lecturer' && lecturerId) {
      const existingLecturer = await User.findOne({ lecturerId });
      if (existingLecturer) {
        return res.status(400).json({ message: 'Lecturer ID already exists' });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId: role === 'student' ? studentId : undefined,
      lecturerId: role === 'lecturer' ? lecturerId : undefined,
      department,
      semester: role === 'student' ? semester : undefined,
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};