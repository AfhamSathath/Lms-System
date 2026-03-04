// controllers/resultsController.js
const Result = require('../models/result');
const Subject = require('../models/course');
const User = require('../models/user');
const Notification = require('../models/notification');
const { isPoorGrade } = require('../utils/gradecalculator');

/**
 * @desc    Get all results (Admin/Lecturer) or student results
 * @route   GET /api/results
 * @access  Private
 */
exports.getResults = async (req, res, next) => {
  try {
    const query = req.user.role === 'student' ? { student: req.user.id } : {};
    const results = await Result.find(query)
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits')
      .populate('publishedBy', 'name')
      .sort('-publishedAt');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get results of a specific student grouped by year/semester
 * @route   GET /api/results/student/:studentId
 * @access  Private
 */
exports.getStudentResults = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('subject', 'name code credits')
      .sort({ year: 1, semester: 1 });

    const yearSemesterResults = {};
    results.forEach(result => {
      const key = `${result.year}-S${result.semester}`;
      if (!yearSemesterResults[key]) {
        yearSemesterResults[key] = { year: result.year, semester: result.semester, subjects: [], totalCredits: 0, totalGradePoints: 0 };
      }
      const sem = yearSemesterResults[key];
      sem.subjects.push(result);
      sem.totalCredits += result.subject.credits;
      sem.totalGradePoints += result.subject.credits * result.gradePoint;
    });

    Object.values(yearSemesterResults).forEach(sem => {
      sem.gpa = sem.totalGradePoints / sem.totalCredits;
      sem.displayName = `${sem.year} - Semester ${sem.semester}`;
    });

    res.json({ success: true, results: yearSemesterResults });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get results by year and semester
 * @route   GET /api/results/year/:year/semester/:semester
 * @access  Private/Admin/Lecturer
 */
exports.getResultsByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;
    const results = await Result.find({ year, semester: parseInt(semester) })
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get results by year
 * @route   GET /api/results/year/:year
 * @access  Private/Admin/Lecturer
 */
exports.getResultsByYear = async (req, res, next) => {
  try {
    const results = await Result.find({ year: req.params.year })
      .populate('student', 'name studentId department')
      .populate('subject', 'name code credits');

    res.json({ success: true, count: results.length, results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a single result and notification
 * @route   POST /api/results
 * @access  Private/Admin
 */
exports.createResult = async (req, res, next) => {
  try {
    const { student, subject, year, semester, examType } = req.body;
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    if (!validYears.includes(year)) return res.status(400).json({ message: 'Invalid year' });
    if (![1, 2].includes(parseInt(semester))) return res.status(400).json({ message: 'Invalid semester' });

    const existingResult = await Result.findOne({ student, subject, examType, year, semester });
    if (existingResult) return res.status(400).json({ message: 'Result already exists' });

    const result = await Result.create({ ...req.body, publishedBy: req.user.id });
    await result.populate([{ path: 'student', select: 'name studentId email department' }, { path: 'subject', select: 'name code credits' }]);

    await Notification.create({
      user: student,
      title: 'Result Published',
      message: `Your ${year} Semester ${semester} ${examType} result for ${result.subject.name} has been published. Grade: ${result.grade}`,
      type: 'RESULT_PUBLISHED',
      priority: isPoorGrade(result.grade) ? 'HIGH' : 'MEDIUM',
      metadata: { resultId: result._id, subjectId: subject, grade: result.grade, year, semester },
      link: `/results/${result._id}`,
    });

    res.status(201).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a result and create notification
 * @route   PUT /api/results/:id
 * @access  Private/Admin
 */
exports.updateResult = async (req, res, next) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('student subject');
    if (!result) return res.status(404).json({ message: 'Result not found' });

    await Notification.create({
      user: result.student._id,
      title: 'Result Updated',
      message: `Your ${result.year} Semester ${result.semester} ${result.examType} result for ${result.subject.name} has been updated. New Grade: ${result.grade}`,
      type: 'RESULT_PUBLISHED',
      priority: isPoorGrade(result.grade) ? 'HIGH' : 'MEDIUM',
      metadata: { resultId: result._id, subjectId: result.subject._id, grade: result.grade, year: result.year, semester: result.semester },
      link: `/results/${result._id}`,
    });

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a result
 * @route   DELETE /api/results/:id
 * @access  Private/Admin
 */
exports.deleteResult = async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    await result.deleteOne();
    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk upload results
 * @route   POST /api/results/bulk-upload
 * @access  Private/Admin
 */
exports.bulkUploadResults = async (req, res, next) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) return res.status(400).json({ message: 'Provide an array of results' });

    const createdResults = [];
    const errors = [];

    for (const data of results) {
      try {
        const student = await User.findOne({ studentId: data.StudentID, role: 'student' });
        if (!student) { errors.push(`Student ${data.StudentID} not found`); continue; }

        const subject = await Subject.findOne({ code: data.SubjectCode });
        if (!subject) { errors.push(`Subject ${data.SubjectCode} not found`); continue; }

        const semester = parseInt(data.Semester);
        const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
        if (!validYears.includes(data.Year)) { errors.push(`Invalid year ${data.Year}`); continue; }
        if (![1, 2].includes(semester)) { errors.push(`Invalid semester ${data.Semester}`); continue; }

        const existing = await Result.findOne({ student: student._id, subject: subject._id, examType: data.ExamType.toUpperCase(), year: data.Year, semester });
        if (existing) { errors.push(`Result exists for student ${data.StudentID}`); continue; }

        const result = await Result.create({
          student: student._id,
          subject: subject._id,
          year: data.Year,
          semester,
          examType: data.ExamType.toUpperCase(),
          marks: parseFloat(data.Marks),
          publishedBy: req.user.id
        });

        await Notification.create({
          user: student._id,
          title: 'Result Published',
          message: `Your ${data.Year} Semester ${semester} ${data.ExamType} result for ${subject.name} has been published.`,
          type: 'RESULT_PUBLISHED',
          priority: isPoorGrade(result.grade) ? 'HIGH' : 'MEDIUM',
          metadata: { resultId: result._id, subjectId: subject._id, grade: result.grade, year: data.Year, semester },
          link: `/results/${result._id}`
        });

        createdResults.push(result);
      } catch (err) {
        errors.push(err.message);
      }
    }

    res.status(201).json({ success: true, results: createdResults, errors: errors.length ? errors : undefined });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student transcript
 * @route   GET /api/results/transcript/:studentId
 * @access  Private
 */
exports.getTranscript = async (req, res, next) => {
  try {
    const results = await Result.find({ student: req.params.studentId }).populate('subject', 'name code credits').sort({ year: 1, semester: 1 });
    if (!results.length) return res.status(404).json({ message: 'No results found for this student' });

    const student = await User.findById(req.params.studentId).select('name studentId department');
    const transcript = { student, years: {}, cgpa: 0, totalCredits: 0, totalGradePoints: 0 };
    let overallCredits = 0, overallGradePoints = 0;

    results.forEach(result => {
      if (!transcript.years[result.year]) transcript.years[result.year] = { semesters: {}, yearGpa: 0, totalCredits: 0, totalGradePoints: 0 };
      const yearData = transcript.years[result.year];

      if (!yearData.semesters[result.semester]) yearData.semesters[result.semester] = { subjects: [], gpa: 0, credits: 0, gradePoints: 0 };
      const semData = yearData.semesters[result.semester];

      semData.subjects.push(result);
      semData.credits += result.subject.credits;
      semData.gradePoints += result.subject.credits * result.gradePoint;

      yearData.totalCredits += result.subject.credits;
      yearData.totalGradePoints += result.subject.credits * result.gradePoint;

      overallCredits += result.subject.credits;
      overallGradePoints += result.subject.credits * result.gradePoint;
    });

    Object.values(transcript.years).forEach(yearData => {
      Object.values(yearData.semesters).forEach(sem => { sem.gpa = sem.gradePoints / sem.credits; });
      yearData.yearGpa = yearData.totalGradePoints / yearData.totalCredits;
    });

    transcript.cgpa = overallGradePoints / overallCredits;

    res.json({ success: true, transcript });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department statistics
 * @route   GET /api/results/department/stats
 * @access  Private/Admin
 */
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id department');
    const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
    const stats = {};

    for (const dept of departments) {
      const deptStudentIds = students.filter(s => s.department === dept).map(s => s._id);
      const deptResults = await Result.find({ student: { $in: deptStudentIds } }).populate('subject');

      if (!deptResults.length) continue;

      const totalResults = deptResults.length;
      const passedResults = deptResults.filter(r => r.status === 'pass').length;
      const passRate = (passedResults / totalResults) * 100;

      const gradeDistribution = {};
      deptResults.forEach(r => { gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1; });

      const yearPerformance = {};
      ['1st Year', '2nd Year', '3rd Year', '4th Year'].forEach(year => {
        const yearResults = deptResults.filter(r => r.year === year);
        if (yearResults.length) yearPerformance[year] = (yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length).toFixed(2);
      });

      const studentGPAs = {};
      deptResults.forEach(r => {
        if (!studentGPAs[r.student]) studentGPAs[r.student] = { totalPoints: 0, count: 0 };
        studentGPAs[r.student].totalPoints += r.gradePoint;
        studentGPAs[r.student].count += 1;
      });

      const topPerformers = await Promise.all(
        Object.entries(studentGPAs).map(async ([studentId, data]) => {
          const student = await User.findById(studentId).select('name studentId');
          return { name: student?.name, studentId: student?.studentId, cgpa: data.totalPoints / data.count };
        }).filter(s => s.cgpa > 0).sort((a, b) => b.cgpa - a.cgpa).slice(0, 5)
      );

      stats[dept] = {
        studentCount: deptStudentIds.length,
        resultCount: totalResults,
        avgCGPA: (deptResults.reduce((sum, r) => sum + r.gradePoint, 0) / totalResults).toFixed(2),
        passRate: passRate.toFixed(2),
        gradeDistribution,
        yearPerformance,
        topPerformers
      };
    }

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get yearly statistics
 * @route   GET /api/results/yearly/stats
 * @access  Private/Admin
 */
exports.getYearlyStats = async (req, res, next) => {
  try {
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const stats = {};

    for (const year of years) {
      const yearResults = await Result.find({ year }).populate('student subject');
      if (!yearResults.length) continue;

      const semesterStats = {};
      for (let sem = 1; sem <= 2; sem++) {
        const semResults = yearResults.filter(r => r.semester === sem);
        if (!semResults.length) continue;

        const avgMarks = semResults.reduce((sum, r) => sum + r.marks, 0) / semResults.length;
        const passedCount = semResults.filter(r => r.status === 'pass').length;

        semesterStats[sem] = {
          resultCount: semResults.length,
          avgMarks: avgMarks.toFixed(2),
          passRate: ((passedCount / semResults.length) * 100).toFixed(2)
        };
      }

      const departments = [...new Set(yearResults.map(r => r.student?.department).filter(Boolean))];
      const deptPerformance = {};
      departments.forEach(dept => {
        const deptResults = yearResults.filter(r => r.student?.department === dept);
        if (deptResults.length) deptPerformance[dept] = (deptResults.reduce((sum, r) => sum + r.marks, 0) / deptResults.length).toFixed(2);
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

    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};