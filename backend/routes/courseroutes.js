const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Course = require('../models/course');
const courseController = require('../controllers/coursecontroller');
const User = require('../models/user');

// @desc    Get all courses with filtering
// @route   GET /api/courses
// @access  Private/Admin
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);
router.get('/stats/all', courseController.getStats);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.get('/:id/timetable', courseController.getCourseTimetable);
router.get('/:id/stats', courseController.getCourseStats);
router.post('/bulk', courseController.bulkCreateCourses);
router.get('/:id/enrollments', courseController.getCourseEnrollments);
router.put('/:id/status', courseController.updateCourseStatus);
router.put('/:id/lecturer', courseController.assignLecturer);
router.delete('/:id/lecturer', courseController.removeLecturer);
router.get('/lecturer/:id', courseController.getCoursesByLecturer);
router.get('/department/:id', courseController.getCoursesByDepartment);

module.exports = router;
