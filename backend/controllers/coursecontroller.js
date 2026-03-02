const Course = require('../models/course');
const User = require('../models/user');
const Department = require('../models/Department');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/notification');
const mongoose = require('mongoose');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res, next) => {
  try {
    const { 
      department, 
      faculty, 
      level, 
      semester,
      academicYear,
      lecturer,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = '-createdAt'
    } = req.query;

    let query = {};
    const userRole = req.user.role;
    const userId = req.user._id;

    // Role-based access control
    if (userRole === 'hod') {
      query.department = req.user.department;
    } else if (userRole === 'dean') {
      query.faculty = req.user.facultyManaged;
    } else if (userRole === 'lecturer') {
      query.lecturers = userId;
    } else if (userRole === 'student') {
      // Students see active courses
      query.isActive = true;
    }

    // Apply filters
    if (department) query.department = department;
    if (faculty) query.faculty = faculty;
    if (level) query.level = level;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;
    if (lecturer) query.lecturers = lecturer;
    if (status) query.enrollmentStatus = status;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';

    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find(query)
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .populate('coordinator', 'name email employeeId')
      .populate('lecturers', 'name email employeeId')
      .populate('prerequisites', 'courseCode courseName')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    // Get enrollment counts for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount = await Enrollment.countDocuments({
          course: course._id,
          enrollmentStatus: 'enrolled'
        });
        
        const completedCount = await Enrollment.countDocuments({
          course: course._id,
          enrollmentStatus: 'completed'
        });

        return {
          ...course.toJSON(),
          enrolledStudents: enrolledCount,
          completedStudents: completedCount,
          availableSeats: course.maxStudents ? course.maxStudents - enrolledCount : null
        };
      })
    );

    res.json({
      success: true,
      count: courses.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      courses: coursesWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name code faculty')
      .populate('faculty', 'name code')
      .populate('coordinator', 'name email employeeId')
      .populate('lecturers', 'name email employeeId')
      .populate('teachingAssistants', 'name email')
      .populate('prerequisites', 'courseCode courseName credits level');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check access permissions
    const userRole = req.user.role;
    if (userRole === 'hod' && course.department?._id.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view courses in your department.' 
      });
    }

    if (userRole === 'dean' && course.faculty?._id.toString() !== req.user.facultyManaged?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view courses in your faculty.' 
      });
    }

    if (userRole === 'student') {
      // Check if student is enrolled
      const isEnrolled = await Enrollment.exists({
        student: req.user.id,
        course: course._id,
        enrollmentStatus: 'enrolled'
      });
      
      if (!isEnrolled && !course.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You are not enrolled in this course.' 
        });
      }
    }

    // Get enrollment statistics
    const enrollments = await Enrollment.find({ course: course._id })
      .populate('student', 'name studentId email')
      .sort('-createdAt');

    const stats = {
      totalEnrollments: enrollments.length,
      enrolled: enrollments.filter(e => e.enrollmentStatus === 'enrolled').length,
      completed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
      dropped: enrollments.filter(e => e.enrollmentStatus === 'dropped').length,
      failed: enrollments.filter(e => e.enrollmentStatus === 'failed').length
    };

    res.json({
      success: true,
      course,
      stats,
      recentEnrollments: enrollments.slice(0, 10)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Admin, HOD, Dean)
exports.createCourse = async (req, res, next) => {
  try {
    const { courseCode, department, faculty, ...courseData } = req.body;

    // Check permissions
    if (req.user.role === 'hod') {
      // HOD can only create courses in their department
      if (department !== req.user.department?.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only create courses in your department.' 
        });
      }
    } else if (req.user.role === 'dean') {
      // Dean can only create courses in their faculty
      const dept = await Department.findById(department);
      if (!dept || dept.faculty?.toString() !== req.user.facultyManaged?.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only create courses in your faculty.' 
        });
      }
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course with this code already exists' 
      });
    }

    // Validate department and faculty
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(400).json({ 
        success: false, 
        message: 'Department not found' 
      });
    }

    // Set academic year if not provided
    if (!courseData.academicYear) {
      const currentYear = new Date().getFullYear();
      courseData.academicYear = `${currentYear}/${currentYear + 1}`;
    }

    // Set createdBy
    courseData.createdBy = req.user.id;

    const course = await Course.create({
      courseCode,
      department,
      faculty: dept.faculty,
      ...courseData
    });

    // If coordinator is assigned, add them to lecturers array
    if (courseData.coordinator) {
      await Course.findByIdAndUpdate(course._id, {
        $addToSet: { lecturers: courseData.coordinator }
      });
      
      // Add course to coordinator's coursesTaught
      await User.findByIdAndUpdate(courseData.coordinator, {
        $addToSet: { coursesTaught: course._id }
      });
    }

    // Add course to department's courses list
    await Department.findByIdAndUpdate(department, {
      $addToSet: { courses: course._id }
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .populate('coordinator', 'name email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: populatedCourse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin, HOD, Dean)
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check permissions
    const userRole = req.user.role;
    if (userRole === 'hod' && course.department?.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update courses in your department.' 
      });
    }

    if (userRole === 'dean') {
      const dept = await Department.findById(course.department);
      if (!dept || dept.faculty?.toString() !== req.user.facultyManaged?.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only update courses in your faculty.' 
        });
      }
    }

    // Set updatedBy
    req.body.updatedBy = req.user.id;

    // If coordinator is changing, update both old and new coordinator's coursesTaught
    if (req.body.coordinator && req.body.coordinator !== course.coordinator?.toString()) {
      // Remove course from old coordinator's coursesTaught
      if (course.coordinator) {
        await User.findByIdAndUpdate(course.coordinator, {
          $pull: { coursesTaught: course._id }
        });
      }
      
      // Add course to new coordinator's coursesTaught
      await User.findByIdAndUpdate(req.body.coordinator, {
        $addToSet: { coursesTaught: course._id }
      });

      // Ensure new coordinator is in lecturers array
      await Course.findByIdAndUpdate(course._id, {
        $addToSet: { lecturers: req.body.coordinator }
      });
    }

    // If lecturers array is updated, update their coursesTaught
    if (req.body.lecturers) {
      // Ensure req.body.lecturers is an array of strings
      const newLecturersArray = req.body.lecturers.map(l => l.toString());
      const oldLecturersArray = (course.lecturers || []).map(l => l.toString());
      
      // Remove course from lecturers no longer teaching
      const removedLecturers = oldLecturersArray.filter(
        l => !newLecturersArray.includes(l)
      );
      
      for (const lecturerId of removedLecturers) {
        await User.findByIdAndUpdate(lecturerId, {
          $pull: { coursesTaught: course._id }
        });
      }

      // Add course to new lecturers
      const addedLecturers = newLecturersArray.filter(
        l => !oldLecturersArray.includes(l)
      );

      for (const lecturerId of addedLecturers) {
        await User.findByIdAndUpdate(lecturerId, {
          $addToSet: { coursesTaught: course._id }
        });
      }
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('department', 'name code')
    .populate('faculty', 'name code')
    .populate('coordinator', 'name email')
    .populate('lecturers', 'name email');

    res.json({
      success: true,
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Only admin can delete courses
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only admin can delete courses.' 
      });
    }

    // Check if course has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      course: course._id,
      enrollmentStatus: 'enrolled'
    });

    if (activeEnrollments > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete course with active enrollments. Deactivate the course instead.' 
      });
    }

    // Remove course from all lecturers' coursesTaught
    await User.updateMany(
      { coursesTaught: course._id },
      { $pull: { coursesTaught: course._id } }
    );

    // Remove course from department
    await Department.findByIdAndUpdate(course.department, {
      $pull: { courses: course._id }
    });

    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses by department
// @route   GET /api/courses/department/:departmentId
// @access  Private
exports.getCoursesByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { level, semester, academicYear, isActive } = req.query;

    // Check department access
    if (req.user.role === 'hod' && req.user.department?.toString() !== departmentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view courses in your department.' 
      });
    }

    let query = { department: departmentId };

    if (level) query.level = level;
    if (semester) query.semester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query)
      .populate('coordinator', 'name email')
      .populate('lecturers', 'name email')
      .sort('level semester courseCode');

    // Get enrollment stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount = await Enrollment.countDocuments({
          course: course._id,
          enrollmentStatus: 'enrolled'
        });

        return {
          ...course.toJSON(),
          enrolledStudents: enrolledCount,
          availableSeats: course.maxStudents ? course.maxStudents - enrolledCount : null
        };
      })
    );

    const department = await Department.findById(departmentId).select('name code');

    res.json({
      success: true,
      count: courses.length,
      department,
      courses: coursesWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses by lecturer
// @route   GET /api/courses/lecturer/:lecturerId
// @access  Private
exports.getCoursesByLecturer = async (req, res, next) => {
  try {
    const { lecturerId } = req.params;

    // Check access
    if (req.user.role === 'lecturer' && req.user.id !== lecturerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own courses.' 
      });
    }

    const lecturer = await User.findById(lecturerId);
    if (!lecturer) {
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
    .populate('coordinator', 'name email')
    .sort('academicYear semester level');

    // Get stats for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.find({
          course: course._id,
          enrollmentStatus: 'enrolled'
        })
        .populate('student', 'name studentId email')
        .limit(10);

        const totalStudents = await Enrollment.countDocuments({
          course: course._id,
          enrollmentStatus: 'enrolled'
        });

        return {
          ...course.toJSON(),
          totalStudents,
          recentStudents: enrollments.map(e => e.student)
        };
      })
    );

    res.json({
      success: true,
      count: courses.length,
      lecturer: {
        name: lecturer.name,
        employeeId: lecturer.employeeId,
        rank: lecturer.lecturerRank
      },
      courses: coursesWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign lecturer to course
// @route   PUT /api/courses/:id/assign-lecturer
// @access  Private (Admin, HOD, Dean)
exports.assignLecturer = async (req, res, next) => {
  try {
    const { lecturerId, role } = req.body; // role can be 'coordinator', 'lecturer', 'ta'

    if (!lecturerId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lecturerId and role'
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check permissions
    if (req.user.role === 'hod' && course.department?.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only assign lecturers to courses in your department.' 
      });
    }

    if (req.user.role === 'dean') {
      const dept = await Department.findById(course.department);
      if (!dept || dept.faculty?.toString() !== req.user.facultyManaged?.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only assign lecturers to courses in your faculty.' 
        });
      }
    }

    const lecturer = await User.findById(lecturerId);
    if (!lecturer || !['lecturer', 'hod', 'dean'].includes(lecturer.role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid lecturer' 
      });
    }

    let updateQuery = {};

    switch (role) {
      case 'coordinator':
        // If there's an existing coordinator, remove them
        if (course.coordinator) {
          await User.findByIdAndUpdate(course.coordinator, {
            $pull: { coursesTaught: course._id }
          });
        }
        updateQuery = { 
          coordinator: lecturerId,
          $addToSet: { lecturers: lecturerId }
        };
        break;
      
      case 'lecturer':
        updateQuery = { $addToSet: { lecturers: lecturerId } };
        break;
      
      case 'ta':
        updateQuery = { $addToSet: { teachingAssistants: lecturerId } };
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role. Use coordinator, lecturer, or ta' 
        });
    }

    // Add course to lecturer's coursesTaught (for lecturers and coordinators)
    if (role !== 'ta') {
      await User.findByIdAndUpdate(lecturerId, {
        $addToSet: { coursesTaught: course._id }
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      course._id, 
      updateQuery, 
      { new: true }
    )
    .populate('coordinator', 'name email')
    .populate('lecturers', 'name email')
    .populate('teachingAssistants', 'name email');

    res.json({
      success: true,
      message: `${role} assigned successfully`,
      course: updatedCourse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove lecturer from course
// @route   PUT /api/courses/:id/remove-lecturer/:lecturerId
// @access  Private (Admin, HOD, Dean)
exports.removeLecturer = async (req, res, next) => {
  try {
    const { id, lecturerId } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check permissions
    if (req.user.role === 'hod' && course.department?.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only remove lecturers from courses in your department.' 
      });
    }

    // Remove from all arrays
    await Course.findByIdAndUpdate(id, {
      $pull: { 
        lecturers: lecturerId,
        teachingAssistants: lecturerId 
      }
    });

    // If this was the coordinator, unset that field
    if (course.coordinator?.toString() === lecturerId) {
      await Course.findByIdAndUpdate(id, {
        $unset: { coordinator: 1 }
      });
    }

    // Remove course from lecturer's coursesTaught
    await User.findByIdAndUpdate(lecturerId, {
      $pull: { coursesTaught: id }
    });

    res.json({
      success: true,
      message: 'Lecturer removed from course successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course status
// @route   PUT /api/courses/:id/status
// @access  Private (Admin, HOD, Dean)
exports.updateCourseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['open', 'closed', 'waitlist'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Use open, closed, or waitlist' 
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check permissions
    if (req.user.role === 'hod' && course.department?.toString() !== req.user.department?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update courses in your department.' 
      });
    }

    course.enrollmentStatus = status;
    course.updatedBy = req.user.id;
    await course.save();

    // If status changed to closed, notify enrolled students
    if (status === 'closed') {
      const enrollments = await Enrollment.find({
        course: course._id,
        enrollmentStatus: 'enrolled'
      }).populate('student');

      for (const enrollment of enrollments) {
        if (enrollment.student) {
          await Notification.create({
            user: enrollment.student._id,
            title: 'Course Enrollment Closed',
            message: `Enrollment for ${course.courseCode} - ${course.courseName} is now closed.`,
            type: 'course',
            priority: 'high',
            sender: req.user.id,
            metadata: {
              courseId: course._id,
              courseCode: course.courseCode
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Course status updated to ${status}`,
      course
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course enrollments
// @route   GET /api/courses/:id/enrollments
// @access  Private (Admin, HOD, Dean, Lecturer of course)
exports.getCourseEnrollments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check access
    const isLecturer = course.lecturers?.some(l => l.toString() === req.user.id);
    const isCoordinator = course.coordinator?.toString() === req.user.id;
    
    if (!['admin', 'hod', 'dean'].includes(req.user.role) && !isLecturer && !isCoordinator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only lecturers of this course can view enrollments.' 
      });
    }

    let query = { course: id };
    if (status) query.enrollmentStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name studentId email phone')
      .populate('gradedBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments(query);

    // Calculate statistics
    const stats = {
      total: await Enrollment.countDocuments({ course: id }),
      enrolled: await Enrollment.countDocuments({ course: id, enrollmentStatus: 'enrolled' }),
      completed: await Enrollment.countDocuments({ course: id, enrollmentStatus: 'completed' }),
      dropped: await Enrollment.countDocuments({ course: id, enrollmentStatus: 'dropped' }),
      failed: await Enrollment.countDocuments({ course: id, enrollmentStatus: 'failed' })
    };

    res.json({
      success: true,
      count: enrollments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk create courses
// @route   POST /api/courses/bulk
// @access  Private (Admin only)
exports.bulkCreateCourses = async (req, res, next) => {
  try {
    const { courses } = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an array of courses' 
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const courseData of courses) {
      try {
        // Check required fields
        if (!courseData.courseCode || !courseData.courseName || !courseData.department) {
          results.failed.push({
            data: courseData,
            reason: 'Missing required fields: courseCode, courseName, department'
          });
          continue;
        }

        // Check if course code exists
        const existing = await Course.findOne({ courseCode: courseData.courseCode });
        if (existing) {
          results.failed.push({
            data: courseData,
            reason: `Course code ${courseData.courseCode} already exists`
          });
          continue;
        }

        // Validate department
        const department = await Department.findById(courseData.department);
        if (!department) {
          results.failed.push({
            data: courseData,
            reason: 'Department not found'
          });
          continue;
        }

        // Set academic year if not provided
        if (!courseData.academicYear) {
          const currentYear = new Date().getFullYear();
          courseData.academicYear = `${currentYear}/${currentYear + 1}`;
        }

        courseData.faculty = department.faculty;
        courseData.createdBy = req.user.id;

        const course = await Course.create(courseData);
        
        // Add course to department's courses list
        await Department.findByIdAndUpdate(department._id, {
          $addToSet: { courses: course._id }
        });

        results.successful.push(course);
      } catch (error) {
        results.failed.push({
          data: courseData,
          reason: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.successful.length} courses`,
      results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/stats
// @access  Private (Admin, HOD, Dean)
exports.getCourseStats = async (req, res, next) => {
  try {
    let query = {};

    // Role-based filters
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    const stats = {
      total: await Course.countDocuments(query),
      byLevel: {},
      byDepartment: {},
      byStatus: {},
      bySemester: {}
    };

    // Stats by level
    const levels = ['100', '200', '300', '400', '500', '600', '700'];
    for (const level of levels) {
      stats.byLevel[level] = await Course.countDocuments({ ...query, level });
    }

    // Stats by semester
    stats.bySemester.semester1 = await Course.countDocuments({ ...query, semester: 1 });
    stats.bySemester.semester2 = await Course.countDocuments({ ...query, semester: 2 });

    // Stats by status
    const statuses = ['open', 'closed', 'waitlist'];
    for (const status of statuses) {
      stats.byStatus[status] = await Course.countDocuments({ ...query, enrollmentStatus: status });
    }

    // Active vs inactive
    stats.active = await Course.countDocuments({ ...query, isActive: true });
    stats.inactive = await Course.countDocuments({ ...query, isActive: false });

    // Department-wise stats
    let departmentQuery = {};
    if (req.user.role === 'hod') {
      departmentQuery._id = req.user.department;
    } else if (req.user.role === 'dean') {
      departmentQuery.faculty = req.user.facultyManaged;
    }
    
    const departments = await Department.find(departmentQuery);

    for (const dept of departments) {
      const deptCourses = await Course.find({ 
        ...query, 
        department: dept._id 
      }).select('_id');
      
      const courseIds = deptCourses.map(c => c._id);
      
      stats.byDepartment[dept.code || dept.name] = {
        name: dept.name,
        total: deptCourses.length,
        enrollments: await Enrollment.countDocuments({
          course: { $in: courseIds },
          enrollmentStatus: 'enrolled'
        })
      };
    }

    // Get total enrolled students across all courses
    const courses = await Course.find(query).select('_id');
    const courseIds = courses.map(c => c._id);
    
    stats.totalEnrollments = await Enrollment.countDocuments({
      course: { $in: courseIds },
      enrollmentStatus: 'enrolled'
    });

    // Get average class size
    if (courses.length > 0) {
      const enrollmentsPerCourse = await Enrollment.aggregate([
        { $match: { course: { $in: courseIds }, enrollmentStatus: 'enrolled' } },
        { $group: { _id: '$course', count: { $sum: 1 } } }
      ]);
      
      const totalEnrollments = enrollmentsPerCourse.reduce((sum, item) => sum + item.count, 0);
      stats.averageClassSize = Math.round(totalEnrollments / courses.length);
    } else {
      stats.averageClassSize = 0;
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course timetable
// @route   GET /api/courses/:id/timetable
// @access  Private
exports.getCourseTimetable = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('lecturers', 'name')
      .populate('coordinator', 'name');

    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check access
    const isEnrolled = await Enrollment.exists({
      student: req.user.id,
      course: course._id,
      enrollmentStatus: 'enrolled'
    });

    const isLecturer = course.lecturers?.some(l => l._id.toString() === req.user.id);
    
    if (!['admin', 'hod', 'dean'].includes(req.user.role) && !isLecturer && !isEnrolled) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You are not enrolled in this course.' 
      });
    }

    // Get timetable entries for this course
    const Timetable = require('../models/timetable');
    const timetableEntries = await Timetable.find({
      courses: course._id,
      date: { $gte: new Date() }
    })
    .populate('lecturers', 'name')
    .sort('date startTime');

    const timetable = {
      course: {
        code: course.courseCode,
        name: course.courseName,
        credits: course.credits,
        level: course.level,
        semester: course.semester
      },
      lecturers: course.lecturers,
      coordinator: course.coordinator,
      schedule: {
        lectureHours: course.lectureHours || 'TBD',
        tutorialHours: course.tutorialHours || 'TBD',
        practicalHours: course.practicalHours || 'TBD'
      },
      assessment: course.assessmentStructure || {},
      upcomingSessions: timetableEntries
    };

    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    next(error);
  }
};