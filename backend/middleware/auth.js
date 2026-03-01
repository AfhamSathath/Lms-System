const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Protect routes - verify token
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check department access
exports.checkDepartmentAccess = (req, res, next) => {
  if (req.user.role === 'hod' && req.params.departmentId) {
    if (req.user.department?.toString() !== req.params.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own department.'
      });
    }
  }
  next();
};

// Check faculty access
exports.checkFacultyAccess = (req, res, next) => {
  if (req.user.role === 'dean' && req.params.facultyId) {
    if (req.user.facultyManaged?.toString() !== req.params.facultyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own faculty.'
      });
    }
  }
  next();
};