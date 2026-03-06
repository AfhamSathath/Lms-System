const express = require('express');
const router = express.Router();
const {
  uploadSubjectFile,
  getSubjectFiles,
  getDepartmentSubjectFiles,
  updateSubjectFile,
  downloadSubjectFile,
  deleteSubjectFile,
  getCurriculumFiles,
  getFileStatistics,
  getAllFiles
} = subjectFileController = require('../controllers/subjectFileController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

/* =====================================================
   Subject File Routes
===================================================== */

// Get all subject files
router.get('/', protect, getAllFiles);

// Upload subject file
router.post('/upload', protect, authorize('lecturer', 'hod', 'admin'), upload, uploadSubjectFile);

// Get subject files
router.get('/subject/:subjectId', protect, getSubjectFiles);

// Get curriculum compliance for subject
router.get('/curriculum/:subjectId/:academicYear/:semester', protect, getCurriculumFiles);

// Get department subject files
router.get('/department/:departmentId', protect, authorize('admin', 'hod'), getDepartmentSubjectFiles);

// Get file statistics
router.get('/stats', protect, authorize('admin'), getFileStatistics);

// Update subject file
router.put('/:fileId', protect, updateSubjectFile);

// Download subject file
router.get('/download/:fileId', protect, downloadSubjectFile);

// Delete subject file
router.delete('/:fileId', protect, authorize('lecturer', 'admin'), deleteSubjectFile);

module.exports = router;
