import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import {
  FiUsers, FiBook, FiFile, FiUserPlus,
  FiTrendingUp, FiPieChart,
  FiDownload, FiArrowUp, FiClock
} from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
);

const AdminDashboard = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    users: { total: 0, students: 0, lecturers: 0, admins: 0, active: 0, newThisMonth: 0, hods: 0, deans: 0 },
    courses: { total: 0, active: 0 },
    files: { total: 0, totalDownloads: 0 },
    enrollments: { total: 0, active: 0 }
  });

  const [lastLogins, setLastLogins] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchWithFallback = async (url, fallback) => {
    try {
      const res = await api.get(url);
      return res.data;
    } catch (err) {
      console.warn(`Failed to fetch ${url}`, err.message);
      return fallback;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        usersData,
        coursesData,
        filesData,
        enrollmentsData,
        loginData,
        activityData
      ] = await Promise.all([
        fetchWithFallback('/api/admin/users/stats', { stats: {} }),
        fetchWithFallback('/api/admin/courses/stats', { stats: {} }),
        fetchWithFallback('/api/admin/files/stats', { stats: {} }),
        fetchWithFallback('/api/admin/enrollments/stats', { stats: {} }),
        fetchWithFallback('/api/admin/users/last-logins', { users: [] }),
        fetchWithFallback('/api/admin/activities/recent', { activities: [] })
      ]);

      setStats({
        users: {
          total: usersData.stats?.total || 0,
          students: usersData.stats?.students || 0,
          lecturers: usersData.stats?.lecturers || 0,
          admins: usersData.stats?.admins || 0,
          active: usersData.stats?.active || 0,
          newThisMonth: usersData.stats?.newThisMonth || 0,
          hods: usersData.stats?.hods || 0,
          deans: usersData.stats?.deans || 0
        },
        courses: {
          total: coursesData.stats?.total || 0,
          active: coursesData.stats?.active || 0
        },
        files: {
          total: filesData.stats?.total || 0,
          totalDownloads: filesData.stats?.totalDownloads || 0
        },
        enrollments: {
          total: enrollmentsData.stats?.total || 0,
          active: enrollmentsData.stats?.active || 0
        }
      });

      setLastLogins(loginData.users || []);
      setRecentActivities(activityData.activities || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const userDistributionData = {
    labels: ['Students', 'Lecturers', 'Admins', 'HODs', 'Deans'],
    datasets: [{
      data: [
        stats.users.students,
        stats.users.lecturers,
        stats.users.admins,
        stats.users.hods,
        stats.users.deans
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']
    }]
  };

  if (loading && stats.users.total === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-purple-100">Here’s what’s happening today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.users.total} icon={<FiUsers />} trend={stats.users.newThisMonth} trendLabel="new this month" />
        <StatCard title="Total Courses" value={stats.courses.total} icon={<FiBook />} trend={stats.courses.active} trendLabel="active" />
        <StatCard title="Enrollments" value={stats.enrollments.total} icon={<FiTrendingUp />} trend={stats.enrollments.active} trendLabel="active" />
        <StatCard title="Files" value={stats.files.total} icon={<FiFile />} trend={stats.files.totalDownloads} trendLabel="downloads" />
      </div>

      {/* User Distribution Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold flex items-center">
          <FiPieChart className="mr-2 text-purple-600" />
          User Distribution
        </h3>
        <div className="h-80 mt-4">
          {stats.users.total > 0 ? (
            <Doughnut data={userDistributionData} />
          ) : (
            <p className="text-center text-gray-500 py-20">
              No user data available
            </p>
          )}
        </div>
      </div>

      {/* Last Login Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <FiClock className="mr-2 text-blue-600" />
          Recent User Logins
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {lastLogins.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <RoleBadge role={u.role} />
                </td>
                <td>{new Date(u.lastLogin).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>

        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity._id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="font-medium">
                  {activity.user?.name}
                  <RoleBadge role={activity.user?.role} />
                </p>
                <p className="text-sm text-gray-500">
                  {activity.action}
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(activity.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendLabel }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
      <span className="text-sm text-gray-600 flex items-center">
        <FiArrowUp className="text-green-500 mr-1" />
        {trend} {trendLabel}
      </span>
    </div>
    <h3 className="text-gray-600 text-sm">{title}</h3>
    <p className="text-3xl font-bold text-gray-800">
      {value.toLocaleString()}
    </p>
  </div>
);

const RoleBadge = ({ role }) => {
  const colors = {
    student: 'bg-blue-100 text-blue-600',
    lecturer: 'bg-green-100 text-green-600',
    admin: 'bg-purple-100 text-purple-600',
    hod: 'bg-yellow-100 text-yellow-600',
    dean: 'bg-red-100 text-red-600'
  };

  return (
    <span className={`ml-2 px-2 py-1 rounded text-xs ${colors[role] || 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  );
};

export default AdminDashboard;