const Result = require('../models/result');
const Department = require('../models/Department');
const User = require('../models/user');
const Course = require('../models/course');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// Helper function for error handling
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => {
      console.error('Controller Error:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  };
};

const resultController = {};

// ==================== Basic CRUD ====================

resultController.getResults = catchAsync(async (req, res, next) => {
  let query = {};

  // Role-based filters
  if (req.user.role === 'hod') {
    query.department = req.user.department;
  } else if (req.user.role === 'dean') {
    const departments = await Department.find({ faculty: req.user.facultyManaged }).select('_id');
    const departmentIds = departments.map(d => d._id);
    query.department = { $in: departmentIds };
  } else if (req.user.role === 'student') {
    query.student = req.user.id;
  } else if (req.user.role === 'lecturer') {
    // Get courses taught by this lecturer
    const courses = await Course.find({ lecturers: req.user.id }).select('_id');
    const courseIds = courses.map(c => c._id);
    query.course = { $in: courseIds };
  }

  const results = await Result.find(query)
    .populate('student', 'name studentId email')
    .populate('course', 'courseCode courseName credits')
    .populate('department', 'name code')
    .sort('-createdAt');

  res.json({ 
    success: true, 
    count: results.length, 
    results 
  });
});

resultController.getResult = catchAsync(async (req, res, next) => {
  const result = await Result.findById(req.params.id)
    .populate('student', 'name studentId email registrationNumber')
    .populate('course', 'courseCode courseName credits level semester')
    .populate('department', 'name code')
    .populate('approvedBy', 'name email')
    .populate('uploadedBy', 'name email');

  if (!result) {
    return res.status(404).json({ 
      success: false, 
      message: 'Result not found' 
    });
  }

  res.json({ 
    success: true, 
    result 
  });
});

resultController.createResult = catchAsync(async (req, res, next) => {
  // Add metadata
  req.body.uploadedBy = req.user.id;
  req.body.uploadedAt = new Date();
  
  // Calculate grade if not provided
  if (!req.body.grade && req.body.marks !== undefined) {
    req.body.grade = calculateGrade(req.body.marks);
    req.body.gradePoint = calculateGradePoint(req.body.marks);
  }

  const newResult = await Result.create(req.body);
  
  res.status(201).json({ 
    success: true, 
    result: newResult 
  });
});

resultController.updateResult = catchAsync(async (req, res, next) => {
  // Recalculate grade if marks changed
  if (req.body.marks !== undefined) {
    req.body.grade = calculateGrade(req.body.marks);
    req.body.gradePoint = calculateGradePoint(req.body.marks);
  }
  
  req.body.lastModifiedBy = req.user.id;
  req.body.lastModifiedAt = new Date();

  const updated = await Result.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    { new: true, runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({ 
      success: false, 
      message: 'Result not found' 
    });
  }

  res.json({ 
    success: true, 
    result: updated 
  });
});

resultController.deleteResult = catchAsync(async (req, res, next) => {
  const deleted = await Result.findByIdAndDelete(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({ 
      success: false, 
      message: 'Result not found' 
    });
  }

  res.json({ 
    success: true, 
    message: 'Result deleted successfully',
    result: deleted 
  });
});

resultController.approveResult = catchAsync(async (req, res, next) => {
  const result = await Result.findById(req.params.id);
  
  if (!result) {
    return res.status(404).json({ 
      success: false, 
      message: 'Result not found' 
    });
  }

  result.status = 'approved';
  result.approvedBy = req.user.id;
  result.approvedAt = new Date();
  result.isPublished = true;
  
  await result.save();

  res.json({ 
    success: true, 
    result 
  });
});

// ==================== Student-Specific ====================

resultController.getStudentResults = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  const { academicYear, semester } = req.query;

  // Check permissions
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own results.'
    });
  }

  let query = { student: studentId, isPublished: true };
  
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = parseInt(semester);

  const results = await Result.find(query)
    .populate('course', 'courseCode courseName credits')
    .sort('academicYear semester');

  // Calculate semester GPA
  let totalCredits = 0;
  let totalGradePoints = 0;
  
  results.forEach(result => {
    if (result.course && result.course.credits && result.gradePoint) {
      totalCredits += result.course.credits;
      totalGradePoints += result.gradePoint * result.course.credits;
    }
  });

  const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

  res.json({ 
    success: true, 
    results,
    summary: {
      totalResults: results.length,
      gpa,
      totalCredits
    }
  });
});

resultController.getTranscript = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;

  // Check permissions
  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own transcript.'
    });
  }

  const results = await Result.find({ student: studentId, isPublished: true })
    .populate('course', 'courseCode courseName credits level')
    .sort('academicYear semester');

  // Group by academic year and semester
  const transcript = {};
  let cumulativeCredits = 0;
  let cumulativeGradePoints = 0;

  results.forEach(result => {
    const year = result.academicYear;
    const sem = result.semester;
    
    if (!transcript[year]) transcript[year] = {};
    if (!transcript[year][sem]) transcript[year][sem] = [];
    
    transcript[year][sem].push(result);
    
    if (result.course && result.course.credits && result.gradePoint) {
      cumulativeCredits += result.course.credits;
      cumulativeGradePoints += result.gradePoint * result.course.credits;
    }
  });

  const cgpa = cumulativeCredits > 0 ? (cumulativeGradePoints / cumulativeCredits).toFixed(2) : '0.00';

  res.json({ 
    success: true, 
    transcript,
    summary: {
      totalResults: results.length,
      cgpa,
      totalCredits: cumulativeCredits
    }
  });
});

resultController.getResultsByCourse = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { academicYear, semester } = req.query;

  let query = { course: courseId };
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = parseInt(semester);

  const results = await Result.find(query)
    .populate('student', 'name studentId email registrationNumber')
    .sort('student.studentId');

  // Calculate statistics
  const marks = results.map(r => r.marks).filter(m => m !== undefined && m !== null);
  const average = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
  const highest = marks.length > 0 ? Math.max(...marks) : 0;
  const lowest = marks.length > 0 ? Math.min(...marks) : 0;
  const passed = results.filter(r => r.marks >= 40).length;
  const failed = results.filter(r => r.marks < 40).length;

  res.json({ 
    success: true, 
    results,
    statistics: {
      total: results.length,
      average: average.toFixed(2),
      highest,
      lowest,
      passCount: passed,
      failCount: failed,
      passPercentage: results.length > 0 ? ((passed / results.length) * 100).toFixed(2) : 0
    }
  });
});

resultController.getResultsByYearAndSemester = catchAsync(async (req, res, next) => {
  const { year, semester } = req.params;
  const { department, course } = req.query;

  let query = { academicYear: year, semester: parseInt(semester) };
  
  if (department) query.department = department;
  if (course) query.course = course;

  const results = await Result.find(query)
    .populate('student', 'name studentId')
    .populate('course', 'courseCode courseName')
    .populate('department', 'name')
    .sort('student.studentId');

  res.json({ 
    success: true, 
    count: results.length,
    academicYear: year,
    semester: parseInt(semester),
    results 
  });
});

resultController.generateGradeSheet = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { academicYear, semester } = req.query;

  let query = { course: courseId };
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = parseInt(semester);

  const results = await Result.find(query)
    .populate('student', 'name studentId registrationNumber')
    .sort('student.studentId');

  // Calculate grade distribution
  const distribution = {
    A: results.filter(r => r.grade === 'A').length,
    B: results.filter(r => r.grade === 'B').length,
    C: results.filter(r => r.grade === 'C').length,
    D: results.filter(r => r.grade === 'D').length,
    E: results.filter(r => r.grade === 'E').length,
    F: results.filter(r => r.grade === 'F').length
  };

  const passed = results.filter(r => r.marks >= 40).length;

  res.json({ 
    success: true, 
    courseId,
    academicYear,
    semester,
    results,
    distribution,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      passPercentage: results.length > 0 ? ((passed / results.length) * 100).toFixed(2) : 0
    }
  });
});

// ==================== Bulk Operations ====================

resultController.bulkUploadResults = catchAsync(async (req, res, next) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide an array of results to upload' 
    });
  }

  // Add metadata to each result
  const resultsWithMeta = req.body.map(result => ({
    ...result,
    uploadedBy: req.user.id,
    uploadedAt: new Date(),
    grade: result.marks ? calculateGrade(result.marks) : result.grade,
    gradePoint: result.marks ? calculateGradePoint(result.marks) : result.gradePoint
  }));

  const results = await Result.insertMany(resultsWithMeta);

  res.json({ 
    success: true, 
    message: `Successfully uploaded ${results.length} results`,
    count: results.length, 
    results 
  });
});

// ==================== Re-evaluation ====================

resultController.processReevaluation = catchAsync(async (req, res, next) => {
  const result = await Result.findById(req.params.id);
  
  if (!result) {
    return res.status(404).json({ 
      success: false, 
      message: 'Result not found' 
    });
  }

  result.reevaluationStatus = req.body.status || 'completed';
  
  if (req.body.marks !== undefined) {
    result.marks = req.body.marks;
    result.grade = calculateGrade(req.body.marks);
    result.gradePoint = calculateGradePoint(req.body.marks);
    result.reevaluatedMarks = req.body.marks;
  }
  
  result.reevaluatedBy = req.user.id;
  result.reevaluatedAt = new Date();
  result.reevaluationRemarks = req.body.remarks;
  
  await result.save();

  res.json({ 
    success: true, 
    message: 'Re-evaluation processed successfully',
    result 
  });
});

// ==================== Statistics ====================

resultController.getDepartmentStats = catchAsync(async (req, res, next) => {
  const { departmentId } = req.params;
  const { academicYear } = req.query;

  // Check if department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  const stats = await Result.aggregate([
    {
      $match: { 
        department: departmentId,
        ...(academicYear && { academicYear })
      }
    },
    {
      $facet: {
        overview: [
          {
            $group: {
              _id: null,
              totalResults: { $sum: 1 },
              averageMarks: { $avg: '$marks' },
              passCount: {
                $sum: { $cond: [{ $gte: ['$marks', 40] }, 1, 0] }
              },
              failCount: {
                $sum: { $cond: [{ $lt: ['$marks', 40] }, 1, 0] }
              }
            }
          }
        ],
        byCourse: [
          {
            $group: {
              _id: '$course',
              count: { $sum: 1 },
              averageMarks: { $avg: '$marks' }
            }
          },
          {
            $lookup: {
              from: 'courses',
              localField: '_id',
              foreignField: '_id',
              as: 'courseInfo'
            }
          },
          { $unwind: { path: '$courseInfo', preserveNullAndEmptyArrays: true } }
        ],
        bySemester: [
          {
            $group: {
              _id: '$semester',
              count: { $sum: 1 },
              averageMarks: { $avg: '$marks' }
            }
          },
          { $sort: { _id: 1 } }
        ],
        gradeDistribution: [
          {
            $group: {
              _id: '$grade',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  res.json({ 
    success: true, 
    department: {
      id: departmentId,
      name: department.name,
      code: department.code
    },
    academicYear: academicYear || 'All',
    stats: stats[0] 
  });
});

// Dashboard Stats (for /stats endpoint)
resultController.getDashboardStats = catchAsync(async (req, res, next) => {
  const currentYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  
  // Build filter based on user role
  let filter = {};
  if (req.user.role === 'hod') {
    filter.department = req.user.department;
  } else if (req.user.role === 'dean') {
    const departments = await Department.find({ faculty: req.user.facultyManaged }).select('_id');
    const departmentIds = departments.map(d => d._id);
    filter.department = { $in: departmentIds };
  }

  // Run parallel queries
  const [
    totalResults,
    totalStudents,
    totalCourses,
    recentResults,
    passRate,
    departmentStats,
    semesterStats
  ] = await Promise.all([
    // Total results count
    Result.countDocuments(filter),
    
    // Total students count
    User.countDocuments({ role: 'student', ...filter }),
    
    // Total courses count
    Course.countDocuments(filter),
    
    // Recent 10 results
    Result.find(filter)
      .sort('-createdAt')
      .limit(10)
      .populate('student', 'name studentId')
      .populate('course', 'courseCode courseName'),
    
    // Pass rate calculation
    Result.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          passed: {
            $sum: { $cond: [{ $gte: ['$marks', 40] }, 1, 0] }
          }
        }
      }
    ]),
    
    // Stats by department (if admin)
    req.user.role === 'admin' ? Result.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          averageMarks: { $avg: '$marks' }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } }
    ]) : Promise.resolve([]),
    
    // Stats by semester for current year
    Result.aggregate([
      { 
        $match: { 
          ...filter,
          academicYear: currentYear 
        }
      },
      {
        $group: {
          _id: '$semester',
          count: { $sum: 1 },
          averageMarks: { $avg: '$marks' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Calculate pass percentage
  const passPercentage = passRate[0] 
    ? ((passRate[0].passed / passRate[0].total) * 100).toFixed(2)
    : '0.00';

  res.json({
    success: true,
    data: {
      overview: {
        totalResults,
        totalStudents,
        totalCourses,
        passRate: passPercentage
      },
      recentResults,
      departmentStats,
      semesterStats,
      academicYear: currentYear
    }
  });
});

// Overall Stats (for /stats/overall endpoint)
resultController.getOverallStats = catchAsync(async (req, res, next) => {
  const { academicYear, semester } = req.query;
  
  let matchStage = {};
  if (academicYear) matchStage.academicYear = academicYear;
  if (semester) matchStage.semester = parseInt(semester);

  const stats = await Result.aggregate([
    { $match: matchStage },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalResults: { $sum: 1 },
              averageMarks: { $avg: '$marks' },
              passCount: {
                $sum: { $cond: [{ $gte: ['$marks', 40] }, 1, 0] }
              },
              failCount: {
                $sum: { $cond: [{ $lt: ['$marks', 40] }, 1, 0] }
              },
              totalCredits: { $sum: { $ifNull: ['$credits', 0] } }
            }
          }
        ],
        byDepartment: [
          {
            $group: {
              _id: '$department',
              count: { $sum: 1 },
              averageMarks: { $avg: '$marks' },
              passCount: {
                $sum: { $cond: [{ $gte: ['$marks', 40] }, 1, 0] }
              }
            }
          },
          {
            $lookup: {
              from: 'departments',
              localField: '_id',
              foreignField: '_id',
              as: 'departmentInfo'
            }
          },
          { $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true } }
        ],
        byCourse: [
          {
            $group: {
              _id: '$course',
              count: { $sum: 1 },
              averageMarks: { $avg: '$marks' },
              passCount: {
                $sum: { $cond: [{ $gte: ['$marks', 40] }, 1, 0] }
              }
            }
          },
          {
            $lookup: {
              from: 'courses',
              localField: '_id',
              foreignField: '_id',
              as: 'courseInfo'
            }
          },
          { $unwind: { path: '$courseInfo', preserveNullAndEmptyArrays: true } },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ],
        byGrade: [
          {
            $group: {
              _id: '$grade',
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ],
        bySemester: [
          {
            $group: {
              _id: '$semester',
              count: { $sum: 1 },
              averageMarks: { $avg: '$marks' }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  res.json({
    success: true,
    stats: stats[0]
  });
});

// ==================== Export ====================

resultController.exportResults = catchAsync(async (req, res, next) => {
  const { format = 'csv', academicYear, semester, department, course } = req.query;

  // Build query
  let query = {};
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = parseInt(semester);
  if (department) query.department = department;
  if (course) query.course = course;

  const results = await Result.find(query)
    .populate('student', 'name studentId email registrationNumber')
    .populate('course', 'courseCode courseName credits')
    .populate('department', 'name code')
    .sort('student.studentId');

  if (format === 'csv') {
    try {
      // Export as CSV
      const fields = [
        {
          label: 'Student ID',
          value: 'student.studentId'
        },
        {
          label: 'Student Name',
          value: 'student.name'
        },
        {
          label: 'Registration Number',
          value: 'student.registrationNumber'
        },
        {
          label: 'Course Code',
          value: 'course.courseCode'
        },
        {
          label: 'Course Name',
          value: 'course.courseName'
        },
        {
          label: 'Credits',
          value: 'course.credits'
        },
        {
          label: 'Marks',
          value: 'marks'
        },
        {
          label: 'Grade',
          value: 'grade'
        },
        {
          label: 'Grade Point',
          value: 'gradePoint'
        },
        {
          label: 'Semester',
          value: 'semester'
        },
        {
          label: 'Academic Year',
          value: 'academicYear'
        },
        {
          label: 'Status',
          value: 'status'
        },
        {
          label: 'Department',
          value: 'department.name'
        }
      ];
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(results);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=results-${new Date().toISOString().slice(0, 10)}.csv`);
      res.send(csv);
    } catch (csvError) {
      console.error('CSV Export Error:', csvError);
      return res.status(500).json({
        success: false,
        message: 'Error generating CSV',
        error: csvError.message
      });
    }
  } 
  else if (format === 'pdf') {
    try {
      // Export as PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=results-${new Date().toISOString().slice(0, 10)}.pdf`);
      doc.pipe(res);

      // Add title
      doc.fontSize(20).text('Results Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Total Records: ${results.length}`, { align: 'center' });
      doc.moveDown();

      // Create table
      const tableTop = 150;
      const rowHeight = 20;
      
      // Draw headers
      doc.font('Helvetica-Bold');
      doc.text('Student ID', 50, tableTop);
      doc.text('Name', 150, tableTop);
      doc.text('Course', 300, tableTop);
      doc.text('Marks', 450, tableTop);
      doc.text('Grade', 500, tableTop);
      doc.text('Semester', 550, tableTop);

      // Draw rows
      doc.font('Helvetica');
      let y = tableTop + rowHeight;
      
      results.forEach((result) => {
        if (y > 500) {
          doc.addPage();
          y = 50;
          
          // Reprint headers on new page
          doc.font('Helvetica-Bold');
          doc.text('Student ID', 50, y);
          doc.text('Name', 150, y);
          doc.text('Course', 300, y);
          doc.text('Marks', 450, y);
          doc.text('Grade', 500, y);
          doc.text('Semester', 550, y);
          y += rowHeight;
          doc.font('Helvetica');
        }
        
        doc.text(result.student?.studentId || '-', 50, y);
        doc.text((result.student?.name || '').substring(0, 15), 150, y);
        doc.text(result.course?.courseCode || '-', 300, y);
        doc.text(result.marks?.toString() || '-', 450, y);
        doc.text(result.grade || '-', 500, y);
        doc.text(result.semester?.toString() || '-', 550, y);
        
        y += rowHeight;
      });

      doc.end();
    } catch (pdfError) {
      console.error('PDF Export Error:', pdfError);
      return res.status(500).json({
        success: false,
        message: 'Error generating PDF',
        error: pdfError.message
      });
    }
  }
  else {
    // Default JSON export
    res.json({
      success: true,
      count: results.length,
      results
    });
  }
});

// ==================== Helper Functions ====================

function calculateGrade(marks) {
  if (marks === undefined || marks === null) return 'F';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C';
  if (marks >= 45) return 'D';
  if (marks >= 40) return 'E';
  return 'F';
}

function calculateGradePoint(marks) {
  if (marks === undefined || marks === null) return 0;
  if (marks >= 70) return 4.0;
  if (marks >= 60) return 3.5;
  if (marks >= 50) return 3.0;
  if (marks >= 45) return 2.5;
  if (marks >= 40) return 2.0;
  return 0.0;
}

module.exports = resultController;