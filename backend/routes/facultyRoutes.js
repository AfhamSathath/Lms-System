const express = require('express');
const router = express.Router();
const { protect, authorize, checkFacultyAccess } = require('../middleware/auth');
const {
  getFaculties,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyStats,
  assignDean,
  getFacultyDepartments,
  getFacultyStaff
} =  facultyController = require('../controllers/facultyController');

// All routes require authentication
router.use(protect);

// Public routes (within auth)
router.get('/', getFaculties);
router.get('/:id', getFaculty);
router.get('/:id/stats', getFacultyStats);
router.get('/:id/departments', getFacultyDepartments);
router.get('/:id/staff', getFacultyStaff);

// Protected routes
router.post('/', 
  authorize('admin'), 
  createFaculty
);

router.put('/:id', 
  authorize('admin', 'dean'), 
  checkFacultyAccess,
  updateFaculty
);

router.put('/:id/assign-dean', 
  authorize('admin'), 
  checkFacultyAccess,
  assignDean
);

router.delete('/:id', 
  authorize('admin'), 
  checkFacultyAccess,
  deleteFaculty
);

module.exports = router;