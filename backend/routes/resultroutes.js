const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const result = require('../models/result');
const resultcontroller = require('../controllers/resultcontroller');
const {
  getResults,
  getStudentResults,
  createResult,
  updateResult,
  deleteResult,
  getResultsByYearAndSemester,
  getResultsByYear,
  getTranscript,
  getDepartmentStats,
  getYearlyStats,
  bulkUploadResults,
} = resultcontroller;

// All routes require authentication
router.use(protect);

// Student specific routes
router.get('/student/:studentId', getStudentResults);
router.get('/transcript/:studentId', getTranscript);

// Statistics routes (Admin only)
router.get('/department/stats', authorize('admin'), getDepartmentStats);
router.get('/yearly/stats', authorize('admin'), getYearlyStats);

// Admin/Lecturer routes
router.get('/', authorize('admin', 'lecturer'), getResults);
router.get('/year/:year', authorize('admin', 'lecturer'), getResultsByYear);
router.get('/year/:year/semester/:semester', authorize('admin', 'lecturer'), getResultsByYearAndSemester);

// Admin only routes
router.post('/', authorize('admin'), createResult);
router.post('/bulk-upload', authorize('admin'), bulkUploadResults);
router.put('/:id', authorize('admin'), updateResult);
router.delete('/:id', authorize('admin'), deleteResult);

module.exports = router;