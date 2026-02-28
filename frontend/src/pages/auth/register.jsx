import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiBook, 
  FiHash,
  FiEye,
  FiEyeOff,
  FiArrowLeft
} from 'react-icons/fi';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    lecturerId: '',
    department: '',
    semester: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        alert('Please fill in all fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.role === 'student' && (!formData.studentId || !formData.semester)) {
      alert('Please fill in all student details');
      return;
    }
    
    if (formData.role === 'lecturer' && !formData.lecturerId) {
      alert('Please fill in lecturer ID');
      return;
    }

    if (!formData.department) {
      alert('Please select department');
      return;
    }

    setLoading(true);
    const registerData = { ...formData };
    delete registerData.confirmPassword;
    
    const result = await register(registerData);
    setLoading(false);
    
    if (result.success) {
      navigate(`/${result.role}/dashboard`);
    }
  };

  const departments = [
    'Computer Science',
    'Information Technology',
    'Engineering',
    'Business Administration',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white bg-opacity-20 backdrop-blur-lg mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
              <FiUser className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-2">
            Create Account
          </h2>
          <p className="text-lg text-white text-opacity-90">
            Join our Learning Management System
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white text-opacity-80">
              Step {step} of 2
            </span>
            <span className="text-sm text-white text-opacity-80">
              {step === 1 ? 'Basic Information' : 'Role Details'}
            </span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-white mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-white text-opacity-60" />
                    </div>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-white text-opacity-60" />
                    </div>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-white text-opacity-60" />
                    </div>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-white text-opacity-60 hover:text-opacity-100" />
                      ) : (
                        <FiEye className="h-5 w-5 text-white text-opacity-60 hover:text-opacity-100" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-white mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-white text-opacity-60" />
                    </div>
                    <input
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-white text-opacity-60 hover:text-opacity-100" />
                      ) : (
                        <FiEye className="h-5 w-5 text-white text-opacity-60 hover:text-opacity-100" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="reg-role" className="block text-sm font-medium text-white mb-2">
                    Role
                  </label>
                  <select
                    id="reg-role"
                    name="role"
                    autoComplete="off"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    <option value="student" className="bg-gray-800">Student</option>
                    <option value="lecturer" className="bg-gray-800">Lecturer</option>
                  </select>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div>
                      <label htmlFor="reg-student-id" className="block text-sm font-medium text-white mb-2">
                        Student ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiHash className="h-5 w-5 text-white text-opacity-60" />
                        </div>
                        <input
                          id="reg-student-id"
                          name="studentId"
                          type="text"
                          autoComplete="off"
                          required
                          value={formData.studentId}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                          placeholder="Enter student ID"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-semester" className="block text-sm font-medium text-white mb-2">
                        Semester
                      </label>
                      <select
                        id="reg-semester"
                        name="semester"
                        autoComplete="off"
                        value={formData.semester}
                        onChange={handleChange}
                        required
                        className="block w-full px-4 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      >
                        <option value="" className="bg-gray-800">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={sem} className="bg-gray-800">
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.role === 'lecturer' && (
                  <div>
                    <label htmlFor="reg-lecturer-id" className="block text-sm font-medium text-white mb-2">
                      Lecturer ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiHash className="h-5 w-5 text-white text-opacity-60" />
                      </div>
                      <input
                        id="reg-lecturer-id"
                        name="lecturerId"
                        type="text"
                        autoComplete="off"
                        required
                        value={formData.lecturerId}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        placeholder="Enter lecturer ID"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="reg-department" className="block text-sm font-medium text-white mb-2">
                    Department
                  </label>
                  <select
                    id="reg-department"
                    name="department"
                    autoComplete="off"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 border border-white border-opacity-20 rounded-lg bg-white bg-opacity-10 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    <option value="" className="bg-gray-800">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept} className="bg-gray-800">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex space-x-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 flex justify-center items-center py-3 px-4 border border-white border-opacity-20 rounded-lg shadow-sm text-sm font-medium text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <FiArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </button>
              )}
              
              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-white hover:text-opacity-80">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;