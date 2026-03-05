// controllers/usercontroller.js
const User = require('../models/user');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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

    if (role === 'student' && studentId && studentId.trim() !== '') userData.studentId = studentId;
    if (['lecturer', 'hod', 'dean'].includes(role) && lecturerId && lecturerId.trim() !== '') userData.lecturerId = lecturerId;

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
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      res.json({ success: true, message: 'Password reset email sent' });
    } catch (emailError) {
      console.error('Email failed to send:', emailError);
      res.json({ success: true, resetToken, message: 'Password reset token generated but email failed to send (check SMTP settings)' });
    }
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

exports.updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const user = await User.findById(req.user.id);

    // Delete old picture if exists
    if (user.profilePicture && !user.profilePicture.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const filePath = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = filePath;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      profilePicture: filePath,
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.profilePicture && !user.profilePicture.startsWith('http')) {
      const oldPath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.profilePicture = null;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Profile picture removed'
    });
  } catch (error) {
    next(error);
  }
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
exports.getUsers = async (req, res, next) => {
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

    const userData = { ...req.body };
    if (!userData.studentId || userData.studentId.trim() === '') delete userData.studentId;
    if (!userData.lecturerId || userData.lecturerId.trim() === '') delete userData.lecturerId;

    const user = await User.create(userData);
    user.password = undefined;
    res.status(201).json({ success: true, user });
  } catch (error) { next(error); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    const unsetData = {};
    if (updateData.studentId === '' || updateData.studentId === null) {
      delete updateData.studentId;
      unsetData.studentId = 1;
    }
    if (updateData.lecturerId === '' || updateData.lecturerId === null) {
      delete updateData.lecturerId;
      unsetData.lecturerId = 1;
    }
    if (Object.keys(unsetData).length > 0) {
      updateData.$unset = unsetData;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
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

// controllers/usercontroller.js
exports.getUserByRole = async (req, res, next) => {
  try {
    const { role } = req.query; // e.g., /?role=student
    const users = role ? await User.find({ role }) : await User.find();
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

exports.bulkImportUsers = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let importedCount = 0;
          let failedCount = 0;
          const errors = [];

          for (const row of results) {
            try {
              // Basic validation
              if (!row.name || !row.email || !row.role) {
                failedCount++;
                errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
                continue;
              }

              // Check if user exists
              const existingUser = await User.findOne({ email: row.email });
              if (existingUser) {
                failedCount++;
                errors.push(`Email already exists: ${row.email}`);
                continue;
              }

              const userData = { ...row };

              // Secure password setup: Either the CSV contains a password or we give a default one
              userData.password = row.password || 'password123';

              // Handle sparse constraints with empty strings
              if (!userData.studentId || userData.studentId.trim() === '') delete userData.studentId;
              if (!userData.lecturerId || userData.lecturerId.trim() === '') delete userData.lecturerId;

              const user = await User.create(userData);
              importedCount++;
            } catch (err) {
              failedCount++;
              errors.push(`Error inserting row ${row.email || 'unknown'}: ${err.message}`);
            }
          }

          // Delete the temporary file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: `Import complete. Inserted: ${importedCount}, Failed: ${failedCount}`,
            count: importedCount,
            failed: failedCount,
            errors
          });
        } catch (error) {
          fs.unlinkSync(req.file.path);
          next(error);
        }
      });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(err);
  }
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



// THIS MUST EXIST if you use it in routes
exports.getStatsByYear = async (req, res, next) => {
  try {
    res.json({ success: true, message: "Stats by year" });
  } catch (err) {
    next(err);
  }
};