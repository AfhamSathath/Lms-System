const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByYearAndSemester,
  getSubjectsByYear,
  getSubjectsByDepartment,
  getSubjectsByCategory,
  assignLecturer,
  getSubjectStatsByYear,
  seedSubjects,
  getSubjectsByLecturer,
  bulkCreateSubjects,
} = require('../controllers/subjectcontroller');

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', getSubjects);
router.get('/stats/by-year', authorize('admin'), getSubjectStatsByYear);
router.get('/year/:year', getSubjectsByYear);
router.get('/year/:year/semester/:semester', getSubjectsByYearAndSemester);
router.get('/department/:department', getSubjectsByDepartment);
router.get('/category/:category', getSubjectsByCategory);
router.get('/lecturer/:lecturerId', authorize('admin'), getSubjectsByLecturer);
router.get('/:id', getSubject);

// Lecturer assignment
router.put('/:id/assign-lecturer', authorize('admin'), assignLecturer);

// Admin only routes
router.post('/', authorize('admin'), createSubject);
router.post('/bulk', authorize('admin'), bulkCreateSubjects);
router.post('/seed', authorize('admin'), seedSubjects);
router.put('/:id', authorize('admin'), updateSubject);
router.delete('/:id', authorize('admin'), deleteSubject);

module.exports = router;