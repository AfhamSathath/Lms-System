const Timetable = require('../models/timetable');
const Course = require('../models/course');
const User = require('../models/user');
const Notification = require('../models/notification');
const Department = require('../models/Department');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to check for scheduling conflicts
const checkScheduleConflict = async (date, startTime, endTime, venue, excludeId = null) => {
  try {
    const query = {
      date: new Date(date),
      venue,
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const conflict = await Timetable.findOne(query);
    return conflict;
  } catch (error) {
    console.error('Conflict check error:', error);
    return null;
  }
};

// Helper function to check lecturer availability
const checkLecturerAvailability = async (lecturerId, date, startTime, endTime, excludeId = null) => {
  try {
    const query = {
      lecturers: lecturerId,
      date: new Date(date),
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const conflict = await Timetable.findOne(query);
    return conflict;
  } catch (error) {
    console.error('Lecturer availability check error:', error);
    return null;
  }
};

// Helper function to check timetable access
const checkTimetableAccess = async (timetable, user) => {
  if (!timetable || !user) return false;
  
  if (user.role === 'admin') return true;
  
  if (user.role === 'student') {
    // Check if student is in the right year/semester or enrolled in the course
    if (timetable.yearOfStudy === user.yearOfStudy && 
        timetable.semester === user.semester &&
        timetable.department?.toString() === user.department?.toString()) {
      return true;
    }
    
    // Check if enrolled in any of the courses
    const enrollments = await Enrollment.find({
      student: user.id,
      course: { $in: timetable.courses || [] },
      enrollmentStatus: 'enrolled'
    });
    
    return enrollments.length > 0;
  }

  if (user.role === 'lecturer') {
    return timetable.lecturers?.some(l => l.toString() === user.id);
  }

  if (user.role === 'hod') {
    return timetable.department?.toString() === user.department?.toString();
  }

  if (user.role === 'dean') {
    return timetable.faculty?.toString() === user.facultyManaged?.toString();
  }

  return false;
};

// Helper function to send timetable notifications
const sendTimetableNotifications = async (timetables, action) => {
  try {
    if (!timetables || timetables.length === 0) return;
    
    const notificationPromises = [];

    for (const timetable of timetables) {
      if (!timetable) continue;
      
      // Find affected users
      let targetUsers = [];

      if (timetable.type === 'exam' || timetable.type === 'class') {
        // Find students in this year/semester/department
        const studentQuery = {
          role: 'student',
          isActive: true
        };
        
        if (timetable.yearOfStudy) studentQuery.yearOfStudy = timetable.yearOfStudy;
        if (timetable.semester) studentQuery.semester = timetable.semester;
        if (timetable.department) studentQuery.department = timetable.department;
        
        const students = await User.find(studentQuery).select('_id');
        targetUsers.push(...students.map(s => s._id));
      }

      // Add lecturers
      if (timetable.lecturers && timetable.lecturers.length > 0) {
        targetUsers.push(...timetable.lecturers);
      }

      // Add HOD
      if (timetable.department) {
        const hod = await User.findOne({
          role: 'hod',
          department: timetable.department
        }).select('_id');
        
        if (hod) targetUsers.push(hod._id);
      }

      // Remove duplicates and null values
      targetUsers = [...new Set(targetUsers.filter(id => id).map(id => id.toString()))];

      if (targetUsers.length === 0) continue;

      // Create notifications
      const actionMessages = {
        created: 'has been created',
        updated: 'has been updated',
        published: 'has been published',
        cancelled: 'has been cancelled'
      };

      const notifications = targetUsers.map(userId => ({
        user: userId,
        title: `${timetable.type === 'exam' ? 'Exam' : 'Class'} Schedule ${actionMessages[action] || 'updated'}`,
        message: `${timetable.title || 'Timetable entry'} scheduled on ${timetable.date ? new Date(timetable.date).toLocaleDateString() : 'TBD'} at ${timetable.startTime || 'TBD'} in ${timetable.venue || 'TBD'}`,
        type: 'timetable',
        priority: 'high',
        metadata: {
          timetableId: timetable._id,
          action,
          type: timetable.type
        },
        action: {
          type: 'link',
          url: `/timetables/${timetable._id}`
        }
      }));

      notificationPromises.push(Notification.insertMany(notifications));
    }

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error sending timetable notifications:', error);
  }
};

// Helper function to get student enrolled courses
const getStudentEnrolledCourses = async (studentId) => {
  try {
    if (!studentId) return [];
    
    const enrollments = await Enrollment.find({
      student: studentId,
      enrollmentStatus: 'enrolled'
    }).select('course');
    
    return enrollments.map(e => e.course).filter(c => c);
  } catch (error) {
    console.error('Error getting enrolled courses:', error);
    return [];
  }
};

// @desc    Get all timetables with filters
// @route   GET /api/timetables
// @access  Private
exports.getTimetables = async (req, res, next) => {
  try {
    const { 
      type,
      department, 
      faculty,
      semester,
      yearOfStudy,
      course,
      lecturer,
      venue,
      fromDate,
      toDate,
      examType,
      status,
      page = 1,
      limit = 20,
      sortBy = 'date startTime'
    } = req.query;

    let query = {};
    const userRole = req.user.role;
    const userId = req.user.id;

    // Role-based access control
    if (userRole === 'student') {
      const enrolledCourses = await getStudentEnrolledCourses(userId);
      query.$or = [
        { 
          type: 'exam',
          yearOfStudy: req.user.yearOfStudy,
          semester: req.user.semester,
          department: req.user.department
        },
        {
          type: { $in: ['class', 'lab', 'tutorial'] },
          $or: [
            { yearOfStudy: req.user.yearOfStudy },
            { courses: { $in: enrolledCourses } }
          ]
        }
      ];
    } else if (userRole === 'lecturer') {
      // Lecturers can see timetables for courses they teach
      const teachingCourses = await Course.find({
        lecturers: userId
      }).select('_id');
      
      query.$or = [
        { lecturers: userId },
        { courses: { $in: teachingCourses.map(c => c._id) } }
      ];
    } else if (userRole === 'hod') {
      query.department = req.user.department;
    } else if (userRole === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    // Apply filters
    if (type) query.type = type;
    if (department) query.department = department;
    if (faculty) query.faculty = faculty;
    if (semester) query.semester = parseInt(semester);
    if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
    if (course) query.courses = course;
    if (lecturer) query.lecturers = lecturer;
    if (venue) query.venue = { $regex: venue, $options: 'i' };
    if (examType) query.examType = examType;
    if (status) query.status = status;
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const timetables = await Timetable.find(query)
      .populate('courses', 'courseCode courseName credits level')
      .populate('lecturers', 'name email employeeId')
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Timetable.countDocuments(query);

    // Group by date for easier display
    const groupedByDate = timetables.reduce((acc, item) => {
      if (item.date) {
        const dateStr = item.date.toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(item);
      }
      return acc;
    }, {});

    res.json({
      success: true,
      count: timetables.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      groupedByDate,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single timetable
// @route   GET /api/timetables/:id
// @access  Private
exports.getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('courses', 'courseCode courseName credits level semester')
      .populate('lecturers', 'name email employeeId lecturerRank')
      .populate('department', 'name code')
      .populate('faculty', 'name code')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!timetable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Timetable entry not found' 
      });
    }

    // Check access permissions
    const hasAccess = await checkTimetableAccess(timetable, req.user);
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Get related timetables (same course, same venue)
    const relatedTimetables = await Timetable.find({
      $or: [
        { courses: { $in: timetable.courses?.map(c => c._id) || [] } },
        { venue: timetable.venue }
      ],
      _id: { $ne: timetable._id },
      date: { $gte: new Date() }
    })
    .populate('courses', 'courseCode courseName')
    .limit(5)
    .sort('date');

    // Get enrolled students count for this exam/class
    let enrolledStudents = 0;
    if (timetable.type === 'exam' && timetable.courses && timetable.courses.length > 0) {
      for (const course of timetable.courses) {
        const count = await Enrollment.countDocuments({
          course: course._id,
          enrollmentStatus: 'enrolled'
        });
        enrolledStudents += count;
      }
    }

    const response = {
      success: true,
      timetable: timetable.toJSON()
    };
    
    // Add additional data
    response.timetable.enrolledStudents = enrolledStudents;
    if (timetable.capacity) {
      response.timetable.availableSeats = timetable.capacity - enrolledStudents;
    }
    response.relatedTimetables = relatedTimetables;

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Create timetable entry
// @route   POST /api/timetables
// @access  Private (Admin, HOD, Dean)
exports.createTimetable = async (req, res, next) => {
  try {
    const { 
      type,
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      capacity,
      courses,
      lecturers,
      yearOfStudy,
      semester,
      examType,
      department,
      faculty,
      recurrence,
      isPublished
    } = req.body;

    // Validate required fields
    if (!type || !date || !startTime || !endTime || !venue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: type, date, startTime, endTime, venue' 
      });
    }

    // Validate courses if provided
    let validCourses = [];
    if (courses && courses.length > 0) {
      validCourses = await Course.find({ _id: { $in: courses } });
      if (validCourses.length !== courses.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'One or more courses not found' 
        });
      }
    }

    // Validate lecturers if provided
    let validLecturers = [];
    if (lecturers && lecturers.length > 0) {
      validLecturers = await User.find({ 
        _id: { $in: lecturers },
        role: { $in: ['lecturer', 'hod', 'dean'] }
      });
      if (validLecturers.length !== lecturers.length) {
        return res.status(400).json({ 
          success: false, 
          message: 'One or more lecturers not found' 
        });
      }

      // Check lecturer availability
      for (const lecturerId of lecturers) {
        const conflict = await checkLecturerAvailability(
          lecturerId, 
          date, 
          startTime, 
          endTime
        );
        if (conflict) {
          const lecturer = await User.findById(lecturerId);
          return res.status(400).json({ 
            success: false, 
            message: `Lecturer ${lecturer?.name || 'Unknown'} is already scheduled at this time` 
          });
        }
      }
    }

    // Check venue availability
    const venueConflict = await checkScheduleConflict(
      date, 
      startTime, 
      endTime, 
      venue
    );
    if (venueConflict) {
      return res.status(400).json({ 
        success: false, 
        message: `Venue ${venue} is already booked at this time` 
      });
    }

    // Get department and faculty from first course if not provided
    let deptId = department;
    let facultyId = faculty;
    
    if (!deptId && validCourses.length > 0) {
      deptId = validCourses[0].department;
      facultyId = validCourses[0].faculty;
    }

    // Create timetable entries (handle recurrence)
    const createdEntries = [];
    
    if (recurrence && recurrence.pattern && recurrence.pattern !== 'none') {
      // Generate recurring entries
      const startDate = new Date(date);
      const endDate = recurrence.endDate ? new Date(recurrence.endDate) : new Date(startDate);
      if (!recurrence.endDate) {
        endDate.setMonth(endDate.getMonth() + (recurrence.months || 3));
      }
      
      let currentDate = new Date(startDate);
      let occurrences = 0;
      const maxOccurrences = recurrence.occurrences || 10;

      while (occurrences < maxOccurrences && currentDate <= endDate) {
        const entryData = {
          type,
          title: recurrence.pattern !== 'none' ? `${title || 'Session'} (Week ${occurrences + 1})` : title,
          description,
          date: new Date(currentDate),
          startTime,
          endTime,
          venue,
          capacity,
          courses: validCourses.map(c => c._id),
          lecturers: validLecturers.map(l => l._id),
          yearOfStudy: yearOfStudy ? parseInt(yearOfStudy) : undefined,
          semester: semester ? parseInt(semester) : undefined,
          examType,
          department: deptId,
          faculty: facultyId,
          recurrence: {
            pattern: recurrence.pattern,
            interval: recurrence.interval || 1,
            endDate: recurrence.endDate,
            occurrences: recurrence.occurrences,
            parentId: createdEntries[0]?._id || null
          },
          isPublished: isPublished || false,
          createdBy: req.user.id
        };

        const entry = await Timetable.create(entryData);
        await entry.populate('courses', 'courseCode courseName');
        if (validLecturers.length > 0) {
          await entry.populate('lecturers', 'name email');
        }
        createdEntries.push(entry);

        // Calculate next date based on recurrence pattern
        switch (recurrence.pattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + (recurrence.interval || 1));
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (7 * (recurrence.interval || 1)));
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + (14 * (recurrence.interval || 1)));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + (recurrence.interval || 1));
            break;
          default:
            occurrences = maxOccurrences;
        }
        
        occurrences++;
      }
    } else {
      // Single entry
      const entryData = {
        type,
        title,
        description,
        date: new Date(date),
        startTime,
        endTime,
        venue,
        capacity,
        courses: validCourses.map(c => c._id),
        lecturers: validLecturers.map(l => l._id),
        yearOfStudy: yearOfStudy ? parseInt(yearOfStudy) : undefined,
        semester: semester ? parseInt(semester) : undefined,
        examType,
        department: deptId,
        faculty: facultyId,
        isPublished: isPublished || false,
        createdBy: req.user.id
      };

      const entry = await Timetable.create(entryData);
      await entry.populate('courses', 'courseCode courseName');
      if (validLecturers.length > 0) {
        await entry.populate('lecturers', 'name email');
      }
      createdEntries.push(entry);
    }

    // Send notifications if published
    if (isPublished) {
      await sendTimetableNotifications(createdEntries, 'created');
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdEntries.length} timetable entries`,
      count: createdEntries.length,
      timetables: createdEntries
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Scheduling conflict detected' 
      });
    }
    next(error);
  }
};

// @desc    Update timetable entry
// @route   PUT /api/timetables/:id
// @access  Private (Admin, HOD, Dean)
exports.updateTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Timetable entry not found' 
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     (req.user.role === 'hod' && timetable.department?.toString() === req.user.department?.toString()) ||
                     (req.user.role === 'dean' && timetable.faculty?.toString() === req.user.facultyManaged?.toString());

    if (!canUpdate) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const { date, startTime, endTime, venue, lecturers } = req.body;

    // Check for scheduling conflicts if time/venue changed
    if ((date && date !== timetable.date.toISOString().split('T')[0]) ||
        (startTime && startTime !== timetable.startTime) ||
        (endTime && endTime !== timetable.endTime) ||
        (venue && venue !== timetable.venue)) {
      
      const conflictDate = date || timetable.date.toISOString().split('T')[0];
      const conflictStart = startTime || timetable.startTime;
      const conflictEnd = endTime || timetable.endTime;
      const conflictVenue = venue || timetable.venue;

      const venueConflict = await checkScheduleConflict(
        conflictDate,
        conflictStart,
        conflictEnd,
        conflictVenue,
        timetable._id
      );

      if (venueConflict) {
        return res.status(400).json({ 
          success: false, 
          message: `Venue ${conflictVenue} is already booked at this time` 
        });
      }
    }

    // Check lecturer availability if changed
    if (lecturers && JSON.stringify(lecturers) !== JSON.stringify(timetable.lecturers)) {
      for (const lecturerId of lecturers) {
        const conflict = await checkLecturerAvailability(
          lecturerId,
          date || timetable.date.toISOString().split('T')[0],
          startTime || timetable.startTime,
          endTime || timetable.endTime,
          timetable._id
        );
        if (conflict) {
          const lecturer = await User.findById(lecturerId);
          return res.status(400).json({ 
            success: false, 
            message: `Lecturer ${lecturer?.name || 'Unknown'} is already scheduled at this time` 
          });
        }
      }
    }

    // Update fields
    const allowedUpdates = [
      'title', 'description', 'date', 'startTime', 'endTime', 'venue',
      'capacity', 'courses', 'lecturers', 'yearOfStudy', 'semester',
      'examType', 'status', 'isPublished', 'remarks'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        timetable[field] = req.body[field];
      }
    });

    timetable.updatedBy = req.user.id;
    await timetable.save();

    await timetable.populate('courses', 'courseCode courseName');
    await timetable.populate('lecturers', 'name email');
    await timetable.populate('department', 'name code');

    // Send notifications if published and changed
    if (timetable.isPublished) {
      await sendTimetableNotifications([timetable], 'updated');
    }

    // If this is a recurring entry, update related entries
    if (timetable.recurrence?.parentId || timetable.recurrence?.pattern !== 'none') {
      const updateRecurring = req.body.updateRecurring;
      if (updateRecurring === 'all' && (timetable.recurrence.parentId || timetable._id)) {
        // Find all related entries and update them
        const parentId = timetable.recurrence.parentId || timetable._id;
        await Timetable.updateMany(
          { 
            $or: [
              { _id: parentId },
              { 'recurrence.parentId': parentId }
            ]
          },
          {
            $set: {
              startTime: timetable.startTime,
              endTime: timetable.endTime,
              venue: timetable.venue,
              lecturers: timetable.lecturers,
              updatedBy: req.user.id
            }
          }
        );
      }
    }

    res.json({
      success: true,
      message: 'Timetable updated successfully',
      timetable
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete timetable entry
// @route   DELETE /api/timetables/:id
// @access  Private (Admin, HOD, Dean)
exports.deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Timetable entry not found' 
      });
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' || 
                     (req.user.role === 'hod' && timetable.department?.toString() === req.user.department?.toString()) ||
                     (req.user.role === 'dean' && timetable.faculty?.toString() === req.user.facultyManaged?.toString());

    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const deleteRecurring = req.query.recurring === 'all';
    
    if (deleteRecurring && (timetable.recurrence?.parentId || timetable.recurrence?.pattern !== 'none')) {
      // Delete all recurring entries
      const parentId = timetable.recurrence.parentId || timetable._id;
      await Timetable.deleteMany({
        $or: [
          { _id: parentId },
          { 'recurrence.parentId': parentId }
        ]
      });
    } else {
      await timetable.deleteOne();
    }

    res.json({
      success: true,
      message: 'Timetable entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timetables by department
// @route   GET /api/timetables/department/:departmentId
// @access  Private
exports.getTimetablesByDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { type, yearOfStudy, semester, fromDate, toDate } = req.query;

    // Check access
    if (req.user.role === 'hod' && req.user.department?.toString() !== departmentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    let query = { department: departmentId };
    
    if (type) query.type = type;
    if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
    if (semester) query.semester = parseInt(semester);
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const timetables = await Timetable.find(query)
      .populate('courses', 'courseCode courseName')
      .populate('lecturers', 'name email')
      .populate('department', 'name')
      .sort({ date: 1, startTime: 1 });

    // Group by type
    const grouped = {
      exams: timetables.filter(t => t.type === 'exam'),
      classes: timetables.filter(t => ['class', 'lab', 'tutorial'].includes(t.type)),
      events: timetables.filter(t => t.type === 'event')
    };

    const department = await Department.findById(departmentId).select('name code');

    res.json({
      success: true,
      count: timetables.length,
      department,
      grouped,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timetables by course
// @route   GET /api/timetables/course/:courseId
// @access  Private
exports.getTimetablesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { type, fromDate, toDate } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    let query = { courses: courseId };
    
    if (type) query.type = type;
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const timetables = await Timetable.find(query)
      .populate('lecturers', 'name email')
      .populate('courses', 'courseCode courseName')
      .sort({ date: 1, startTime: 1 });

    // Group by type
    const now = new Date();
    const grouped = {
      upcoming: timetables.filter(t => new Date(t.date) >= now),
      past: timetables.filter(t => new Date(t.date) < now)
    };

    res.json({
      success: true,
      count: timetables.length,
      course: {
        code: course.courseCode,
        name: course.courseName
      },
      grouped,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timetables by lecturer
// @route   GET /api/timetables/lecturer/:lecturerId
// @access  Private
exports.getTimetablesByLecturer = async (req, res, next) => {
  try {
    const { lecturerId } = req.params;
    const { fromDate, toDate } = req.query;

    // Check access
    if (req.user.role === 'lecturer' && req.user.id !== lecturerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const lecturer = await User.findById(lecturerId);
    if (!lecturer || !['lecturer', 'hod', 'dean'].includes(lecturer.role)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lecturer not found' 
      });
    }

    let query = { lecturers: lecturerId };
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const timetables = await Timetable.find(query)
      .populate('courses', 'courseCode courseName')
      .populate('department', 'name')
      .sort({ date: 1, startTime: 1 });

    // Calculate workload statistics
    const now = new Date();
    const totalHours = timetables.reduce((acc, t) => {
      if (t.startTime && t.endTime) {
        const start = t.startTime.split(':').map(Number);
        const end = t.endTime.split(':').map(Number);
        const hours = (end[0] - start[0]) + (end[1] - start[1]) / 60;
        return acc + (hours > 0 ? hours : 0);
      }
      return acc;
    }, 0);

    const stats = {
      total: timetables.length,
      byType: timetables.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {}),
      upcomingCount: timetables.filter(t => new Date(t.date) >= now).length,
      totalHours: totalHours.toFixed(1)
    };

    res.json({
      success: true,
      count: timetables.length,
      lecturer: {
        name: lecturer.name,
        employeeId: lecturer.employeeId,
        rank: lecturer.lecturerRank
      },
      stats,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timetable by date
// @route   GET /api/timetables/date/:date
// @access  Private
exports.getTimetablesByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { department, faculty } = req.query;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query = {
      date: { $gte: startDate, $lte: endDate }
    };

    // Role-based filters
    if (req.user.role === 'student') {
      const enrolledCourses = await getStudentEnrolledCourses(req.user.id);
      query.$or = [
        { 
          yearOfStudy: req.user.yearOfStudy,
          semester: req.user.semester,
          department: req.user.department
        },
        { courses: { $in: enrolledCourses } }
      ];
    } else if (req.user.role === 'lecturer') {
      query.lecturers = req.user.id;
    } else if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    if (department) query.department = department;
    if (faculty) query.faculty = faculty;

    const timetables = await Timetable.find(query)
      .populate('courses', 'courseCode courseName')
      .populate('lecturers', 'name')
      .populate('department', 'name')
      .sort('startTime');

    res.json({
      success: true,
      date,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly timetable
// @route   GET /api/timetables/week/:startDate
// @access  Private
exports.getWeeklyTimetable = async (req, res, next) => {
  try {
    const { startDate } = req.params;
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    let query = {
      date: { $gte: start, $lte: end }
    };

    // Role-based filters
    if (req.user.role === 'student') {
      const enrolledCourses = await getStudentEnrolledCourses(req.user.id);
      query.$or = [
        { 
          yearOfStudy: req.user.yearOfStudy,
          semester: req.user.semester,
          department: req.user.department
        },
        { courses: { $in: enrolledCourses } }
      ];
    } else if (req.user.role === 'lecturer') {
      query.lecturers = req.user.id;
    } else if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    const timetables = await Timetable.find(query)
      .populate('courses', 'courseCode courseName')
      .populate('lecturers', 'name')
      .sort('date startTime');

    // Group by day of week
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const groupedByDay = {};

    weekDays.forEach(day => {
      groupedByDay[day] = [];
    });

    timetables.forEach(item => {
      if (item.date) {
        const dayName = weekDays[item.date.getDay()];
        if (groupedByDay[dayName]) {
          groupedByDay[dayName].push(item);
        }
      }
    });

    res.json({
      success: true,
      weekStart: start,
      weekEnd: end,
      total: timetables.length,
      groupedByDay
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming exams
// @route   GET /api/timetables/exams/upcoming
// @access  Private
exports.getUpcomingExams = async (req, res, next) => {
  try {
    const { days = 30, department, faculty } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    let query = {
      type: 'exam',
      date: { $gte: today, $lte: futureDate },
      status: { $ne: 'cancelled' }
    };

    // Role-based filters
    if (req.user.role === 'student') {
      query.yearOfStudy = req.user.yearOfStudy;
      query.semester = req.user.semester;
      query.department = req.user.department;
    } else if (req.user.role === 'lecturer') {
      query.lecturers = req.user.id;
    } else if (req.user.role === 'hod') {
      query.department = req.user.department;
    } else if (req.user.role === 'dean') {
      query.faculty = req.user.facultyManaged;
    }

    if (department) query.department = department;
    if (faculty) query.faculty = faculty;

    const exams = await Timetable.find(query)
      .populate('courses', 'courseCode courseName credits')
      .populate('lecturers', 'name')
      .populate('department', 'name code')
      .sort('date startTime');

    // Group by date
    const groupedByDate = exams.reduce((acc, exam) => {
      if (exam.date) {
        const dateStr = exam.date.toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(exam);
      }
      return acc;
    }, {});

    // Calculate statistics
    const stats = {
      totalExams: exams.length,
      byDepartment: exams.reduce((acc, e) => {
        const deptName = e.department?.name || 'Unknown';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {}),
      byVenue: exams.reduce((acc, e) => {
        if (e.venue) {
          acc[e.venue] = (acc[e.venue] || 0) + 1;
        }
        return acc;
      }, {})
    };

    res.json({
      success: true,
      count: exams.length,
      dateRange: {
        from: today,
        to: futureDate
      },
      stats,
      groupedByDate,
      exams
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get timetable conflicts
// @route   GET /api/timetables/conflicts
// @access  Private (Admin, HOD)
exports.getTimetableConflicts = async (req, res, next) => {
  try {
    const { date, venue, lecturer } = req.query;

    let query = {};
    
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.date = { $gte: searchDate, $lt: nextDate };
    }

    const timetables = await Timetable.find(query)
      .populate('courses', 'courseCode courseName')
      .populate('lecturers', 'name email')
      .sort('date startTime');

    const conflicts = [];

    // Check venue conflicts
    const venueMap = {};
    timetables.forEach(item => {
      if (item.date && item.venue && item.startTime && item.endTime) {
        const key = `${item.date.toISOString().split('T')[0]}_${item.venue}_${item.startTime}-${item.endTime}`;
        if (!venueMap[key]) {
          venueMap[key] = [];
        }
        venueMap[key].push(item);
      }
    });

    Object.values(venueMap).forEach(items => {
      if (items.length > 1) {
        conflicts.push({
          type: 'venue',
          message: `Venue ${items[0].venue} has multiple bookings`,
          items
        });
      }
    });

    // Check lecturer conflicts
    const lecturerMap = {};
    timetables.forEach(item => {
      if (item.date && item.lecturers && item.startTime && item.endTime) {
        item.lecturers.forEach(lecturerId => {
          if (lecturerId) {
            const key = `${item.date.toISOString().split('T')[0]}_${lecturerId}_${item.startTime}-${item.endTime}`;
            if (!lecturerMap[key]) {
              lecturerMap[key] = [];
            }
            lecturerMap[key].push(item);
          }
        });
      }
    });

    Object.values(lecturerMap).forEach(items => {
      if (items.length > 1) {
        conflicts.push({
          type: 'lecturer',
          message: `Lecturer has multiple assignments`,
          items
        });
      }
    });

    res.json({
      success: true,
      totalConflicts: conflicts.length,
      conflicts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish timetable
// @route   PUT /api/timetables/:id/publish
// @access  Private (Admin, HOD)
exports.publishTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Timetable entry not found' 
      });
    }

    timetable.isPublished = true;
    timetable.publishedAt = new Date();
    timetable.publishedBy = req.user.id;
    await timetable.save();

    // Send notifications
    await sendTimetableNotifications([timetable], 'published');

    res.json({
      success: true,
      message: 'Timetable published successfully',
      timetable
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import timetable from Excel
// @route   POST /api/timetables/import
// @access  Private (Admin)
exports.importTimetable = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please upload an Excel file' 
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Excel file' 
      });
    }

    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header row
        rows.push({
          type: row.getCell(1).value,
          title: row.getCell(2).value,
          date: row.getCell(3).value,
          startTime: row.getCell(4).value,
          endTime: row.getCell(5).value,
          venue: row.getCell(6).value,
          courseCode: row.getCell(7)?.value,
          lecturerId: row.getCell(8)?.value,
          yearOfStudy: row.getCell(9)?.value,
          semester: row.getCell(10)?.value
        });
      }
    });

    const results = {
      successful: [],
      failed: []
    };

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.type || !row.date || !row.startTime || !row.endTime || !row.venue) {
          results.failed.push({ row, reason: 'Missing required fields' });
          continue;
        }

        // Find course
        let course = null;
        if (row.courseCode) {
          course = await Course.findOne({ courseCode: row.courseCode });
          if (!course) {
            results.failed.push({ row, reason: `Course ${row.courseCode} not found` });
            continue;
          }
        }

        // Find lecturer
        let lecturer = null;
        if (row.lecturerId) {
          lecturer = await User.findOne({ 
            $or: [
              { employeeId: row.lecturerId },
              { email: row.lecturerId }
            ]
          });
          if (!lecturer) {
            results.failed.push({ row, reason: `Lecturer ${row.lecturerId} not found` });
            continue;
          }
        }

        // Check for conflicts
        const conflict = await checkScheduleConflict(
          row.date,
          row.startTime,
          row.endTime,
          row.venue
        );

        if (conflict) {
          results.failed.push({ row, reason: 'Scheduling conflict' });
          continue;
        }

        // Create timetable entry
        const timetable = await Timetable.create({
          type: row.type,
          title: row.title || `${row.type} session`,
          date: new Date(row.date),
          startTime: row.startTime,
          endTime: row.endTime,
          venue: row.venue,
          courses: course ? [course._id] : [],
          lecturers: lecturer ? [lecturer._id] : [],
          yearOfStudy: row.yearOfStudy ? parseInt(row.yearOfStudy) : undefined,
          semester: row.semester ? parseInt(row.semester) : undefined,
          department: course?.department,
          faculty: course?.faculty,
          createdBy: req.user.id
        });

        results.successful.push(timetable);
      } catch (error) {
        results.failed.push({ row, reason: error.message });
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.error('Error deleting uploaded file:', err);
    }

    res.json({
      success: true,
      message: `Imported ${results.successful.length} entries`,
      results
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }
    next(error);
  }
};

// @desc    Export timetable to Excel
// @route   GET /api/timetables/export
// @access  Private (Admin, HOD)
exports.exportTimetable = async (req, res, next) => {
  try {
    const { fromDate, toDate, department, type } = req.query;

    let query = {};
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }
    
    if (department) query.department = department;
    if (type) query.type = type;

    const timetables = await Timetable.find(query)
      .populate('courses', 'courseCode courseName')
      .populate('lecturers', 'name employeeId')
      .populate('department', 'name code')
      .sort('date startTime');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Timetable');

    // Add headers
    worksheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Start Time', key: 'startTime', width: 12 },
      { header: 'End Time', key: 'endTime', width: 12 },
      { header: 'Venue', key: 'venue', width: 20 },
      { header: 'Course(s)', key: 'courses', width: 30 },
      { header: 'Lecturer(s)', key: 'lecturers', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Year/Semester', key: 'yearSemester', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    timetables.forEach(item => {
      worksheet.addRow({
        type: item.type,
        title: item.title || '',
        date: item.date ? item.date.toLocaleDateString() : '',
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        venue: item.venue || '',
        courses: item.courses?.map(c => c.courseCode).join(', ') || '',
        lecturers: item.lecturers?.map(l => l.name).join(', ') || '',
        department: item.department?.name || '',
        yearSemester: item.yearOfStudy ? `Y${item.yearOfStudy}S${item.semester}` : '-',
        status: item.status || 'scheduled'
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=timetable-${new Date().toISOString().slice(0,10)}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};