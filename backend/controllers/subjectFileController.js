const SubjectFile = require('../models/SubjectFile');
const Subject = require('../models/course');
const user = require('../models/user');
const Department = require('../models/Department');
const fs = require('fs');
const path = require('path');

/* =====================================================
   Upload Subject File
===================================================== */
exports.uploadSubjectFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const {
      subjectId,
      departmentId,
      fileType,
      title,
      description,
      academicYear,
      semester,
      topic,
      weekNumber,
      courseOutcomes,
      tags
    } = req.body;

    // Validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate department
    let department = await Department.findById(departmentId);
    
    // If not found by ID, try to find by name
    if (!department) {
      department = await Department.findOne({ name: departmentId });
    }
    
    if (!department) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const subjectFile = await SubjectFile.create({
      subject: subjectId,
      department: department._id,
      uploadedBy: req.user.id,
      title,
      description,
      filePath: req.file.path,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileType,
      academicYear,
      semester: Number(semester),
      topic,
      weekNumber: weekNumber ? Number(weekNumber) : null,
      courseOutcomes: courseOutcomes ? JSON.parse(courseOutcomes) : [],
      tags: tags ? JSON.parse(tags) : [],
      isPublished: true,
      isActive: true
    });

    await subjectFile.populate([
      { path: 'subject', select: 'name code' },
      { path: 'department', select: 'name code' },
      { path: 'uploadedBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: subjectFile
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/* =====================================================
   Get Subject Files
===================================================== */
exports.getSubjectFiles = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { semester, academicYear, fileType, weekNumber } = req.query;

    let query = { subject: subjectId, isActive: true, isPublished: true };

    if (semester) query.semester = Number(semester);
    if (academicYear) query.academicYear = academicYear;
    if (fileType) query.fileType = fileType;
    if (weekNumber) query.weekNumber = Number(weekNumber);

    const files = await SubjectFile.find(query)
      .populate('uploadedBy', 'name email')
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
   Get Department Subject Files
===================================================== */
exports.getDepartmentSubjectFiles = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { semester, academicYear, fileType } = req.query;

    let query = { department: departmentId, isActive: true };

    if (semester) query.semester = Number(semester);
    if (academicYear) query.academicYear = academicYear;
    if (fileType) query.fileType = fileType;

    const files = await SubjectFile.find(query)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name email')
      .sort('-createdAt');

    // Group by subject
    const grouped = {};
    files.forEach(file => {
      const subjectCode = file.subject.code;
      if (!grouped[subjectCode]) {
        grouped[subjectCode] = {
          subject: file.subject,
          files: []
        };
      }
      grouped[subjectCode].files.push(file);
    });

    res.json({
      success: true,
      count: files.length,
      files,
      grouped
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Update Subject File
===================================================== */
exports.updateSubjectFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { title, description, fileType, isPublished, courseOutcomes, tags } = req.body;

    const subjectFile = await SubjectFile.findById(fileId);

    if (!subjectFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization
    if (subjectFile.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this file'
      });
    }

    if (title) subjectFile.title = title;
    if (description !== undefined) subjectFile.description = description;
    if (fileType) subjectFile.fileType = fileType;
    if (isPublished !== undefined) subjectFile.isPublished = isPublished;
    if (courseOutcomes) subjectFile.courseOutcomes = courseOutcomes;
    if (tags) subjectFile.tags = tags;

    await subjectFile.save();

    res.json({
      success: true,
      message: 'File updated successfully',
      file: subjectFile
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Download Subject File
===================================================== */
exports.downloadSubjectFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const subjectFile = await SubjectFile.findById(fileId);

    if (!subjectFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (!fs.existsSync(subjectFile.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File missing on server'
      });
    }

    // Increment download count
    subjectFile.downloadCount += 1;
    await subjectFile.save();

    res.download(subjectFile.filePath, subjectFile.fileName);
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Delete Subject File
===================================================== */
exports.deleteSubjectFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const subjectFile = await SubjectFile.findById(fileId);

    if (!subjectFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization
    if (subjectFile.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    // Delete from filesystem
    if (fs.existsSync(subjectFile.filePath)) {
      fs.unlinkSync(subjectFile.filePath);
    }

    await SubjectFile.findByIdAndRemove(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Get Curriculum Files (All required files for a subject)
===================================================== */
exports.getCurriculumFiles = async (req, res, next) => {
  try {
    const { subjectId, academicYear, semester } = req.params;

    const requiredTypes = [
      'syllabus',
      'curriculum',
      'lecture_notes',
      'slides',
      'lab_manual',
      'assignment',
      'past_paper',
      'grading_rubric'
    ];

    const files = await SubjectFile.find({
      subject: subjectId,
      academicYear,
      semester: Number(semester),
      isActive: true,
      isPublished: true
    });

    // Analyze curriculum compliance
    const uploadedTypes = new Set(files.map(f => f.fileType));
    const compliance = {
      total: requiredTypes.length,
      uploaded: requiredTypes.filter(t => uploadedTypes.has(t)).length,
      missing: requiredTypes.filter(t => !uploadedTypes.has(t)),
      completePercentage: 0
    };

    compliance.completePercentage = Math.round((compliance.uploaded / compliance.total) * 100);

    // Group by type
    const grouped = {};
    requiredTypes.forEach(type => {
      grouped[type] = {
        status: uploadedTypes.has(type) ? 'uploaded' : 'missing',
        files: files.filter(f => f.fileType === type)
      };
    });

    res.json({
      success: true,
      compliance,
      files,
      grouped
    });
  } catch (error) {
    next(error);
  }
};

/* =====================================================
   Get File Statistics
===================================================== */
exports.getFileStatistics = async (req, res, next) => {
  try {
    const { departmentId, semester, academicYear } = req.query;

    let matchStage = {};
    if (departmentId) matchStage.department = require('mongoose').Types.ObjectId(departmentId);
    if (semester) matchStage.semester = Number(semester);
    if (academicYear) matchStage.academicYear = academicYear;

    const stats = await SubjectFile.aggregate([
      { $match: { ...matchStage, isActive: true } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          totalSize: { $sum: '$fileSize' },
          byType: {
            $push: {
              type: '$fileType',
              count: 1
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalFiles: 0,
        totalDownloads: 0,
        totalSize: 0
      }
    });
  } catch (error) {
    next(error);
  }
};
