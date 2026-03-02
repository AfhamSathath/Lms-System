const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');


// Import the authorize function from auth middleware
const { authorize } = require('../middleware/auth');

const {
  getDashboardStats,
  getUserStats,
  getCourseStats,
  getResultStats,
  getSystemOverview,
  createCustomReport
} = require('../controllers/statsController');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

// All stats routes require authentication


// @route   GET /api/stats/dashboard
// @desc    Get dashboard stats based on user role
// @access  Private
router.get('/dashboard', getDashboardStats);

// @route   GET /api/stats/users
// @desc    Get user statistics
// @access  Private/Admin
router.get('/users', authorize('admin'), getUserStats);

// @route   GET /api/stats/courses
// @desc    Get course statistics
// @access  Private/Admin
router.get('/courses', authorize('admin'), getCourseStats);

// @route   GET /api/stats/results
// @desc    Get result statistics
// @access  Private/Admin
router.get('/results', [
  authorize('admin'),
  query('semester').optional().isInt({ min: 1, max: 8 })
], validate, getResultStats);

// @route   GET /api/stats/overview
// @desc    Get system overview statistics
// @access  Private/Admin
router.get('/overview', authorize('admin'), getSystemOverview);

// @route   POST /api/stats/report
// @desc    Create custom statistical report
// @access  Private/Admin
router.post('/report', [
  authorize('admin'),
  body('type').isIn(['student_performance', 'course_popularity', 'grade_analysis']),
  body('filters').optional().isObject(),
  body('dateRange').optional().isObject(),
  body('dateRange.start').optional().isISO8601(),
  body('dateRange.end').optional().isISO8601()
], validate, createCustomReport);

module.exports = router;