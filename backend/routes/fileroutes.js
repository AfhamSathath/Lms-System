const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  deleteFile,
  getFilesBySubject,
} = require('../controllers/filecontroller');

// All routes require authentication
router.use(protect);

// File operations
router.get('/', getFiles);
router.get('/subject/:subjectId', getFilesBySubject);
router.get('/:id', getFile);
router.get('/download/:id', downloadFile);

// Upload file (lecturer and admin only)
router.post(
  '/upload',
  authorize('lecturer', 'admin'),
  upload.single('file'),
  uploadFile
);

// Delete file (owner or admin)
router.delete('/:id', deleteFile);

module.exports = router;