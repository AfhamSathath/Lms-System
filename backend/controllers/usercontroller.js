// controllers/usercontroller.js
const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
};

// ---------------- PUBLIC ROUTES ----------------
exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, role, studentId, lecturerId, gender, dateOfBirth, department, semester, yearOfStudy, phone, address, emergencyContact, emergencyContactPhone, qualifications, specialization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const userData = { name, email, password, role, gender, dateOfBirth, department, semester, yearOfStudy, phone, address, emergencyContact, emergencyContactPhone, qualifications, specialization, isActive: true };

    if (role === 'student') userData.studentId = studentId;
    if (['lecturer', 'hod', 'dean'].includes(role)) userData.lecturerId = lecturerId;

    const user = await User.create(userData);
    user.password = undefined;
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    user.password = undefined;
    const token = generateToken(user._id);

    res.json({ success: true, token, user });
  } catch (error) { next(error); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, resetToken }); // remove token in production
  } catch (error) { next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, token });
  } catch (error) { next(error); }
};

// ---------------- PRIVATE ROUTES ----------------
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) return res.status(401).json({ message: 'Current password incorrect' });

    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) { next(error); }
};

// ---------------- ADMIN ROUTES ----------------
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) { next(error); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const user = await User.create(req.body);
    user.password = undefined;
    res.status(201).json({ success: true, user });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { next(error); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (error) { next(error); }
};

exports.adminResetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset' });
  } catch (error) { next(error); }
};

exports.bulkImportUsers = async (req, res, next) => {
  res.json({ success: true, message: 'Bulk import to be implemented' });
};

exports.exportUsersCSV = async (req, res, next) => {
  const users = await User.find().select('-password');
  let csv = 'name,email,role,studentId,lecturerId,department,semester,yearOfStudy,phone,isActive,lastLogin,createdAt\n';
  users.forEach(u => {
    csv += `${u.name},${u.email},${u.role},${u.studentId || ''},${u.lecturerId || ''},${u.department || ''},${u.semester || ''},${u.yearOfStudy || ''},${u.phone || ''},${u.isActive},${u.lastLogin || ''},${u.createdAt}\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
  res.send(csv);
};