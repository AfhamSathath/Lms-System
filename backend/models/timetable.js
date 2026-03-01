const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Timetable type is required'],
    enum: ['exam', 'class', 'event', 'lab', 'tutorial'],
    default: 'exam'
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  yearOfStudy: {
    type: Number,
    required: [true, 'Year of study is required'],
    min: 1,
    max: 5
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 2
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'supplementary', 'special', 'practical', 'viva']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  duration: {
    type: Number,
    min: 1,
    max: 480
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true,
    toUpperCase: true
  },
  building: String,
  roomNumber: String,
  capacity: {
    type: Number,
    min: 1,
    max: 1000
  },
  lecturers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  invigilators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recurrence: {
    pattern: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'biweekly', 'monthly']
    },
    interval: Number,
    endDate: Date,
    occurrences: Number,
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable'
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  cancellationReason: String,
  postponedTo: Date,
  attendance: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused']
    },
    markedAt: Date,
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  resources: [{
    name: String,
    type: {
      type: String,
      enum: ['document', 'link', 'video', 'presentation']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
timetableSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for time range
timetableSchema.virtual('timeRange').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual for is ongoing
timetableSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  const [startH, startM] = this.startTime.split(':');
  const [endH, endM] = this.endTime.split(':');
  
  const startDateTime = new Date(this.date);
  startDateTime.setHours(parseInt(startH), parseInt(startM), 0);
  
  const endDateTime = new Date(this.date);
  endDateTime.setHours(parseInt(endH), parseInt(endM), 0);
  
  return now >= startDateTime && now <= endDateTime;
});

// Pre-save middleware
timetableSchema.pre('save', function(next) {
  const [startH, startM] = this.startTime.split(':').map(Number);
  const [endH, endM] = this.endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (startTotal >= endTotal) {
    return next(new Error('End time must be after start time'));
  }

  this.duration = endTotal - startTotal;
  this.updatedAt = new Date();

  const venueParts = this.venue.split('-');
  if (venueParts.length >= 2) {
    this.building = venueParts[0];
    this.roomNumber = venueParts[1];
  }

  next();
});

// Indexes for efficient queries
timetableSchema.index({ date: 1, startTime: 1 });
timetableSchema.index({ department: 1, yearOfStudy: 1, semester: 1 });
timetableSchema.index({ faculty: 1, date: 1 });
timetableSchema.index({ courses: 1 });
timetableSchema.index({ lecturers: 1 });
timetableSchema.index({ type: 1, status: 1 });
timetableSchema.index({ isPublished: 1, date: 1 });
timetableSchema.index({ venue: 1, date: 1 });

// Compound unique index to prevent scheduling conflicts
timetableSchema.index(
  { date: 1, venue: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

module.exports = mongoose.model('Timetable', timetableSchema);