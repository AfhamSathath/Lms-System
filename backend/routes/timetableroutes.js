// routes/timetableRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTimetables,
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getTimetablesByDepartment,
  getTimetablesByCourse,
  getTimetablesByLecturer,
  getTimetablesByDate,
  getWeeklyTimetable,
  getUpcomingExams,
  getTimetableConflicts,
  publishTimetable,
  importTimetable,
  exportTimetable
} =  timetableController = require('../controllers/timetablecontroller');

// All routes require authentication
router.use(protect);

// ==================== Basic Timetable Routes ====================

// Get all timetables with filters
router.get('/', getTimetables);

// Get single timetable
router.get('/:id', getTimetable);

// ==================== Filtered Timetable Routes ====================

// Get timetables by department
router.get('/department/:departmentId', 
  (req, res, next) => {
    // HOD can only view their own department
    if (req.user.role === 'hod' && req.user.department?.toString() !== req.params.departmentId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own department.' 
      });
    }
    next();
  },
  getTimetablesByDepartment
);

// Get timetables by course (lecturer/hod/admin)
router.get('/course/:courseId', 
  authorize('lecturer', 'hod', 'admin', 'dean'),
  getTimetablesByCourse
);

// Get timetables by lecturer
router.get('/lecturer/:lecturerId', 
  (req, res, next) => {
    // Lecturers can only view their own timetable
    if (req.user.role === 'lecturer' && req.user.id !== req.params.lecturerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own timetable.' 
      });
    }
    next();
  },
  getTimetablesByLecturer
);

// Get timetables by date
router.get('/date/:date', getTimetablesByDate);

// Get weekly timetable
router.get('/week/:startDate', getWeeklyTimetable);

// ==================== Exam-Specific Routes ====================

// Get upcoming exams
router.get('/exams/upcoming', getUpcomingExams);

// Get exams by department (hod/admin)
router.get('/exams/department/:departmentId', 
  authorize('hod', 'admin', 'dean'),
  async (req, res, next) => {
    try {
      const { departmentId } = req.params;
      const { yearOfStudy, semester, fromDate, toDate } = req.query;
      
      let query = {
        type: 'exam',
        department: departmentId,
        status: { $ne: 'cancelled' }
      };
      
      if (yearOfStudy) query.yearOfStudy = parseInt(yearOfStudy);
      if (semester) query.semester = parseInt(semester);
      
      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) query.date.$lte = new Date(toDate);
      }
      
      const Timetable = require('../models/timetable');
      const exams = await Timetable.find(query)
        .populate('courses', 'courseCode courseName')
        .populate('lecturers', 'name')
        .populate('invigilators', 'name')
        .sort('date startTime');
      
      res.json({
        success: true,
        count: exams.length,
        department: await require('../models/Department').findById(departmentId).select('name'),
        exams
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get exam timetable for a student
router.get('/exams/student', 
  authorize('student'),
  async (req, res, next) => {
    try {
      const { yearOfStudy, semester, department } = req.user;
      
      const Timetable = require('../models/timetable');
      const exams = await Timetable.find({
        type: 'exam',
        yearOfStudy,
        semester,
        department,
        status: { $ne: 'cancelled' },
        isPublished: true,
        date: { $gte: new Date() }
      })
        .populate('courses', 'courseCode courseName')
        .populate('lecturers', 'name')
        .sort('date startTime');
      
      res.json({
        success: true,
        count: exams.length,
        exams
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Class Timetable Routes ====================

// Get class timetable for a student
router.get('/classes/student', 
  authorize('student'),
  async (req, res, next) => {
    try {
      const { yearOfStudy, semester, department } = req.user;
      
      // Get student's enrolled courses
      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.find({
        student: req.user.id,
        enrollmentStatus: 'enrolled'
      }).select('course');
      
      const courseIds = enrollments.map(e => e.course);
      
      const Timetable = require('../models/timetable');
      const classes = await Timetable.find({
        type: { $in: ['class', 'lab', 'tutorial'] },
        $or: [
          { yearOfStudy, semester, department },
          { courses: { $in: courseIds } }
        ],
        status: { $ne: 'cancelled' },
        isPublished: true,
        date: { $gte: new Date() }
      })
        .populate('courses', 'courseCode courseName')
        .populate('lecturers', 'name')
        .sort('date startTime');
      
      // Group by date
      const grouped = classes.reduce((acc, item) => {
        const dateStr = item.date.toISOString().split('T')[0];
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(item);
        return acc;
      }, {});
      
      res.json({
        success: true,
        count: classes.length,
        grouped,
        classes
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get class timetable for a lecturer
router.get('/classes/lecturer', 
  authorize('lecturer'),
  async (req, res, next) => {
    try {
      const Timetable = require('../models/timetable');
      const classes = await Timetable.find({
        type: { $in: ['class', 'lab', 'tutorial'] },
        lecturers: req.user.id,
        status: { $ne: 'cancelled' },
        isPublished: true,
        date: { $gte: new Date() }
      })
        .populate('courses', 'courseCode courseName')
        .populate('department', 'name')
        .sort('date startTime');
      
      // Group by course
      const grouped = {};
      classes.forEach(item => {
        item.courses.forEach(course => {
          const courseId = course._id.toString();
          if (!grouped[courseId]) {
            grouped[courseId] = {
              course: course,
              sessions: []
            };
          }
          grouped[courseId].sessions.push(item);
        });
      });
      
      res.json({
        success: true,
        count: classes.length,
        grouped: Object.values(grouped),
        classes
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Conflict Management Routes ====================

// Get timetable conflicts (admin/hod)
router.get('/conflicts/check', 
  authorize('admin', 'hod', 'dean'),
  getTimetableConflicts
);

// Check venue availability
router.get('/conflicts/venue/:venue', 
  authorize('admin', 'hod'),
  async (req, res, next) => {
    try {
      const { venue } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide a date' 
        });
      }
      
      const Timetable = require('../models/timetable');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const bookings = await Timetable.find({
        venue,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      }).sort('startTime');
      
      // Generate time slots
      const timeSlots = [];
      for (let hour = 8; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const isBooked = bookings.some(b => {
            const start = b.startTime;
            const end = b.endTime;
            return time >= start && time < end;
          });
          
          timeSlots.push({
            time,
            isBooked,
            booking: bookings.find(b => time >= b.startTime && time < b.endTime)
          });
        }
      }
      
      res.json({
        success: true,
        venue,
        date,
        bookings,
        timeSlots
      });
    } catch (error) {
      next(error);
    }
  }
);

// Check lecturer availability
router.get('/conflicts/lecturer/:lecturerId', 
  authorize('admin', 'hod'),
  async (req, res, next) => {
    try {
      const { lecturerId } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide a date' 
        });
      }
      
      const Timetable = require('../models/timetable');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const assignments = await Timetable.find({
        lecturers: lecturerId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      })
        .populate('courses', 'courseCode courseName')
        .sort('startTime');
      
      res.json({
        success: true,
        lecturerId,
        date,
        assignments,
        isAvailable: assignments.length === 0
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Creation/Update Routes ====================

// Create timetable entry (admin/hod/dean)
router.post('/', 
  authorize('admin', 'hod', 'dean'),
  createTimetable
);

// Update timetable entry (admin/hod/dean)
router.put('/:id', 
  authorize('admin', 'hod', 'dean'),
  updateTimetable
);

// Publish timetable (admin/hod)
router.put('/:id/publish', 
  authorize('admin', 'hod'),
  publishTimetable
);

// Cancel timetable entry (admin/hod)
router.put('/:id/cancel', 
  authorize('admin', 'hod'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const Timetable = require('../models/timetable');
      const timetable = await Timetable.findById(id);
      
      if (!timetable) {
        return res.status(404).json({ 
          success: false, 
          message: 'Timetable entry not found' 
        });
      }
      
      await timetable.cancel(reason, req.user.id);
      
      res.json({
        success: true,
        message: 'Timetable entry cancelled successfully',
        timetable
      });
    } catch (error) {
      next(error);
    }
  }
);

// Postpone timetable entry (admin/hod)
router.put('/:id/postpone', 
  authorize('admin', 'hod'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newDate } = req.body;
      
      const Timetable = require('../models/timetable');
      const timetable = await Timetable.findById(id);
      
      if (!timetable) {
        return res.status(404).json({ 
          success: false, 
          message: 'Timetable entry not found' 
        });
      }
      
      await timetable.postpone(new Date(newDate), req.user.id);
      
      res.json({
        success: true,
        message: 'Timetable entry postponed successfully',
        timetable
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete timetable entry (admin only)
router.delete('/:id', 
  authorize('admin'),
  deleteTimetable
);

// ==================== Batch Operation Routes ====================

// Create multiple timetable entries (admin/hod)
router.post('/batch', 
  authorize('admin', 'hod'),
  async (req, res, next) => {
    try {
      const { entries } = req.body;
      
      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide an array of timetable entries' 
        });
      }
      
      const Timetable = require('../models/timetable');
      const created = [];
      const errors = [];
      
      for (const entry of entries) {
        try {
          entry.createdBy = req.user.id;
          const timetable = await Timetable.create(entry);
          created.push(timetable);
        } catch (error) {
          errors.push({
            entry,
            error: error.message
          });
        }
      }
      
      res.status(201).json({
        success: true,
        message: `Created ${created.length} entries`,
        created,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete multiple timetable entries (admin only)
router.delete('/batch', 
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide an array of timetable IDs' 
        });
      }
      
      const Timetable = require('../models/timetable');
      const result = await Timetable.deleteMany({ _id: { $in: ids } });
      
      res.json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} entries`,
        count: result.deletedCount
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Import/Export Routes ====================

// Import timetable from Excel (admin only)
router.post('/import', 
  authorize('admin'),
  (req, res, next) => {
    const multer = require('multer');
    const upload = multer({ dest: 'uploads/' });
    
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ 
          success: false, 
          message: 'File upload failed' 
        });
      }
      next();
    });
  },
  importTimetable
);

// Export timetable to Excel (admin/hod)
router.get('/export/excel', 
  authorize('admin', 'hod', 'dean'),
  exportTimetable
);

// Export timetable to PDF (admin/hod)
router.get('/export/pdf', 
  authorize('admin', 'hod', 'dean'),
  async (req, res, next) => {
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
      
      // Role-based filters
      if (req.user.role === 'hod') {
        query.department = req.user.department;
      } else if (req.user.role === 'dean') {
        query.faculty = req.user.facultyManaged;
      }
      
      const Timetable = require('../models/timetable');
      const timetables = await Timetable.find(query)
        .populate('courses', 'courseCode courseName')
        .populate('lecturers', 'name')
        .populate('department', 'name')
        .sort('date startTime');
      
      // Generate PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=timetable-${new Date().toISOString().slice(0,10)}.pdf`);
      
      doc.pipe(res);
      
      // Add content to PDF
      doc.fontSize(20).text('Timetable Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
      if (fromDate && toDate) {
        doc.text(`Period: ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`);
      }
      doc.moveDown();
      
      // Group by date
      const grouped = {};
      timetables.forEach(item => {
        const dateStr = item.date.toISOString().split('T')[0];
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(item);
      });
      
      // Add table for each date
      Object.keys(grouped).sort().forEach(dateStr => {
        const items = grouped[dateStr];
        const date = new Date(dateStr).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        doc.fontSize(14).font('Helvetica-Bold').text(date);
        doc.moveDown(0.5);
        
        // Table headers
        let y = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Time', 50, y);
        doc.text('Type', 120, y);
        doc.text('Course', 180, y);
        doc.text('Venue', 300, y);
        doc.text('Lecturer', 400, y);
        
        y += 20;
        doc.font('Helvetica');
        
        // Table rows
        items.forEach(item => {
          if (y > 500) {
            doc.addPage();
            y = 50;
          }
          
          doc.text(`${item.startTime} - ${item.endTime}`, 50, y);
          doc.text(item.type, 120, y);
          doc.text(item.courses.map(c => c.courseCode).join(', '), 180, y, { width: 100 });
          doc.text(item.venue, 300, y);
          doc.text(item.lecturers.map(l => l.name).join(', '), 400, y, { width: 150 });
          
          y += 20;
        });
        
        doc.moveDown();
      });
      
      doc.end();
      
    } catch (error) {
      next(error);
    }
  }
);

// ==================== Statistics Routes ====================

// Get timetable statistics (admin/hod/dean)
router.get('/stats/summary', 
  authorize('admin', 'hod', 'dean'),
  async (req, res, next) => {
    try {
      const { fromDate, toDate } = req.query;
      
      let query = {};
      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) query.date.$lte = new Date(toDate);
      }
      
      // Role-based filters
      if (req.user.role === 'hod') {
        query.department = req.user.department;
      } else if (req.user.role === 'dean') {
        query.faculty = req.user.facultyManaged;
      }
      
      const Timetable = require('../models/timetable');
      
      const stats = await Timetable.aggregate([
        { $match: query },
        {
          $facet: {
            byType: [
              { $group: { _id: '$type', count: { $sum: 1 } } }
            ],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            byVenue: [
              { $group: { _id: '$venue', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            daily: [
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ],
            total: [
              { $count: 'count' }
            ]
          }
        }
      ]);
      
      res.json({
        success: true,
        stats: stats[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;