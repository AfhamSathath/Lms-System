const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(options) {
    const mailOptions = {
      from: `"University Management System" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(user, password) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to University Management System</h2>
        <p>Dear ${user.name},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          ${user.studentId ? `<p><strong>Student ID:</strong> ${user.studentId}</p>` : ''}
          ${user.employeeId ? `<p><strong>Employee ID:</strong> ${user.employeeId}</p>` : ''}
        </div>
        <p>Please change your password after first login.</p>
        <p>Login here: <a href="${process.env.CLIENT_URL}/login">${process.env.CLIENT_URL}/login</a></p>
        <p>Best regards,<br>University Management System Team</p>
      </div>
    `;

    return await this.sendEmail({
      email: user.email,
      subject: 'Welcome to University Management System',
      html
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear ${user.name},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 10 minutes.</p>
        <p>Best regards,<br>University Management System Team</p>
      </div>
    `;

    return await this.sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html
    });
  }

  async sendEnrollmentConfirmation(student, course) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Enrollment Confirmation</h2>
        <p>Dear ${student.name},</p>
        <p>You have been successfully enrolled in the following course:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Course Code:</strong> ${course.courseCode}</p>
          <p><strong>Course Name:</strong> ${course.courseName}</p>
          <p><strong>Credits:</strong> ${course.credits}</p>
          <p><strong>Academic Year:</strong> ${course.academicYear}</p>
          <p><strong>Semester:</strong> ${course.semester}</p>
        </div>
        <p>Best regards,<br>Academic Affairs Office</p>
      </div>
    `;

    return await this.sendEmail({
      email: student.email,
      subject: 'Course Enrollment Confirmation',
      html
    });
  }

  async sendGradeNotification(student, enrollment) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Grade Notification</h2>
        <p>Dear ${student.name},</p>
        <p>Your grade for the following course has been published:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Course:</strong> ${enrollment.course.courseName}</p>
          <p><strong>Course Code:</strong> ${enrollment.course.courseCode}</p>
          <p><strong>Total Marks:</strong> ${enrollment.totalMarks}</p>
          <p><strong>Grade:</strong> ${enrollment.grade}</p>
          <p><strong>Grade Points:</strong> ${enrollment.gradePoints}</p>
        </div>
        <p>You can view your full transcript in the student portal.</p>
        <p>Best regards,<br>Examinations Department</p>
      </div>
    `;

    return await this.sendEmail({
      email: student.email,
      subject: 'Grade Published',
      html
    });
  }
}

module.exports = new EmailService();