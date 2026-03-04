const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetablecontroller');

// Middleware for authentication (assuming you have one)
const { protect } = require('../middleware/auth');

// CRUD routes
router.route('/')
  .get(protect, timetableController.getAllTimetables)
  .post(protect, timetableController.createTimetable);

router.route('/:id')
  .get(protect, timetableController.getTimetable)
  .put(protect, timetableController.updateTimetable)
  .delete(protect, timetableController.deleteTimetable);

module.exports = router;