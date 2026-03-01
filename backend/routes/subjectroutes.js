const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validateCourse } = require('../middleware/validation');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByDepartment,
  getCoursesByLecturer,
  assignLecturer,
  removeLecturer,
  updateCourseStatus,
  getCourseEnrollments,
  bulkCreateCourses,
  getCourseStats,
  getCourseTimetable
} = courseController = require('../controllers/subjectcontroller');

// All routes require authentication
router.use(protect);

// Stats route - must come before /:id route
router.get('/stats', getCourseStats);

// Public routes (within auth)
router.get('/', getCourses);
router.get('/:id', getCourse);
router.get('/department/:departmentId', getCoursesByDepartment);
router.get('/lecturer/:lecturerId', getCoursesByLecturer);
router.get('/:id/enrollments', getCourseEnrollments);
router.get('/:id/timetable', getCourseTimetable);

// Protected routes
router.post('/', 
  authorize('admin', 'hod', 'dean'), 
  validateCourse,
  createCourse
);

router.post('/bulk', 
  authorize('admin'), 
  bulkCreateCourses
);

router.put('/:id', 
  authorize('admin', 'hod', 'dean'), 
  validateCourse,
  updateCourse
);

router.put('/:id/assign-lecturer', 
  authorize('admin', 'hod', 'dean'), 
  assignLecturer
);

router.put('/:id/remove-lecturer/:lecturerId', 
  authorize('admin', 'hod', 'dean'), 
  removeLecturer
);

router.put('/:id/status', 
  authorize('admin', 'hod', 'dean'), 
  updateCourseStatus
);

router.delete('/:id', 
  authorize('admin'), 
  deleteCourse
);

module.exports = router;