const User = require('../models/user');
const Course = require('../models/course');
const File = require('../models/file');
const Enrollment = require('../models/enrollment');
const Result = require('../models/result');
const Department = require('../models/Department');
const Timetable = require('../models/timetable');

const Activity = require('../models/Activity');

// GET /api/admin/users/stats
exports.getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const lecturers = await User.countDocuments({ role: 'lecturer' });
    const admins = await User.countDocuments({ role: 'admin' });
    const hods = await User.countDocuments({ role: 'hod' });
    const deans = await User.countDocuments({ role: 'dean' });
    const active = await User.countDocuments({ lastLogin: { $ne: null } });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newThisMonth = await User.countDocuments({ createdAt: { $gte: monthStart } });

    res.json({
      stats: { total, students, lecturers, admins, hods, deans, active, newThisMonth }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/admin/users/last-logins
exports.getLastLogins = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ lastLogin: -1 })
      .limit(20)
      .select('name email role lastLogin');

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/admin/activities/recent
exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name role');

    res.json({ activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
    try {
        const total = await User.countDocuments();
        const students = await User.countDocuments({ role: 'student' });
        const lecturers = await User.countDocuments({ role: 'lecturer' });
        const admins = await User.countDocuments({ role: 'admin' });
        const hods = await User.countDocuments({ role: 'hod' });
        const deans = await User.countDocuments({ role: 'dean' });
        const active = await User.countDocuments({ isActive: true });
        
        // Get new users this month
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const newThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

        // Get users by department
        const byDepartment = await User.aggregate([
            { $match: { department: { $exists: true, $ne: null } } },
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                students,
                lecturers,
                admins,
                hods,
                deans,
                active,
                newThisMonth,
                byDepartment: byDepartment.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get course statistics
// @route   GET /api/admin/courses/stats
// @access  Private/Admin
exports.getCourseStats = async (req, res) => {
    try {
        const total = await Course.countDocuments();
        const active = await Course.countDocuments({ status: 'active' });
        
        // Get courses by level
        const byLevel = await Course.aggregate([
            { $group: { _id: '$level', count: { $sum: 1 } } }
        ]);

        // Get courses by department
        const byDepartment = await Course.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        // Get courses by semester
        const bySemester = await Course.aggregate([
            { $group: { _id: '$semester', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                active,
                byLevel: byLevel.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                byDepartment: byDepartment.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                bySemester: bySemester.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting course stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get file statistics
// @route   GET /api/admin/files/stats
// @access  Private/Admin
exports.getFileStats = async (req, res) => {
    try {
        const total = await File.countDocuments();
        
        // Get total file size
        const sizeResult = await File.aggregate([
            { $group: { _id: null, totalSize: { $sum: '$size' } } }
        ]);
        const totalSize = sizeResult.length > 0 ? sizeResult[0].totalSize : 0;

        // Get total downloads
        const downloadsResult = await File.aggregate([
            { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }
        ]);
        const totalDownloads = downloadsResult.length > 0 ? downloadsResult[0].totalDownloads : 0;

        // Get files by type
        const byType = await File.aggregate([
            { $group: { _id: '$fileType', count: { $sum: 1 } } }
        ]);

        // Get files by course
        const byCourse = await File.aggregate([
            { $group: { _id: '$course', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                totalSize,
                totalDownloads,
                byType: byType.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                byCourse: byCourse.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting file stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get enrollment statistics
// @route   GET /api/admin/enrollments/stats
// @access  Private/Admin
exports.getEnrollmentStats = async (req, res) => {
    try {
        const total = await Enrollment.countDocuments();
        const active = await Enrollment.countDocuments({ status: 'active' });
        const completed = await Enrollment.countDocuments({ status: 'completed' });
        const dropped = await Enrollment.countDocuments({ status: 'dropped' });
        
        // Get enrollments by course
        const byCourse = await Enrollment.aggregate([
            { $group: { _id: '$course', count: { $sum: 1 } } }
        ]);

        // Get enrollments by semester
        const bySemester = await Enrollment.aggregate([
            { $group: { _id: '$semester', count: { $sum: 1 } } }
        ]);

        // Get enrollment trends by month
        const byMonth = await Enrollment.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } },
            { $limit: 12 }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                active,
                completed,
                dropped,
                byCourse: byCourse.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                bySemester: bySemester.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                byMonth: byMonth.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting enrollment stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get result statistics
// @route   GET /api/admin/results/stats
// @access  Private/Admin
exports.getResultStats = async (req, res) => {
    try {
        const total = await Result.countDocuments();
        
        // Calculate pass rate
        const passed = await Result.countDocuments({ status: 'passed' });
        const passRate = total > 0 ? (passed / total) * 100 : 0;

        // Calculate average GPA
        const gpaResult = await Result.aggregate([
            { $group: { _id: null, avgGPA: { $avg: '$gpa' } } }
        ]);
        const averageGPA = gpaResult.length > 0 ? gpaResult[0].avgGPA : 0;

        // Get results by grade
        const byGrade = await Result.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } }
        ]);

        // Get results by course
        const byCourse = await Result.aggregate([
            { $group: { _id: '$course', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                passed,
                failed: total - passed,
                passRate: Math.round(passRate * 100) / 100,
                averageGPA: Math.round(averageGPA * 100) / 100,
                byGrade: byGrade.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                byCourse: byCourse.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting result stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get department statistics
// @route   GET /api/admin/departments/stats
// @access  Private/Admin
exports.getDepartmentStats = async (req, res) => {
    try {
        const total = await Department.countDocuments();
        const active = await Department.countDocuments({ status: 'active' });
        
        // Get departments with user counts
        const withUserCounts = await Department.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'department',
                    as: 'users'
                }
            },
            {
                $project: {
                    name: 1,
                    code: 1,
                    userCount: { $size: '$users' }
                }
            }
        ]);

        // Get departments with course counts
        const withCourseCounts = await Department.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: 'department',
                    as: 'courses'
                }
            },
            {
                $project: {
                    name: 1,
                    code: 1,
                    courseCount: { $size: '$courses' }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                active,
                userDistribution: withUserCounts,
                courseDistribution: withCourseCounts
            }
        });
    } catch (error) {
        console.error('Error getting department stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get timetable statistics
// @route   GET /api/admin/timetables/stats
// @access  Private/Admin
exports.getTimetableStats = async (req, res) => {
    try {
        const total = await Timetable.countDocuments();
        
        // Get upcoming events (next 7 days)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcoming = await Timetable.countDocuments({
            date: { $gte: now, $lte: nextWeek }
        });

        // Get exams
        const exams = await Timetable.countDocuments({ type: 'exam' });

        // Get by type
        const byType = await Timetable.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Get by day of week
        const byDay = await Timetable.aggregate([
            {
                $group: {
                    _id: { $dayOfWeek: '$date' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            success: true,
            stats: {
                total,
                upcoming,
                exams,
                byType: byType.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                byDay: byDay.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Error getting timetable stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
