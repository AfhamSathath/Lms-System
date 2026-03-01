const User = require('../models/user');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/subject');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const fs = require('fs');
const path = require('path');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, HOD, Dean, Registrar)
exports.getUsers = async (req, res, next) => {
  try {
    const { 
      role, 
      department, 
      faculty, 
      yearOfStudy, 
      semester,
      academicStatus,
      lecturerRank,
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = '-createdAt'
    } = req.query;

    let query = {};
    const userRole = req.user.role;

    // Role-based access control
    if (userRole === 'hod') {
      query.department = req.user.department;
    } else if (userRole === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    // Apply filters
    if (role) query.role = role;
    if (department) query.department = department;
    if (faculty) query.faculty = faculty;
    if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
    if (semester) query.semester = parseInt(semester);
    if (academicStatus) query.academicStatus = academicStatus;
    if (lecturerRank) query.lecturerRank = lecturerRank;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .populate('coursesTaught', 'courseCode courseName')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin, HOD, Dean, or self)
exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Check if user is requesting their own profile
    if (req.user.role === 'student' && req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own profile.' 
      });
    }

    const user = await User.findById(userId)
      .populate('department', 'name code faculty')
      .populate('faculty', 'name code')
      .populate('coursesTaught', 'courseCode courseName credits');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check department access for HOD
    if (req.user.role === 'hod' && 
        user.department && 
        user.department._id.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view users in your department.' 
      });
    }

    // Check faculty access for Dean
    if (req.user.role === 'dean' && 
        user.faculty && 
        user.faculty._id.toString() !== req.user.facultyManaged?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view users in your faculty.' 
      });
    }

    // Get additional data based on role
    let additionalData = {};
    
    if (user.role === 'student') {
      const enrollments = await Enrollment.find({ student: user._id })
        .populate('course', 'courseCode courseName credits level semester')
        .sort('-academicYear -semester');
      
      // Calculate GPA
      let totalCredits = 0;
      let totalGradePoints = 0;
      
      enrollments.forEach(e => {
        if (e.gradePoints && e.course?.credits) {
          totalCredits += e.course.credits;
          totalGradePoints += e.gradePoints * e.course.credits;
        }
      });

      additionalData = {
        enrollments,
        gpa: totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0,
        totalCredits,
        totalCourses: enrollments.length
      };
    }

    if (user.role === 'lecturer') {
      const coursesTeaching = await Course.find({ 
        lecturers: user._id,
        isActive: true 
      }).select('courseCode courseName level semester credits');
      
      const totalStudents = await Enrollment.countDocuments({
        course: { $in: user.coursesTaught },
        enrollmentStatus: 'enrolled'
      });

      additionalData = {
        coursesTeaching,
        totalStudents
      };
    }

    res.json({
      success: true,
      user,
      ...additionalData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin, Registrar)
exports.createUser = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'registrar') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin and registrar can create users.' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Generate password if not provided
    if (!req.body.password) {
      req.body.password = Math.random().toString(36).slice(-8);
    }

    req.body.createdBy = req.user.id;

    const user = await User.create(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin, HOD, Dean, or self)
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check permissions
    const canUpdate = 
      req.user.id === user._id.toString() || // Self update
      req.user.role === 'admin' || // Admin
      (req.user.role === 'hod' && user.department?.toString() === req.user.department?.toString()) || // HOD of same department
      (req.user.role === 'dean' && user.faculty?.toString() === req.user.facultyManaged?.toString()); // Dean of same faculty

    if (!canUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You cannot update this user.' 
      });
    }

    // Prevent role change by non-admin
    if (req.body.role && req.body.role !== user.role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin can change user roles.' 
      });
    }

    req.body.updatedBy = req.user.id;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department', 'name code')
     .populate('faculty', 'name code');

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin can delete users.' 
      });
    }

    // Prevent deleting own account
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Check if user has active enrollments
    if (user.role === 'student') {
      const activeEnrollments = await Enrollment.countDocuments({
        student: user._id,
        enrollmentStatus: 'enrolled'
      });
      if (activeEnrollments > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete student with active enrollments' 
        });
      }
    }

    // Delete profile picture if exists
    if (user.profilePicture) {
      const picturePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile (self)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'phone', 'address', 'bio', 
      'qualifications', 'specialization', 'officeLocation',
      'consultationHours', 'emergencyContact', 'gender', 'dateOfBirth'
    ];
    
    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.updatedBy = req.user.id;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('department', 'name code')
     .populate('faculty', 'name code');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload an image' 
      });
    }

    const user = await User.findById(req.user.id);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update user with new profile picture path
    const pictureUrl = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = pictureUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: pictureUrl
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Remove profile picture
// @route   DELETE /api/users/profile/picture
// @access  Private
exports.removeProfilePicture = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.profilePicture) {
      const picturePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
      
      user.profilePicture = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Profile picture removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get students by year and semester
// @route   GET /api/users/students/year/:year/semester/:semester
// @access  Private (Admin, HOD, Lecturer, Dean)
exports.getStudentsByYearAndSemester = async (req, res, next) => {
  try {
    const { year, semester } = req.params;
    const { department } = req.query;

    let query = {
      role: 'student',
      yearOfStudy: parseInt(year),
      semester: parseInt(semester),
      isActive: true
    };

    // Role-based filters
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    } else if (department) {
      // Check if lecturer has access to this department
      if (req.user.role === 'lecturer') {
        const courses = await Course.find({
          lecturers: req.user.id,
          department: department
        });
        if (courses.length === 0) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied. You can only view students in departments you teach.' 
          });
        }
      }
      query.department = department;
    }

    const students = await User.find(query)
      .select('name studentId registrationNumber email phone yearOfStudy semester department')
      .populate('department', 'name code');

    // Get enrollment info for these students
    const studentsWithEnrollments = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.find({
          student: student._id,
          semester: parseInt(semester)
        }).populate('course', 'courseCode courseName credits');

        return {
          ...student.toJSON(),
          currentCourses: enrollments.length,
          enrollments
        };
      })
    );

    res.json({
      success: true,
      count: students.length,
      year: parseInt(year),
      semester: parseInt(semester),
      students: studentsWithEnrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lecturers by department
// @route   GET /api/users/lecturers/department/:department
// @access  Private (Admin, HOD, Dean)
exports.getLecturersByDepartment = async (req, res, next) => {
  try {
    const departmentId = req.params.department;

    // Check permissions
    if (req.user.role === 'hod' && 
        req.user.department?.toString() !== departmentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view lecturers in your department.' 
      });
    }

    if (req.user.role === 'dean') {
      const department = await Department.findById(departmentId).populate('faculty');
      if (department.faculty._id.toString() !== req.user.facultyManaged?.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only view lecturers in your faculty.' 
        });
      }
    }

    const lecturers = await User.find({
      role: 'lecturer',
      department: departmentId,
      isActive: true
    })
    .select('name employeeId email phone lecturerRank specialization qualifications officeLocation')
    .populate('department', 'name code');

    // Get courses each lecturer teaches
    const lecturersWithCourses = await Promise.all(
      lecturers.map(async (lecturer) => {
        const courses = await Course.find({
          lecturers: lecturer._id,
          isActive: true
        }).select('courseCode courseName level semester');

        return {
          ...lecturer.toJSON(),
          coursesTeaching: courses,
          totalCourses: courses.length
        };
      })
    );

    res.json({
      success: true,
      count: lecturers.length,
      department: await Department.findById(departmentId).select('name code'),
      lecturers: lecturersWithCourses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin, HOD, Dean)
exports.getUserStats = async (req, res, next) => {
  try {
    let query = {};
    
    // Role-based filters
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    const stats = {
      total: await User.countDocuments(query),
      byRole: {},
      byDepartment: {},
      byYear: {},
      byGender: {},
      active: await User.countDocuments({ ...query, isActive: true }),
      inactive: await User.countDocuments({ ...query, isActive: false }),
      newThisMonth: await User.countDocuments({
        ...query,
        createdAt: { $gte: new Date(new Date().setDate(1)) }
      })
    };

    // Stats by role
    const roles = ['student', 'lecturer', 'admin', 'hod', 'dean', 'registrar'];
    for (const role of roles) {
      stats.byRole[role] = await User.countDocuments({ ...query, role });
    }

    // Stats for students by year
    if (stats.byRole.student > 0) {
      for (let year = 1; year <= 4; year++) {
        stats.byYear[`year${year}`] = await User.countDocuments({
          ...query,
          role: 'student',
          yearOfStudy: year,
          isActive: true
        });
      }
    }

    // Stats by gender
    const genders = ['male', 'female', 'other'];
    for (const gender of genders) {
      stats.byGender[gender] = await User.countDocuments({ ...query, gender });
    }

    // Department stats for admin/dean
    if (req.user.role !== 'hod') {
      let departmentQuery = {};
      if (req.user.role === 'dean') {
        departmentQuery.faculty = req.user.facultyManaged;
      }
      
      const departments = await Department.find(departmentQuery);
      
      for (const dept of departments) {
        stats.byDepartment[dept.name] = {
          students: await User.countDocuments({ 
            department: dept._id, 
            role: 'student' 
          }),
          lecturers: await User.countDocuments({ 
            department: dept._id, 
            role: 'lecturer' 
          })
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

// @desc    Get student transcript
// @route   GET /api/users/student/:id/transcript
// @access  Private (Student, Admin, HOD)
exports.getStudentTranscript = async (req, res, next) => {
  try {
    const studentId = req.params.id;

    // Check permissions
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own transcript.' 
      });
    }

    const student = await User.findById(studentId)
      .populate('department', 'name code')
      .populate('faculty', 'name code');

    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Check department access for HOD
    if (req.user.role === 'hod' && 
        student.department?._id.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view students in your department.' 
      });
    }

    const enrollments = await Enrollment.find({ 
      student: studentId,
      visibleOnTranscript: true 
    })
    .populate('course', 'courseCode courseName credits level')
    .sort('academicYear semester');

    // Group by academic year
    const transcript = {
      studentInfo: {
        name: student.name,
        studentId: student.studentId,
        registrationNumber: student.registrationNumber,
        department: student.department,
        faculty: student.faculty,
        enrollmentDate: student.enrollmentDate,
        expectedGraduation: student.expectedGraduation
      },
      academicRecord: {},
      summary: {
        totalCredits: 0,
        totalCourses: enrollments.length,
        gpa: 0,
        cgpa: 0
      }
    };

    let totalPoints = 0;
    let totalCredits = 0;

    // Group enrollments by year
    enrollments.forEach(enrollment => {
      const year = enrollment.academicYear;
      if (!transcript.academicRecord[year]) {
        transcript.academicRecord[year] = [];
      }
      transcript.academicRecord[year].push(enrollment);
      
      if (enrollment.enrollmentStatus === 'completed') {
        transcript.summary.totalCredits += enrollment.course.credits;
        totalPoints += (enrollment.gradePoints * enrollment.course.credits);
        totalCredits += enrollment.course.credits;
      }
    });

    // Calculate CGPA
    if (totalCredits > 0) {
      transcript.summary.cgpa = (totalPoints / totalCredits).toFixed(2);
    }

    res.json({
      success: true,
      transcript
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lecturer workload
// @route   GET /api/users/lecturer/:id/workload
// @access  Private (Lecturer, HOD, Dean, Admin)
exports.getLecturerWorkload = async (req, res, next) => {
  try {
    const lecturerId = req.params.id;

    // Check permissions
    if (req.user.role === 'lecturer' && req.user.id !== lecturerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own workload.' 
      });
    }

    const lecturer = await User.findById(lecturerId)
      .populate('department', 'name code');

    if (!lecturer || lecturer.role !== 'lecturer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Lecturer not found' 
      });
    }

    const courses = await Course.find({
      $or: [
        { coordinator: lecturerId },
        { lecturers: lecturerId }
      ],
      isActive: true
    })
    .populate('department', 'name code')
    .populate('coordinator', 'name email');

    const workload = {
      lecturerInfo: {
        name: lecturer.name,
        employeeId: lecturer.employeeId,
        rank: lecturer.lecturerRank,
        department: lecturer.department,
        specialization: lecturer.specialization,
        officeLocation: lecturer.officeLocation,
        consultationHours: lecturer.consultationHours
      },
      courses: [],
      summary: {
        totalCourses: courses.length,
        totalStudents: 0,
        totalCredits: 0,
        averageClassSize: 0
      }
    };

    let totalStudents = 0;
    for (const course of courses) {
      const enrollments = await Enrollment.countDocuments({
        course: course._id,
        enrollmentStatus: 'enrolled'
      });
      
      totalStudents += enrollments;
      
      workload.courses.push({
        ...course.toJSON(),
        enrolledStudents: enrollments
      });
      
      workload.summary.totalCredits += course.credits;
    }

    workload.summary.totalStudents = totalStudents;
    workload.summary.averageClassSize = courses.length > 0 ? 
      Math.round(totalStudents / courses.length) : 0;

    res.json({
      success: true,
      workload
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk import users
// @route   POST /api/users/bulk-import
// @access  Private (Admin, Registrar)
exports.bulkImportUsers = async (req, res, next) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an array of users' 
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const userData of users) {
      try {
        // Check for existing user
        const existingUser = await User.findOne({
          $or: [
            { email: userData.email },
            { studentId: userData.studentId },
            { employeeId: userData.employeeId }
          ]
        });

        if (existingUser) {
          results.failed.push({
            data: userData,
            reason: 'User already exists'
          });
          continue;
        }

        // Validate department if provided
        if (userData.department) {
          const department = await Department.findById(userData.department);
          if (!department) {
            results.failed.push({
              data: userData,
              reason: 'Department not found'
            });
            continue;
          }
        }

        // Generate password if not provided
        if (!userData.password) {
          userData.password = Math.random().toString(36).slice(-8);
        }

        userData.createdBy = req.user.id;

        const user = await User.create(userData);
        results.successful.push(user);
      } catch (error) {
        results.failed.push({
          data: userData,
          reason: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${results.successful.length} users`,
      results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (activate/deactivate)
// @route   PUT /api/users/:id/toggle-status
// @access  Private (Admin, HOD, Dean)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check permissions
    const canToggle = 
      req.user.role === 'admin' ||
      (req.user.role === 'hod' && user.department?.toString() === req.user.department?.toString()) ||
      (req.user.role === 'dean' && user.faculty?.toString() === req.user.facultyManaged?.toString());

    if (!canToggle) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You cannot toggle this user\'s status.' 
      });
    }

    // Prevent deactivating own account
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot deactivate your own account' 
      });
    }

    user.isActive = !user.isActive;
    user.updatedBy = req.user.id;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    next(error);
  }
};