// routes/userroutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  registerUser,
  login,
  getMe,
  getUsers,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  toggleUserStatus,
  deleteUser,
  adminResetPassword,
  bulkImportUsers,
  exportUsersCSV
} = usercontroller=require('../controllers/usercontroller');

const { protect, authorize } = require('../middleware/auth');

// ------------------ AUTH ROUTES (Public & Private User) ------------------ //

// Public routes
router.post(
  '/auth/register',
  [
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  registerUser
);

router.post(
  '/auth/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  login
);

router.get('/', getUsers); 
router.post('/auth/forgot-password', forgotPassword);
router.put('/auth/reset-password/:resetToken', resetPassword);

// Private routes (logged-in users)
router.get('/auth/me', protect, getMe);
router.put('/auth/update-profile', protect, updateProfile);
router.put('/auth/update-password', protect, updatePassword);

// ------------------ ADMIN ROUTES ------------------ //
router.use(protect, authorize('admin')); // All routes below require admin

// User management
router.get('/auth/users', getAllUsers);
router.get('/auth/users/role/:role', getUsersByRole);
router.get('/auth/users/:id', getUserById);
router.put('/auth/users/:id', updateUser);
router.put('/auth/users/:id/toggle-status', toggleUserStatus);
router.delete('/auth/users/:id', deleteUser);

// Admin password reset
router.post('/auth/users/:id/reset-password', adminResetPassword);

// Bulk import & export
router.post('/auth/users/bulk-import', bulkImportUsers);
router.get('/auth/users/export/csv', exportUsersCSV);

module.exports = router;