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
  processReevaluation
} = resultController;

// All routes require authentication
router.use(protect);

// ==================== Basic Result Routes ====================
router.get('/', authorize('admin', 'lecturer', 'hod', 'dean'), getResults);
router.get('/:id', getResult);

// ==================== Student-Specific Routes ====================
router.get('/student/:studentId',
  (req, res, next) => {
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own results.' });
    }
    next();
  },
  getStudentResults
);

router.get('/transcript/:studentId',
  (req, res, next) => {
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own transcript.' });
    }
    next();
  },
  getTranscript
);

router.get('/student/:studentId/gpa/:academicYear/:semester',
  authorize('admin', 'hod', 'dean', 'student'),
  async (req, res, next) => {
    try {
      const { studentId, academicYear, semester } = req.params;
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      const Result = require('../models/result');
      const gpa = await Result.calculateGPA(studentId, academicYear, parseInt(semester));
      res.json({ success: true, studentId, academicYear, semester: parseInt(semester), gpa: gpa.toFixed(2) });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/student/:studentId/cgpa',
  authorize('admin', 'hod', 'dean', 'student'),
  async (req, res, next) => {
    try {
      const { studentId } = req.params;
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      const Result = require('../models/result');
      const cgpa = await Result.calculateCGPA(studentId);
      res.json({ success: true, studentId, cgpa: cgpa.toFixed(2) });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Course-Specific Routes ====================
router.get('/course/:courseId', authorize('lecturer', 'hod', 'admin', 'dean'), getResultsByCourse);
router.get('/course/:courseId/grade-sheet', authorize('lecturer', 'hod', 'admin'), generateGradeSheet);
router.get('/course/:courseId/distribution/:academicYear/:semester',
  authorize('lecturer', 'hod', 'admin', 'dean'),
  async (req, res, next) => {
    try {
      const { courseId, academicYear, semester } = req.params;
      const Result = require('../models/result');
      const distribution = await Result.getGradeDistribution(courseId, academicYear, parseInt(semester));
      res.json({ success: true, courseId, academicYear, semester: parseInt(semester), distribution });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Year/Semester Routes ====================
router.get('/year/:year/semester/:semester', authorize('admin', 'lecturer', 'hod', 'dean'), getResultsByYearAndSemester);

router.get('/academic-year/:academicYear', authorize('admin', 'hod', 'dean'),
  async (req, res, next) => {
    try {
      const { academicYear } = req.params;
      const { department, faculty } = req.query;
      let query = { academicYear };

      if (req.user.role === 'hod') query.department = req.user.department;
      else if (req.user.role === 'dean') query.faculty = req.user.facultyManaged;
      else {
        if (department) query.department = department;
        if (faculty) query.faculty = faculty;
      }

      const Result = require('../models/result');
      const results = await Result.find(query)
        .populate('student', 'name studentId')
        .populate('course', 'courseCode courseName')
        .sort('semester');

      res.json({
        success: true,
        count: results.length,
        academicYear,
        grouped: { semester1: results.filter(r => r.semester === 1), semester2: results.filter(r => r.semester === 2) },
        results
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Department/Faculty Statistics Routes ====================
router.get('/stats/department/:departmentId', authorize('hod', 'admin', 'dean'), async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { academicYear } = req.query;
    if (req.user.role === 'hod' && req.user.department?.toString() !== departmentId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const Result = require('../models/result');
    const stats = await Result.getDepartmentResults(departmentId, { academicYear });
    res.json({ success: true, departmentId, academicYear: academicYear || 'All', stats });
  } catch (error) { next(error); }
});

router.get('/stats/faculty/:facultyId', authorize('dean', 'admin'), async (req, res, next) => {
  try {
    const { facultyId } = req.params;
    const { academicYear } = req.query;
    const Department = require('../models/Department');
    const departments = await Department.find({ faculty: facultyId }).select('_id');
    const Result = require('../models/result');
    const stats = {};
    for (const dept of departments) stats[dept._id] = await Result.getDepartmentResults(dept._id, { academicYear });
    res.json({ success: true, facultyId, academicYear: academicYear || 'All', departments: stats });
  } catch (error) { next(error); }
});

router.get('/stats/overall', authorize('admin'), async (req, res, next) => {
  try {
    const { academicYear, semester } = req.query;
    let query = {};
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    const Result = require('../models/result');
    const stats = await Result.aggregate([
      { $match: query },
      { $facet: {
        overall: [{ $group: { _id: null, totalResults: { $sum: 1 }, averageMarks: { $avg: '$marks' }, passCount: { $sum: { $cond: [{ $eq: ['$status','pass'] },1,0] } }, failCount: { $sum: { $cond: [{ $eq: ['$status','fail'] },1,0] } } } }],
        byDepartment: [{ $group: { _id: '$department', count: { $sum: 1 }, averageMarks: { $avg: '$marks' } } }, { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'deptInfo' } }],
        byGrade: [{ $group: { _id: '$grade', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]
      }}
    ]);
    res.json({ success: true, stats: stats[0] });
  } catch (error) { next(error); }
});

// ==================== Re-evaluation Routes ====================
router.get('/reevaluation/requests', authorize('hod', 'admin'), async (req, res, next) => {
  try {
    const Result = require('../models/result');
    const requests = await Result.getReevaluationRequests(req.user.department);
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
    res.json({ success: true, message: 'Re-evaluation request submitted successfully', result });
  } catch (error) { next(error); }
});

router.put('/:id/reevaluation/process', authorize('hod', 'admin'), processReevaluation);

// ==================== Result Creation/Update ====================
router.post('/', authorize('lecturer', 'hod', 'admin'), createResult);
router.post('/bulk-upload', authorize('admin', 'registrar'), bulkUploadResults);
router.put('/:id', authorize('lecturer', 'hod', 'admin'), updateResult);
router.put('/:id/approve', authorize('hod', 'admin'), approveResult);
router.delete('/:id', authorize('admin'), deleteResult);

// ==================== Export Routes ====================
router.get('/export/csv', authorize('admin', 'hod', 'dean'), exportResults);

// PDF export route (fixed role filters and populate)
router.get('/export/pdf', authorize('admin', 'hod', 'dean'), async (req, res, next) => {
  try {
    const { academicYear, semester, department, course } = req.query;
    let query = {};
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (department) query.department = department;
    if (course) query.course = course;
    if (req.user.role === 'hod') query.department = req.user.department;
    if (req.user.role === 'dean') query.faculty = req.user.facultyManaged;

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
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'Please provide an array of result IDs' });
    const Result = require('../models/result');
    const result = await Result.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Successfully deleted ${result.deletedCount} results`, count: result.deletedCount });
  } catch (error) { next(error); }
});

// ==================== Publication ====================
router.put('/:id/publish', authorize('hod', 'admin'), async (req, res, next) => {
  try {
    const Result = require('../models/result');
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    await result.publish(req.user.id);
    res.json({ success: true, message: 'Result published successfully', result });
  } catch (error) { next(error); }
});

router.put('/batch/publish', authorize('hod', 'admin'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ success: false, message: 'Please provide an array of result IDs' });
    const Result = require('../models/result');
    const result = await Result.updateMany({ _id: { $in: ids } }, { isPublished: true, publishedBy: req.user.id, publishedAt: new Date() });
    res.json({ success: true, message: `Successfully published ${result.modifiedCount} results`, count: result.modifiedCount });
  } catch (error) { next(error); }
});

// ==================== Analytics ====================
router.get('/analytics/dashboard', authorize('admin', 'hod', 'dean'), async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const currentYear = academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    let departmentFilter = {};
    if (req.user.role === 'hod') departmentFilter.department = req.user.department;
    if (req.user.role === 'dean') departmentFilter.faculty = req.user.facultyManaged;
    const Result = require('../models/result');

    const [
      overallStats,
      semester1Stats,
      semester2Stats,
      gradeDistribution,
      topPerformers
    ] = await Promise.all([
      Result.aggregate([{ $match: { academicYear: currentYear, ...departmentFilter } }, { $group: { _id: null, totalResults: { $sum: 1 }, averageMarks: { $avg: '$marks' }, passCount: { $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] } }, failCount: { $sum: { $cond: [{ $eq: ['$status', 'fail'] }, 1, 0] } } } }]),
      Result.aggregate([{ $match: { academicYear: currentYear, semester: 1, ...departmentFilter } }, { $group: { _id: null, averageMarks: { $avg: '$marks' }, passCount: { $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] } } } }]),
      Result.aggregate([{ $match: { academicYear: currentYear, semester: 2, ...departmentFilter } }, { $group: { _id: null, averageMarks: { $avg: '$marks' }, passCount: { $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] } } } }]),
      Result.aggregate([{ $match: { academicYear: currentYear, ...departmentFilter } }, { $group: { _id: '$grade', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Result.aggregate([{ $match: { academicYear: currentYear, ...departmentFilter } }, { $group: { _id: '$student', averageMarks: { $avg: '$marks' }, totalCredits: { $sum: '$course.credits' } } }, { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } }, { $unwind: '$student' }, { $sort: { averageMarks: -1 } }, { $limit: 10 }, { $project: { 'student.name': 1, 'student.studentId': 1, averageMarks: 1 } }])
    ]);

    res.json({
      success: true,
      academicYear: currentYear,
      data: {
        overall: overallStats[0] || { totalResults: 0, averageMarks: 0, passCount: 0, failCount: 0 },
        semester1: semester1Stats[0] || { averageMarks: 0, passCount: 0 },
        semester2: semester2Stats[0] || { averageMarks: 0, passCount: 0 },
        gradeDistribution,
        topPerformers
      }
    });
  } catch (error) { next(error); }
});

module.exports = router;