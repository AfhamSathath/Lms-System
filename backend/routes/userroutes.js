const express = require('express');
const router = express.Router();

// Models (if needed)
const { User } = require('../models/user');

// Middlewares
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');
const upload = require('../middleware/upload');

// Controllers
const userController = require('../controllers/usercontroller');

// Destructure middleware
const { protect, authorize } = auth;
const { validateUser } = validation;
const { uploadProfilePicture } = upload;

// Destructure controller functions
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  bulkImportUsers,
  updateProfile,
  removeProfilePicture,
  getStudentsByYearAndSemester,
  getLecturersByDepartment,
  getUserStats,
  getStudentTranscript,
  getLecturerWorkload
} = userController;

// ======================== ROUTES ========================

// All routes require authentication
router.use(protect);

// ----------------- Profile -----------------
router.put('/profile', updateProfile); // Update own profile
router.post('/profile/picture', uploadProfilePicture, updateProfile); // Upload profile picture
router.delete('/profile/picture', removeProfilePicture); // Delete profile picture

// ----------------- Statistics -----------------
router.get('/stats', authorize('admin', 'hod', 'dean'), getUserStats);

// ----------------- Filters -----------------
router.get(
  '/students/year/:year/semester/:semester',
  authorize('admin', 'hod', 'lecturer', 'dean'),
  getStudentsByYearAndSemester
);

router.get(
  '/lecturers/department/:department',
  authorize('admin', 'hod', 'dean'),
  getLecturersByDepartment
);

// ----------------- Transcript / Workload -----------------
router.get('/student/:id/transcript', getStudentTranscript);
router.get('/lecturer/:id/workload', getLecturerWorkload);

// ----------------- Bulk import -----------------
router.post(
  '/bulk-import',
  authorize('admin', 'registrar'),
  bulkImportUsers
);

// ----------------- Admin only -----------------
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(validateUser, createUser);

router.route('/:id')
  .get(getUser)
  .put(validateUser, updateUser)
  .delete(deleteUser);

module.exports = router;