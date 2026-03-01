const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Faculty name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Faculty code is required'],
    unique: true,
    toUpperCase: true,
    trim: true
  },
  dean: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  associateDeans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  contactEmail: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid phone number']
  },
  officeLocation: String,
  establishedYear: Number,
  description: String,
  vision: String,
  mission: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for departments
facultySchema.virtual('departments', {
  ref: 'Department',
  foreignField: 'faculty',
  localField: '_id'
});

facultySchema.index({ name: 1 });
facultySchema.index({ code: 1 });

module.exports = mongoose.model('Faculty', facultySchema);