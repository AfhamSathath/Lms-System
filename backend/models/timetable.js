const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8,
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
  },
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'supplementary'],
    required: [true, 'Exam type is required'],
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
  },
  date: {
    type: Date,
    required: [true, 'Exam date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time (HH:MM)'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time (HH:MM)'],
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validate that end time is after start time
timetableSchema.pre('save', function(next) {
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (startTotal >= endTotal) {
    return next(new Error('End time must be after start time'));
  }
  next();
});

// Ensure no overlapping exams
timetableSchema.index({ date: 1, venue: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);