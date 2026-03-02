const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
  assignHOD,
  getDepartmentCourses,
  getDepartmentStaff
} = DepartmentController=require('../controllers/departmentController');

// All routes require authentication
router.use(protect);

/* ================================
   Stats Routes
================================ */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const Department = require('../models/Department');
    const { User } = require('../models/user');
    const Course = require('../models/course');
    const Enrollment = require('../models/Enrollment');

    const stats = await Department.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byFaculty: [
            { $group: { _id: '$faculty', count: { $sum: 1 } } }
          ],
          withHOD: [
            { $match: { hod: { $ne: null } } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Get additional stats
    const coursesPerDepartment = await Course.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const staffPerDepartment = await User.aggregate([
      { $match: { role: { $in: ['lecturer', 'hod'] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const studentsPerDepartment = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const enrollmentsPerDepartment = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      { $group: { _id: '$courseInfo.department', count: { $sum: 1 } } }
    ]);

    // Get department names
    const departments = await Department.find().select('name code');
    
    const formatData = (data) => {
      return data.map(item => ({
        department: departments.find(d => d._id.toString() === item._id?.toString()),
        count: item.count
      })).filter(item => item.department);
    };

    res.json({
      success: true,
      stats: {
        total: stats[0].total[0]?.count || 0,
        byFaculty: stats[0].byFaculty,
        withHOD: stats[0].withHOD[0]?.count || 0,
        coursesPerDepartment: formatData(coursesPerDepartment),
        staffPerDepartment: formatData(staffPerDepartment),
        studentsPerDepartment: formatData(studentsPerDepartment),
        enrollmentsPerDepartment: formatData(enrollmentsPerDepartment)
      }
    });
  } catch (error) {
    console.error('Department stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching department stats',
      error: error.message 
    });
  }
});

/* ================================
   IMPORTANT: Specific routes FIRST
================================ */

// Department statistics
router.get('/:id/stats', getDepartmentStats);

// Department related data
router.get('/:id/courses', getDepartmentCourses);
router.get('/:id/staff', getDepartmentStaff);

// Get all departments
router.get('/', getDepartments);

// Get single department
router.get('/:id', getDepartment);

/* ================================
   Protected Routes
================================ */

// Create department
router.post(
  '/',
  authorize('admin', 'dean'),
  createDepartment
);

// Update department
router.put(
  '/:id',
  authorize('admin', 'dean', 'hod'),
  updateDepartment
);

// Assign HOD
router.put(
  '/:id/assign-hod',
  authorize('admin', 'dean'),
  assignHOD
);

// Delete department
router.delete(
  '/:id',
  authorize('admin'),
  deleteDepartment
);

module.exports = router;