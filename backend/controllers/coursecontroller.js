const Course = require('../models/course');
const Enrollment = require('../models/Enrollment');
const Timetable = require('../models/timetable');
const { validationResult } = require('express-validator');

// ----------------------
// Get all courses with optional filters
// ----------------------
exports.getCourses = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.department) filters.department = req.query.department;
    if (req.query.semester) filters.semester = req.query.semester;
    if (req.query.academicYear) filters.academicYear = req.query.academicYear;

    const courses = await Course.find(filters);
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get a single course by ID
// ----------------------
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Create a new course
// ----------------------
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Update a course
// ----------------------
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Delete a course
// ----------------------
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get course timetable
// ----------------------
exports.getCourseTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.find({ course: req.params.id });
    res.status(200).json({ success: true, data: timetable });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get course stats
// ----------------------
exports.getCourseStats = async (req, res, next) => {
  try {
    const enrollmentCount = await Enrollment.countDocuments({ course: req.params.id });
    res.status(200).json({ success: true, data: { enrollments: enrollmentCount } });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Bulk create courses
// ----------------------
exports.bulkCreateCourses = async (req, res, next) => {
  try {
    const courses = req.body.courses || [];
    const created = await Course.insertMany(courses);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get enrollments for a course
// ----------------------
exports.getCourseEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id });
    res.status(200).json({ success: true, data: enrollments });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Update course status (active/inactive)
// ----------------------
exports.updateCourseStatus = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    course.active = !course.active;
    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Assign lecturer to course
// ----------------------
exports.assignLecturer = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    course.lecturer = req.body.lecturer;
    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Remove lecturer from course
// ----------------------
exports.removeLecturer = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    course.lecturer = null;
    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get courses by lecturer
// ----------------------
exports.getCoursesByLecturer = async (req, res, next) => {
  try {
    const courses = await Course.find({ lecturer: req.params.id });
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get courses by department
// ----------------------
exports.getCoursesByDepartment = async (req, res, next) => {
  try {
    const courses = await Course.find({ department: req.params.id });
    res.status(200).json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get all course stats
// ----------------------
exports.getStats = async (req, res, next) => {
  try {
    const totalCourses = await Course.countDocuments();
    const byDepartment = await Course.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);
    res.status(200).json({ success: true, data: { totalCourses, byDepartment } });
  } catch (err) {
    next(err);
  }
};