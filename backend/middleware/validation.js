const { body, validationResult } = require('express-validator');

// Validation rules for user registration
exports.validateUser = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['student', 'lecturer', 'admin', 'hod', 'dean', 'registrar']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation rules for course creation
exports.validateCourse = [
  body('courseCode').notEmpty().withMessage('Course code is required').trim().toUpperCase(),
  body('courseName').notEmpty().withMessage('Course name is required').trim(),
  body('credits').isInt({ min: 1, max: 6 }).withMessage('Credits must be between 1 and 6'),
  body('department').notEmpty().withMessage('Department is required'),
  body('level').isIn(['100', '200', '300', '400', '500', '600', '700']).withMessage('Invalid level'),
  body('semester').isIn([1, 2]).withMessage('Semester must be 1 or 2'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation rules for enrollment
exports.validateEnrollment = [
  body('student').notEmpty().withMessage('Student is required'),
  body('course').notEmpty().withMessage('Course is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required'),
  body('semester').isIn([1, 2]).withMessage('Semester must be 1 or 2'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];