// routes/userroutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/usercontroller');
const { protect, authorize } = require('../middleware/auth');

// ---------------- AUTH ROUTES ----------------

// Register (public)
router.post(
  '/auth/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student','lecturer','admin','hod','dean']).withMessage('Invalid role'),
    body('studentId').if(body('role').equals('student')).notEmpty().withMessage('Student ID is required for students'),
    body('lecturerId').if(body('role').equals('lecturer')).notEmpty().withMessage('Lecturer ID is required for lecturers'),
    body('department').if(body('role').not().equals('admin')).notEmpty().withMessage('Department is required'),
    body('semester').if(body('role').equals('student')).isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1-8'),
    body('yearOfStudy').if(body('role').equals('student')).isInt({ min: 1, max: 5 }).withMessage('Year of study must be between 1-5'),
    body('qualifications').if(body('role').equals('lecturer')).notEmpty().withMessage('Qualifications are required for lecturers'),
    body('specialization').if(body('role').equals('lecturer')).notEmpty().withMessage('Specialization is required for lecturers'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('emergencyContact').optional().isString().withMessage('Emergency contact must be a string'),
    body('emergencyContactPhone').optional().isMobilePhone().withMessage('Invalid emergency contact phone')
  ],
  userController.registerUser
);

// Login
router.post(
  '/auth/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  userController.login
);

// Forgot & Reset Password
router.post('/', userController.createUser);
router.get('/users', userController.getUsers);
router.delete('/:id', userController.deleteUser);
router.put('/:id', userController.updateUser);
router.put('/:id/admin-reset-password', userController.adminResetPassword);
router.put('/:id/update-profile', protect, userController.updateProfile);
router.put('/:id/update-password', protect, userController.updatePassword);
router.put('/:id/toggle-status', userController.toggleUserStatus);
router.post('/:id/reset-password', userController.resetPassword);
router.get('/', userController.getUserByRole);

// Bulk import & CSV export
router.post('/bulk-import', userController.bulkImportUsers);
router.get('/export/csv', userController.exportUsersCSV);

// ---------------- PRIVATE USER ROUTES ----------------
router.use(protect);

// Current user info
router.get('/auth/me', userController.getMe);
router.put('/auth/update-profile', userController.updateProfile);
router.put('/auth/update-password', userController.updatePassword);

// ---------------- ADMIN ROUTES ----------------
router.use(authorize('admin'));

// Users CRUD
router.get('/stats/by-year', userController.getStatsByYear);
router.get('/:id', userController.getUserById);
router.post(
  '/users',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['student','lecturer','admin','hod','dean']),
    body('studentId').if(body('role').equals('student')).notEmpty(),
    body('lecturerId').if(body('role').equals('lecturer')).notEmpty(),
    body('department').if(body('role').not().equals('admin')).notEmpty(),
    body('semester').if(body('role').equals('student')).isInt({ min: 1, max: 8 }),
    body('yearOfStudy').if(body('role').equals('student')).isInt({ min: 1, max: 5 }),
    body('qualifications').if(body('role').equals('lecturer')).notEmpty(),
    body('specialization').if(body('role').equals('lecturer')).notEmpty(),
    body('gender').isIn(['male', 'female', 'other'])
  ],
  userController.createUser
);




module.exports = router;