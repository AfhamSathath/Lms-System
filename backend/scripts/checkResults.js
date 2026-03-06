// quick script to inspect student results
const mongoose = require('mongoose');
const connectDB = require('../config/database');
// register Subject model for populates
require('../models/course');
const User = require('../models/User');
const Result = require('../models/result');

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

    // if no results, insert a sample one for testing purposes
    if (results.length === 0) {
      const Subject = require('../models/course');
      const subj = await Subject.findOne();
      if (subj) {
        console.log('inserting sample result for subject', subj.code);
        const newResult = await Result.create({
          student: student._id,
          subject: subj._id,
          year: subj.year || '1st Year',
          semester: subj.semester || 1,
          examType: 'final',
          marks: 75,
          publishedBy: student._id // just reuse student as publisher for testing
        });
        console.log('created result', newResult._id);
        const updated = await Result.find({ student: student._id }).populate('subject');
        console.log('now have', updated.length, 'results');
      }
    }

    // directly call controller to see returned payload
    const resultController = require('../controllers/resultcontroller');
    const fakeReq = { params: { studentId: student._id } };
    const fakeRes = {
      json: (data) => console.log('controller returned:', JSON.stringify(data, null, 2)),
      status: function(code) { this._status = code; return this; }
    };
    await resultController.getStudentResults(fakeReq, fakeRes, (err)=>{ if(err) console.error('controller error', err); });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();