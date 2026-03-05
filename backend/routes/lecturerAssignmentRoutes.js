const express = require('express');
const router = express.Router();
const {
  assignLecturerToSubject,
  getLecturerSubjects,
  getDepartmentAssignments,
  updateAssignmentProgress,
  updateAssignmentStatus,
  verifyQualification,
  getAllAssignments,
  deleteAssignment
} = require('../controllers/lecturerAssignmentController');
const { protect, authorize } = require('../middleware/auth');

/* =====================================================
   Lecturer Assignment Routes
===================================================== */

// Admin: Assign lecturer to subject
router.post('/assign', protect, authorize('admin', 'hod'), (req, res, next) => {
  console.log('Post to /assign reached');
  next();
}, assignLecturerToSubject);

// Get all assignments (admin only)
router.get('/all', protect, authorize('admin'), getAllAssignments);

// Get lecturer's assigned subjects
router.get('/lecturer/:lecturerId', protect, getLecturerSubjects);

// Get department assignments
router.get('/department/:departmentId', protect, authorize('admin', 'hod'), getDepartmentAssignments);

// Update assignment progress
router.put('/:assignmentId/progress', protect, updateAssignmentProgress);

// Update assignment status
router.put('/:assignmentId/status', protect, authorize('admin', 'hod'), updateAssignmentStatus);

// Verify lecturer qualification
router.put('/:assignmentId/qualification', protect, authorize('admin'), verifyQualification);

// Delete assignment
router.delete('/:assignmentId', protect, authorize('admin'), deleteAssignment);

module.exports = router;
