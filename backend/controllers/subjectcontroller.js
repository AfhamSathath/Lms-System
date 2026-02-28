const Subject = require('../models/subject');
const User = require('../models/user');
const { getDepartmentSubjects, getAllSubjectsForSeeding } = require('../utils/subjectData');

const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
exports.getSubjects = async (req, res, next) => {
  try {
    let query = { isActive: true };

    // Filter based on user role
    if (req.user.role === 'student') {
      // Students see subjects for their current year and semester
      const yearMap = {
        1: '1st Year',
        2: '2nd Year',
        3: '3rd Year',
        4: '4th Year'
      };
      query.year = yearMap[req.user.currentYear] || '1st Year';
      query.semester = req.user.currentSemester || 1;
      query.department = req.user.department;
    } else if (req.user.role === 'lecturer') {
      query.lecturer = req.user.id;
    }

    const subjects = await Subject.find(query)
      .populate('lecturer', 'name email lecturerId')
      .sort({ year: 1, semester: 1, code: 1 });

    // Add virtual semester number
    const subjectsWithSemNumber = subjects.map(sub => ({
      ...sub.toObject(),
      semesterNumber: sub.semesterNumber
    }));

    res.json({
      success: true,
      count: subjects.length,
      subjects: subjectsWithSemNumber,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('lecturer', 'name email lecturerId');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({
      success: true,
      subject: {
        ...subject.toObject(),
        semesterNumber: subject.semesterNumber
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = async (req, res, next) => {
  try {
    const { year, semester, department } = req.body;

    // Validate year
    const validYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    if (!validYears.includes(year)) {
      return res.status(400).json({ 
        message: 'Invalid year. Must be: 1st Year, 2nd Year, 3rd Year, or 4th Year' 
      });
    }

    // Validate semester
    if (![1, 2].includes(parseInt(semester))) {
      return res.status(400).json({ 
        message: 'Invalid semester. Must be 1 or 2' 
      });
    }

    // Validate department
    const validDepartments = ['Computer Science', 'Software Engineering', 'Information Technology'];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({ 
        message: 'Invalid department' 
      });
    }

    const subject = await Subject.create(req.body);
    
    await subject.populate('lecturer', 'name email lecturerId');

    res.status(201).json({
      success: true,
      subject: {
        ...subject.toObject(),
        semesterNumber: subject.semesterNumber
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Subject code already exists for this year, semester and department' 
      });
    }
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('lecturer', 'name email lecturerId');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({
      success: true,
      subject: {
        ...subject.toObject(),
        semesterNumber: subject.semesterNumber
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Subject code already exists for this year, semester and department' 
      });
    }
    next(error);
  }
};

// @desc    Delete subject (soft delete)
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Soft delete
    subject.isActive = false;
    await subject.save();

    res.json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by year and semester
// @route   GET /api/subjects/year/:year/semester/:semester
// @access  Private
exports.getSubjectsByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;
    
    const query = {
      year,
      semester: parseInt(semester),
      isActive: true,
    };

    // Add department filter for students
    if (req.user.role === 'student') {
      query.department = req.user.department;
    }

    const subjects = await Subject.find(query)
      .populate('lecturer', 'name email lecturerId')
      .sort({ code: 1 });

    res.json({
      success: true,
      count: subjects.length,
      subjects: subjects.map(sub => ({
        ...sub.toObject(),
        semesterNumber: sub.semesterNumber
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by year
// @route   GET /api/subjects/year/:year
// @access  Private
exports.getSubjectsByYear = async (req, res, next) => {
  try {
    const query = {
      year: req.params.year,
      isActive: true,
    };

    // Add department filter for students
    if (req.user.role === 'student') {
      query.department = req.user.department;
    }

    const subjects = await Subject.find(query)
      .populate('lecturer', 'name email lecturerId')
      .sort({ semester: 1, code: 1 });

    res.json({
      success: true,
      count: subjects.length,
      subjects: subjects.map(sub => ({
        ...sub.toObject(),
        semesterNumber: sub.semesterNumber
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by department
// @route   GET /api/subjects/department/:department
// @access  Private
exports.getSubjectsByDepartment = async (req, res, next) => {
  try {
    const { department } = req.params;
    const { year, semester } = req.query;

    let query = { 
      department,
      isActive: true 
    };

    if (year) query.year = year;
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query)
      .populate('lecturer', 'name email lecturerId')
      .sort({ year: 1, semester: 1, code: 1 });

    // Group by year and semester for easier frontend consumption
    const groupedSubjects = {};
    
    academicYears.forEach(y => {
      groupedSubjects[y] = {
        semester1: [],
        semester2: []
      };
    });

    subjects.forEach(sub => {
      if (groupedSubjects[sub.year]) {
        const semKey = sub.semester === 1 ? 'semester1' : 'semester2';
        groupedSubjects[sub.year][semKey].push({
          ...sub.toObject(),
          semesterNumber: sub.semesterNumber
        });
      }
    });

    res.json({
      success: true,
      count: subjects.length,
      subjects: groupedSubjects,
      flatList: subjects.map(sub => ({
        ...sub.toObject(),
        semesterNumber: sub.semesterNumber
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by category
// @route   GET /api/subjects/category/:category
// @access  Private
exports.getSubjectsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    const query = {
      category,
      isActive: true,
    };

    if (req.user.role === 'student') {
      query.department = req.user.department;
    }

    const subjects = await Subject.find(query)
      .populate('lecturer', 'name email')
      .sort({ year: 1, semester: 1, code: 1 });

    res.json({
      success: true,
      count: subjects.length,
      subjects: subjects.map(sub => ({
        ...sub.toObject(),
        semesterNumber: sub.semesterNumber
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign lecturer to subject
// @route   PUT /api/subjects/:id/assign-lecturer
// @access  Private/Admin
exports.assignLecturer = async (req, res, next) => {
  try {
    const { lecturerId } = req.body;

    const lecturer = await User.findOne({
      _id: lecturerId,
      role: 'lecturer',
      isActive: true,
    });

    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { lecturer: lecturerId },
      { new: true }
    ).populate('lecturer', 'name email lecturerId');

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({
      success: true,
      subject: {
        ...subject.toObject(),
        semesterNumber: subject.semesterNumber
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subject statistics by year
// @route   GET /api/subjects/stats/by-year
// @access  Private/Admin
exports.getSubjectStatsByYear = async (req, res, next) => {
  try {
    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const departments = ['Computer Science', 'Software Engineering', 'Information Technology'];
    const stats = {};

    for (const year of years) {
      const yearStats = {
        totalSubjects: 0,
        byDepartment: {},
        byCategory: {},
        semester1: 0,
        semester2: 0,
        totalCredits: 0
      };

      for (const dept of departments) {
        const subjects = await Subject.find({ 
          year, 
          department: dept,
          isActive: true 
        });

        const deptStats = {
          total: subjects.length,
          semester1: subjects.filter(s => s.semester === 1).length,
          semester2: subjects.filter(s => s.semester === 2).length,
          credits: subjects.reduce((sum, s) => sum + s.credits, 0)
        };

        yearStats.byDepartment[dept] = deptStats;
        yearStats.totalSubjects += deptStats.total;
        yearStats.semester1 += deptStats.semester1;
        yearStats.semester2 += deptStats.semester2;
        yearStats.totalCredits += deptStats.credits;

        // Category breakdown
        const categories = ['Lecture', 'Practical', 'General', 'Management', 'Project'];
        categories.forEach(cat => {
          const catCount = subjects.filter(s => s.category === cat).length;
          if (!yearStats.byCategory[cat]) yearStats.byCategory[cat] = 0;
          yearStats.byCategory[cat] += catCount;
        });
      }

      stats[year] = yearStats;
    }

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed default subjects for all departments
// @route   POST /api/subjects/seed
// @access  Private/Admin
exports.seedSubjects = async (req, res, next) => {
  try {
    const { department } = req.body;
    
    // Get subjects based on department or all departments
    let subjectsToSeed = [];
    
    if (department && department !== 'all') {
      // Seed specific department
      const deptSubjects = getDepartmentSubjects(department);
      
      Object.keys(deptSubjects).forEach(year => {
        ['semester1', 'semester2'].forEach(semKey => {
          const semester = semKey === 'semester1' ? 1 : 2;
          const subjects = deptSubjects[year][semKey] || [];
          
          subjects.forEach(sub => {
            subjectsToSeed.push({
              ...sub,
              year,
              semester,
              department,
              isActive: true
            });
          });
        });
      });
    } else {
      // Seed all departments
      subjectsToSeed = getAllSubjectsForSeeding();
    }

    // Insert subjects, skipping duplicates
    const results = [];
    const errors = [];

    for (const subjectData of subjectsToSeed) {
      try {
        // Check if subject already exists
        const existing = await Subject.findOne({
          code: subjectData.code,
          year: subjectData.year,
          semester: subjectData.semester,
          department: subjectData.department
        });

        if (!existing) {
          const subject = await Subject.create(subjectData);
          results.push(subject);
        }
      } catch (error) {
        errors.push(error.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} subjects`,
      count: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get subjects by lecturer
// @route   GET /api/subjects/lecturer/:lecturerId
// @access  Private/Admin
exports.getSubjectsByLecturer = async (req, res, next) => {
  try {
    const { lecturerId } = req.params;

    const subjects = await Subject.find({
      lecturer: lecturerId,
      isActive: true
    }).sort({ year: 1, semester: 1, code: 1 });

    res.json({
      success: true,
      count: subjects.length,
      subjects: subjects.map(sub => ({
        ...sub.toObject(),
        semesterNumber: sub.semesterNumber
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk create subjects
// @route   POST /api/subjects/bulk
// @access  Private/Admin
exports.bulkCreateSubjects = async (req, res, next) => {
  try {
    const { subjects } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of subjects' });
    }

    const results = [];
    const errors = [];

    for (const subjectData of subjects) {
      try {
        const existing = await Subject.findOne({
          code: subjectData.code,
          year: subjectData.year,
          semester: subjectData.semester,
          department: subjectData.department
        });

        if (!existing) {
          const subject = await Subject.create(subjectData);
          results.push(subject);
        } else {
          errors.push(`Subject ${subjectData.code} already exists`);
        }
      } catch (error) {
        errors.push(error.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.length} subjects`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
};