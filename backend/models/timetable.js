const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  },
  semester: {
    type: Number,
    enum: [1, 2]
  },
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'supplementary', 'special', 'practical', 'viva'],
    default: 'final'
  },
  department: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  venue: { type: String, required: true },
}, { timestamps: true });

// Autofill year & semester from subject
timetableSchema.pre('save', async function(next) {
  if ((!this.year || !this.semester) && this.subject) {
    const Subject = mongoose.model('Subject');
    const subject = await Subject.findById(this.subject).select('year semester');
    if (subject) {
      this.year = this.year || subject.year;
      this.semester = this.semester || subject.semester;
    }
  }
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema);