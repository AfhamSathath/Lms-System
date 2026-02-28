const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTimetables,
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getTimetablesBySemester,
  getUpcomingExams,
} = require('../controllers/timetablecontroller');

router.use(protect);

// Public routes for authenticated users
router.get('/', getTimetables);
router.get('/upcoming', getUpcomingExams);
router.get('/:id', getTimetable);

// Admin-only routes
router.get('/semester/:semester', authorize('admin'), getTimetablesBySemester);
router.post('/', authorize('admin'), createTimetable);
router.put('/:id', authorize('admin'), updateTimetable);
router.delete('/:id', authorize('admin'), deleteTimetable);

module.exports = router;