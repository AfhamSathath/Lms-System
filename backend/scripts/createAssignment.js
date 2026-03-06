const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Subject = require('../models/course');
const LecturerAssignment = require('../models/LecturerAssignment');

(async () => {
  try {
    await connectDB();
    const lecturer = await User.findOne({ role: 'lecturer' });
    const subject = await Subject.findOne();
    if (!lecturer || !subject) {
      console.log('missing lecturer or subject');
      process.exit(0);
    }
    console.log('creating assignment for', lecturer._id, subject.code);
    const existing = await LecturerAssignment.findOne({ lecturer: lecturer._id, subject: subject._id, isActive: true });
    if (existing) {
      console.log('assignment already exists');
      process.exit(0);
    }
    const asn = await LecturerAssignment.create({
      lecturer: lecturer._id,
      subject: subject._id,
      department: lecturer.department || 'Computer Science',
      academicYear: subject.year || '1st Year',
      semester: subject.semester || 1,
      startDate: new Date(),
      endDate: new Date(Date.now()+30*24*3600*1000),
      curriculum: { totalLectures:30, totalPracticals:10, totalAssignments:5 },
      qualifications: { minimumQualification: 'B.Tech' }
    });
    console.log('assignment created', asn._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();