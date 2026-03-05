import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import GPAChart from '../../components/charts/gpachart';
import PerformanceChart from '../../components/charts/performancechart';
import Loader from '../../components/common/loader';
import { 
  FiBook, 
  FiAward, 
  FiFile, 
  FiBell, 
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiDownload,
  FiCalendar
} from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subjects: [],
    results: {},
    files: [],
    timetables: [],
    notifications: [],
    unreadCount: 0,
  });

  useEffect(() => {
    if (user?._id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?._id) return;
    try {
      const [subjectsRes, resultsRes, filesRes, timetablesRes, notificationsRes, unreadRes] = await Promise.all([
        api.get('/api/subjects'),
        api.get(`/api/results/student/${user._id}`),
        api.get('/api/files'),
        api.get('/api/timetables/upcoming'),
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count')
      ]);

      setStats({
        subjects: subjectsRes.data.subjects,
        results: resultsRes.data.results,
        files: filesRes.data.files.slice(0, 5),
        timetables: timetablesRes.data.timetables,
        notifications: notificationsRes.data.notifications.slice(0, 5),
        unreadCount: unreadRes.data.count,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPoorGradeSubjects = () => {
    const poorGrades = [];
    Object.keys(stats.results).forEach(semester => {
      stats.results[semester]?.subjects?.forEach(result => {
        if (['C-', 'D+', 'D', 'E'].includes(result.grade)) {
          poorGrades.push(result);
        }
      });
    });
    return poorGrades;
  };

  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;
    
    Object.keys(stats.results).forEach(semester => {
      const sem = stats.results[semester];
      sem?.subjects?.forEach(result => {
        totalCredits += result.subject.credits;
        totalGradePoints += result.subject.credits * result.gradePoint;
      });
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
  };

  const poorGradeSubjects = getPoorGradeSubjects();

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100">
              Student ID: {user?.studentId} | Semester {user?.semester} | {user?.department}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3 backdrop-blur-lg">
              <p className="text-sm opacity-90">Current CGPA</p>
              <p className="text-3xl font-bold">{calculateCGPA()}</p>
            </div>
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
              <p className="text-sm text-gray-500">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-800">{stats.subjects.length}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/student/subjects" className="text-sm text-blue-600 hover:text-blue-800">
              View all subjects →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiAward className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Completed Subjects</p>
              <p className="text-2xl font-bold text-gray-800">
                {Object.keys(stats.results).reduce((acc, sem) => 
                  acc + (stats.results[sem]?.subjects?.length || 0), 0
                )}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/student/results" className="text-sm text-green-600 hover:text-green-800">
              View results →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiFile className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Study Materials</p>
              <p className="text-2xl font-bold text-gray-800">{stats.files.length}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/student/files" className="text-sm text-yellow-600 hover:text-yellow-800">
              Access files →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <FiBell className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Notifications</p>
              <p className="text-2xl font-bold text-gray-800">{stats.unreadCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <button className="text-sm text-red-600 hover:text-red-800">
              View all →
            </button>
          </div>
        </div>
      </div>

      {/* Poor Grade Alert */}
      {poorGradeSubjects.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8">
          <div className="flex">
            <FiAlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Academic Alert - {poorGradeSubjects.length} Subject(s) Need Attention
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-2">You have received low grades in the following subjects:</p>
                <ul className="list-disc list-inside space-y-1">
                  {poorGradeSubjects.map((result, index) => (
                    <li key={index}>
                      {result.subject.name} - Grade: {result.grade} (Semester {result.semester})
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  Please contact your academic advisor for guidance on improving these grades.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiTrendingUp className="mr-2 text-blue-600" />
            GPA Trend
          </h3>
          {Object.keys(stats.results).length > 0 ? (
            <GPAChart data={stats.results} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No GPA data available yet
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiAward className="mr-2 text-green-600" />
            Subject Performance
          </h3>
          {stats.subjects.length > 0 && Object.keys(stats.results).length > 0 ? (
            <PerformanceChart subjects={stats.subjects} results={stats.results} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No performance data available yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiCalendar className="mr-2 text-purple-600" />
              Upcoming Exams
            </h3>
            <Link to="/student/timetables" className="text-sm text-purple-600 hover:text-purple-800">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {stats.timetables.length > 0 ? (
              stats.timetables.map((timetable) => (
                <div key={timetable._id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{timetable.subject?.name}</p>
                      <p className="text-sm text-gray-500">{timetable.subject?.code}</p>
                    </div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded">
                      {timetable.examType}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <FiClock className="mr-1" />
                    <span>
                      {new Date(timetable.date).toLocaleDateString()} at {timetable.startTime}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Venue: {timetable.venue}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No upcoming exams</p>
            )}
          </div>
        </div>

        {/* Recent Files */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiFile className="mr-2 text-blue-600" />
              Recent Study Materials
            </h3>
            <Link to="/student/files" className="text-sm text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {stats.files.length > 0 ? (
              stats.files.map((file) => (
                <div key={file._id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 truncate">{file.originalName}</p>
                    <p className="text-sm text-gray-500">{file.subject?.name}</p>
                  </div>
                  <a
                    href={`${API_URL}/files/download/${file._id}`}
                    className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    download
                  >
                    <FiDownload className="h-5 w-5" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No files available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/student/subjects"
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-all text-center group"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
              <FiBook className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">View Subjects</span>
          </Link>
          <Link
            to="/student/results"
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-all text-center group"
          >
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
              <FiAward className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Check Results</span>
          </Link>
          <Link
            to="/student/files"
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-all text-center group"
          >
            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-200 transition-colors">
              <FiFile className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Study Materials</span>
          </Link>
          <Link
            to="/student/profile"
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition-all text-center group"
          >
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
              <FiBell className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Update Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;