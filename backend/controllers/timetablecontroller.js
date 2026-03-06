const Timetable = require('../models/timetable');
const Subject = require('../models/course');


// @desc    Get upcoming timetables (date >= today)
// @route   GET /api/timetables/upcoming
// @access  Private
exports.getUpcomingTimetables = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const timetables = await Timetable.find({ date: { $gte: today } })
      .populate('subject', 'name code year semester')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all timetables
// @route   GET /api/timetables
// @access  Private
exports.getAllTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find()
      .populate('subject', 'name code year semester')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: timetables.length,
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
      .populate('subject', 'name code year semester');

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    res.json({ success: true, timetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a timetable entry
// @route   POST /api/timetables
// @access  Private
exports.createTimetable = async (req, res, next) => {
  try {
    const { subject, examType, department, date, startTime, endTime, venue } = req.body;

    if (!subject || !department || !date || !startTime || !endTime || !venue) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const timetable = new Timetable({
      subject,
      examType,
      department,
      date,
      startTime,
      endTime,
      venue
    });

    await timetable.save(); // year & semester autofill via pre('save') hook

    const populatedTimetable = await timetable.populate('subject', 'name code year semester');

    res.status(201).json({ success: true, timetable: populatedTimetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a timetable entry
// @route   PUT /api/timetables/:id
// @access  Private
exports.updateTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    const fieldsToUpdate = ['subject', 'examType', 'department', 'date', 'startTime', 'endTime', 'venue'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) timetable[field] = req.body[field];
    });

    await timetable.save(); // pre('save') hook will autofill year/semester if subject changed

    const populatedTimetable = await timetable.populate('subject', 'name code year semester');

    res.json({ success: true, timetable: populatedTimetable });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a timetable entry
// @route   DELETE /api/timetables/:id
// @access  Private
exports.deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    await timetable.deleteOne();

    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
};