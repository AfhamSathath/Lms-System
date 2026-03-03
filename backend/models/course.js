// models/course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },

  subjectName: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    required: true,
    unique: true,
  },
  credits: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Theory', 'Practical', 'Elective', 'Optional'], // Example categories
  },
  lecturer: {
    type: String, // Could be ObjectId reference if you have a Lecturer model
  },
  description: {
    type: String,
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt
});

module.exports = mongoose.model('Course', courseSchema);