const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const User = require('../models/user');
const Course = require('../models/subject');

// @desc    Get all faculties
// @route   GET /api/faculty
// @access  Private
exports.getFaculties = async (req, res, next) => {
  try {
    const { isActive, search, page = 1, limit = 20, sortBy = 'name' } = req.query;

    let query = {};
    const userRole = req.user.role;

    // Role-based access control
    if (userRole === 'dean') {
      query._id = req.user.facultyManaged;
    }

    // Apply filters
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const faculties = await Faculty.find(query)
      .populate('dean', 'name email employeeId lecturerRank')
      .populate('associateDeans', 'name email employeeId')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Faculty.countDocuments(query);

    // Get statistics for each faculty
    const facultiesWithStats = await Promise.all(
      faculties.map(async (faculty) => {
        const departments = await Department.countDocuments({
          faculty: faculty._id,
          isActive: true
        });

        const students = await User.countDocuments({
          faculty: faculty._id,
          role: 'student',
          isActive: true
        });

        const lecturers = await User.countDocuments({
          faculty: faculty._id,
          role: { $in: ['lecturer', 'hod'] },
          isActive: true
        });

        const courses = await Course.countDocuments({
          faculty: faculty._id,
          isActive: true
        });

        return {
          ...faculty.toJSON(),
          stats: {
            departments,
            students,
            lecturers,
            courses
          }
        };
      })
    );

    res.json({
      success: true,
      count: faculties.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      faculties: facultiesWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single faculty
// @route   GET /api/faculty/:id
// @access  Private
exports.getFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('dean', 'name email employeeId lecturerRank specialization officeLocation')
      .populate('associateDeans', 'name email employeeId lecturerRank');

    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Check access permissions
    if (req.user.role === 'dean' && req.user.facultyManaged?.toString() !== faculty._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own faculty.' 
      });
    }

    // Get detailed statistics
    const departments = await Department.find({ 
      faculty: faculty._id,
      isActive: true 
    }).select('name code headOfDepartment');

    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const students = await User.countDocuments({
          department: dept._id,
          role: 'student',
          isActive: true
        });

        const lecturers = await User.countDocuments({
          department: dept._id,
          role: 'lecturer',
          isActive: true
        });

        const courses = await Course.countDocuments({
          department: dept._id,
          isActive: true
        });

        return {
          ...dept.toJSON(),
          stats: { students, lecturers, courses }
        };
      })
    );

    const stats = {
      totalDepartments: departments.length,
      totalStudents: await User.countDocuments({
        faculty: faculty._id,
        role: 'student',
        isActive: true
      }),
      totalLecturers: await User.countDocuments({
        faculty: faculty._id,
        role: { $in: ['lecturer', 'hod'] },
        isActive: true
      }),
      totalCourses: await Course.countDocuments({
        faculty: faculty._id,
        isActive: true
      }),
      studentsByGender: {
        male: await User.countDocuments({
          faculty: faculty._id,
          role: 'student',
          gender: 'male',
          isActive: true
        }),
        female: await User.countDocuments({
          faculty: faculty._id,
          role: 'student',
          gender: 'female',
          isActive: true
        }),
        other: await User.countDocuments({
          faculty: faculty._id,
          role: 'student',
          gender: 'other',
          isActive: true
        })
      },
      lecturersByRank: {
        professor: await User.countDocuments({
          faculty: faculty._id,
          role: 'lecturer',
          lecturerRank: 'professor',
          isActive: true
        }),
        associateProfessor: await User.countDocuments({
          faculty: faculty._id,
          role: 'lecturer',
          lecturerRank: 'associate_professor',
          isActive: true
        }),
        seniorLecturer: await User.countDocuments({
          faculty: faculty._id,
          role: 'lecturer',
          lecturerRank: 'senior_lecturer',
          isActive: true
        }),
        lecturer: await User.countDocuments({
          faculty: faculty._id,
          role: 'lecturer',
          lecturerRank: 'lecturer',
          isActive: true
        }),
        assistantLecturer: await User.countDocuments({
          faculty: faculty._id,
          role: 'lecturer',
          lecturerRank: 'assistant_lecturer',
          isActive: true
        })
      }
    };

    res.json({
      success: true,
      faculty,
      stats,
      departments: departmentsWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create faculty
// @route   POST /api/faculty
// @access  Private (Admin only)
exports.createFaculty = async (req, res, next) => {
  try {
    const { code } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin can create faculties.' 
      });
    }

    // Check if faculty code already exists
    const existingFaculty = await Faculty.findOne({ code });
    if (existingFaculty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faculty with this code already exists' 
      });
    }

    const faculty = await Faculty.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      faculty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update faculty
// @route   PUT /api/faculty/:id
// @access  Private (Admin, Dean)
exports.updateFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      (req.user.role === 'dean' && req.user.facultyManaged?.toString() === faculty._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You cannot update this faculty.' 
      });
    }

    // If dean is being updated, handle previous dean
    if (req.body.dean && req.body.dean !== faculty.dean?.toString()) {
      // Remove dean status from previous dean
      if (faculty.dean) {
        await User.findByIdAndUpdate(faculty.dean, {
          isDean: false,
          deanSince: null,
          facultyManaged: null
        });
      }

      // Set new dean
      const newDean = await User.findById(req.body.dean);
      if (!newDean || !['lecturer', 'hod'].includes(newDean.role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid dean. Dean must be a lecturer or HOD.' 
        });
      }

      await User.findByIdAndUpdate(req.body.dean, {
        isDean: true,
        deanSince: new Date(),
        facultyManaged: faculty._id,
        role: 'dean'
      });
    }

    // Handle associate deans update
    if (req.body.associateDeans) {
      // Remove associate dean status from removed deans
      const removedDeans = faculty.associateDeans.filter(
        id => !req.body.associateDeans.includes(id.toString())
      );
      
      for (const deanId of removedDeans) {
        await User.findByIdAndUpdate(deanId, {
          isDean: false,
          facultyManaged: null
        });
      }

      // Add associate dean status to new deans
      const newDeans = req.body.associateDeans.filter(
        id => !faculty.associateDeans.map(ad => ad.toString()).includes(id)
      );

      for (const deanId of newDeans) {
        await User.findByIdAndUpdate(deanId, {
          isDean: true,
          facultyManaged: faculty._id
        });
      }
    }

    req.body.updatedBy = req.user.id;
    req.body.updatedAt = new Date();

    const updatedFaculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('dean', 'name email employeeId')
     .populate('associateDeans', 'name email employeeId');

    res.json({
      success: true,
      message: 'Faculty updated successfully',
      faculty: updatedFaculty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete faculty
// @route   DELETE /api/faculty/:id
// @access  Private (Admin only)
exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Only admin can delete faculties
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin can delete faculties.' 
      });
    }

    // Check if faculty has active departments
    const activeDepartments = await Department.countDocuments({
      faculty: faculty._id,
      isActive: true
    });

    if (activeDepartments > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete faculty with active departments. Deactivate the faculty instead.' 
      });
    }

    // Remove dean status from faculty dean
    if (faculty.dean) {
      await User.findByIdAndUpdate(faculty.dean, {
        isDean: false,
        deanSince: null,
        facultyManaged: null
      });
    }

    // Remove associate dean status
    for (const deanId of faculty.associateDeans) {
      await User.findByIdAndUpdate(deanId, {
        isDean: false,
        facultyManaged: null
      });
    }

    await faculty.deleteOne();

    res.json({
      success: true,
      message: 'Faculty deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty statistics
// @route   GET /api/faculty/:id/stats
// @access  Private (Admin, Dean)
exports.getFacultyStats = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Check access
    if (req.user.role === 'dean' && req.user.facultyManaged?.toString() !== faculty._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own faculty statistics.' 
      });
    }

    // Comprehensive statistics
    const stats = {
      overview: {
        totalDepartments: await Department.countDocuments({
          faculty: faculty._id,
          isActive: true
        }),
        totalStudents: await User.countDocuments({
          faculty: faculty._id,
          role: 'student',
          isActive: true
        }),
        totalLecturers: await User.countDocuments({
          faculty: faculty._id,
          role: { $in: ['lecturer', 'hod'] },
          isActive: true
        }),
        totalCourses: await Course.countDocuments({
          faculty: faculty._id,
          isActive: true
        }),
        totalStaff: await User.countDocuments({
          faculty: faculty._id,
          role: { $in: ['lecturer', 'hod', 'dean'] },
          isActive: true
        })
      },
      departments: {
        total: await Department.countDocuments({ faculty: faculty._id, isActive: true }),
        byStatus: {
          active: await Department.countDocuments({ faculty: faculty._id, isActive: true }),
          inactive: await Department.countDocuments({ faculty: faculty._id, isActive: false })
        }
      },
      students: {
        total: await User.countDocuments({ faculty: faculty._id, role: 'student', isActive: true }),
        byYear: {},
        byGender: {},
        byStatus: {
          active: await User.countDocuments({ 
            faculty: faculty._id, 
            role: 'student', 
            academicStatus: 'active',
            isActive: true 
          }),
          probation: await User.countDocuments({ 
            faculty: faculty._id, 
            role: 'student', 
            academicStatus: 'probation',
            isActive: true 
          }),
          graduated: await User.countDocuments({ 
            faculty: faculty._id, 
            role: 'student', 
            academicStatus: 'graduated' 
          })
        },
        newThisYear: await User.countDocuments({
          faculty: faculty._id,
          role: 'student',
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        })
      },
      staff: {
        total: await User.countDocuments({ 
          faculty: faculty._id, 
          role: { $in: ['lecturer', 'hod'] },
          isActive: true 
        }),
        byRank: {},
        byGender: {},
        newThisYear: await User.countDocuments({
          faculty: faculty._id,
          role: { $in: ['lecturer', 'hod'] },
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        })
      },
      courses: {
        total: await Course.countDocuments({ faculty: faculty._id, isActive: true }),
        byLevel: {},
        bySemester: {
          semester1: await Course.countDocuments({ 
            faculty: faculty._id, 
            semester: 1,
            isActive: true 
          }),
          semester2: await Course.countDocuments({ 
            faculty: faculty._id, 
            semester: 2,
            isActive: true 
          })
        },
        byStatus: {
          open: await Course.countDocuments({ 
            faculty: faculty._id, 
            enrollmentStatus: 'open',
            isActive: true 
          }),
          closed: await Course.countDocuments({ 
            faculty: faculty._id, 
            enrollmentStatus: 'closed',
            isActive: true 
          }),
          waitlist: await Course.countDocuments({ 
            faculty: faculty._id, 
            enrollmentStatus: 'waitlist',
            isActive: true 
          })
        }
      }
    };

    // Students by year
    for (let year = 1; year <= 4; year++) {
      stats.students.byYear[`year${year}`] = await User.countDocuments({
        faculty: faculty._id,
        role: 'student',
        yearOfStudy: year,
        isActive: true
      });
    }

    // Students by gender
    const genders = ['male', 'female', 'other'];
    for (const gender of genders) {
      stats.students.byGender[gender] = await User.countDocuments({
        faculty: faculty._id,
        role: 'student',
        gender,
        isActive: true
      });
    }

    // Staff by rank
    const ranks = [
      'professor', 'associate_professor', 'senior_lecturer', 
      'lecturer', 'assistant_lecturer', 'tutorial_fellow'
    ];
    for (const rank of ranks) {
      stats.staff.byRank[rank] = await User.countDocuments({
        faculty: faculty._id,
        role: 'lecturer',
        lecturerRank: rank,
        isActive: true
      });
    }

    // Staff by gender
    for (const gender of genders) {
      stats.staff.byGender[gender] = await User.countDocuments({
        faculty: faculty._id,
        role: { $in: ['lecturer', 'hod'] },
        gender,
        isActive: true
      });
    }

    // Courses by level
    const levels = ['100', '200', '300', '400', '500', '600', '700'];
    for (const level of levels) {
      stats.courses.byLevel[level] = await Course.countDocuments({
        faculty: faculty._id,
        level,
        isActive: true
      });
    }

    // Department-wise breakdown
    const departments = await Department.find({ 
      faculty: faculty._id,
      isActive: true 
    }).select('name code');

    stats.departmentBreakdown = await Promise.all(
      departments.map(async (dept) => ({
        _id: dept._id,
        name: dept.name,
        code: dept.code,
        students: await User.countDocuments({
          department: dept._id,
          role: 'student',
          isActive: true
        }),
        lecturers: await User.countDocuments({
          department: dept._id,
          role: 'lecturer',
          isActive: true
        }),
        courses: await Course.countDocuments({
          department: dept._id,
          isActive: true
        })
      }))
    );

    res.json({
      success: true,
      faculty: {
        id: faculty._id,
        name: faculty.name,
        code: faculty.code
      },
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign Dean
// @route   PUT /api/faculty/:id/assign-dean
// @access  Private (Admin only)
exports.assignDean = async (req, res, next) => {
  try {
    const { lecturerId } = req.body;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Only admin can assign dean
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin can assign dean.' 
      });
    }

    const lecturer = await User.findOne({
      _id: lecturerId,
      role: { $in: ['lecturer', 'hod'] },
      isActive: true
    });

    if (!lecturer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lecturer not found or inactive' 
      });
    }

    // Check if lecturer belongs to this faculty
    if (lecturer.faculty?.toString() !== faculty._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lecturer must belong to this faculty to be dean' 
      });
    }

    // Remove previous dean if exists
    if (faculty.dean) {
      await User.findByIdAndUpdate(faculty.dean, {
        isDean: false,
        deanSince: null,
        facultyManaged: null
      });
    }

    // Set new dean
    faculty.dean = lecturerId;
    await faculty.save();

    await User.findByIdAndUpdate(lecturerId, {
      isDean: true,
      deanSince: new Date(),
      facultyManaged: faculty._id,
      role: 'dean'
    });

    const updatedFaculty = await Faculty.findById(faculty._id)
      .populate('dean', 'name email employeeId lecturerRank');

    res.json({
      success: true,
      message: 'Dean assigned successfully',
      faculty: updatedFaculty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty departments
// @route   GET /api/faculty/:id/departments
// @access  Private
exports.getFacultyDepartments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive = true, page = 1, limit = 20 } = req.query;

    // Check access
    if (req.user.role === 'dean' && req.user.facultyManaged?.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own faculty departments.' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const departments = await Department.find({ 
      faculty: id,
      isActive: isActive === 'true'
    })
    .populate('headOfDepartment', 'name email employeeId')
    .sort('name')
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Department.countDocuments({ 
      faculty: id,
      isActive: isActive === 'true'
    });

    // Get stats for each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (dept) => {
        const students = await User.countDocuments({
          department: dept._id,
          role: 'student',
          isActive: true
        });

        const lecturers = await User.countDocuments({
          department: dept._id,
          role: 'lecturer',
          isActive: true
        });

        const courses = await Course.countDocuments({
          department: dept._id,
          isActive: true
        });

        return {
          ...dept.toJSON(),
          stats: {
            students,
            lecturers,
            courses
          }
        };
      })
    );

    res.json({
      success: true,
      count: departments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      departments: departmentsWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty staff
// @route   GET /api/faculty/:id/staff
// @access  Private
exports.getFacultyStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, rank, department, isActive = true, page = 1, limit = 20 } = req.query;

    // Check access
    if (req.user.role === 'dean' && req.user.facultyManaged?.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own faculty staff.' 
      });
    }

    let query = { 
      faculty: id,
      role: { $in: ['lecturer', 'hod', 'dean'] },
      isActive: isActive === 'true'
    };

    if (role) {
      query.role = role;
    }

    if (rank) {
      query.lecturerRank = rank;
    }

    if (department) {
      query.department = department;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const staff = await User.find(query)
      .select('name email employeeId role lecturerRank department specialization officeLocation consultationHours profilePicture')
      .populate('department', 'name code')
      .sort('name')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get teaching loads for each staff
    const staffWithLoad = await Promise.all(
      staff.map(async (member) => {
        const teachingCourses = await Course.countDocuments({
          lecturers: member._id,
          isActive: true
        });

        const coordinatingCourses = await Course.countDocuments({
          coordinator: member._id,
          isActive: true
        });

        return {
          ...member.toJSON(),
          teachingLoad: teachingCourses,
          coordinatingCourses
        };
      })
    );

    // Get summary statistics
    const summary = {
      totalStaff: await User.countDocuments({ faculty: id, role: { $in: ['lecturer', 'hod', 'dean'] }, isActive: true }),
      byRole: {
        dean: await User.countDocuments({ faculty: id, role: 'dean', isActive: true }),
        hod: await User.countDocuments({ faculty: id, role: 'hod', isActive: true }),
        lecturer: await User.countDocuments({ faculty: id, role: 'lecturer', isActive: true })
      },
      byRank: {}
    };

    // Staff by rank
    const ranks = [
      'professor', 'associate_professor', 'senior_lecturer', 
      'lecturer', 'assistant_lecturer', 'tutorial_fellow'
    ];
    for (const r of ranks) {
      summary.byRank[r] = await User.countDocuments({
        faculty: id,
        role: 'lecturer',
        lecturerRank: r,
        isActive: true
      });
    }

    res.json({
      success: true,
      count: staff.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      summary,
      staff: staffWithLoad
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty courses
// @route   GET /api/faculty/:id/courses
// @access  Private
exports.getFacultyCourses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      level, 
      semester, 
      department,
      isActive = true,
      page = 1, 
      limit = 20 
    } = req.query;

    // Check access
    if (req.user.role === 'dean' && req.user.facultyManaged?.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own faculty courses.' 
      });
    }

    let query = { 
      faculty: id,
      isActive: isActive === 'true'
    };

    if (level) query.level = level;
    if (semester) query.semester = parseInt(semester);
    if (department) query.department = department;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
      .populate('department', 'name code')
      .populate('coordinator', 'name email')
      .populate('lecturers', 'name email')
      .sort('level semester courseCode')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    // Get enrollment stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const Enrollment = require('../models/Enrollment');
        const enrolledCount = await Enrollment.countDocuments({
          course: course._id,
          enrollmentStatus: 'enrolled'
        });

        return {
          ...course.toJSON(),
          enrolledStudents: enrolledCount,
          availableSeats: course.maxStudents - enrolledCount
        };
      })
    );

    // Group by department for summary
    const summary = {
      totalCourses: total,
      byLevel: {},
      byDepartment: {}
    };

    // Courses by level
    const levels = ['100', '200', '300', '400', '500', '600', '700'];
    for (const l of levels) {
      summary.byLevel[l] = await Course.countDocuments({ ...query, level: l });
    }

    // Courses by department
    const departments = await Department.find({ faculty: id, isActive: true }).select('name code');
    for (const dept of departments) {
      summary.byDepartment[dept.name] = await Course.countDocuments({ 
        ...query, 
        department: dept._id 
      });
    }

    res.json({
      success: true,
      count: courses.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      summary,
      courses: coursesWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get faculty performance report
// @route   GET /api/faculty/:id/performance
// @access  Private (Admin, Dean)
exports.getFacultyPerformance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { academicYear } = req.query;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Check access
    if (req.user.role === 'dean' && req.user.facultyManaged?.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own faculty performance.' 
      });
    }

    const currentYear = academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

    // Get all departments in this faculty
    const departments = await Department.find({ faculty: id, isActive: true }).select('_id name');
    const departmentIds = departments.map(d => d._id);

    // Get all courses in this faculty
    const courses = await Course.find({ faculty: id, isActive: true }).select('_id');
    const courseIds = courses.map(c => c._id);

    const Enrollment = require('../models/Enrollment');
    const Result = require('../models/result');

    // Performance metrics
    const performance = {
      faculty: {
        id: faculty._id,
        name: faculty.name,
        code: faculty.code
      },
      academicYear: currentYear,
      overall: {
        totalStudents: await User.countDocuments({
          faculty: id,
          role: 'student',
          isActive: true
        }),
        totalEnrollments: await Enrollment.countDocuments({
          course: { $in: courseIds },
          academicYear: currentYear
        }),
        averageGPA: 0,
        passRate: 0,
        graduationRate: 0
      },
      byDepartment: [],
      bySemester: {
        semester1: {},
        semester2: {}
      },
      trends: {
        enrollmentTrend: [],
        performanceTrend: []
      }
    };

    // Calculate performance by department
    for (const dept of departments) {
      const deptCourses = await Course.find({ 
        department: dept._id, 
        isActive: true 
      }).select('_id');
      
      const deptCourseIds = deptCourses.map(c => c._id);

      const enrollments = await Enrollment.find({
        course: { $in: deptCourseIds },
        academicYear: currentYear
      });

      const results = await Result.find({
        course: { $in: deptCourseIds },
        academicYear: currentYear,
        isPublished: true
      });

      const totalGradePoints = results.reduce((sum, r) => sum + (r.gradePoint || 0), 0);
      const avgGPA = results.length > 0 ? totalGradePoints / results.length : 0;
      
      const passed = results.filter(r => r.status === 'pass').length;
      const passRate = results.length > 0 ? (passed / results.length) * 100 : 0;

      performance.byDepartment.push({
        departmentId: dept._id,
        departmentName: dept.name,
        totalStudents: await User.countDocuments({
          department: dept._id,
          role: 'student',
          isActive: true
        }),
        totalEnrollments: enrollments.length,
        averageGPA: avgGPA.toFixed(2),
        passRate: passRate.toFixed(2),
        totalResults: results.length
      });
    }

    // Calculate semester-wise performance
    for (const semester of [1, 2]) {
      const semesterResults = await Result.find({
        course: { $in: courseIds },
        academicYear: currentYear,
        semester,
        isPublished: true
      });

      const totalGradePoints = semesterResults.reduce((sum, r) => sum + (r.gradePoint || 0), 0);
      const avgGPA = semesterResults.length > 0 ? totalGradePoints / semesterResults.length : 0;
      
      const passed = semesterResults.filter(r => r.status === 'pass').length;
      const passRate = semesterResults.length > 0 ? (passed / semesterResults.length) * 100 : 0;

      performance.bySemester[`semester${semester}`] = {
        totalResults: semesterResults.length,
        averageGPA: avgGPA.toFixed(2),
        passRate: passRate.toFixed(2),
        gradeDistribution: {}
      };

      // Grade distribution for semester
      const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F'];
      for (const grade of grades) {
        performance.bySemester[`semester${semester}`].gradeDistribution[grade] = 
          semesterResults.filter(r => r.grade === grade).length;
      }
    }

    // Calculate overall average GPA
    const allResults = await Result.find({
      course: { $in: courseIds },
      academicYear: currentYear,
      isPublished: true
    });

    if (allResults.length > 0) {
      const totalGP = allResults.reduce((sum, r) => sum + (r.gradePoint || 0), 0);
      performance.overall.averageGPA = (totalGP / allResults.length).toFixed(2);
      
      const totalPassed = allResults.filter(r => r.status === 'pass').length;
      performance.overall.passRate = ((totalPassed / allResults.length) * 100).toFixed(2);
    }

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle faculty status (activate/deactivate)
// @route   PUT /api/faculty/:id/toggle-status
// @access  Private (Admin only)
exports.toggleFacultyStatus = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Only admin can toggle faculty status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin can toggle faculty status.' 
      });
    }

    faculty.isActive = !faculty.isActive;
    faculty.updatedBy = req.user.id;
    await faculty.save();

    // If deactivating, also notify all departments
    if (!faculty.isActive) {
      const departments = await Department.find({ faculty: faculty._id });
      
      const Notification = require('../models/notification');
      for (const dept of departments) {
        if (dept.headOfDepartment) {
          await Notification.create({
            user: dept.headOfDepartment,
            title: 'Faculty Deactivated',
            message: `Faculty ${faculty.name} has been deactivated. This affects your department.`,
            type: 'system',
            priority: 'high',
            sender: req.user.id,
            metadata: {
              facultyId: faculty._id,
              facultyName: faculty.name
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Faculty ${faculty.isActive ? 'activated' : 'deactivated'} successfully`,
      faculty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import departments to faculty
// @route   POST /api/faculty/:id/import-departments
// @access  Private (Admin, Dean)
exports.importDepartments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departments } = req.body;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Faculty not found' 
      });
    }

    // Check permissions
    const canImport = 
      req.user.role === 'admin' ||
      (req.user.role === 'dean' && req.user.facultyManaged?.toString() === id);

    if (!canImport) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You cannot import departments to this faculty.' 
      });
    }

    if (!Array.isArray(departments) || departments.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an array of departments' 
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const deptData of departments) {
      try {
        // Check if department code already exists
        const existingDept = await Department.findOne({ code: deptData.code });
        if (existingDept) {
          results.failed.push({
            data: deptData,
            reason: `Department with code ${deptData.code} already exists`
          });
          continue;
        }

        // Create department
        const department = await Department.create({
          ...deptData,
          faculty: id,
          createdBy: req.user.id
        });

        results.successful.push(department);
      } catch (error) {
        results.failed.push({
          data: deptData,
          reason: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${results.successful.length} departments`,
      results
    });
  } catch (error) {
    next(error);
  }
};

