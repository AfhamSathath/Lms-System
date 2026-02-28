import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiUsers, FiBook, FiFile, FiUserPlus } from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    lecturers: 0,
    subjects: 0,
    files: 0,
    recentActivities: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, lecturersRes, subjectsRes, filesRes] = await Promise.all([
        api.get('/users?role=student'),
        api.get('/users?role=lecturer'),
        api.get('/subjects'),
        api.get('/files')
      ]);

      setStats({
        students: studentsRes.data.count,
        lecturers: lecturersRes.data.count,
        subjects: subjectsRes.data.count,
        files: filesRes.data.count,
        recentActivities: []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const userDistributionData = {
    labels: ['Students', 'Lecturers'],
    datasets: [{
      data: [stats.students, stats.lecturers],
      backgroundColor: ['#3B82F6', '#10B981'],
      borderColor: ['#2563EB', '#059669'],
      borderWidth: 1
    }]
  };

  const resourceData = {
    labels: ['Subjects', 'Files'],
    datasets: [{
      data: [stats.subjects, stats.files],
      backgroundColor: ['#F59E0B', '#EF4444'],
      borderColor: ['#D97706', '#DC2626'],
      borderWidth: 1
    }]
  };

  return (
    <div
      className={`container mx-auto px-4 py-8 transition-all duration-300`}
      style={{ marginLeft: sidebarOpen ? 208 : 64 }} // matches sidebar width (w-52 / w-16)
    >
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 truncate">
              Welcome back, Admin {user?.name}! 👋
            </h1>
            <p className="text-purple-100 truncate">
              Manage your LMS system efficiently
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              to="/admin/users"
              className="bg-white text-purple-600 px-5 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium inline-flex items-center whitespace-nowrap"
            >
              <FiUserPlus className="mr-2" />
              Add New User
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Students', value: stats.students, icon: <FiUsers className="h-8 w-8 text-blue-600" />, color: 'blue' },
          { label: 'Total Lecturers', value: stats.lecturers, icon: <FiUsers className="h-8 w-8 text-green-600" />, color: 'green' },
          { label: 'Total Subjects', value: stats.subjects, icon: <FiBook className="h-8 w-8 text-yellow-600" />, color: 'yellow' },
          { label: 'Total Files', value: stats.files, icon: <FiFile className="h-8 w-8 text-purple-600" />, color: 'purple' }
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg p-6 flex flex-col min-w-0">
            <div className="flex items-center">
              <div className={`p-3 bg-${card.color}-100 rounded-lg flex-shrink-0`}>
                {card.icon}
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-sm text-gray-500 truncate">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800 truncate">{card.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={`/admin/${card.label.toLowerCase().split(' ')[1]}`}
                className={`text-sm text-${card.color}-600 hover:text-${card.color}-800 truncate`}
              >
                View all {card.label.toLowerCase().split(' ')[1]} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 min-w-0 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiUsers className="mr-2 text-blue-600" />
            User Distribution
          </h3>
          <div className="flex-1 min-h-[200px] h-64">
            {stats.students + stats.lecturers > 0 ? (
              <Doughnut data={userDistributionData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Resources Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 min-w-0 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiBook className="mr-2 text-yellow-600" />
            Resources Overview
          </h3>
          <div className="flex-1 min-h-[200px] h-64">
            {stats.subjects + stats.files > 0 ? (
              <Doughnut data={resourceData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">  </div>
      <div className="bg-white rounded-xl shadow-lg p-6">  </div>
    </div>
  );
};

export default AdminDashboard;