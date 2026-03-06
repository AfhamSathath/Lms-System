const express = require('express');
const router = express.Router();
const multer = require('multer');

const { protect, authorize } = require('../middleware/auth');
const resultcontroller = require('../controllers/resultcontroller');

const {
  getResults,
  getStudentResults,
  createResult,
  updateResult,
  deleteResult,
  getResultsByYearAndSemester,
  getResultsByYear,
  getTranscript,
  getDepartmentStats,
  getYearlyStats,
  bulkUploadResults,

} = resultcontroller;

// ================= MULTER SETUP =================
// Store file in memory (best for Excel processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ================= APPLY AUTH PROTECTION =================
router.use(protect);

// ================= STUDENT ROUTES =================
router.get('/student/:id', protect, getStudentResults);
router.get('/transcript/:studentId', getTranscript);

// ================= ADMIN STATISTICS ROUTES =================
router.get('/department/stats', authorize('admin'), getDepartmentStats);
router.get('/yearly/stats', authorize('admin'), getYearlyStats);

// ================= ADMIN / LECTURER ROUTES =================
router.get('/', authorize('admin', 'lecturer'), getResults);
router.get('/year/:year', authorize('admin', 'lecturer'), getResultsByYear);
router.get(
  '/year/:year/semester/:semester',
  authorize('admin', 'lecturer'),
  getResultsByYearAndSemester
);

// ================= ADMIN ONLY ROUTES =================
router.post('/', authorize('admin'), createResult);

// 🔥 BULK UPLOAD ROUTE (FIXED)
router.post(
  '/bulk-upload',
  authorize('admin'),
  upload.single('file'), // MUST match frontend FormData key
  bulkUploadResults
);

router.put('/:id', authorize('admin'), updateResult);
router.delete('/:id', authorize('admin'), deleteResult);

module.exports = router;