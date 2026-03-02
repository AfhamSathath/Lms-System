const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateEnrollment } = require('../middleware/validation');
const {
  getEnrollments,
  getEnrollment,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  bulkEnrollStudents,
  updateGrades,
  updateAttendance,
  getStudentEnrollments,
  getCourseEnrollments,
  generateGradeSheet,
  withdrawStudent
} = EntrollmentController=require('../controllers/enrollmentController');

// All routes require authentication
router.use(protect);

/* =====================================
   IMPORTANT: Specific routes FIRST
===================================== */

// Student enrollments
router.get('/student/:studentId', getStudentEnrollments);

// Course enrollments
router.get('/course/:courseId', getCourseEnrollments);

// Course grade sheet
router.get(
  '/course/:courseId/grade-sheet',
  authorize('lecturer', 'hod', 'admin'),
  generateGradeSheet
);

// Get all enrollments
router.get('/', getEnrollments);

// Get single enrollment (KEEP LAST)
router.get('/:id', getEnrollment);

/* =====================================
   Protected routes
===================================== */

// Create enrollment
router.post(
  '/',
  authorize('admin', 'registrar', 'hod'),
  validateEnrollment,
  createEnrollment
);

// Bulk enroll
router.post(
  '/bulk',
  authorize('admin', 'registrar'),
  bulkEnrollStudents
);

// Update enrollment
router.put(
  '/:id',
  authorize('admin', 'registrar', 'lecturer'),
  updateEnrollment
);

// Update grades
router.put(
  '/:id/grades',
  authorize('lecturer', 'hod', 'admin'),
  updateGrades
);

// Update attendance
router.put(
  '/:id/attendance',
  authorize('lecturer', 'hod', 'admin'),
  updateAttendance
);

// Withdraw student
router.put(
  '/:id/withdraw',
  authorize('student', 'admin', 'registrar'),
  withdrawStudent
);

// Delete enrollment
router.delete(
  '/:id',
  authorize('admin'),
  deleteEnrollment
);

module.exports = router;