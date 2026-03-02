// routes/resultRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const resultController = require('../controllers/resultcontroller');

const {
  getResults,
  getResult,
  getStudentResults,
  getResultsByCourse,
  getResultsByYearAndSemester,
  getTranscript,
  createResult,
  updateResult,
  deleteResult,
  approveResult,
  bulkUploadResults,
  generateGradeSheet,
  getDepartmentStats,
  exportResults,
  processReevaluation,
  getDashboardStats,
  getOverallStats
} = resultController;

// All routes require authentication
router.use(protect);

// ==================== STATS ROUTES ====================
router.get('/stats', authorize('admin', 'lecturer'), getDashboardStats);
router.get('/stats/department/:departmentId', authorize('admin'), getDepartmentStats);
router.get('/stats/overall', authorize('admin'), getOverallStats);

// ==================== Basic Result Routes ====================
router.get('/', authorize('admin', 'lecturer'), getResults);
router.get('/:id', getResult);

// ==================== Student-Specific Routes ====================
router.get('/student/:studentId',
  (req, res, next) => {
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own results.' 
      });
    }
    next();
  },
  getStudentResults
);

router.get('/transcript/:studentId',
  (req, res, next) => {
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own transcript.' 
      });
    }
    next();
  },
  getTranscript
);

router.get('/student/:studentId/gpa/:academicYear/:semester',
  authorize('admin', 'lecturer', 'student'),
  async (req, res, next) => {
    try {
      const { studentId, academicYear, semester } = req.params;
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      const Result = require('../models/result');
      const gpa = await Result.calculateGPA(studentId, academicYear, parseInt(semester));
      res.json({ 
        success: true, 
        studentId, 
        academicYear, 
        semester: parseInt(semester), 
        gpa: gpa.toFixed(2) 
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/student/:studentId/cgpa',
  authorize('admin', 'lecturer', 'student'),
  async (req, res, next) => {
    try {
      const { studentId } = req.params;
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      const Result = require('../models/result');
      const cgpa = await Result.calculateCGPA(studentId);
      res.json({ 
        success: true, 
        studentId, 
        cgpa: cgpa.toFixed(2) 
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Course-Specific Routes ====================
router.get('/course/:courseId', authorize('admin', 'lecturer'), getResultsByCourse);
router.get('/course/:courseId/grade-sheet', authorize('admin', 'lecturer'), generateGradeSheet);

// ==================== Year/Semester Routes ====================
router.get('/year/:year/semester/:semester', authorize('admin', 'lecturer'), getResultsByYearAndSemester);

router.get('/academic-year/:academicYear', authorize('admin'),
  async (req, res, next) => {
    try {
      const { academicYear } = req.params;
      const { department } = req.query;
      let query = { academicYear };

      if (req.user.role === 'student') query.student = req.user.id;
      else if (department) query.department = department;

      const Result = require('../models/result');
      const results = await Result.find(query)
        .populate('student', 'name studentId')
        .populate('course', 'courseCode courseName')
        .sort('semester');

      res.json({
        success: true,
        count: results.length,
        academicYear,
        grouped: {
          semester1: results.filter(r => r.semester === 1),
          semester2: results.filter(r => r.semester === 2)
        },
        results
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Re-evaluation Routes ====================
router.get('/reevaluation/requests', authorize('admin'), async (req, res, next) => {
  try {
    const Result = require('../models/result');
    const requests = await Result.getReevaluationRequests();
    res.json({ success: true, count: requests.length, requests });
  } catch (error) { next(error); }
});

router.post('/:id/reevaluation/request', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const Result = require('../models/result');
    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    if (result.student.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });

    await result.requestReevaluation(req.user.id, reason);
    res.json({ success: true, message: 'Re-evaluation request submitted', result });
  } catch (error) { next(error); }
});

router.put('/:id/reevaluation/process', authorize('admin'), processReevaluation);

// ==================== Result Creation/Update ====================
router.post('/', authorize('admin', 'lecturer'), createResult);
router.post('/bulk-upload', authorize('admin'), bulkUploadResults);
router.put('/:id', authorize('admin', 'lecturer'), updateResult);
router.put('/:id/approve', authorize('admin'), approveResult);
router.delete('/:id', authorize('admin'), deleteResult);

// ==================== Export Routes ====================
router.get('/export/csv', authorize('admin'), exportResults);

router.get('/export/pdf', authorize('admin'), async (req, res, next) => {
  try {
    const { academicYear, semester, department, course } = req.query;
    let query = {};
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (department) query.department = department;
    if (course) query.course = course;

    const Result = require('../models/result');
    const results = await Result.find(query)
      .populate('student', 'name studentId registrationNumber')
      .populate('course', 'courseCode courseName credits')
      .populate('department', 'name')
      .sort('student.studentId');

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=results-${new Date().toISOString().slice(0,10)}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Results Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    let y = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Student ID', 50, y);
    doc.text('Name', 150, y);
    doc.text('Course', 300, y);
    doc.text('Marks', 450, y);
    doc.text('Grade', 500, y);
    y += 20;
    doc.font('Helvetica');

    results.forEach(result => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.text(result.student?.studentId || '-', 50, y);
      doc.text((result.student?.name || '').substring(0, 20), 150, y);
      doc.text(result.course?.courseCode || '-', 300, y);
      doc.text(result.marks.toString(), 450, y);
      doc.text(result.grade || '-', 500, y);
      y += 20;
    });

    doc.end();
  } catch (error) { next(error); }
});

// ==================== Batch Operations ====================
router.delete('/batch', authorize('admin'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'Please provide result IDs' });

    const Result = require('../models/result');
    const result = await Result.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Deleted ${result.deletedCount} results`, count: result.deletedCount });
  } catch (error) { next(error); }
});

// ==================== Publication ====================
router.put('/:id/publish', authorize('admin'), async (req, res, next) => {
  try {
    const Result = require('../models/result');
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    await result.publish(req.user.id);
    res.json({ success: true, message: 'Result published', result });
  } catch (error) { next(error); }
});

router.put('/batch/publish', authorize('admin'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'Please provide result IDs' });

    const Result = require('../models/result');
    const result = await Result.updateMany(
      { _id: { $in: ids } },
      { isPublished: true, publishedBy: req.user.id, publishedAt: new Date() }
    );
    res.json({ success: true, message: `Published ${result.modifiedCount} results`, count: result.modifiedCount });
  } catch (error) { next(error); }
});

module.exports = router;