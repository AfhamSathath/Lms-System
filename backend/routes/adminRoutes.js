const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getUserStats,
    getCourseStats,
    getFileStats,
    getEnrollmentStats,
    getResultStats,
    getDepartmentStats,
    getTimetableStats,
} = adminController=require('../controllers/adminController');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Stats routes
router.get('/users/stats', getUserStats);
router.get('/courses/stats', getCourseStats);
router.get('/files/stats', getFileStats);
router.get('/enrollments/stats', getEnrollmentStats);
router.get('/results/stats', getResultStats);
router.get('/departments/stats', getDepartmentStats);
router.get('/timetables/stats', getTimetableStats);





module.exports = router;