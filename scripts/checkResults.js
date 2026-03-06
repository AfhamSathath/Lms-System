// quick script to inspect student results
const mongoose = require('mongoose');
const connectDB = require('../backend/config/database');
const User = require('../backend/models/User');
const Result = require('../backend/models/result');

(async () => {
  try {
    await connectDB();
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('no student found');
      process.exit(0);
    }
    console.log('found student', student._id.toString(), student.name, student.studentId);
    const results = await Result.find({ student: student._id }).populate('subject');
    console.log('results count', results.length);
    results.forEach(r => {
      console.log(`${r.year}-S${r.semester} ${r.subject?.code} marks:${r.marks} grade:${r.grade}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();