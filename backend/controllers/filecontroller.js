// controllers/fileController.js
const File = require('../models/file');
const Course = require('../models/subject');
const User = require('../models/user');
const Department = require('../models/Department');
const Enrollment = require('../models/Enrollment');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private (Lecturers, HOD, Admin)
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload a file' 
      });
    }

    const { 
      courseId, 
      yearOfStudy, 
      semester, 
      description,
      fileType,
      tags,
      isPublic = false
    } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      // Delete uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check permissions
    const userRole = req.user.role;
    const isLecturer = course.lecturers.some(l => l.toString() === req.user.id);
    
    if (!['admin', 'hod', 'dean'].includes(userRole) && !isLecturer) {
      // Delete uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only upload files for courses you teach.' 
      });
    }

    // Validate year of study
    const validYears = [1, 2, 3, 4, 5];
    if (yearOfStudy && !validYears.includes(parseInt(yearOfStudy))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid year of study' 
      });
    }

    // Validate semester
    if (semester && ![1, 2].includes(parseInt(semester))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid semester' 
      });
    }

    // Validate file type
    const validFileTypes = [
      'lecture_notes', 'tutorial', 'assignment', 'past_paper', 
      'syllabus', 'reading_material', 'lab_manual', 'project_guideline',
      'announcement', 'supplementary_material'
    ];
    
    if (fileType && !validFileTypes.includes(fileType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type' 
      });
    }

    // Create file record in database
    const file = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      fileType: fileType || 'lecture_notes',
      course: courseId,
      yearOfStudy: parseInt(yearOfStudy) || null,
      semester: parseInt(semester) || null,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic,
      uploadedBy: req.user.id,
      department: course.department,
      faculty: course.faculty,
      accessControl: {
        allowedRoles: isPublic ? ['student', 'lecturer', 'hod', 'dean', 'admin'] : ['lecturer', 'hod', 'dean', 'admin'],
        allowedDepartments: [course.department],
        allowedYears: yearOfStudy ? [parseInt(yearOfStudy)] : [],
        allowedSemesters: semester ? [parseInt(semester)] : []
      }
    });

    // Populate references
    await file.populate([
      { path: 'course', select: 'courseCode courseName level semester' },
      { path: 'uploadedBy', select: 'name email' },
      { path: 'department', select: 'name code' },
      { path: 'faculty', select: 'name code' }
    ]);

    // Notify enrolled students if file is public
    if (isPublic && yearOfStudy && semester) {
      const enrollments = await Enrollment.find({
        course: courseId,
        enrollmentStatus: 'enrolled'
      }).populate('student', 'email');

      // Queue notification emails (implement background job)
      const studentEmails = enrollments.map(e => e.student.email);
      // await notificationService.sendFileUploadNotification(file, studentEmails);
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file
    });
  } catch (error) {
    // Delete uploaded file if database operation fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    next(error);
  }
};

// @desc    Get all files with filters
// @route   GET /api/files
// @access  Private
exports.getFiles = async (req, res, next) => {
  try {
    const { 
      course, 
      department, 
      faculty,
      yearOfStudy, 
      semester,
      fileType,
      search,
      uploadedBy,
      isPublic,
      page = 1,
      limit = 20,
      sortBy = '-uploadedAt'
    } = req.query;

    let query = {};
    const userRole = req.user.role;
    const userId = req.user.id;

    // Build access control query based on user role
    if (userRole === 'student') {
      // Students can only see files for courses they're enrolled in
      const enrollments = await Enrollment.find({
        student: userId,
        enrollmentStatus: 'enrolled'
      }).select('course');
      
      const enrolledCourseIds = enrollments.map(e => e.course);
      
      query.$or = [
        { 
          isPublic: true,
          $or: [
            { course: { $in: enrolledCourseIds } },
            { accessControl: { $exists: false } }
          ]
        },
        {
          'accessControl.allowedRoles': 'student',
          $or: [
            { course: { $in: enrolledCourseIds } },
            { 'accessControl.allowedDepartments': req.user.department }
          ]
        }
      ];

      // Filter by student's year and semester
      if (req.user.yearOfStudy) {
        query.$or.push({
          yearOfStudy: req.user.yearOfStudy
        });
      }
      if (req.user.semester) {
        query.$or.push({
          semester: req.user.semester
        });
      }
    } else if (userRole === 'lecturer') {
      // Lecturers can see files for courses they teach
      const teachingCourses = await Course.find({
        lecturers: userId
      }).select('_id');
      
      const teachingCourseIds = teachingCourses.map(c => c._id);
      
      query.$or = [
        { uploadedBy: userId },
        { course: { $in: teachingCourseIds } },
        { 
          isPublic: true,
          department: req.user.department 
        }
      ];
    } else if (userRole === 'hod') {
      // HOD can see all files in their department
      query.department = req.user.department;
    } else if (userRole === 'dean') {
      // Dean can see all files in their faculty
      query.faculty = req.user.facultyManaged;
    }

    // Apply additional filters
    if (course) query.course = course;
    if (department) query.department = department;
    if (faculty) query.faculty = faculty;
    if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
    if (semester) query.semester = parseInt(semester);
    if (fileType) query.fileType = fileType;
    if (uploadedBy) query.uploadedBy = uploadedBy;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';

    if (search) {
      query.$and = [
        query.$and || [],
        {
          $or: [
            { originalName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const files = await File.find(query)
      .populate('course', 'courseCode courseName level semester')
      .populate('uploadedBy', 'name email')
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await File.countDocuments(query);

    // Get additional stats for each file
    const filesWithStats = files.map(file => ({
      ...file.toJSON(),
      downloadUrl: `/api/files/download/${file._id}`,
      preview: file.mimeType.startsWith('image/') ? file.path : null
    }));

    res.json({
      success: true,
      count: files.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      files: filesWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single file
// @route   GET /api/files/:id
// @access  Private
exports.getFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('course', 'courseCode courseName level semester credits')
      .populate('uploadedBy', 'name email employeeId')
      .populate('department', 'name code')
      .populate('faculty', 'name code');

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Check access permissions
    const hasAccess = await checkFileAccess(file, req.user);
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Get related files (same course, same type)
    const relatedFiles = await File.find({
      course: file.course,
      fileType: file.fileType,
      _id: { $ne: file._id },
      isPublic: true
    })
    .populate('uploadedBy', 'name')
    .limit(5)
    .sort('-downloads');

    res.json({
      success: true,
      file,
      relatedFiles,
      downloadUrl: `/api/files/download/${file._id}`,
      preview: file.mimeType.startsWith('image/') ? file.path : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download file
// @route   GET /api/files/download/:id
// @access  Private
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Check access permissions
    const hasAccess = await checkFileAccess(file, req.user);
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Check if file exists on server
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found on server' 
      });
    }

    // Increment download count and track who downloaded
    file.downloads += 1;
    file.downloadHistory.push({
      user: req.user.id,
      downloadedAt: new Date(),
      ipAddress: req.ip
    });
    await file.save();

    // Log download for analytics
    console.log(`File downloaded: ${file.originalName} by ${req.user.email}`);

    res.download(file.path, file.originalName);
  } catch (error) {
    next(error);
  }
};

// @desc    Update file metadata
// @route   PUT /api/files/:id
// @access  Private (Uploader, Admin, HOD)
exports.updateFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Check permissions (only uploader, admin, or HOD can update)
    const canUpdate = 
      file.uploadedBy.toString() === req.user.id ||
      req.user.role === 'admin' ||
      (req.user.role === 'hod' && file.department.toString() === req.user.department?.toString());

    if (!canUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update your own files.' 
      });
    }

    const allowedUpdates = [
      'description', 'fileType', 'tags', 'isPublic',
      'yearOfStudy', 'semester', 'accessControl'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle tags specially
    if (req.body.tags && typeof req.body.tags === 'string') {
      updates.tags = req.body.tags.split(',').map(tag => tag.trim());
    }

    const updatedFile = await File.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('course', 'courseCode courseName')
    .populate('uploadedBy', 'name email');

    res.json({
      success: true,
      message: 'File updated successfully',
      file: updatedFile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private (Uploader, Admin, HOD)
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }

    // Check permissions
    const canDelete = 
      file.uploadedBy.toString() === req.user.id ||
      req.user.role === 'admin' ||
      (req.user.role === 'hod' && file.department.toString() === req.user.department?.toString());

    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete your own files.' 
      });
    }

    // Delete file from server
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await file.deleteOne();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get files by course
// @route   GET /api/files/course/:courseId
// @access  Private
exports.getFilesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { fileType, yearOfStudy, semester } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check access
    const isEnrolled = await Enrollment.exists({
      student: req.user.id,
      course: courseId,
      enrollmentStatus: 'enrolled'
    });

    const isLecturer = course.lecturers.some(l => l.toString() === req.user.id);
    const isAdmin = ['admin', 'hod', 'dean'].includes(req.user.role);

    if (!isEnrolled && !isLecturer && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    let query = { course: courseId };

    // Filter by file type
    if (fileType) query.fileType = fileType;
    if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
    if (semester) query.semester = parseInt(semester);

    // Students only see public files
    if (req.user.role === 'student') {
      query.isPublic = true;
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'name')
      .sort('-uploadedAt');

    // Group files by type
    const groupedFiles = files.reduce((acc, file) => {
      if (!acc[file.fileType]) {
        acc[file.fileType] = [];
      }
      acc[file.fileType].push(file);
      return acc;
    }, {});

    res.json({
      success: true,
      count: files.length,
      course: {
        id: course._id,
        code: course.courseCode,
        name: course.courseName
      },
      groupedFiles,
      files
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get files by year and semester
// @route   GET /api/files/year/:year/semester/:semester
// @access  Private
exports.getFilesByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;

    // Validate year
    const validYears = [1, 2, 3, 4, 5];
    if (!validYears.includes(parseInt(year))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid year' 
      });
    }

    let query = {
      yearOfStudy: parseInt(year),
      semester: parseInt(semester)
    };

    // Role-based filtering
    if (req.user.role === 'student') {
      query.isPublic = true;
      query.$or = [
        { department: req.user.department },
        { 'accessControl.allowedDepartments': req.user.department }
      ];
    } else if (req.user.role === 'lecturer') {
      query.department = req.user.department;
    } else if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    const files = await File.find(query)
      .populate('course', 'courseCode courseName')
      .populate('uploadedBy', 'name')
      .populate('department', 'name code')
      .sort('-downloads');

    // Group by course
    const groupedByCourse = files.reduce((acc, file) => {
      const courseId = file.course._id.toString();
      if (!acc[courseId]) {
        acc[courseId] = {
          course: file.course,
          files: []
        };
      }
      acc[courseId].files.push(file);
      return acc;
    }, {});

    res.json({
      success: true,
      count: files.length,
      year: parseInt(year),
      semester: parseInt(semester),
      groupedByCourse: Object.values(groupedByCourse),
      files
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get files by department
// @route   GET /api/files/department/:departmentId
// @access  Private (HOD, Admin, Dean)
exports.getFilesByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { fileType, startDate, endDate } = req.query;

    // Check access
    if (req.user.role === 'hod' && req.user.department?.toString() !== departmentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    let query = { department: departmentId };

    if (fileType) query.fileType = fileType;
    if (startDate || endDate) {
      query.uploadedAt = {};
      if (startDate) query.uploadedAt.$gte = new Date(startDate);
      if (endDate) query.uploadedAt.$lte = new Date(endDate);
    }

    const files = await File.find(query)
      .populate('course', 'courseCode courseName')
      .populate('uploadedBy', 'name email')
      .populate('department', 'name')
      .sort('-uploadedAt');

    // Get statistics
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0),
      byType: {},
      topUploaders: {},
      monthlyUploads: {}
    };

    files.forEach(file => {
      // By type
      stats.byType[file.fileType] = (stats.byType[file.fileType] || 0) + 1;

      // By uploader
      const uploaderName = file.uploadedBy?.name || 'Unknown';
      stats.topUploaders[uploaderName] = (stats.topUploaders[uploaderName] || 0) + 1;

      // Monthly stats
      const month = file.uploadedAt.toISOString().slice(0, 7);
      stats.monthlyUploads[month] = (stats.monthlyUploads[month] || 0) + 1;
    });

    res.json({
      success: true,
      count: files.length,
      department: await Department.findById(departmentId).select('name code'),
      stats,
      files
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get file statistics
// @route   GET /api/files/stats
// @access  Private (Admin, HOD, Dean)
exports.getFileStats = async (req, res, next) => {
  try {
    let query = {};

    // Role-based filters
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    const stats = {
      totalFiles: await File.countDocuments(query),
      totalSize: 0,
      byType: {},
      byCourse: {},
      byDepartment: {},
      topDownloaded: [],
      recentUploads: [],
      monthlyStats: {}
    };

    // Get all files for detailed stats
    const files = await File.find(query)
      .populate('course', 'courseCode courseName')
      .populate('department', 'name')
      .populate('uploadedBy', 'name');

    // Calculate statistics
    files.forEach(file => {
      // Total size
      stats.totalSize += file.size;

      // By file type
      stats.byType[file.fileType] = (stats.byType[file.fileType] || 0) + 1;

      // By course
      if (file.course) {
        const courseKey = `${file.course.courseCode} - ${file.course.courseName}`;
        stats.byCourse[courseKey] = (stats.byCourse[courseKey] || 0) + 1;
      }

      // By department
      if (file.department) {
        stats.byDepartment[file.department.name] = (stats.byDepartment[file.department.name] || 0) + 1;
      }

      // Monthly stats
      const month = file.uploadedAt.toISOString().slice(0, 7);
      if (!stats.monthlyStats[month]) {
        stats.monthlyStats[month] = { count: 0, size: 0 };
      }
      stats.monthlyStats[month].count += 1;
      stats.monthlyStats[month].size += file.size;
    });

    // Top downloaded files
    stats.topDownloaded = await File.find(query)
      .sort('-downloads')
      .limit(10)
      .populate('course', 'courseCode courseName')
      .populate('uploadedBy', 'name');

    // Recent uploads
    stats.recentUploads = await File.find(query)
      .sort('-uploadedAt')
      .limit(10)
      .populate('course', 'courseCode courseName')
      .populate('uploadedBy', 'name');

    // Convert size to MB
    stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete files
// @route   DELETE /api/files/bulk
// @access  Private (Admin, HOD)
exports.bulkDeleteFiles = async (req, res, next) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an array of file IDs' 
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const fileId of fileIds) {
      try {
        const file = await File.findById(fileId);

        if (!file) {
          results.failed.push({
            id: fileId,
            reason: 'File not found'
          });
          continue;
        }

        // Check permissions
        const canDelete = 
          file.uploadedBy.toString() === req.user.id ||
          req.user.role === 'admin' ||
          (req.user.role === 'hod' && file.department.toString() === req.user.department?.toString());

        if (!canDelete) {
          results.failed.push({
            id: fileId,
            reason: 'Access denied'
          });
          continue;
        }

        // Delete file from server
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        await file.deleteOne();
        results.successful.push(fileId);
      } catch (error) {
        results.failed.push({
          id: fileId,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully deleted ${results.successful.length} files`,
      results
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to check file access
const checkFileAccess = async (file, user) => {
  // Admin and HOD have full access
  if (user.role === 'admin' || user.role === 'registrar') return true;
  
  if (user.role === 'hod' && file.department?.toString() === user.department?.toString()) {
    return true;
  }

  if (user.role === 'dean' && file.faculty?.toString() === user.facultyManaged?.toString()) {
    return true;
  }

  // Uploader always has access
  if (file.uploadedBy.toString() === user.id) return true;

  // Check if user is a lecturer for this course
  const course = await Course.findById(file.course);
  if (course && course.lecturers.some(l => l.toString() === user.id)) {
    return true;
  }

  // Check if user is a student
  if (user.role === 'student') {
    // Check if file is public
    if (file.isPublic) {
      // Check if student is enrolled in the course
      const isEnrolled = await Enrollment.exists({
        student: user.id,
        course: file.course,
        enrollmentStatus: 'enrolled'
      });

      if (isEnrolled) return true;

      // Check department access
      if (file.accessControl?.allowedDepartments?.includes(user.department)) {
        return true;
      }

      // Check year and semester
      if (file.yearOfStudy && file.yearOfStudy === user.yearOfStudy) {
        if (!file.semester || file.semester === user.semester) {
          return true;
        }
      }
    }

    // Check custom access control
    if (file.accessControl) {
      const { allowedRoles, allowedDepartments, allowedYears, allowedSemesters } = file.accessControl;
      
      if (allowedRoles?.includes('student')) {
        if (allowedDepartments?.includes(user.department)) {
          if (!allowedYears.length || allowedYears.includes(user.yearOfStudy)) {
            if (!allowedSemesters.length || allowedSemesters.includes(user.semester)) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
};

