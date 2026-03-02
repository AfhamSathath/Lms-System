const Department = require('../models/Department');
const User = require('../models/user');
const Course = require('../models/course');


// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res, next) => {
  try {
    const { faculty, isActive, search, page = 1, limit = 20 } = req.query;

    let query = {};
    const userRole = req.user.role;

    // Role-based access control
    if (userRole === 'hod') {
      query._id = req.user.department;
    } else if (userRole === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    // Apply filters
    if (faculty) query.faculty = faculty;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const departments = await Department.find(query)
      .populate('faculty', 'name code')
      .populate('headOfDepartment', 'name email employeeId')
      .sort('name')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Department.countDocuments(query);

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

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('faculty', 'name code dean')
      .populate('headOfDepartment', 'name email employeeId lecturerRank');

    if (!department) {
      return res.status(404).json({ 
        success: false, 
        message: 'Department not found' 
      });
    }

    // Check access
    if (req.user.role === 'hod' && req.user.department?.toString() !== department._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own department.' 
      });
    }

    if (req.user.role === 'dean' && department.faculty?._id?.toString() !== req.user.facultyManaged?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view departments in your faculty.' 
      });
    }

    // Get detailed statistics
    const stats = {
      students: await User.countDocuments({
        department: department._id,
        role: 'student',
        isActive: true
      }),
      studentsByYear: {},
      lecturers: await User.countDocuments({
        department: department._id,
        role: 'lecturer',
        isActive: true
      }),
      courses: await Course.countDocuments({
        department: department._id,
        isActive: true
      }),
      coursesByLevel: {},
      activeCourses: await Course.countDocuments({
        department: department._id,
        isActive: true,
        enrollmentStatus: 'open'
      })
    };

    // Students by year
    for (let year = 1; year <= 4; year++) {
      stats.studentsByYear[`year${year}`] = await User.countDocuments({
        department: department._id,
        role: 'student',
        yearOfStudy: year,
        isActive: true
      });
    }

    // Courses by level
    const levels = ['100', '200', '300', '400'];
    for (const level of levels) {
      stats.coursesByLevel[level] = await Course.countDocuments({
        department: department._id,
        level,
        isActive: true
      });
    }

    // Get recent courses
    const recentCourses = await Course.find({
      department: department._id,
      isActive: true
    })
    .select('courseCode courseName level semester credits')
    .sort('-createdAt')
    .limit(5);

    // Get recent staff
    const recentStaff = await User.find({
      department: department._id,
      role: { $in: ['lecturer', 'hod'] },
      isActive: true
    })
    .select('name email employeeId lecturerRank')
    .sort('-createdAt')
    .limit(5);

    res.json({
      success: true,
      department,
      stats,
      recentCourses,
      recentStaff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin, Dean)
exports.createDepartment = async (req, res, next) => {
  try {
    const { code, faculty } = req.body;

    // Check permissions
    if (req.user.role === 'dean') {
      // Dean can only create departments in their faculty
      if (faculty !== req.user.facultyManaged?.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only create departments in your faculty.' 
        });
      }
    }

    // Check if department code already exists
    const existingDept = await Department.findOne({ code });
    if (existingDept) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department with this code already exists' 
      });
    }

    const department = await Department.create({
      ...req.body,
      createdBy: req.user.id
    });

    // Add department to faculty's departments list (if using virtual)
    if (faculty) {
      await Faculty.findByIdAndUpdate(faculty, {
        $addToSet: { departments: department._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin, Dean, HOD)
exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ 
        success: false, 
        message: 'Department not found' 
      });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      (req.user.role === 'dean' && department.faculty?.toString() === req.user.facultyManaged?.toString()) ||
      (req.user.role === 'hod' && department._id.toString() === req.user.department?.toString());

    if (!canUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You cannot update this department.' 
      });
    }

    // If HOD is being updated, handle previous HOD
    if (req.body.headOfDepartment && req.body.headOfDepartment !== department.headOfDepartment?.toString()) {
      // Remove HOD status from previous HOD
      if (department.headOfDepartment) {
        await User.findByIdAndUpdate(department.headOfDepartment, {
          isHOD: false,
          hodSince: null,
          hodEndDate: new Date(),
          role: 'lecturer'
        });
      }

      // Set new HOD
      await User.findByIdAndUpdate(req.body.headOfDepartment, {
        isHOD: true,
        hodSince: new Date(),
        department: department._id,
        role: 'hod'
      });
    }

    req.body.updatedBy = req.user.id;
    req.body.updatedAt = new Date();

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('faculty', 'name code')
     .populate('headOfDepartment', 'name email');

    res.json({
      success: true,
      message: 'Department updated successfully',
      department: updatedDepartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ 
        success: false, 
        message: 'Department not found' 
      });
    }

    // Only admin can delete departments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin can delete departments.' 
      });
    }

    // Check if department has active courses
    const activeCourses = await Course.countDocuments({
      department: department._id,
      isActive: true
    });

    if (activeCourses > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete department with active courses. Deactivate the department instead.' 
      });
    }

    // Check if department has active staff/students
    const activeUsers = await User.countDocuments({
      department: department._id,
      isActive: true
    });

    if (activeUsers > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete department with active users. Deactivate the department instead.' 
      });
    }

    // Remove department from faculty's departments list
    if (department.faculty) {
      await Faculty.findByIdAndUpdate(department.faculty, {
        $pull: { departments: department._id }
      });
    }

    await department.deleteOne();

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department statistics
// @route   GET /api/departments/:id/stats
// @access  Private (Admin, Dean, HOD)
exports.getDepartmentStats = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ 
        success: false, 
        message: 'Department not found' 
      });
    }

    // Check access
    if (req.user.role === 'hod' && req.user.department?.toString() !== department._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own department statistics.' 
      });
    }

    if (req.user.role === 'dean') {
      if (department.faculty?.toString() !== req.user.facultyManaged?.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only view departments in your faculty.' 
        });
      }
    }

    // Comprehensive statistics
    const stats = {
      students: {
        total: await User.countDocuments({
          department: department._id,
          role: 'student',
          isActive: true
        }),
        byYear: {},
        byGender: {},
        newThisYear: await User.countDocuments({
          department: department._id,
          role: 'student',
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        })
      },
      staff: {
        total: await User.countDocuments({
          department: department._id,
          role: { $in: ['lecturer', 'hod'] },
          isActive: true
        }),
        byRank: {},
        byGender: {},
        newThisYear: await User.countDocuments({
          department: department._id,
          role: { $in: ['lecturer', 'hod'] },
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        })
      },
      courses: {
        total: await Course.countDocuments({
          department: department._id,
          isActive: true
        }),
        byLevel: {},
        bySemester: {},
        byStatus: {},
        averageClassSize: 0
      },
      performance: {
        averageGPA: 0,
        passRate: 0,
        graduationRate: 0
      }
    };

    // Students by year
    for (let year = 1; year <= 4; year++) {
      stats.students.byYear[`year${year}`] = await User.countDocuments({
        department: department._id,
        role: 'student',
        yearOfStudy: year,
        isActive: true
      });
    }

    // Students by gender
    const genders = ['male', 'female', 'other'];
    for (const gender of genders) {
      stats.students.byGender[gender] = await User.countDocuments({
        department: department._id,
        role: 'student',
        gender,
        isActive: true
      });
    }

    // Staff by rank
    const ranks = ['professor', 'associate_professor', 'senior_lecturer', 'lecturer', 'assistant_lecturer'];
    for (const rank of ranks) {
      stats.staff.byRank[rank] = await User.countDocuments({
        department: department._id,
        role: 'lecturer',
        lecturerRank: rank,
        isActive: true
      });
    }

    // Staff by gender
    for (const gender of genders) {
      stats.staff.byGender[gender] = await User.countDocuments({
        department: department._id,
        role: { $in: ['lecturer', 'hod'] },
        gender,
        isActive: true
      });
    }

    // Courses by level
    const levels = ['100', '200', '300', '400'];
    for (const level of levels) {
      stats.courses.byLevel[level] = await Course.countDocuments({
        department: department._id,
        level,
        isActive: true
      });
    }

    // Courses by semester
    stats.courses.bySemester.semester1 = await Course.countDocuments({
      department: department._id,
      semester: 1,
      isActive: true
    });
    stats.courses.bySemester.semester2 = await Course.countDocuments({
      department: department._id,
      semester: 2,
      isActive: true
    });

    // Courses by status
    stats.courses.byStatus.open = await Course.countDocuments({
      department: department._id,
      enrollmentStatus: 'open',
      isActive: true
    });
    stats.courses.byStatus.closed = await Course.countDocuments({
      department: department._id,
      enrollmentStatus: 'closed',
      isActive: true
    });
    stats.courses.byStatus.waitlist = await Course.countDocuments({
      department: department._id,
      enrollmentStatus: 'waitlist',
      isActive: true
    });

    // Calculate average class size
    const courses = await Course.find({ 
      department: department._id, 
      isActive: true 
    }).select('_id');
    
    const courseIds = courses.map(c => c._id);
    
    if (courseIds.length > 0) {
      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.countDocuments({
        course: { $in: courseIds },
        enrollmentStatus: { $in: ['enrolled', 'completed'] }
      });
      stats.courses.averageClassSize = Math.round(enrollments / courseIds.length);
    }

    res.json({
      success: true,
      department: {
        id: department._id,
        name: department.name,
        code: department.code
      },
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign HOD
// @route   PUT /api/departments/:id/assign-hod
// @access  Private (Admin, Dean)
exports.assignHOD = async (req, res, next) => {
  try {
    const { lecturerId } = req.body;

    if (!lecturerId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lecturer ID'
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ 
        success: false, 
        message: 'Department not found' 
      });
    }

    // Check permissions
    if (req.user.role === 'dean' && department.faculty?.toString() !== req.user.facultyManaged?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only assign HOD to departments in your faculty.' 
      });
    }

    const lecturer = await User.findOne({
      _id: lecturerId,
      role: 'lecturer',
      isActive: true
    });

    if (!lecturer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lecturer not found or inactive' 
      });
    }

    // Check if lecturer belongs to this department
    if (lecturer.department?.toString() !== department._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lecturer must belong to this department to be HOD' 
      });
    }

    // Remove previous HOD if exists
    if (department.headOfDepartment) {
      await User.findByIdAndUpdate(department.headOfDepartment, {
        isHOD: false,
        hodSince: null,
        hodEndDate: new Date(),
        role: 'lecturer'
      });
    }

    // Set new HOD
    department.headOfDepartment = lecturerId;
    department.hodStartDate = new Date();
    await department.save();

    await User.findByIdAndUpdate(lecturerId, {
      isHOD: true,
      hodSince: new Date(),
      department: department._id,
      role: 'hod'
    });

    const updatedDepartment = await Department.findById(department._id)
      .populate('headOfDepartment', 'name email employeeId lecturerRank');

    res.json({
      success: true,
      message: 'HOD assigned successfully',
      department: updatedDepartment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department courses
// @route   GET /api/departments/:id/courses
// @access  Private
exports.getDepartmentCourses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { level, semester, isActive = true } = req.query;

    // Check access
    if (req.user.role === 'hod' && req.user.department?.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own department courses.' 
      });
    }

    let query = { department: id, isActive: isActive === 'true' };

    if (level) query.level = level;
    if (semester) query.semester = parseInt(semester);

    const courses = await Course.find(query)
      .populate('coordinator', 'name email')
      .populate('lecturers', 'name email')
      .sort('level semester courseCode');

    // Group by level
    const groupedByLevel = courses.reduce((acc, course) => {
      const level = course.level || 'other';
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(course);
      return acc;
    }, {});

    res.json({
      success: true,
      count: courses.length,
      groupedByLevel,
      courses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department staff
// @route   GET /api/departments/:id/staff
// @access  Private
exports.getDepartmentStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, rank, isActive = true } = req.query;

    // Check access
    if (req.user.role === 'hod' && req.user.department?.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own department staff.' 
      });
    }

    let query = { 
      department: id,
      isActive: isActive === 'true'
    };

    if (role) {
      query.role = role;
    } else {
      query.role = { $in: ['lecturer', 'hod'] };
    }

    if (rank) query.lecturerRank = rank;

    const staff = await User.find(query)
      .select('name email employeeId lecturerRank specialization officeLocation consultationHours')
      .sort('name');

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

    // Group by rank
    const groupedByRank = staffWithLoad.reduce((acc, member) => {
      const rank = member.lecturerRank || 'other';
      if (!acc[rank]) {
        acc[rank] = [];
      }
      acc[rank].push(member);
      return acc;
    }, {});

    res.json({
      success: true,
      count: staff.length,
      groupedByRank,
      staff: staffWithLoad
    });
  } catch (error) {
    next(error);
  }
};