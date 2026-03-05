import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import {
  FiUsers, FiBook, FiFile, FiUserPlus,
  FiTrendingUp, FiPieChart,
  FiDownload, FiArrowUp, FiClock, FiUserCheck, FiUserX
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

const AdminDashboard = () => {
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all stats from correct endpoints
      const [
        usersStats,
        coursesStats,
        filesStats,
        enrollmentsStats,
        loginData,
        activityData
      ] = await Promise.all([
        api.get('/api/admin/users/stats').catch(() => ({ data: { stats: {} } })),
        api.get('/api/admin/courses/stats').catch(() => ({ data: { stats: {} } })),
        api.get('/api/admin/files/stats').catch(() => ({ data: { stats: {} } })),
        api.get('/api/admin/enrollments/stats').catch(() => ({ data: { stats: {} } })),
        api.get('/api/admin/users/last-logins').catch(() => ({ data: { users: [] } })),
        api.get('/api/admin/activities/recent').catch(() => ({ data: { activities: [] } }))
      ]);

      setStats({
        users: {
          total: usersStats.data.stats?.total || 0,
          students: usersStats.data.stats?.students || 0,
          lecturers: usersStats.data.stats?.lecturers || 0,
          admins: usersStats.data.stats?.admins || 0,
          active: usersStats.data.stats?.active || 0,
          newThisMonth: usersStats.data.stats?.newThisMonth || 0,
          hods: usersStats.data.stats?.hods || 0,
          deans: usersStats.data.stats?.deans || 0
        },
        courses: {
          total: coursesStats.data.stats?.total || 0,
          active: coursesStats.data.stats?.active || 0
        },
        files: {
          total: filesStats.data.stats?.total || 0,
          totalDownloads: filesStats.data.stats?.totalDownloads || 0
        },
        enrollments: {
          total: enrollmentsStats.data.stats?.total || 0,
          active: enrollmentsStats.data.stats?.active || 0
        }
      });

      setLastLogins(loginData.data.users || []);
      setRecentActivities(activityData.data.activities || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const userDistributionData = {
    labels: ['Students', 'Lecturers', 'HODs', 'Deans', 'Admins'],
    datasets: [{
      data: [
        stats.users.students,
        stats.users.lecturers,
        stats.users.hods,
        stats.users.deans,
        stats.users.admins
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderWidth: 0
    }]
  };

  if (loading && stats.users.total === 0) {
    return <Loader fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-purple-100 mt-2">Here's what's happening in your LMS today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.users.total}
          icon={<FiUsers className="h-6 w-6" />}
          trend={stats.users.newThisMonth}
          trendLabel="new this month"
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats.users.active}
          icon={<FiUserCheck className="h-6 w-6" />}
          trend={Math.round((stats.users.active / (stats.users.total || 1)) * 100)}
          trendLabel="% active"
          color="green"
        />
        <StatCard
          title="Total Courses"
          value={stats.courses.total}
          icon={<FiBook className="h-6 w-6" />}
          trend={stats.courses.active}
          trendLabel="active"
          color="purple"
        />
        <StatCard
          title="Enrollments"
          value={stats.enrollments.total}
          icon={<FiTrendingUp className="h-6 w-6" />}
          trend={stats.enrollments.active}
          trendLabel="active"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* User Distribution Chart */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <FiPieChart className="mr-2 text-purple-600" />
            User Distribution
          </h3>
          <div className="h-80">
            {stats.users.total > 0 ? (
              <Doughnut
                data={userDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No user data available
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickStat
              label="Students"
              value={stats.users.students}
              icon={<FiUsers />}
              color="blue"
            />
            <QuickStat
              label="Lecturers"
              value={stats.users.lecturers}
              icon={<FiUsers />}
              color="green"
            />
            <QuickStat
              label="HODs"
              value={stats.users.hods}
              icon={<FiUsers />}
              color="yellow"
            />
            <QuickStat
              label="Deans"
              value={stats.users.deans}
              icon={<FiUsers />}
              color="red"
            />
            <QuickStat
              label="Admins"
              value={stats.users.admins}
              icon={<FiUsers />}
              color="purple"
            />
            <QuickStat
              label="File Downloads"
              value={stats.files.totalDownloads}
              icon={<FiDownload />}
              color="indigo"
            />
          </div>
        </div>
      </div>

      {/* Last Login Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <FiClock className="mr-2 text-blue-600" />
          Recent User Logins
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {lastLogins.length > 0 ? (
                lastLogins.map((u) => (
                  <tr key={u._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{u.name}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(u.lastLogin).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">
                    No login data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>

        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div
                key={activity._id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <p className="font-medium flex items-center">
                    {activity.user?.name}
                    <RoleBadge role={activity.user?.role} />
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.action}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">
              No recent activities
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, trendLabel, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-lg ${colors[color] || 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        <span className="text-sm text-gray-600 flex items-center">
          <FiArrowUp className="text-green-500 mr-1" />
          {trend} {trendLabel}
        </span>
      </div>
      <h3 className="text-gray-600 text-sm mt-4">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
};

const QuickStat = ({ label, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600'
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {React.cloneElement(icon, { className: 'h-4 w-4' })}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const colors = {
    student: 'bg-blue-100 text-blue-800',
    lecturer: 'bg-green-100 text-green-800',
    admin: 'bg-purple-100 text-purple-800',
    hod: 'bg-yellow-100 text-yellow-800',
    dean: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
      {role}
    </span>
  );
};

export default AdminDashboard;