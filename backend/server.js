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
    message: 'LMS Backend API is running successfully 🚀'
  });
});

// ================= API ROUTES =================
app.use('/api/auth', require('./routes/authroutes'));
app.use('/api/users', require('./routes/userroutes'));
app.use('/api/subjects', require('./routes/courseroutes'));
app.use('/api/results', require('./routes/resultroutes'));
app.use('/api/files', require('./routes/fileroutes'));
app.use('/api/notifications', require('./routes/notificationroutes'));
app.use('/api/timetables', require('./routes/timetableroutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));




// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ================= SERVER START =================
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.log(err);
  }
});