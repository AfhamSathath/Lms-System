const File = require('../models/file');
const fs = require('fs');
const path = require('path');

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private/Lecturer/Admin
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      subject: req.body.subjectId,
      semester: req.body.semester,
      description: req.body.description,
      uploadedBy: req.user.id,
    };

    const file = await File.create(fileData);
    
    await file.populate([
      { path: 'subject', select: 'name code' },
      { path: 'uploadedBy', select: 'name' },
    ]);

    res.status(201).json({
      success: true,
      file,
    });
  } catch (error) {
    // Delete uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Get all files
// @route   GET /api/files
// @access  Private
exports.getFiles = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.semester = req.user.semester;
    } else if (req.user.role === 'lecturer') {
      query.uploadedBy = req.user.id;
    }

    const files = await File.find(query)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name')
      .sort('-uploadedAt');

    res.json({
      success: true,
      count: files.length,
      files,
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
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({
      success: true,
      file,
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
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Increment download count
    file.downloads += 1;
    await file.save();

    res.download(file.path, file.originalName);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private/Lecturer/Admin
exports.deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // Delete from filesystem
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await file.deleteOne();

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get files by subject
// @route   GET /api/files/subject/:subjectId
// @access  Private
exports.getFilesBySubject = async (req, res, next) => {
  try {
    const files = await File.find({ subject: req.params.subjectId })
      .populate('uploadedBy', 'name')
      .sort('-uploadedAt');

    res.json({
      success: true,
      files,
    });
  } catch (error) {
    next(error);
  }
};