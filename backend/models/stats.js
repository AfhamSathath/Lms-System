// backend/routes/stats.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const Course = require('../models/course');
const Enrollment = require('../models/Enrollment');

// Get all stats for dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [userStats, courseStats, enrollmentStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
            students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
            lecturers: { $sum: { $cond: [{ $eq: ['$role', 'lecturer'] }, 1, 0] } }
          }
        }
      ]),
      Course.countDocuments(),
      Enrollment.countDocuments({ status: 'active' })
    ]);

    res.json({
      users: userStats[0] || { total: 0, active: 0, inactive: 0, students: 0, lecturers: 0 },
      courses: courseStats,
      enrollments: enrollmentStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;