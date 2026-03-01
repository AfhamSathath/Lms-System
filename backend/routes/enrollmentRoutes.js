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
} = enrollmentController = require('../controllers/enrollmentController');

// All routes require authentication
router.use(protect);

// Public routes (within auth)
router.get('/', getEnrollments);
router.get('/:id', getEnrollment);
router.get('/student/:studentId', getStudentEnrollments);
router.get('/course/:courseId', getCourseEnrollments);
router.get('/course/:courseId/grade-sheet', 
  authorize('lecturer', 'hod', 'admin'), 
  generateGradeSheet
);

// Protected routes
router.post('/', 
  authorize('admin', 'registrar', 'hod'), 
  validateEnrollment,
  createEnrollment
);

router.post('/bulk', 
  authorize('admin', 'registrar'), 
  bulkEnrollStudents
);

router.put('/:id', 
  authorize('admin', 'registrar', 'lecturer'), 
  updateEnrollment
);

router.put('/:id/grades', 
  authorize('lecturer', 'hod', 'admin'), 
  updateGrades
);

router.put('/:id/attendance', 
  authorize('lecturer', 'hod', 'admin'), 
  updateAttendance
);

router.put('/:id/withdraw', 
  authorize('student', 'admin', 'registrar'), 
  withdrawStudent
);

router.delete('/:id', 
  authorize('admin'), 
  deleteEnrollment
);

module.exports = router;