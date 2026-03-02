const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

// All routes are protected
router.use(protect);

// CRUD Routes
router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivity);
router.post('/', activityController.createActivity);

// Admin-only routes
router.put('/:id', authorize('admin'), activityController.updateActivity);
router.delete('/:id', authorize('admin'), activityController.deleteActivity);

module.exports = router;