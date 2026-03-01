// controllers/resultcontroller.js
const Result = require('../models/result');
const Department = require('../models/Department');
const User = require('../models/user');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { parse } = require('json2csv');

const resultController = {};

// ==================== Basic CRUD ====================

resultController.getResults = async (req, res, next) => {
  try {
    let query = {};

    // Role-based filters
    if (req.user.role === 'hod') query.department = req.user.department;
    if (req.user.role === 'dean') query.faculty = req.user.facultyManaged;

    const results = await Result.find(query)
      .populate('student', 'name studentId')
      .populate('course', 'courseCode courseName')
      .sort('academicYear semester');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

resultController.getResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name studentId')
      .populate('course', 'courseCode courseName');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

resultController.createResult = async (req, res, next) => {
  try {
    const newResult = await Result.create(req.body);
    res.status(201).json({ success: true, result: newResult });
  } catch (error) {
    next(error);
  }
};

resultController.updateResult = async (req, res, next) => {
  try {
    const updated = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, result: updated });
  } catch (error) {
    next(error);
  }
};

resultController.deleteResult = async (req, res, next) => {
  try {
    const deleted = await Result.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Result not found' });
    res.json({ success: true, message: 'Result deleted successfully', result: deleted });
  } catch (error) {
    next(error);
  }
};

resultController.approveResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    result.status = 'approved';
    await result.save();
    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

// ==================== Student-Specific ====================

resultController.getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('course', 'courseCode courseName credits')
      .sort('academicYear semester');
    res.json({ success: true, results });
  } catch (error) { next(error); }
};

resultController.getTranscript = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('course', 'courseCode courseName credits')
      .sort('academicYear semester');
    res.json({ success: true, transcript: results });
  } catch (error) { next(error); }
};

resultController.getResultsByCourse = async (req, res, next) => {
  try {
    const results = await Result.find({ course: req.params.courseId })
      .populate('student', 'name studentId')
      .sort('academicYear semester');
    res.json({ success: true, results });
  } catch (error) { next(error); }
};

resultController.getResultsByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;
    const results = await Result.find({ academicYear: year, semester })
      .populate('student', 'name studentId')
      .populate('course', 'courseCode courseName')
      .sort('student.studentId');
    res.json({ success: true, results });
  } catch (error) { next(error); }
};

resultController.generateGradeSheet = async (req, res, next) => {
  try {
    const results = await Result.find({ course: req.params.courseId })
      .populate('student', 'name studentId')
      .sort('student.studentId');
    res.json({ success: true, results });
  } catch (error) { next(error); }
};

// ==================== Bulk Operations ====================
resultController.bulkUploadResults = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0)
      return res.status(400).json({ success: false, message: 'No results to upload' });
    const results = await Result.insertMany(req.body);
    res.json({ success: true, count: results.length, results });
  } catch (error) { next(error); }
};

// ==================== Re-evaluation ====================
resultController.processReevaluation = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    result.status = req.body.status || result.status;
    if (req.body.marks !== undefined) result.marks = req.body.marks;
    await result.save();
    res.json({ success: true, result });
  } catch (error) { next(error); }
};

// ==================== Statistics ====================
resultController.getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await Result.getDepartmentResults(req.params.departmentId, { academicYear: req.query.academicYear });
    res.json({ success: true, stats });
  } catch (error) { next(error); }
};

// ==================== Export ====================
resultController.exportResults = async (req, res, next) => {
  try {
    const results = await Result.find({})
      .populate('student', 'name studentId')
      .populate('course', 'courseCode courseName credits');

    const fields = ['student.studentId', 'student.name', 'course.courseCode', 'course.courseName', 'marks', 'grade', 'semester', 'academicYear'];
    const csv = parse(results, { fields });
    res.header('Content-Type', 'text/csv');
    res.attachment(`results-${new Date().toISOString().slice(0,10)}.csv`);
    res.send(csv);
  } catch (error) { next(error); }
};

module.exports = resultController;