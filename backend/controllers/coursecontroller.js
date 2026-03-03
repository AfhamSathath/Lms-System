// controllers/coursecontroller.js
const Course = require('../models/course');
const User = require('../models/user');
const Department = require('../models/Department');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/notification');
const Timetable = require('../models/timetable');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// ----------------------
// Get all courses
// ----------------------
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().populate('department faculty lecturers coordinator');
    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get single course
// ----------------------
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department faculty lecturers coordinator prerequisites');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    res.json({ totalCourses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ----------------------
// Create course
// ----------------------
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, message: 'Course created', course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Update course
// ----------------------
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course updated', course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Delete course
// ----------------------
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    await course.deleteOne();
    res.json({ success: true, message: 'Course deleted' });
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
    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get courses by lecturer
// ----------------------
exports.getCoursesByLecturer = async (req, res, next) => {
  try {
    const courses = await Course.find({ lecturers: req.params.id });
    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Assign lecturer to course
// ----------------------
exports.assignLecturer = async (req, res, next) => {
  try {
    const { lecturerId } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { lecturers: lecturerId } },
      { new: true }
    );
    res.json({ success: true, message: 'Lecturer assigned', course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Remove lecturer from course
// ----------------------
exports.removeLecturer = async (req, res, next) => {
  try {
    const { lecturerId } = req.body;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $pull: { lecturers: lecturerId } },
      { new: true }
    );
    res.json({ success: true, message: 'Lecturer removed', course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Update course status (active/inactive)
// ----------------------
exports.updateCourseStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.json({ success: true, message: 'Course status updated', course });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get course enrollments
// ----------------------
exports.getCourseEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id }).populate('student', 'name studentId');
    res.json({ success: true, count: enrollments.length, enrollments });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Bulk create courses
// ----------------------
exports.bulkCreateCourses = async (req, res, next) => {
  try {
    // Example: req.body = array of courses
    const courses = await Course.insertMany(req.body);
    res.json({ success: true, message: 'Bulk courses created', count: courses.length });
  } catch (err) {
    next(err);
  }
};

// ----------------------
// Get course statistics
// ----------------------
exports.getCourseStats = async (req, res, next) => {
  try {
    const total = await Course.countDocuments();
    const active = await Course.countDocuments({ isActive: true });
    const inactive = await Course.countDocuments({ isActive: false });
    res.json({ success: true, total, active, inactive });
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
    res.json({ success: true, count: timetable.length, timetable });
  } catch (err) {
    next(err);
  }
};