const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const{ registerUser, loginUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules for registration
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'lecturer', 'admin', 'hod', 'dean']).withMessage('Invalid role'),
  body('studentId').if(body('role').equals('student')).notEmpty().withMessage('Student ID is required for students'),
  body('lecturerId').if(body('role').equals('lecturer')).notEmpty().withMessage('Lecturer ID is required for lecturers'),
  body('department').if(body('role').not().equals('admin')).notEmpty().withMessage('Department is required'),
  body('semester').if(body('role').equals('student')).isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8'),
  body('yearOfStudy').if(body('role').equals('student')).isInt({ min: 1, max: 5 }).withMessage('Year of study must be between 1-5')
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, authController.registerUser);
router.post('/login', loginValidation, authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:resetToken', authController.resetPassword);

// Protected routes - require authentication
router.use(protect);

// User profile routes
router.get('/me', authController.getMe);

// Admin only routes
router.get('/users', authorize('admin'), authController.getAllUsers);
router.get('/users/:id', authorize('admin'), authController.getUserById);
router.put('/users/:id', authorize('admin'), authController.updateUser);
router.put('/users/:id/toggle-status', authorize('admin'), authController.toggleUserStatus);
router.delete('/users/:id', authorize('admin'), authController.deleteUser);

module.exports = router;