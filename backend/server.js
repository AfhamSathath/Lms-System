const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoose = require('mongoose');
const courseRoutes = require('./routes/courseroutes');
const resultRoutes = require('./routes/resultroutes');  
const fileroutes = require('./routes/fileroutes');
const notificationRoutes = require('./routes/notificationroutes');
const timetableRoutes = require('./routes/timetableroutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userroutes = require('./routes/userroutes');
const authRoutes = require('./routes/authroutes');

// Load environment variables
dotenv.config();

const app = express();

// Connect to database
require('./config/database')();

// ================= SECURITY MIDDLEWARE =================

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Set security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Prevent XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Sanitize data
app.use(mongoSanitize());

// Compress responses
app.use(compression());

// ================= CORS CONFIGURATION =================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5173',

    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ================= BODY PARSER =================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================= LOGGING =================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ================= STATIC FILES =================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= ROOT ROUTE =================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LMS Backend API is running successfully 🚀',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
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
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
        'update-profile': 'PUT /api/auth/update-profile',
        'update-password': 'PUT /api/auth/update-password',
        'forgot-password': 'POST /api/auth/forgot-password',
        'reset-password': 'PUT /api/auth/reset-password/:token',
        'refresh-token': 'POST /api/auth/refresh-token'
      },
      users: {
        'get-all': 'GET /api/users',
        'get-by-id': 'GET /api/users/:id',
        'create': 'POST /api/users',
        'update': 'PUT /api/users/:id',
        'delete': 'DELETE /api/users/:id',
        'toggle-status': 'PUT /api/users/:id/toggle-status',
        'reset-password': 'POST /api/users/:id/reset-password',
        'bulk-import': 'POST /api/users/bulk-import',
        'download-template': 'GET /api/users/template/download'
      },
      subjects: {
        'get-all': 'GET /api/subjects',
        'get-by-id': 'GET /api/subjects/:id',
        'create': 'POST /api/subjects',
        'update': 'PUT /api/subjects/:id',
        'delete': 'DELETE /api/subjects/:id'
      },
      results: {
        'get-all': 'GET /api/results',
        'get-by-id': 'GET /api/results/:id',
        'create': 'POST /api/results',
        'update': 'PUT /api/results/:id',
        'delete': 'DELETE /api/results/:id',
        'bulk-upload': 'POST /api/results/bulk-upload'
      },
      files: {
        upload: 'POST /api/files/upload',
        download: 'GET /api/files/:id',
        delete: 'DELETE /api/files/:id'
      },
      notifications: {
        'get-all': 'GET /api/notifications',
        'mark-read': 'PUT /api/notifications/:id/read',
        'mark-all-read': 'PUT /api/notifications/read-all',
        'delete': 'DELETE /api/notifications/:id'
      },
      timetables: {
        'get-all': 'GET /api/timetables',
        'get-by-id': 'GET /api/timetables/:id',
        'create': 'POST /api/timetables',
        'update': 'PUT /api/timetables/:id',
        'delete': 'DELETE /api/timetables/:id'
      },
      enrollments: {
        'get-all': 'GET /api/enrollments',
        'get-by-id': 'GET /api/enrollments/:id',
        'create': 'POST /api/enrollments',
        'update': 'PUT /api/enrollments/:id',
        'delete': 'DELETE /api/enrollments/:id'
      },
      stats: {
        dashboard: 'GET /api/stats/dashboard',
        users: 'GET /api/stats/users',
        subjects: 'GET /api/stats/subjects',
        results: 'GET /api/stats/results'
      },
      admin: {
        dashboard: 'GET /api/admin/dashboard',
        logs: 'GET /api/admin/logs',
        settings: 'GET /api/admin/settings',
        'update-settings': 'PUT /api/admin/settings'
      },
      activities: {
        'get-all': 'GET /api/activities',
        'get-by-user': 'GET /api/activities/user/:userId'
      }
    }
  });
});

// ================= API ROUTES =================

// Auth routes - handles authentication and user management
app.use('/api/auth', authRoutes);

// User routes - for additional user-related operations
app.use('/api/users', userroutes);

// Other routes
app.use('/api/subjects',courseRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/files', fileroutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activityRoutes);


// ================= HEALTH CHECK =================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});

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
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
      field: field,
      error: `${field} already exists`
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB.'
    });
  }

  if (err.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
});

// ================= SERVER START =================
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Server Status: RUNNING`);
  console.log('='.repeat(50));
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api`);

  console.log('='.repeat(50) + '\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('\n❌ UNHANDLED REJECTION! Shutting down...');
  console.log('Error:', err.name, err.message);
  console.log(err.stack);

  server.close(() => {
    console.log('💤 Server closed due to unhandled rejection');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('\n❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.log('Error:', err.name, err.message);
  console.log(err.stack);

  server.close(() => {
    console.log('💤 Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n❌ Port ${PORT} is already in use.`);
    console.log(`💡 Try: lsof -i :${PORT} | grep LISTEN`);
    console.log(`💡 Then: kill -9 <PID>`);
    console.log(`💡 Or change PORT in .env file\n`);
    process.exit(1);
  } else {
    console.log('Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated!');
    // Close database connection if needed
    // mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated!');
    // Close database connection if needed
    // mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = app;