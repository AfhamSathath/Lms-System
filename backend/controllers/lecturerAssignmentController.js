const LecturerAssignment = require('../models/LecturerAssignment');
const User = require('../models/user');
const Subject = require('../models/course');
const Department = require('../models/Department');

/* =====================================================
   Assign Lecturer to Subject
===================================================== */
// controllers/lecturerAssignmentController.js
const mongoose = require('mongoose');


exports.assignLecturerToSubject = async (req, res) => {
  try {
    console.log('Assign Lecturer Request Body:', req.body);
    const { lecturerId, departmentId, subjectId } = req.body;

    // Validate required fields
    if (!lecturerId || !departmentId || !subjectId) {
      console.log('Missing fields:', { lecturerId, departmentId, subjectId });
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        received: { lecturerId, departmentId, subjectId }
      });
    }

    // Check if Lecturer exists
    const lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      console.log('Lecturer not found for ID:', lecturerId);
      return res.status(404).json({
        success: false,
        message: `Lecturer with ID ${lecturerId} not found`
      });
    }

    // Check if Subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      console.log('Subject not found for ID:', subjectId);
      return res.status(404).json({
        success: false,
        message: `Subject with ID ${subjectId} not found`
      });
    }

    // Use department string directly
    const departmentName = departmentId;
    const academicYear = subject.year || req.body.academicYear;
    const semester = subject.semester || Number(req.body.semester);

    // Check if this specific assignment already exists
    const existing = await LecturerAssignment.findOne({
      lecturer: lecturer._id,
      subject: subject._id,
      department: departmentName,
      academicYear: academicYear,
      semester: semester,
      isActive: true
    });

    if (existing) {
      console.log('Existing assignment found:', existing._id);
      return res.status(400).json({
        success: false,
        message: `Lecturer is already assigned to this subject in this department for ${academicYear}, Semester ${semester}`
      });
    }

    // Create new assignment
    const newAssignment = new LecturerAssignment({
      lecturer: lecturer._id,
      subject: subject._id,
      department: departmentName,
      academicYear: academicYear,
      semester: semester,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      curriculum: {
        totalLectures: Number(req.body.curriculum?.totalLectures || 30),
        totalPracticals: Number(req.body.curriculum?.totalPracticals || 0),
        totalAssignments: Number(req.body.curriculum?.totalAssignments || 0)
      },
      qualifications: req.body.qualifications,
      notes: req.body.notes
    });

    await newAssignment.save();

    console.log('Assignment created successfully:', newAssignment._id);
    res.status(201).json({
      success: true,
      message: 'Lecturer assigned successfully',
      assignment: newAssignment
    });
  } catch (err) {
    console.error('Error assigning lecturer:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};

/* =====================================================
   Get Lecturer's Assigned Subjects
===================================================== */
exports.getLecturerSubjects = async (req, res, next) => {
  try {
    const { lecturerId } = req.params;
    const { semester, academicYear } = req.query;

    // ensure lecturer only sees their own data unless admin
    if (req.user.role !== 'admin' && req.user.id !== lecturerId && req.user._id.toString() !== lecturerId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Build filter
    const filter = {
      lecturer: lecturerId,
      isActive: true
    };

    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    // Get assignments
    const assignments = await LecturerAssignment.find(filter)
      .populate('subject', 'name code credits semester')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching lecturer subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lecturer subjects',
      error: error.message
    });
  }
};

/* =====================================================
   Get Department Assignments
===================================================== */
exports.getDepartmentAssignments = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { semester, academicYear } = req.query;

    // Build filter
    const filter = {
      department: departmentId,
      isActive: true
    };

    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;

    // Get assignments grouped by subject
    const assignments = await LecturerAssignment.find(filter)
      .populate('lecturer', 'name email lecturerId department')
      .populate('subject', 'name code credits')
      .sort({ subject: 1, createdAt: -1 });

    // Group by subject
    const groupedBySubject = {};
    assignments.forEach(assignment => {
      const subjectName = assignment.subject?.name || 'Unknown';
      if (!groupedBySubject[subjectName]) {
        groupedBySubject[subjectName] = [];
      }
      groupedBySubject[subjectName].push(assignment);
    });

    res.status(200).json({
      success: true,
      count: assignments.length,
      groupedBySubject,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching department assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department assignments',
      error: error.message
    });
  }
};

/* =====================================================
   Update Assignment Progress
===================================================== */
exports.updateAssignmentProgress = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { lecturesCompleted, practicalsCompleted, assignmentsCompleted } = req.body;

    // Find assignment
    const assignment = await LecturerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // ensure only the assigned lecturer or admin can update
    if (req.user.role !== 'admin' && assignment.lecturer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this assignment' });
    }

    // Update curriculum progress
    if (lecturesCompleted !== undefined) assignment.curriculum.lecturesCompleted = lecturesCompleted;
    if (practicalsCompleted !== undefined) assignment.curriculum.practicalsCompleted = practicalsCompleted;
    if (assignmentsCompleted !== undefined) assignment.curriculum.assignmentsCompleted = assignmentsCompleted;

    // Calculate progress percentage
    const totalItems = assignment.curriculum.totalLectures +
      assignment.curriculum.totalPracticals +
      assignment.curriculum.totalAssignments;
    const completedItems = assignment.curriculum.lecturesCompleted +
      assignment.curriculum.practicalsCompleted +
      assignment.curriculum.assignmentsCompleted;

    assignment.curriculum.progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Auto-mark as completed at 100%
    if (assignment.curriculum.progressPercentage === 100 && assignment.status !== 'completed') {
      assignment.status = 'completed';
    }

    // Save assignment
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment progress updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment progress',
      error: error.message
    });
  }
};

/* =====================================================
   Update Assignment Status
===================================================== */
exports.updateAssignmentStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['assigned', 'active', 'completed', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update assignment
    const assignment = await LecturerAssignment.findByIdAndUpdate(
      assignmentId,
      { status },
      { new: true, runValidators: true }
    ).populate('lecturer subject department');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Assignment status updated to ${status}`,
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment status',
      error: error.message
    });
  }
};

/* =====================================================
   Verify Lecturer Qualification
===================================================== */
exports.verifyQualification = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { qualificationProof, isVerified } = req.body;

    // Find assignment
    const assignment = await LecturerAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Update qualification verification
    if (qualificationProof) {
      assignment.qualificationVerification = {
        proof: qualificationProof,
        verifiedAt: isVerified ? new Date() : null,
        isVerified: !!isVerified
      };
    }

    // Save assignment
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Qualification verification updated',
      data: assignment
    });
  } catch (error) {
    console.error('Error verifying qualification:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying qualification',
      error: error.message
    });
  }
};

/* =====================================================
   Get All Assignments (Admin)
===================================================== */
exports.getAllAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, semester, academicYear, department } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (department) filter.department = department;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const total = await LecturerAssignment.countDocuments(filter);

    // Get assignments
    const assignments = await LecturerAssignment.find(filter)
      .populate('lecturer', 'name email lecturerId department')
      .populate('subject', 'name code credits')
      .populate('department', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

/* =====================================================
   Delete Assignment
===================================================== */
exports.deleteAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;

    // Soft delete by setting isActive to false
    const assignment = await LecturerAssignment.findByIdAndUpdate(
      assignmentId,
      { isActive: false },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
};
