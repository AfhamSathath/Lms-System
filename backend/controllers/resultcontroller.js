const Result = require('../models/result');
const Subject = require('../models/subject');
const User = require('../models/user');
const Notification = require('../models/notification');
const { calculateGPA, isPoorGrade, getYearNumber, getSemesterNumber, calculateCGPA } = require('../utils/gradecalculator');

// @desc    Get results
// @route   GET /api/results
// @access  Private
exports.getResults = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user.id;
    }

    const results = await Result.find(query)
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits')
      .populate('publishedBy', 'name')
      .sort('-publishedAt');

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student results
// @route   GET /api/results/student/:studentId
// @access  Private
exports.getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('subject', 'name code credits')
      .sort({ year: 1, semester: 1 });

    // Group by year and semester
    const yearSemesterResults = {};
    
    for (const result of results) {
      const key = `${result.year}-S${result.semester}`;
      if (!yearSemesterResults[key]) {
        yearSemesterResults[key] = {
          year: result.year,
          semester: result.semester,
          subjects: [],
          totalCredits: 0,
          totalGradePoints: 0,
        };
      }
      
      yearSemesterResults[key].subjects.push(result);
      yearSemesterResults[key].totalCredits += result.subject.credits;
      yearSemesterResults[key].totalGradePoints += 
        result.subject.credits * result.gradePoint;
    }

    // Calculate GPA for each year-semester
    Object.values(yearSemesterResults).forEach(sem => {
      sem.gpa = sem.totalGradePoints / sem.totalCredits;
      sem.displayName = `${sem.year} - Semester ${sem.semester}`;
    });

    res.json({
      success: true,
      results: yearSemesterResults,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create result
// @route   POST /api/results
// @access  Private/Admin
exports.createResult = async (req, res, next) => {
  try {
    const { student, subject, year, semester, examType, marks } = req.body;

    // Check if result already exists
    const existingResult = await Result.findOne({
      student,
      subject,
      examType,
      year,
      semester,
    });

    if (existingResult) {
      return res.status(400).json({ 
        message: 'Result already exists for this student, year, semester, and exam type' 
      });
    }

    // Validate year and semester
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    if (!validYears.includes(year)) {
      return res.status(400).json({ 
        message: 'Invalid year. Must be: 1st Year, 2nd Year, 3rd Year, or 4th Year' 
      });
    }

    if (![1, 2].includes(parseInt(semester))) {
      return res.status(400).json({ 
        message: 'Invalid semester. Must be 1 or 2' 
      });
    }

    // Create result
    const result = await Result.create({
      ...req.body,
      publishedBy: req.user.id,
    });

    // Populate data
    await result.populate([
      { path: 'student', select: 'name studentId email department' },
      { path: 'subject', select: 'name code credits' },
    ]);

    // Create notification for student
    const notification = await Notification.create({
      user: student,
      title: 'Result Published',
      message: `Your ${year} Semester ${semester} ${examType} result for ${result.subject.name} has been published. Grade: ${result.grade}`,
      type: 'result',
      priority: isPoorGrade(result.grade) ? 'high' : 'medium',
      metadata: {
        resultId: result._id,
        subjectId: subject,
        grade: result.grade,
        year,
        semester,
      },
    });

    res.status(201).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update result
// @route   PUT /api/results/:id
// @access  Private/Admin
exports.updateResult = async (req, res, next) => {
  try {
    const result = await Result.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('student subject');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Create notification for updated result
    await Notification.create({
      user: result.student._id,
      title: 'Result Updated',
      message: `Your ${result.year} Semester ${result.semester} ${result.examType} result for ${result.subject.name} has been updated. New Grade: ${result.grade}`,
      type: 'result',
      priority: isPoorGrade(result.grade) ? 'high' : 'medium',
      metadata: {
        resultId: result._id,
        subjectId: result.subject._id,
        grade: result.grade,
        year: result.year,
        semester: result.semester,
      },
    });

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete result
// @route   DELETE /api/results/:id
// @access  Private/Admin
exports.deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    await result.deleteOne();

    res.json({
      success: true,
      message: 'Result deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get results by year and semester
// @route   GET /api/results/year/:year/semester/:semester
// @access  Private/Admin/Lecturer
exports.getResultsByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;
    
    const results = await Result.find({ 
      year,
      semester: parseInt(semester)
    })
      .populate('student', 'name studentId department')
      .populate('subject', 'name code');

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get results by year
// @route   GET /api/results/year/:year
// @access  Private/Admin/Lecturer
exports.getResultsByYear = async (req, res, next) => {
  try {
    const results = await Result.find({ year: req.params.year })
      .populate('student', 'name studentId department')
      .populate('subject', 'name code');

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student transcript
// @route   GET /api/results/transcript/:studentId
// @access  Private
exports.getTranscript = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('subject', 'name code credits')
      .sort({ year: 1, semester: 1 });

    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found for this student' });
    }

    // Get student info
    const student = await User.findById(req.params.studentId).select('name studentId department');

    // Group by year and semester
    const transcript = {
      student,
      years: {},
      cgpa: 0,
      totalCredits: 0,
      totalGradePoints: 0,
    };

    let overallCredits = 0;
    let overallGradePoints = 0;

    for (const result of results) {
      if (!transcript.years[result.year]) {
        transcript.years[result.year] = {
          semesters: {},
          yearGpa: 0,
          totalCredits: 0,
          totalGradePoints: 0,
        };
      }

      if (!transcript.years[result.year].semesters[result.semester]) {
        transcript.years[result.year].semesters[result.semester] = {
          subjects: [],
          gpa: 0,
          credits: 0,
          gradePoints: 0,
        };
      }

      transcript.years[result.year].semesters[result.semester].subjects.push(result);
      transcript.years[result.year].semesters[result.semester].credits += result.subject.credits;
      transcript.years[result.year].semesters[result.semester].gradePoints += 
        result.subject.credits * result.gradePoint;
      
      transcript.years[result.year].totalCredits += result.subject.credits;
      transcript.years[result.year].totalGradePoints += result.subject.credits * result.gradePoint;
      
      overallCredits += result.subject.credits;
      overallGradePoints += result.subject.credits * result.gradePoint;
    }

    // Calculate semester GPAs
    Object.keys(transcript.years).forEach(year => {
      const yearData = transcript.years[year];
      
      Object.keys(yearData.semesters).forEach(sem => {
        const semData = yearData.semesters[sem];
        semData.gpa = semData.gradePoints / semData.credits;
      });

      yearData.yearGpa = yearData.totalGradePoints / yearData.totalCredits;
    });

    // Calculate CGPA
    transcript.cgpa = overallGradePoints / overallCredits;

    res.json({
      success: true,
      transcript,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department statistics
// @route   GET /api/results/department/stats
// @access  Private/Admin
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id department');
    const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
    
    const stats = {};

    for (const dept of departments) {
      const deptStudentIds = students
        .filter(s => s.department === dept)
        .map(s => s._id);

      const deptResults = await Result.find({ 
        student: { $in: deptStudentIds } 
      }).populate('subject');

      if (deptResults.length > 0) {
        // Calculate statistics
        const totalStudents = deptStudentIds.length;
        const totalResults = deptResults.length;
        const passedResults = deptResults.filter(r => r.status === 'pass').length;
        const passRate = (passedResults / totalResults) * 100;

        // Grade distribution
        const gradeDistribution = {};
        deptResults.forEach(r => {
          gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
        });

        // Year-wise performance
        const yearPerformance = {};
        const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        
        years.forEach(year => {
          const yearResults = deptResults.filter(r => r.year === year);
          if (yearResults.length > 0) {
            const avgMarks = yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length;
            yearPerformance[year] = avgMarks.toFixed(2);
          }
        });

        // Top performers
        const studentGPAs = {};
        deptResults.forEach(r => {
          if (!studentGPAs[r.student]) {
            studentGPAs[r.student] = {
              totalPoints: 0,
              count: 0
            };
          }
          studentGPAs[r.student].totalPoints += r.gradePoint;
          studentGPAs[r.student].count += 1;
        });

        const topPerformers = await Promise.all(
          Object.entries(studentGPAs)
            .map(async ([studentId, data]) => {
              const student = await User.findById(studentId).select('name studentId');
              return {
                name: student?.name,
                studentId: student?.studentId,
                cgpa: data.totalPoints / data.count
              };
            })
            .filter(s => s.cgpa > 0)
            .sort((a, b) => b.cgpa - a.cgpa)
            .slice(0, 5)
        );

        stats[dept] = {
          studentCount: totalStudents,
          resultCount: totalResults,
          avgCGPA: (deptResults.reduce((sum, r) => sum + r.gradePoint, 0) / deptResults.length).toFixed(2),
          passRate: passRate.toFixed(2),
          gradeDistribution,
          yearPerformance,
          topPerformers
        };
      }
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get yearly statistics
// @route   GET /api/results/yearly/stats
// @access  Private/Admin
exports.getYearlyStats = async (req, res, next) => {
  try {
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const stats = {};

    for (const year of years) {
      const yearResults = await Result.find({ year })
        .populate('student subject');

      if (yearResults.length > 0) {
        // Semester breakdown
        const semesterStats = {};
        for (let sem = 1; sem <= 2; sem++) {
          const semResults = yearResults.filter(r => r.semester === sem);
          if (semResults.length > 0) {
            const avgMarks = semResults.reduce((sum, r) => sum + r.marks, 0) / semResults.length;
            const passedCount = semResults.filter(r => r.status === 'pass').length;
            semesterStats[sem] = {
              resultCount: semResults.length,
              avgMarks: avgMarks.toFixed(2),
              passRate: ((passedCount / semResults.length) * 100).toFixed(2)
            };
          }
        }

        // Department performance
        const deptPerformance = {};
        const departments = [...new Set(yearResults.map(r => r.student?.department).filter(Boolean))];
        
        departments.forEach(dept => {
          const deptResults = yearResults.filter(r => r.student?.department === dept);
          if (deptResults.length > 0) {
            const avgMarks = deptResults.reduce((sum, r) => sum + r.marks, 0) / deptResults.length;
            deptPerformance[dept] = avgMarks.toFixed(2);
          }
        });

        stats[year] = {
          totalResults: yearResults.length,
          totalStudents: [...new Set(yearResults.map(r => r.student?._id.toString()))].length,
          semesterStats,
          deptPerformance,
          overallAvgMarks: (yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length).toFixed(2),
          passRate: ((yearResults.filter(r => r.status === 'pass').length / yearResults.length) * 100).toFixed(2)
        };
      }
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk upload results
// @route   POST /api/results/bulk-upload
// @access  Private/Admin
exports.bulkUploadResults = async (req, res, next) => {
  try {
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of results' });
    }

    const createdResults = [];
    const errors = [];

    for (const resultData of results) {
      try {
        // Find student by studentId
        const student = await User.findOne({ 
          studentId: resultData.StudentID,
          role: 'student'
        });

        if (!student) {
          errors.push(`Student with ID ${resultData.StudentID} not found`);
          continue;
        }

        // Find subject by code
        const subject = await Subject.findOne({ code: resultData.SubjectCode });
        if (!subject) {
          errors.push(`Subject with code ${resultData.SubjectCode} not found`);
          continue;
        }

        // Validate year
        const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        if (!validYears.includes(resultData.Year)) {
          errors.push(`Invalid year for student ${resultData.StudentID}: ${resultData.Year}`);
          continue;
        }

        // Validate semester
        const semester = parseInt(resultData.Semester);
        if (![1, 2].includes(semester)) {
          errors.push(`Invalid semester for student ${resultData.StudentID}: ${resultData.Semester}`);
          continue;
        }

        // Check for existing result
        const existingResult = await Result.findOne({
          student: student._id,
          subject: subject._id,
          examType: resultData.ExamType.toLowerCase(),
          year: resultData.Year,
          semester
        });

        if (existingResult) {
          errors.push(`Result already exists for student ${resultData.StudentID}`);
          continue;
        }

        // Create result
        const result = await Result.create({
          student: student._id,
          subject: subject._id,
          year: resultData.Year,
          semester,
          examType: resultData.ExamType.toLowerCase(),
          marks: parseFloat(resultData.Marks),
          publishedBy: req.user.id
        });

        await result.populate([
          { path: 'student', select: 'name studentId' },
          { path: 'subject', select: 'name code' }
        ]);

        createdResults.push(result);
      } catch (error) {
        errors.push(error.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdResults.length} results`,
      results: createdResults,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
};