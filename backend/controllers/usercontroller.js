const User = require('../models/user');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/course');
const Department = require('../models/Department');


const fs = require('fs');
const path = require('path');

// ====================== UTILITY FUNCTIONS ======================

// Check role access for department
const checkDepartmentAccess = async (userRole, targetDepartment, user) => {
  if (userRole === 'hod') {
    const departments = await Department.find({ 
      $or: [
        { _id: user.department },
        { parentDepartment: user.department }
      ]
    }).select('_id');
    const departmentIds = departments.map(d => d._id.toString());
    return departmentIds.includes(targetDepartment?.toString());
  } else if (userRole === 'dean') {
    const departments = await Department.find({ faculty: user.facultyManaged }).select('_id');
    const departmentIds = departments.map(d => d._id.toString());
    return departmentIds.includes(targetDepartment?.toString());
  }
  return true; // admin, registrar, student (self) have no restriction
};

// ====================== GET USERS ======================
exports.getUsers = async (req, res, next) => {
  try {
    const { role, department, faculty, yearOfStudy, semester, search, isActive, page = 1, limit = 10, sortBy = '-createdAt' } = req.query;
    const query = {};
    const userRole = req.user.role;

    // Role-based access control
    if (userRole === 'hod') query.department = req.user.department;
    else if (userRole === 'dean') {
      const depts = await Department.find({ faculty: req.user.facultyManaged }).select('_id');
      query.department = { $in: depts.map(d => d._id) };
    }

    // Filters
    if (role) query.role = role;
    if (department) query.department = department;
    if (faculty) query.faculty = faculty;
    if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
    if (semester) query.semester = parseInt(semester);
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users
    });
  } catch (error) {
    next(error);
  }
};

// ====================== GET SINGLE USER ======================
exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (req.user.role === 'student' && req.user.id !== userId)
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });

    const user = await User.findById(userId)
      .populate('department', 'name code faculty')
      .populate('faculty', 'name code')
      .select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!await checkDepartmentAccess(req.user.role, user.department, req.user))
      return res.status(403).json({ success: false, message: 'Access denied to this user.' });

    // Additional role-based data
    let additionalData = {};
    if (user.role === 'student') {
      const enrollments = await Enrollment.find({ student: user._id }).populate('course', 'courseCode courseName credits level semester');
      const totalCredits = enrollments.reduce((acc, e) => acc + (e.gradePoints && e.course?.credits ? e.gradePoints * e.course.credits : 0), 0);
      const completedCredits = enrollments.reduce((acc, e) => acc + (e.course?.credits || 0), 0);
      additionalData = { enrollments, totalCredits, totalCourses: enrollments.length };
    }
    if (user.role === 'lecturer') {
      const coursesTeaching = await Course.find({ lecturers: user._id, isActive: true }).select('courseCode courseName level semester credits');
      additionalData = { coursesTeaching, totalCourses: coursesTeaching.length };
    }

    res.json({ success: true, user: { ...user.toJSON(), ...additionalData } });
  } catch (error) {
    next(error);
  }
};

// ====================== CREATE USER ======================
exports.createUser = async (req, res, next) => {
  try {
    if (!['admin', 'registrar'].includes(req.user.role))
      return res.status(403).json({ success: false, message: 'Only admin or registrar can create users.' });

    const { email, studentId, employeeId, department, faculty } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { studentId }, { employeeId }] });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

    if (department && !await Department.findById(department)) return res.status(400).json({ success: false, message: 'Department not found' });
    if (faculty && !await Faculty.findById(faculty)) return res.status(400).json({ success: false, message: 'Faculty not found' });

    if (!req.body.password) req.body.password = Math.random().toString(36).slice(-8);
    req.body.createdBy = req.user.id;

    const user = await User.create(req.body);
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'User created successfully', user: userResponse });
  } catch (error) {
    next(error);
  }
};

// ====================== UPDATE USER ======================
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const canUpdate = req.user.id === user._id.toString() || req.user.role === 'admin' || await checkDepartmentAccess(req.user.role, user.department, req.user);
    if (!canUpdate) return res.status(403).json({ success: false, message: 'Access denied. You cannot update this user.' });

    if ((req.body.role && req.body.role !== user.role) || (req.body.email && req.body.email !== user.email)) {
      if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admin can change role/email.' });
    }

    req.body.updatedBy = req.user.id;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .select('-password');

    res.json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// ====================== DELETE USER ======================
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admin can delete users' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });

    if ((user.role === 'student' && await Enrollment.countDocuments({ student: user._id, enrollmentStatus: 'enrolled' }) > 0) ||
        (user.role === 'lecturer' && await Course.countDocuments({ lecturers: user._id, isActive: true }) > 0)) {
      return res.status(400).json({ success: false, message: 'Cannot delete active student/lecturer' });
    }

    if (user.profilePicture) {
      const picturePath = path.join(__dirname, '..', 'uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(picturePath)) fs.unlinkSync(picturePath);
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ====================== MISSING FUNCTIONS ======================

// Update own profile
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = { ...req.body, updatedBy: userId };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select('-password');

    res.json({ success: true, message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Remove profile picture
exports.removeProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.profilePicture) {
      const picturePath = path.join(__dirname, '..', 'uploads/profiles', path.basename(user.profilePicture));
      if (fs.existsSync(picturePath)) fs.unlinkSync(picturePath);
      user.profilePicture = undefined;
      await user.save();
    }

    res.json({ success: true, message: 'Profile picture removed' });
  } catch (error) {
    next(error);
  }
};

// Bulk import users
exports.bulkImportUsers = async (req, res, next) => {
  try {
    const users = req.body.users; // expect array of users
    if (!Array.isArray(users) || users.length === 0)
      return res.status(400).json({ success: false, message: 'No users provided' });

    const createdUsers = await User.insertMany(users);
    res.json({ success: true, message: 'Users imported successfully', count: createdUsers.length });
  } catch (error) {
    next(error);
  }
};

// Get students by year & semester
exports.getStudentsByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;
    const students = await User.find({ role: 'student', yearOfStudy: year, semester }).select('-password');
    res.json({ success: true, students });
  } catch (error) {
    next(error);
  }
};

// Get lecturers by department
exports.getLecturersByDepartment = async (req, res, next) => {
  try {
    const { department } = req.params;
    const lecturers = await User.find({ role: 'lecturer', department }).select('-password');
    res.json({ success: true, lecturers });
  } catch (error) {
    next(error);
  }
};

// Get user stats
exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalLecturers = await User.countDocuments({ role: 'lecturer' });

    res.json({ success: true, stats: { totalUsers, totalStudents, totalLecturers } });
  } catch (error) {
    next(error);
  }
};

// Get student transcript (placeholder)
exports.getStudentTranscript = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, transcript: [] });
  } catch (error) {
    next(error);
  }
};

// Get lecturer workload (placeholder)
exports.getLecturerWorkload = async (req, res, next) => {
  try {
    const lecturer = await User.findById(req.params.id);
    if (!lecturer || lecturer.role !== 'lecturer') return res.status(404).json({ success: false, message: 'Lecturer not found' });

    res.json({ success: true, workload: [] });
  } catch (error) {
    next(error);
  }
};