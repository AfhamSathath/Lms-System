const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  deleteFile,
  getFilesByYearAndSemester,
} = FileController=require('../controllers/filecontroller');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG files are allowed.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

// All routes require authentication
router.use(protect);

/* ===============================
   Stats Routes
================================ */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const File = require('../models/file');
    
    const stats = await File.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          totalSize: [{ $group: { _id: null, total: { $sum: '$size' } } }],
          byType: [{ $group: { _id: '$mimeType', count: { $sum: 1 } } }],
          byUser: [
            { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          byYearSemester: [
            {
              $group: {
                _id: {
                  year: '$yearOfStudy',
                  semester: '$semester'
                },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Get user details for top uploaders
    const topUserIds = stats[0].byUser.map(item => item._id);
    const User = require('../models/user');
    const users = await User.find({ _id: { $in: topUserIds } }).select('name email');

    const topUsers = stats[0].byUser.map(item => ({
      user: users.find(u => u._id.toString() === item._id?.toString()),
      count: item.count
    }));

    res.json({
      success: true,
      stats: {
        total: stats[0].total[0]?.count || 0,
        totalSize: stats[0].totalSize[0]?.total || 0,
        byType: stats[0].byType,
        topUsers,
        byYearSemester: stats[0].byYearSemester
      }
    });
  } catch (error) {
    console.error('File stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching file stats',
      error: error.message 
    });
  }
});

/* ===============================
   Specific routes FIRST
================================ */

// Filter by year & semester
router.get('/year/:year/semester/:semester', getFilesByYearAndSemester);

// Download file
router.get('/download/:id', downloadFile);

// Get all files
router.get('/', getFiles);

// Get single file (KEEP LAST)
router.get('/:id', getFile);

/* ===============================
   Admin routes
================================ */

router.post(
  '/upload',
  authorize('admin'),
  upload.single('file'),
  uploadFile
);

router.delete('/:id', authorize('admin'), deleteFile);

/* ===============================
   Multer Error Handler
================================ */

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

module.exports = router;