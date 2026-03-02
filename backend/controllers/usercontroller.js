const User = require('../models/user');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/course');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty'); // Make sure you have a Faculty model
const fs = require('fs');
const path = require('path');

// Utility to check role access for department
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
    if (userRole === 'hod') {
      query.department = req.user.department;
    } else if (userRole === 'dean') {
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
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
    }

    const user = await User.findById(userId)
      .populate('department', 'name code faculty')
      .populate('faculty', 'name code')
      .select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Department/Faculty access check
    if (!await checkDepartmentAccess(req.user.role, user.department, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied to this user.' });
    }

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
    if (!['admin', 'registrar'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only admin or registrar can create users.' });
    }

    const { email, studentId, employeeId, department, faculty } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { studentId }, { employeeId }] });
    if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

    // Validate department/faculty
    if (department && !await Department.findById(department)) return res.status(400).json({ success: false, message: 'Department not found' });
    if (faculty && !await Faculty.findById(faculty)) return res.status(400).json({ success: false, message: 'Faculty not found' });

    // Generate password if missing
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

    let canUpdate = req.user.id === user._id.toString() || req.user.role === 'admin' || await checkDepartmentAccess(req.user.role, user.department, req.user);
    if (!canUpdate) return res.status(403).json({ success: false, message: 'Access denied. You cannot update this user.' });

    // Restrict role/email change
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

    // Check active enrollments or teaching
    if ((user.role === 'student' && await Enrollment.countDocuments({ student: user._id, enrollmentStatus: 'enrolled' }) > 0) ||
        (user.role === 'lecturer' && await Course.countDocuments({ lecturers: user._id, isActive: true }) > 0)) {
      return res.status(400).json({ success: false, message: 'Cannot delete active student/lecturer' });
    }

    // Delete profile picture
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