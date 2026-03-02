// controllers/usercontroller.js
const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};


exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
};




// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      email, 
      password, 
      name, 
      role, 
      studentId, 
      lecturerId,
      gender,
      dateOfBirth, 
      department, 
      semester,
      yearOfStudy,
      phone,
      address,
      emergencyContact,
      qualifications,
      specialization
    } = req.body;

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

    if (['lecturer', 'hod', 'dean'].includes(role) && lecturerId) {
      const existingLecturer = await User.findOne({ lecturerId });
      if (existingLecturer) {
        return res.status(400).json({ message: 'Lecturer ID already exists' });
      }
    }

    // Create user object based on role
    const userData = {
      name,
      email,
      password,
      role,
      gender,
      dateOfBirth,
      department,
      phone,
      address,
      emergencyContact,
      isActive: true
    };

    // Add role-specific fields
    if (role === 'student') {
      userData.studentId = studentId;
      userData.semester = semester;
      userData.yearOfStudy = yearOfStudy;
    } else if (['lecturer', 'hod', 'dean'].includes(role)) {
      userData.lecturerId = lecturerId;
      userData.qualifications = qualifications;
      userData.specialization = specialization;
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        address: user.address,
        emergencyContact: user.emergencyContact,
        qualifications: user.qualifications,
        specialization: user.specialization,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
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

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        address: user.address,
        emergencyContact: user.emergencyContact,
        qualifications: user.qualifications,
        specialization: user.specialization,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
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
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        address: user.address,
        emergencyContact: user.emergencyContact,
        qualifications: user.qualifications,
        specialization: user.specialization,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      gender,
      dateOfBirth,
      department,
      semester,
      yearOfStudy,
      phone,
      address,
      emergencyContact
    } = req.body;

    // Find user and update
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        gender,
        dateOfBirth,
        department,
        semester,
        yearOfStudy,
        phone,
        address,
        emergencyContact
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        address: user.address,
        emergencyContact: user.emergencyContact
      }
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

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    
    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        address: user.address,
        qualifications: user.qualifications,
        specialization: user.specialization,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        emergencyContact: user.emergencyContact,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users by role
// @route   GET /api/auth/users/role/:role
// @access  Private/Admin
exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    
    if (!['student', 'lecturer', 'admin', 'hod', 'dean'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const users = await User.find({ role }).select('-password');
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID (Admin only)
// @route   GET /api/auth/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        address: user.address,
        qualifications: user.qualifications,
        specialization: user.specialization,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        emergencyContact: user.emergencyContact,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      role,
      studentId,
      lecturerId,
      department,
      semester,
      yearOfStudy,
      phone,
      address,
      qualifications,
      specialization,
      gender,
      dateOfBirth,
      emergencyContact,
      isActive
    } = req.body;

    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Check if student ID is being changed and if it's already taken
    if (role === 'student' && studentId && studentId !== user.studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    // Check if lecturer ID is being changed and if it's already taken
    if (['lecturer', 'hod', 'dean'].includes(role) && lecturerId && lecturerId !== user.lecturerId) {
      const existingLecturer = await User.findOne({ lecturerId });
      if (existingLecturer) {
        return res.status(400).json({ message: 'Lecturer ID already exists' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (qualifications !== undefined) user.qualifications = qualifications;
    if (specialization !== undefined) user.specialization = specialization;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (isActive !== undefined) user.isActive = isActive;

    // Role-specific fields
    if (role === 'student') {
      if (studentId) user.studentId = studentId;
      if (semester) user.semester = semester;
      if (yearOfStudy) user.yearOfStudy = yearOfStudy;
      // Clear staff fields
      user.lecturerId = undefined;
      user.qualifications = undefined;
      user.specialization = undefined;
    } else if (['lecturer', 'hod', 'dean'].includes(role)) {
      if (lecturerId) user.lecturerId = lecturerId;
      if (qualifications !== undefined) user.qualifications = qualifications;
      if (specialization !== undefined) user.specialization = specialization;
      // Clear student fields
      user.studentId = undefined;
      user.semester = undefined;
      user.yearOfStudy = undefined;
    } else if (role === 'admin') {
      // Clear all role-specific fields for admin
      user.studentId = undefined;
      user.lecturerId = undefined;
      user.semester = undefined;
      user.yearOfStudy = undefined;
      user.qualifications = undefined;
      user.specialization = undefined;
      user.department = undefined;
    }

    // Save user
    await user.save();

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
        department: user.department,
        semester: user.semester,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        address: user.address,
        qualifications: user.qualifications,
        specialization: user.specialization,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        emergencyContact: user.emergencyContact,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (Admin only)
// @route   PUT /api/auth/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Password reset email sent',
      resetToken // Remove this in production
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Password reset successful',
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reset user password
// @route   POST /api/auth/users/:id/reset-password
// @access  Private/Admin
exports.adminResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import users (placeholder)
// @route   POST /api/auth/users/bulk-import
// @access  Private/Admin
exports.bulkImportUsers = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Bulk import functionality - to be implemented',
      results: {
        successful: [],
        failed: []
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Export users as CSV (placeholder)
// @route   GET /api/auth/users/export/csv
// @access  Private/Admin
exports.exportUsersCSV = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    
    // Create CSV content
    const fields = ['name', 'email', 'role', 'studentId', 'lecturerId', 'department', 'yearOfStudy', 'semester', 'phone', 'isActive', 'lastLogin', 'createdAt'];
    const csvRows = [];
    
    // Add headers
    csvRows.push(fields.join(','));
    
    // Add data rows
    for (const user of users) {
      const row = fields.map(field => {
        const value = user[field] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
      csvRows.push(row);
    }
    
    const csvContent = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};