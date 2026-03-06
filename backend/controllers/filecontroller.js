const File = require('../models/file');
const Course = require('../models/course');
const Enrollment = require('../models/Enrollment');
const fs = require('fs');

/* =====================================================
   Helper: Access Control
===================================================== */
const checkFileAccess = async (file, user) => {
  if (!file || !user) return false;

  if (user.role === 'admin') return true;
  if (file.uploadedBy.toString() === user.id) return true;

  if (file.isPublic) {
    if (user.role === 'student') {
      const isEnrolled = await Enrollment.exists({
        student: user.id,
        course: file.subject,
        enrollmentStatus: 'enrolled'
      });
      return !!isEnrolled;
    }
    return true;
  }

  return false;
};

/* =====================================================
   Upload File
===================================================== */
exports.uploadFile = async (req, res, next) => {
  try {

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file"
      });
    }

    const {
      subjectsId,
      academicYear,
      semester,
      description,
      fileType,
      tags,
      isPublic
    } = req.body;

    // Validate subjectsId
    if (!subjectsId) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }

    const course = await Course.findById(subjectsId);

    if (!course) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    const file = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      fileType,
      subject: subjectsId,
      academicYear,
      semester: semester ? parseInt(semester) : null,
      description,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
      isPublic: isPublic === "true",
      uploadedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file
    });

  } catch (error) {

    // Delete uploaded file if error occurs
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    next(error);
  }
};

/* =====================================================
   Get Stats
===================================================== */
exports.getStats = async (req, res, next) => {
  try {
    const totalFiles = await File.countDocuments();
    const totalDownloads = await File.aggregate([
      { $group: { _id: null, total: { $sum: "$downloads" } } }
    ]);
    const publicFiles = await File.countDocuments({ isPublic: true });

    res.json({
      success: true,
      stats: {
        totalFiles,
        totalDownloads: totalDownloads[0]?.total || 0,
        publicFiles
      }
    });

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Get All Files
===================================================== */
exports.getFiles = async (req, res, next) => {
  try {
    let query = {};

    // allow filtering by academic year / semester
    if (req.query.year) {
      const y = parseInt(req.query.year);
      if (!isNaN(y)) query.academicYear = y;
    }
    if (req.query.semester) {
      const s = parseInt(req.query.semester);
      if (!isNaN(s)) query.semester = s;
    }

    if (req.user.role === 'student') {
      // restrict students to public files OR files belonging to courses they
      // are enrolled in (so they can access private materials for their
      // subjects).
      const enrolled = await Enrollment.find({
        student: req.user.id,
        enrollmentStatus: 'enrolled'
      }).select('course');
      const courseIds = enrolled.map(e => e.course);

      query.$or = [{ isPublic: true }];
      if (courseIds.length) {
        query.$or.push({ subject: { $in: courseIds } });
      }
    }

    const files = await File.find(query)
      .populate('subject', 'code name')
      .populate('uploadedBy', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: files.length,
      files
    });

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Get Single File
===================================================== */
exports.getFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const hasAccess = await checkFileAccess(file, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, file });

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Download File
===================================================== */
exports.downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ success: false, message: 'File missing on server' });
    }

    file.downloads += 1;
    await file.save();

    res.download(file.path, file.originalName);

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Update File
===================================================== */
exports.updateFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (
      file.uploadedBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allowedFields = [
      'description',
      'fileType',
      'academicYear',
      'semester',
      'isPublic'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        file[field] = field === 'semester'
          ? parseInt(req.body[field])
          : req.body[field];
      }
    });

    if (req.body.tags) {
      file.tags = req.body.tags.split(',').map(t => t.trim());
    }

    await file.save();

    res.json({
      success: true,
      message: 'File updated successfully',
      file
    });

  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Delete File
===================================================== */
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (
      file.uploadedBy.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    await file.deleteOne();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};