const express = require('express');
const router = express.Router();

const {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  updateFile,
  deleteFile,
  getStats
} = require('../controllers/fileController');

const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

/* =====================================================
   File Routes
===================================================== */

// 1️⃣ Stats (must be first)
router.get('/stats', protect, getStats);

// 2️⃣ Upload
router.post('/upload', protect, upload, uploadFile);

// 3️⃣ Download (before :id)
router.get('/download/:id', protect, downloadFile);

// 4️⃣ Get all files
router.get('/', protect, getFiles);

// 5️⃣ Get single file
router.get('/:id', protect, getFile);

// 6️⃣ Update
router.put('/:id', protect, updateFile);

// 7️⃣ Delete
router.delete('/:id', protect, deleteFile);

module.exports = router;