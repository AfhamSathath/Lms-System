const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Connect to database
require('./config/database')();

// ================= MIDDLEWARE =================
app.use(helmet());
app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ================= STATIC FILES =================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= ROOT ROUTE =================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LMS Backend API is running successfully 🚀',
    version: '1.0.0',
    documentation: 'Use /api/* endpoints for API access',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      subjects: '/api/subjects',
      results: '/api/results',
      files: '/api/files',
      notifications: '/api/notifications',
      timetables: '/api/timetables',
      enrollments: '/api/enrollments',
      stats: '/api/stats',
      admin: '/api/admin',
      activities: '/api/activities'
    }
  });
});

// ================= API INDEX ROUTE =================
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LMS API',
    version: '1.0.0',
    availableEndpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        'update-profile': 'PUT /api/auth/update-profile',
        'update-password': 'PUT /api/auth/update-password',
        'forgot-password': 'POST /api/auth/forgot-password',
        'reset-password': 'PUT /api/auth/reset-password/:token'
      },
      admin: {
        'get-all-users': 'GET /api/auth/users',
        'get-user-by-id': 'GET /api/auth/users/:id',
        'get-users-by-role': 'GET /api/auth/users/role/:role',
        'update-user': 'PUT /api/auth/users/:id',
        'toggle-status': 'PUT /api/auth/users/:id/toggle-status',
        'delete-user': 'DELETE /api/auth/users/:id',
        'reset-password': 'POST /api/auth/users/:id/reset-password'
      },
      other: {
        subjects: '/api/subjects',
        results: '/api/results',
        files: '/api/files',
        notifications: '/api/notifications',
        timetables: '/api/timetables',
        enrollments: '/api/enrollments',
        stats: '/api/stats',
        admin: '/api/admin',
        activities: '/api/activities'
      }
    }
  });
});

// ================= API ROUTES =================

// Auth routes - handles authentication and user management
app.use('/api/auth', require('./routes/authroutes'));

// User routes - for additional user-related operations
app.use('/api/users', require('./routes/userroutes'));

// Other routes
app.use('/api/subjects', require('./routes/courseroutes'));
app.use('/api/results', require('./routes/resultroutes'));
app.use('/api/files', require('./routes/fileroutes'));
app.use('/api/notifications', require('./routes/notificationroutes'));
app.use('/api/timetables', require('./routes/timetableroutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/auth', require('./routes/authroutes'));

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: 'Try accessing /api for available endpoints'
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ================= SERVER START =================
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📝 API available at http://localhost:${PORT}/api`);
  console.log(`📚 Test the API at http://localhost:${PORT}/api/auth/users (requires auth token)`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Please use a different port or close the existing process.`);
    process.exit(1);
  } else {
    console.log('Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated!');
  });
});