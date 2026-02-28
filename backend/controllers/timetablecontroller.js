const Timetable = require('../models/timetable');
const Subject = require('../models/subject');
const Notification = require('../models/notification');
const User = require('../models/user');

// Get all timetables
exports.getTimetables = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.semester = req.user.semester;
      query.department = req.user.department;
    }

    const timetables = await Timetable.find(query)
      .populate('subject', 'name code')
      .populate('createdBy', 'name')
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, count: timetables.length, timetables });
  } catch (error) {
    next(error);
  }
};

// Get single timetable
exports.getTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name');

    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};

// Create timetable
exports.createTimetable = async (req, res, next) => {
  try {
    req.body.semester = Number(req.body.semester);

    const timetable = await Timetable.create({ ...req.body, createdBy: req.user.id });
    await timetable.populate('subject', 'name code');

    const students = await User.find({
      role: 'student',
      semester: timetable.semester,
      department: timetable.department,
    });
    const lecturers = await User.find({
      role: 'lecturer',
      department: timetable.department,
    });

    const notifications = [...students, ...lecturers].map(user => ({
      user: user._id,
      title: 'New Exam Schedule',
      message: `${timetable.examType} exam for ${timetable.subject.name} scheduled on ${new Date(timetable.date).toLocaleDateString()}`,
      type: 'timetable',
      metadata: { timetableId: timetable._id },
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ success: true, timetable });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Exam schedule conflict: Another exam is already scheduled at this time and venue' });
    }
    next(error);
  }
};

// Update timetable
exports.updateTimetable = async (req, res, next) => {
  try {
    req.body.semester = Number(req.body.semester);

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('subject', 'name code');

    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });

    const students = await User.find({
      role: 'student',
      semester: timetable.semester,
      department: timetable.department,
    });
    const lecturers = await User.find({
      role: 'lecturer',
      department: timetable.department,
    });

    const notifications = [...students, ...lecturers].map(user => ({
      user: user._id,
      title: 'Exam Schedule Updated',
      message: `${timetable.examType} exam for ${timetable.subject.name} has been updated`,
      type: 'timetable',
      priority: 'high',
      metadata: { timetableId: timetable._id },
    }));

    await Notification.insertMany(notifications);

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};

// Delete timetable
exports.deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });

    await timetable.deleteOne();
    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get timetables by semester
exports.getTimetablesBySemester = async (req, res, next) => {
  try {
    const timetables = await Timetable.find({ semester: Number(req.params.semester) })
      .populate('subject', 'name code')
      .sort({ date: 1 });

    res.json({ success: true, timetables });
  } catch (error) {
    next(error);
  }
};

// Get upcoming exams
exports.getUpcomingExams = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timetables = await Timetable.find({
      date: { $gte: today },
      ...(req.user.role === 'student' && {
        semester: req.user.semester,
        department: req.user.department,
      }),
    })
      .populate('subject', 'name code')
      .sort({ date: 1, startTime: 1 })
      .limit(10);

    res.json({ success: true, timetables });
  } catch (error) {
    next(error);
  }
};