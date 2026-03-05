const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../uploads/profiles'),
    path.join(__dirname, '../uploads/documents'),
    path.join(__dirname, '../uploads/assignments')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Profile picture storage
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/profiles'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// Document storage
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

// Assignment storage
const assignmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/assignments'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `assignment-${req.params.courseId}-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'text/plain': true
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDF, DOC, DOCX, XLS, XLSX, and TXT files are allowed.'), false);
  }
};

// Upload limits
const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB
};

// Export configured multer instances
exports.uploadProfilePicture = multer({
  storage: profileStorage,
  limits: limits,
  fileFilter: fileFilter
}).single('profilePicture');

exports.uploadDocument = multer({
  storage: documentStorage,
  limits: limits,
  fileFilter: fileFilter
}).single('document');

exports.uploadAssignment = multer({
  storage: assignmentStorage,
  limits: limits,
  fileFilter: fileFilter
}).single('assignment');

// Multiple files upload
exports.uploadMultiple = multer({
  storage: documentStorage,
  limits: limits,
  fileFilter: fileFilter
}).array('files', 5);

// General file upload
exports.upload = multer({
  storage: documentStorage,
  limits: limits,
  fileFilter: fileFilter
}).single('file');

