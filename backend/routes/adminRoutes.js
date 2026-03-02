// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');
const {
    getUserStats,
    getCourseStats,
    getFileStats,
    getEnrollmentStats,
    getResultStats,
    getDepartmentStats,
    getTimetableStats,
    getRecentActivities,
    getLastLogins
} = admincontroller = require('../controllers/adminController');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// ==================== STATS ROUTES (Your existing routes) ====================
router.get('/users/stats', getUserStats);
router.get('/courses/stats', getCourseStats);
router.get('/files/stats', getFileStats);
router.get('/enrollments/stats', getEnrollmentStats);
router.get('/results/stats', getResultStats);
router.get('/departments/stats', getDepartmentStats);
router.get('/timetables/stats', getTimetableStats);
router.get('/users/last-logins', getLastLogins);
router.get('/activities/recent', getRecentActivities);

// Dashboard summary route
router.get('/dashboard-summary', async (req, res, next) => {
    try {
        const [
            userStats,
            courseStats,
            enrollmentStats,
            recentActivities
        ] = await Promise.all([
            getUserStats(req, res, () => {}),
            getCourseStats(req, res, () => {}),
            getEnrollmentStats(req, res, () => {}),
            getRecentActivities(req, res, () => {})
        ]);

        res.json({
            success: true,
            summary: {
                users: userStats,
                courses: courseStats,
                enrollments: enrollmentStats,
                activities: recentActivities
            }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== USER MANAGEMENT ROUTES (Add these) ====================

/**
 * @desc    Get all users with filters
 * @route   GET /admin/users
 * @access  Private/Admin
 */
router.get('/users', async (req, res) => {
    try {
        const { role, department, year, status, search, page = 1, limit = 50 } = req.query;
        
        // Build filter object
        let filter = {};
        if (role && role !== 'all') filter.role = role;
        if (department && department !== 'all') filter.department = department;
        if (year && year !== 'all') filter.yearOfStudy = parseInt(year);
        if (status && status !== 'all') filter.isActive = status === 'active';
        
        // Search functionality
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { lecturerId: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get users
        const users = await User.find(filter)
            .select('-password')
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
        const total = await User.countDocuments(filter);
        
        // Get all departments for filter dropdown
        const departments = await User.distinct('department', { department: { $ne: null } });
        
        res.json({
            success: true,
            users,
            departments: departments.filter(d => d),
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

/**
 * @desc    Get single user by ID
 * @route   GET /admin/users/:id
 * @access  Private/Admin
 */
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

/**
 * @desc    Create new user
 * @route   POST /admin/users
 * @access  Private/Admin
 */
router.post('/users',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['student', 'lecturer', 'hod', 'dean', 'admin']).withMessage('Invalid role'),
        body('studentId').if(body('role').equals('student')).notEmpty().withMessage('Student ID required'),
        body('lecturerId').if(body('role').equals('lecturer')).notEmpty().withMessage('Lecturer ID required'),
        body('department').if(body('role').not().equals('admin')).notEmpty().withMessage('Department required'),
        body('yearOfStudy').if(body('role').equals('student')).isInt({ min: 1, max: 5 }).withMessage('Valid year required'),
        body('semester').if(body('role').equals('student')).isInt({ min: 1, max: 2 }).withMessage('Valid semester required')
    ],
    async (req, res) => {
        try {
            const { email, studentId, lecturerId } = req.body;
            
            // Check if user exists
            const existingUser = await User.findOne({
                $or: [
                    { email },
                    ...(studentId ? [{ studentId }] : []),
                    ...(lecturerId ? [{ lecturerId }] : [])
                ]
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email or ID already exists'
                });
            }
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
            
            // Create user
            const user = await User.create(req.body);
            
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    studentId: user.studentId,
                    lecturerId: user.lecturerId,
                    department: user.department,
                    yearOfStudy: user.yearOfStudy,
                    semester: user.semester,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: error.message
            });
        }
    }
);

/**
 * @desc    Update user
 * @route   PUT /admin/users/:id
 * @access  Private/Admin
 */
router.put('/users/:id', async (req, res) => {
    try {
        const { password, ...updateData } = req.body;
        
        // If password is provided, hash it
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        
        // Check if email/ID is being changed and if it's already taken
        if (updateData.email || updateData.studentId || updateData.lecturerId) {
            const existingUser = await User.findOne({
                _id: { $ne: req.params.id },
                $or: [
                    ...(updateData.email ? [{ email: updateData.email }] : []),
                    ...(updateData.studentId ? [{ studentId: updateData.studentId }] : []),
                    ...(updateData.lecturerId ? [{ lecturerId: updateData.lecturerId }] : [])
                ]
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email or ID already taken by another user'
                });
            }
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

/**
 * @desc    Delete user
 * @route   DELETE /admin/users/:id
 * @access  Private/Admin
 */
router.delete('/users/:id', async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }
        
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

/**
 * @desc    Toggle user status (activate/deactivate)
 * @route   PUT /admin/users/:id/toggle-status
 * @access  Private/Admin
 */
router.put('/users/:id/toggle-status', async (req, res) => {
    try {
        // Prevent toggling your own status
        if (req.params.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot toggle your own status'
            });
        }
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        user.isActive = !user.isActive;
        await user.save();
        
        res.json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: user.isActive
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle user status',
            error: error.message
        });
    }
});

/**
 * @desc    Bulk import users
 * @route   POST /admin/users/bulk-import
 * @access  Private/Admin
 */
router.post('/users/bulk-import', async (req, res) => {
    try {
        const { users } = req.body;
        
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of users'
            });
        }
        
        const results = {
            successful: [],
            failed: []
        };
        
        for (const userData of users) {
            try {
                // Check if user exists
                const existingUser = await User.findOne({
                    $or: [
                        { email: userData.email },
                        ...(userData.studentId ? [{ studentId: userData.studentId }] : []),
                        ...(userData.lecturerId ? [{ lecturerId: userData.lecturerId }] : [])
                    ]
                });
                
                if (existingUser) {
                    results.failed.push({
                        email: userData.email,
                        reason: 'User already exists'
                    });
                    continue;
                }
                
                // Hash password
                if (userData.password) {
                    const salt = await bcrypt.genSalt(10);
                    userData.password = await bcrypt.hash(userData.password, salt);
                }
                
                // Create user
                const user = await User.create(userData);
                results.successful.push({
                    _id: user._id,
                    name: user.name,
                    email: user.email
                });
            } catch (error) {
                results.failed.push({
                    email: userData.email,
                    reason: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `Successfully imported ${results.successful.length} users`,
            results
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk import users',
            error: error.message
        });
    }
});

/**
 * @desc    Get all departments
 * @route   GET /admin/departments
 * @access  Private/Admin
 */
router.get('/departments', async (req, res) => {
    try {
        const departments = await User.distinct('department', { department: { $ne: null } });
        res.json({
            success: true,
            departments: departments.filter(d => d)
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch departments',
            error: error.message
        });
    }
});

/**
 * @desc    Export users data
 * @route   GET /admin/users/export
 * @access  Private/Admin
 */
router.get('/users/export/csv', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .lean();
        
        // Format for CSV
        const csvData = users.map(user => ({
            Name: user.name,
            Email: user.email,
            Role: user.role,
            'Student/Employee ID': user.studentId || user.lecturerId || 'N/A',
            Department: user.department || 'N/A',
            'Year of Study': user.yearOfStudy || 'N/A',
            Semester: user.semester || 'N/A',
            Phone: user.phone || 'N/A',
            Gender: user.gender || 'N/A',
            Status: user.isActive ? 'Active' : 'Inactive',
            'Created At': user.createdAt,
            'Last Login': user.lastLogin || 'Never'
        }));
        
        res.json({
            success: true,
            users: csvData
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export users',
            error: error.message
        });
    }
});

module.exports = router;