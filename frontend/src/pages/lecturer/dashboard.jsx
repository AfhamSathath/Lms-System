import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import {
  FiBook,
  FiUsers,
  FiFile,
  FiCalendar,
  FiTrendingUp,
  FiUpload,
  FiChevronRight
} from 'react-icons/fi';

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subjects: [],
    files: [],
    students: [],
    upcomingExams: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [subjectsRes, filesRes] = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/files')
      ]);

      setStats({
        subjects: subjectsRes.data.subjects,
        files: filesRes.data.files,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="p-6">
      <div className="container mx-auto">
        {/* Welcome Section */}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, Prof. {user?.name?.split(' ')[0]}! 📚
              </h1>
              <p className="text-green-100">
                Lecturer ID: {user?.lecturerId} | Department: {user?.department}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/lecturer/files"
                className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium inline-flex items-center shadow-lg"
              >
                <FiUpload className="mr-2" />
                Upload Materials
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiBook className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">My Subjects</p>
                <p className="text-2xl font-bold text-gray-800">{stats.subjects.length}</p>
              </div>
            </div>
            <Link to="/lecturer/subjects" className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
              Manage <FiChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiFile className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Materials Uploaded</p>
                <p className="text-2xl font-bold text-gray-800">{stats.files.length}</p>
              </div>
            </div>
            <Link to="/lecturer/files" className="mt-4 text-sm text-green-600 hover:text-green-800 font-medium flex items-center">
              View <FiChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiUsers className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Students</p>
                <p className="text-2xl font-bold text-gray-800">{stats.subjects.reduce((sum, s) => sum + (s.enrolledStudents || 0), 0)}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-yellow-600">
              Across all subjects
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiCalendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Upcoming Exams</p>
                <p className="text-2xl font-bold text-gray-800">3</p>
              </div>
            </div>
            <Link to="/lecturer/timetable" className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center">
              View Schedule <FiChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* My Subjects */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">My Subjects</h2>
            <Link to="/lecturer/subjects" className="text-green-600 hover:text-green-800">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.subjects.map(subject => (
              <div key={subject._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800">{subject.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{subject.code}</p>
                <div className="flex items-center mt-3 text-sm text-gray-600">
                  <FiUsers className="mr-2" />
                  <span>Semester {subject.semester}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/lecturer/files"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center group"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <FiUpload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Upload Materials</h3>
            <p className="text-sm text-gray-500">Share lecture notes and resources</p>
          </Link>

          <Link
            to="/lecturer/subjects"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center group"
          >
            <div className="bg-green-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <FiBook className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">View Subjects</h3>
            <p className="text-sm text-gray-500">Manage your course materials</p>
          </Link>

          <Link
            to="/lecturer/profile"
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-center group"
          >
            <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <FiTrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Update Profile</h3>
            <p className="text-sm text-gray-500">Manage your personal information</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;