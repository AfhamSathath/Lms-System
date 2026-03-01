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
} =  departmentController = require('../controllers/departmentController');

// All routes require authentication
router.use(protect);

// Public routes (within auth)
router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.get('/:id/stats', getDepartmentStats);
router.get('/:id/courses', getDepartmentCourses);
router.get('/:id/staff', getDepartmentStaff);

// Protected routes
router.post('/', 
  authorize('admin', 'dean'), 
  createDepartment
);

router.put('/:id', 
  authorize('admin', 'dean', 'hod'), 

  updateDepartment
);

router.put('/:id/assign-hod', 
  authorize('admin', 'dean'), 

  assignHOD
);

router.delete('/:id', 
  authorize('admin'), 
  
  deleteDepartment
);

router.route('/')
  .get(protect, (req, res) => {
    res.json({ message: 'Get all departments - to be implemented' });
  })
  .post(protect, authorize('admin'), (req, res) => {
    res.json({ message: 'Create department - to be implemented' });
  });

router.route('/:id')
  .get(protect, (req, res) => {
    res.json({ message: `Get department ${req.params.id} - to be implemented` });
  })
  .put(protect, authorize('admin'), (req, res) => {
    res.json({ message: `Update department ${req.params.id} - to be implemented` });
  })
  .delete(protect, authorize('admin'), (req, res) => {
    res.json({ message: `Delete department ${req.params.id} - to be implemented` });
  });

module.exports = router;

module.exports = router;