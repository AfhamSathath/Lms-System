const Enrollment = require('../models/enrollment');
const Course = require('../models/course');
const User = require('../models/user');
const Notification = require('../models/notification');

// Helper functions
const checkEnrollmentAccess = async (enrollment, user) => {
  if (!enrollment || !user) return false;

  if (user.role === 'admin') return true;

  if (user.role === 'student') {
    return enrollment.student?._id?.toString() === user.id;
  }

  if (user.role === 'lecturer') {
    return await isCourseLecturer(enrollment.course?._id, user.id);
  }

  if (user.role === 'hod') {
    const course = await Course.findById(enrollment.course?._id);
    return course?.department?.toString() === user.department?.toString();
  }

  if (user.role === 'dean') {
    const course = await Course.findById(enrollment.course?._id).populate('department');
    return course?.department?.faculty?.toString() === user.facultyManaged?.toString();
  }

  return false;
};

const isCourseLecturer = async (courseId, userId) => {
  if (!courseId || !userId) return false;
  const course = await Course.findById(courseId);
  return course?.lecturers?.some(l => l?.toString() === userId);
};

const calculateAverageGrade = (enrollments) => {
  if (!Array.isArray(enrollments) || enrollments.length === 0) return '0.00';

  const gradedEnrollments = enrollments.filter(e => e.gradePoints);
  if (gradedEnrollments.length === 0) return '0.00';

  const sum = gradedEnrollments.reduce((acc, e) => acc + (e.gradePoints || 0), 0);
  return (sum / gradedEnrollments.length).toFixed(2);
};

const calculatePassRate = (enrollments) => {
  if (!Array.isArray(enrollments) || enrollments.length === 0) return '0.00';

  const completed = enrollments.filter(e => e.enrollmentStatus === 'completed').length;
  const failed = enrollments.filter(e => e.enrollmentStatus === 'failed').length;
  const totalGraded = completed + failed;

  if (totalGraded === 0) return '0.00';
  return ((completed / totalGraded) * 100).toFixed(2);
};

const calculateGradeDistribution = (enrollments) => {
  const distribution = {};
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F'];

  grades.forEach(grade => {
    distribution[grade] = enrollments.filter(e => e.grade === grade).length;
  });

  return distribution;
};

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private (Admin, HOD, Dean, Lecturer)
exports.getEnrollments = async (req, res, next) => {
  try {
    const {
      student,
      course,
      academicYear,
      semester,
      enrollmentStatus,
      page = 1,
      limit = 20,
      sortBy = '-createdAt'
    } = req.query;

    let query = {};
    const userRole = req.user.role;
    const userId = req.user.id;

    // Role-based access control
    if (userRole === 'student') {
      query.student = userId;
    } else if (userRole === 'lecturer') {
      // Lecturers can see enrollments for courses they teach
      const teachingCourses = await Course.find({
        lecturers: userId
      }).select('_id');
      const courseIds = teachingCourses.map(c => c._id);
      if (courseIds.length > 0) {
        query.course = { $in: courseIds };
      }
    } else if (userRole === 'hod') {
      // HOD can see enrollments in their department
      const departmentCourses = await Course.find({
        department: req.user.department
      }).select('_id');
      const courseIds = departmentCourses.map(c => c._id);
      if (courseIds.length > 0) {
        query.course = { $in: courseIds };
      }
    } else if (userRole === 'dean') {
      // Dean can see enrollments in their faculty
      const facultyCourses = await Course.find({
        faculty: req.user.facultyManaged
      }).select('_id');
      const courseIds = facultyCourses.map(c => c._id);
      if (courseIds.length > 0) {
        query.course = { $in: courseIds };
      }
    }

    // Apply filters
    if (student) query.student = student;
    if (course) query.course = course;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (enrollmentStatus) query.enrollmentStatus = enrollmentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name studentId registrationNumber email')
      .populate('course', 'courseCode courseName credits level')
      .populate('gradedBy', 'name')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      count: enrollments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single enrollment
// @route   GET /api/enrollments/:id
// @access  Private
exports.getEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'name studentId registrationNumber email phone department')
      .populate('course', 'courseCode courseName credits level semester assessmentStructure')
      .populate('gradedBy', 'name email')
      .populate('assessments.gradedBy', 'name');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check access permissions
    const hasAccess = await checkEnrollmentAccess(enrollment, req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create enrollment
// @route   POST /api/enrollments
// @access  Private (Admin, Registrar, HOD)
exports.createEnrollment = async (req, res, next) => {
  try {
    const { student, course, academicYear, semester } = req.body;

    // Check if student exists and is a student
    const studentUser = await User.findOne({
      _id: student,
      role: 'student',
      isActive: true
    });

    if (!studentUser) {
      return res.status(404).json({
        success: false,
        message: 'Student not found or inactive'
      });
    }

    // Check if course exists and is active
    const courseData = await Course.findOne({
      _id: course,
      isActive: true
    });

    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }

    // Check if enrollment already exists
    const existingEnrollment = await Enrollment.findOne({
      student,
      course,
      academicYear,
      semester: semester || studentUser.semester
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course for the specified semester'
      });
    }

    // Check course capacity
    const enrolledCount = await Enrollment.countDocuments({
      course,
      academicYear,
      semester: semester || studentUser.semester,
      enrollmentStatus: { $in: ['enrolled', 'completed'] }
    });

    if (enrolledCount >= (courseData.maxStudents || Infinity)) {
      return res.status(400).json({
        success: false,
        message: 'Course has reached maximum capacity'
      });
    }

    // Set student's year of study and semester if not provided
    const enrollmentData = {
      student,
      course,
      academicYear,
      semester: semester || studentUser.semester,
      yearOfStudy: studentUser.yearOfStudy,
      createdBy: req.user.id,
      enrollmentDate: new Date()
    };

    const enrollment = await Enrollment.create(enrollmentData);

    // Update course current enrollment count
    await Course.findByIdAndUpdate(course, {
      $inc: { currentEnrollment: 1 }
    });

    // Populate data
    await enrollment.populate([
      { path: 'student', select: 'name studentId email' },
      { path: 'course', select: 'courseCode courseName' }
    ]);

    // Create notification for student
    await Notification.create({
      user: student,
      title: 'Course Enrollment Successful',
      message: `You have been successfully enrolled in ${enrollment.course?.courseCode || ''} - ${enrollment.course?.courseName || ''}`,
      type: 'enrollment',
      priority: 'medium',
      sender: req.user.id,
      metadata: {
        enrollmentId: enrollment._id,
        courseId: course,
        courseCode: enrollment.course?.courseCode
      }
    });

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update enrollment
// @route   PUT /api/enrollments/:id
// @access  Private (Admin, Registrar, Lecturer)
exports.updateEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canUpdate =
      req.user.role === 'admin' ||
      req.user.role === 'registrar' ||
      (req.user.role === 'lecturer' && await isCourseLecturer(enrollment.course, req.user.id));

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot update this enrollment.'
      });
    }

    // Prevent updates to certain fields
    const allowedUpdates = [
      'continuousAssessment', 'finalExam', 'attendance',
      'assessments', 'remarks', 'enrollmentStatus'
    ];

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedBy = req.user.id;

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('student', 'name studentId email')
      .populate('course', 'courseCode courseName');

    // If grade was updated, notify student
    if (updates.continuousAssessment !== undefined || updates.finalExam !== undefined) {
      await Notification.create({
        user: enrollment.student,
        title: 'Grade Updated',
        message: `Your grade for ${updatedEnrollment.course?.courseCode || ''} has been updated.`,
        type: 'grade',
        priority: 'high',
        sender: req.user.id,
        metadata: {
          enrollmentId: enrollment._id,
          courseId: enrollment.course,
          courseCode: updatedEnrollment.course?.courseCode
        }
      });
    }

    res.json({
      success: true,
      message: 'Enrollment updated successfully',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Admin only)
exports.deleteEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Only admin can delete enrollments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can delete enrollments.'
      });
    }

    await enrollment.deleteOne();

    // Update course current enrollment count
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { currentEnrollment: -1 }
    });

    res.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk enroll students
// @route   POST /api/enrollments/bulk
// @access  Private (Admin, Registrar)
exports.bulkEnrollStudents = async (req, res, next) => {
  try {
    const { course, academicYear, semester, students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }

    const courseData = await Course.findById(course);
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    let successCount = 0;

    for (const studentId of students) {
      try {
        // Check if student exists
        const student = await User.findOne({
          _id: studentId,
          role: 'student',
          isActive: true
        });

        if (!student) {
          results.failed.push({
            studentId,
            reason: 'Student not found or inactive'
          });
          continue;
        }

        // Check if already enrolled
        const existing = await Enrollment.findOne({
          student: studentId,
          course,
          academicYear,
          semester: semester || student.semester
        });

        if (existing) {
          results.failed.push({
            studentId,
            reason: 'Already enrolled'
          });
          continue;
        }

        // Check capacity
        const enrolledCount = await Enrollment.countDocuments({
          course,
          academicYear,
          semester: semester || student.semester,
          enrollmentStatus: { $in: ['enrolled', 'completed'] }
        });

        if (enrolledCount >= (courseData.maxStudents || Infinity)) {
          results.failed.push({
            studentId,
            reason: 'Course has reached maximum capacity'
          });
          continue;
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
          student: studentId,
          course,
          academicYear,
          semester: semester || student.semester,
          yearOfStudy: student.yearOfStudy,
          createdBy: req.user.id,
          enrollmentDate: new Date()
        });

        results.successful.push(enrollment);
        successCount++;
      } catch (error) {
        results.failed.push({
          studentId,
          reason: error.message
        });
      }
    }

    // Update course enrollment count
    if (successCount > 0) {
      await Course.findByIdAndUpdate(course, {
        $inc: { currentEnrollment: successCount }
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully enrolled ${results.successful.length} students`,
      results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update grades
// @route   PUT /api/enrollments/:id/grades
// @access  Private (Lecturer, HOD, Admin)
exports.updateGrades = async (req, res, next) => {
  try {
    const { continuousAssessment, finalExam, assessments } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canGrade =
      req.user.role === 'admin' ||
      req.user.role === 'hod' ||
      (req.user.role === 'lecturer' && await isCourseLecturer(enrollment.course, req.user.id));

    if (!canGrade) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot grade this enrollment.'
      });
    }

    if (continuousAssessment !== undefined) {
      enrollment.continuousAssessment = continuousAssessment;
    }

    if (finalExam !== undefined) {
      enrollment.finalExam = finalExam;
    }

    if (assessments && Array.isArray(assessments)) {
      for (const assessment of assessments) {
        const existingIndex = enrollment.assessments.findIndex(
          a => a._id && a._id.toString() === assessment._id
        );

        if (existingIndex >= 0) {
          // Update existing assessment
          assessment.gradedBy = req.user.id;
          assessment.gradedDate = new Date();
          assessment.graded = true;

          enrollment.assessments[existingIndex] = {
            ...enrollment.assessments[existingIndex].toObject(),
            ...assessment
          };
        } else if (assessment.name && assessment.score !== undefined) {
          // Add new assessment
          enrollment.assessments.push({
            name: assessment.name,
            score: assessment.score,
            maxScore: assessment.maxScore || 100,
            weight: assessment.weight || 0,
            gradedBy: req.user.id,
            gradedDate: new Date(),
            graded: true
          });
        }
      }
    }

    enrollment.gradedBy = req.user.id;
    enrollment.gradedDate = new Date();
    await enrollment.save();

    await enrollment.populate('student', 'name studentId email');
    await enrollment.populate('course', 'courseCode courseName');

    // Notify student about grade update
    await Notification.create({
      user: enrollment.student?._id,
      title: 'Grade Posted',
      message: `Your grade for ${enrollment.course?.courseCode || ''} has been posted. Grade: ${enrollment.grade || 'N/A'}`,
      type: 'grade',
      priority: 'high',
      sender: req.user.id,
      metadata: {
        enrollmentId: enrollment._id,
        courseId: enrollment.course?._id,
        courseCode: enrollment.course?.courseCode,
        grade: enrollment.grade
      }
    });

    res.json({
      success: true,
      message: 'Grades updated successfully',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance
// @route   PUT /api/enrollments/:id/attendance
// @access  Private (Lecturer, HOD, Admin)
exports.updateAttendance = async (req, res, next) => {
  try {
    const { attendance } = req.body;

    if (!Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attendance records'
      });
    }

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canUpdateAttendance =
      req.user.role === 'admin' ||
      req.user.role === 'hod' ||
      (req.user.role === 'lecturer' && await isCourseLecturer(enrollment.course, req.user.id));

    if (!canUpdateAttendance) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot update attendance for this enrollment.'
      });
    }

    // Initialize attendance array if it doesn't exist
    if (!enrollment.attendance) {
      enrollment.attendance = [];
    }

    for (const record of attendance) {
      const recordDate = new Date(record.date);
      const existingIndex = enrollment.attendance.findIndex(
        a => a.date && a.date.toISOString().split('T')[0] === recordDate.toISOString().split('T')[0]
      );

      if (existingIndex >= 0) {
        // Update existing attendance
        enrollment.attendance[existingIndex].status = record.status;
        if (record.remarks) {
          enrollment.attendance[existingIndex].remarks = record.remarks;
        }
      } else {
        // Add new attendance record
        enrollment.attendance.push({
          date: recordDate,
          status: record.status,
          remarks: record.remarks
        });
      }
    }

    // Recalculate attendance percentage
    const total = enrollment.attendance.length;
    const present = enrollment.attendance.filter(
      a => a.status === 'present' || a.status === 'late'
    ).length;
    enrollment.attendancePercentage = total > 0 ? (present / total) * 100 : 0;

    enrollment.updatedBy = req.user.id;
    await enrollment.save();

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance: enrollment.attendance,
      attendancePercentage: enrollment.attendancePercentage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student enrollments
// @route   GET /api/enrollments/student/:studentId
// @access  Private
exports.getStudentEnrollments = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester, status } = req.query;

    // Check access
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own enrollments.'
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    let query = { student: studentId };

    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (status) query.enrollmentStatus = status;

    const enrollments = await Enrollment.find(query)
      .populate('course', 'courseCode courseName credits level')
      .populate('gradedBy', 'name')
      .sort('-academicYear -semester');

    // Calculate GPA
    let totalCredits = 0;
    let totalGradePoints = 0;
    const completedEnrollments = enrollments.filter(e => e.enrollmentStatus === 'completed');

    completedEnrollments.forEach(e => {
      if (e.gradePoints && e.course?.credits) {
        totalCredits += e.course.credits;
        totalGradePoints += e.gradePoints * e.course.credits;
      }
    });

    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        department: student.department
      },
      stats: {
        totalEnrollments: enrollments.length,
        completed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
        enrolled: enrollments.filter(e => e.enrollmentStatus === 'enrolled').length,
        gpa,
        totalCredits
      },
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get course enrollments
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Admin, HOD, Dean, Lecturer)
exports.getCourseEnrollments = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { academicYear, semester, status } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access
    const isLecturer = course.lecturers?.some(l => l?.toString() === req.user.id);
    const hasAccess =
      req.user.role === 'admin' ||
      req.user.role === 'hod' ||
      req.user.role === 'dean' ||
      isLecturer;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view enrollments for this course.'
      });
    }

    let query = { course: courseId };

    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (status) query.enrollmentStatus = status;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name studentId email')
      .populate('gradedBy', 'name')
      .sort('student.name');

    // Calculate statistics
    const stats = {
      total: enrollments.length,
      enrolled: enrollments.filter(e => e.enrollmentStatus === 'enrolled').length,
      completed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
      dropped: enrollments.filter(e => e.enrollmentStatus === 'dropped').length,
      failed: enrollments.filter(e => e.enrollmentStatus === 'failed').length,
      averageGrade: calculateAverageGrade(enrollments),
      passRate: calculatePassRate(enrollments),
      gradeDistribution: calculateGradeDistribution(enrollments)
    };

    res.json({
      success: true,
      course: {
        id: course._id,
        code: course.courseCode,
        name: course.courseName
      },
      stats,
      enrollments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate grade sheet
// @route   GET /api/enrollments/course/:courseId/grade-sheet
// @access  Private (Lecturer, HOD, Admin)
exports.generateGradeSheet = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { academicYear, semester } = req.query;

    if (!academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide academicYear and semester'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access
    const isLecturer = course.lecturers?.some(l => l?.toString() === req.user.id);
    if (!['admin', 'hod', 'dean'].includes(req.user.role) && !isLecturer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only lecturers of this course can generate grade sheets.'
      });
    }

    const enrollments = await Enrollment.find({
      course: courseId,
      academicYear,
      semester: parseInt(semester)
    })
      .populate('student', 'name studentId registrationNumber')
      .sort('student.studentId');

    // Generate grade sheet data
    const gradeSheet = {
      course: {
        code: course.courseCode,
        name: course.courseName,
        credits: course.credits,
        academicYear,
        semester: parseInt(semester)
      },
      stats: {
        totalStudents: enrollments.length,
        passed: enrollments.filter(e => e.enrollmentStatus === 'completed').length,
        failed: enrollments.filter(e => e.enrollmentStatus === 'failed').length,
        averageGrade: calculateAverageGrade(enrollments),
        passRate: calculatePassRate(enrollments)
      },
      gradeDistribution: calculateGradeDistribution(enrollments),
      students: enrollments.map(e => ({
        studentId: e.student?.studentId || '',
        registrationNumber: e.student?.registrationNumber || '',
        name: e.student?.name || '',
        continuousAssessment: e.continuousAssessment,
        finalExam: e.finalExam,
        totalMarks: e.totalMarks,
        grade: e.grade,
        gradePoints: e.gradePoints,
        status: e.enrollmentStatus
      }))
    };

    res.json({
      success: true,
      gradeSheet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw student from course
// @route   PUT /api/enrollments/:id/withdraw
// @access  Private (Student, Admin, Registrar)
exports.withdrawStudent = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check permissions
    const canWithdraw =
      req.user.role === 'admin' ||
      req.user.role === 'registrar' ||
      (req.user.role === 'student' && enrollment.student?.toString() === req.user.id);

    if (!canWithdraw) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot withdraw from this course.'
      });
    }

    // Students can only withdraw within a certain period (e.g., first 2 weeks)
    if (req.user.role === 'student') {
      const enrollmentDate = new Date(enrollment.enrollmentDate || enrollment.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - enrollmentDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > 14) {
        return res.status(400).json({
          success: false,
          message: 'Withdrawal period has expired. Please contact the registrar.'
        });
      }
    }

    enrollment.enrollmentStatus = 'dropped';
    enrollment.withdrawalDate = new Date();
    enrollment.withdrawalReason = reason;
    enrollment.updatedBy = req.user.id;
    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { currentEnrollment: -1 }
    });

    res.json({
      success: true,
      message: 'Successfully withdrawn from course',
      enrollment
    });
  } catch (error) {
    next(error);
  }
};