import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import PasswordInput from '../../components/common/PasswordInput';
import {
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiUser,
  FiEye,
  FiEyeOff,
  FiCalendar,
  FiBookOpen,
  FiUsers,
  FiRefreshCw,
  FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminUsers = ({ sidebarOpen }) => {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    lecturerId: '',
    department: '',
    year: '',
    semester: '',
    phone: '',
    address: '',
    bio: '',
    qualifications: '',
    specialization: '',
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];
  const roles = ['student', 'lecturer', 'admin'];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedRole, selectedYear, selectedSemester, selectedDepartment, users]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
      setFilteredUsers(res.data.users);
      
      // Extract unique departments
      const uniqueDepts = [...new Set(res.data.users.map(u => u.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(u => u.year === selectedYear);
    }

    if (selectedSemester !== 'all') {
      filtered = filtered.filter(u => u.semester === parseInt(selectedSemester));
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(u => u.department === selectedDepartment);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.studentId && u.studentId.toLowerCase().includes(term)) ||
        (u.lecturerId && u.lecturerId.toLowerCase().includes(term)) ||
        (u.department && u.department.toLowerCase().includes(term))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-capitalize role-specific IDs
    if (name === 'studentId' || name === 'lecturerId') {
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      studentId: '',
      lecturerId: '',
      department: '',
      year: '',
      semester: '',
      phone: '',
      address: '',
      bio: '',
      qualifications: '',
      specialization: '',
    });
    setShowPassword(false);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validate required fields based on role
    if (formData.role === 'student' && !formData.studentId) {
      toast.error('Student ID is required for students');
      return;
    }
    
    if (formData.role === 'student' && (!formData.year || !formData.semester)) {
      toast.error('Year and semester are required for students');
      return;
    }
    
    if (formData.role === 'lecturer' && !formData.lecturerId) {
      toast.error('Lecturer ID is required for lecturers');
      return;
    }
    
    if (formData.role !== 'admin' && !formData.department) {
      toast.error('Department is required');
      return;
    }

    try {
      await api.post('/users', formData);
      toast.success('User added successfully');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add user');
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'student',
      studentId: u.studentId || '',
      lecturerId: u.lecturerId || '',
      department: u.department || '',
      year: u.year || '',
      semester: u.semester || '',
      phone: u.phone || '',
      address: u.address || '',
      bio: u.bio || '',
      qualifications: u.qualifications || '',
      specialization: u.specialization || '',
    });
    setShowEditModal(true);
  };

  const openViewModal = (u) => {
    setSelectedUser(u);
    setShowViewModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    // Prepare update data (exclude password if empty)
    const updateData = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }

    try {
      await api.put(`/users/${selectedUser._id}`, updateData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'lecturer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getYearBadge = (year) => {
    const colors = {
      '1st Year': 'bg-blue-100 text-blue-800',
      '2nd Year': 'bg-green-100 text-green-800',
      '3rd Year': 'bg-yellow-100 text-yellow-800',
      '4th Year': 'bg-orange-100 text-orange-800'
    };
    return colors[year] || 'bg-gray-100 text-gray-800';
  };

  const getStats = () => {
    const total = users.length;
    const students = users.filter(u => u.role === 'student').length;
    const lecturers = users.filter(u => u.role === 'lecturer').length;
    const admins = users.filter(u => u.role === 'admin').length;
    
    // Year-wise student distribution
    const yearDistribution = academicYears.map(year => ({
      year,
      count: users.filter(u => u.role === 'student' && u.year === year).length
    }));

    return { total, students, lecturers, admins, yearDistribution };
  };

  if (loading) return <Loader fullScreen />;

  const stats = getStats();

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
          <p className="text-purple-100 mt-1">Manage students, lecturers and administrators</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={fetchUsers}
            className="bg-white bg-opacity-20 text-white px-4 py-3 rounded-lg hover:bg-opacity-30 transition-colors flex items-center"
            title="Refresh"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center shadow-lg"
          >
            <FiUserPlus className="mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Students</p>
              <p className="text-2xl font-bold text-gray-800">{stats.students}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUser className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Lecturers</p>
              <p className="text-2xl font-bold text-gray-800">{stats.lecturers}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiUser className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Admins</p>
              <p className="text-2xl font-bold text-gray-800">{stats.admins}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUser className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Departments</p>
              <p className="text-2xl font-bold text-gray-800">{departments.length}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiBookOpen className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Year Distribution Cards */}
      {stats.students > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.yearDistribution.map(({ year, count }) => (
            <div key={year} className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getYearBadge(year)}`}>
                  {year}
                </span>
                <FiCalendar className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-3">{count}</p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, ID, or department..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}s</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <FiBookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Active Filters Summary */}
        {(selectedRole !== 'all' || selectedYear !== 'all' || selectedSemester !== 'all' || selectedDepartment !== 'all' || searchTerm) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedRole !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center">
                Role: {selectedRole}
                <button onClick={() => setSelectedRole('all')} className="ml-2 hover:text-purple-900">×</button>
              </span>
            )}
            {selectedDepartment !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center">
                Dept: {selectedDepartment}
                <button onClick={() => setSelectedDepartment('all')} className="ml-2 hover:text-blue-900">×</button>
              </span>
            )}
            {selectedYear !== 'all' && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                Year: {selectedYear}
                <button onClick={() => setSelectedYear('all')} className="ml-2 hover:text-green-900">×</button>
              </span>
            )}
            {selectedSemester !== 'all' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center">
                Sem: {selectedSemester}
                <button onClick={() => setSelectedSemester('all')} className="ml-2 hover:text-yellow-900">×</button>
              </span>
            )}
            {searchTerm && (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-2 hover:text-gray-900">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('all');
                setSelectedYear('all');
                setSelectedSemester('all');
                setSelectedDepartment('all');
              }}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-6 py-4 text-left">User</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-left">Year/Semester</th>
                <th className="px-6 py-4 text-left">Contact</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openViewModal(u)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">
                      {u.studentId || u.lecturerId || '-'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {u.department || '-'}
                  </td>

                  <td className="px-6 py-4">
                    {u.role === 'student' ? (
                      <div className="flex flex-wrap gap-1">
                        {u.year && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getYearBadge(u.year)}`}>
                            {u.year}
                          </span>
                        )}
                        {u.semester && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            Sem {u.semester}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {u.phone || '-'}
                  </td>

                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => openEditModal(u)} 
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit user"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>

                      {u._id !== user?.id && (
                        <button 
                          onClick={() => handleDeleteUser(u._id)} 
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete user"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <FiUser className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
              >
                Add your first user
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New User"
        size="lg"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="0771234567"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Role-specific fields */}
            {(formData.role === 'student' || formData.role === 'lecturer') && (
              <>
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">
                    {formData.role === 'student' ? 'Student Information' : 'Lecturer Information'}
                  </h3>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="studentId"
                        type="text"
                        placeholder="CO1234"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Year</option>
                        {academicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Semester</option>
                        {semesters.map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.role === 'lecturer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lecturer ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="lecturerId"
                        type="text"
                        placeholder="LEC123"
                        value={formData.lecturerId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                      <input
                        name="qualifications"
                        type="text"
                        placeholder="PhD, MSc, etc."
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <input
                        name="specialization"
                        type="text"
                        placeholder="Computer Science, Mathematics, etc."
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                <div className={formData.role === 'student' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="department"
                    type="text"
                    placeholder="Computer Science"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}

            {/* Additional Information */}
            <div className="md:col-span-2 mt-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Additional Information</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                name="address"
                rows="2"
                placeholder="Enter address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                rows="3"
                placeholder="Short biography"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        title="Edit User"
        size="lg"
      >
        <form onSubmit={handleEditUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Same form fields as Add User but without password requirement */}
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password (leave blank to keep current)</label>
              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Role-specific fields - same as Add User */}
            {(formData.role === 'student' || formData.role === 'lecturer') && (
              <>
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">
                    {formData.role === 'student' ? 'Student Information' : 'Lecturer Information'}
                  </h3>
                </div>

                {formData.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="studentId"
                        type="text"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Year</option>
                        {academicYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select Semester</option>
                        {semesters.map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {formData.role === 'lecturer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lecturer ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="lecturerId"
                        type="text"
                        value={formData.lecturerId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                      <input
                        name="qualifications"
                        type="text"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <input
                        name="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                <div className={formData.role === 'student' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </>
            )}

            {/* Additional Information */}
            <div className="md:col-span-2 mt-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Additional Information</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
                resetForm();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Update User
            </button>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
        }}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-2xl">
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">Basic Information</h3>
                
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className={`inline-block px-3 py-1 mt-1 text-sm rounded-full font-medium ${getRoleBadge(selectedUser.role)}`}>
                    {selectedUser.role}
                  </p>
                </div>

                {selectedUser.studentId && (
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="font-mono text-gray-900">{selectedUser.studentId}</p>
                  </div>
                )}

                {selectedUser.lecturerId && (
                  <div>
                    <p className="text-sm text-gray-500">Lecturer ID</p>
                    <p className="font-mono text-gray-900">{selectedUser.lecturerId}</p>
                  </div>
                )}

                {selectedUser.department && (
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="text-gray-900">{selectedUser.department}</p>
                  </div>
                )}

                {selectedUser.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{selectedUser.phone}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b">
                  {selectedUser.role === 'student' ? 'Academic Information' : 
                   selectedUser.role === 'lecturer' ? 'Professional Information' : 'Additional Information'}
                </h3>

                {selectedUser.role === 'student' && (
                  <>
                    {selectedUser.year && (
                      <div>
                        <p className="text-sm text-gray-500">Academic Year</p>
                        <p className={`inline-block px-3 py-1 mt-1 text-sm rounded-full ${getYearBadge(selectedUser.year)}`}>
                          {selectedUser.year}
                        </p>
                      </div>
                    )}
                    {selectedUser.semester && (
                      <div>
                        <p className="text-sm text-gray-500">Current Semester</p>
                        <p className="inline-block px-3 py-1 mt-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                          Semester {selectedUser.semester}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedUser.role === 'lecturer' && (
                  <>
                    {selectedUser.qualifications && (
                      <div>
                        <p className="text-sm text-gray-500">Qualifications</p>
                        <p className="text-gray-900">{selectedUser.qualifications}</p>
                      </div>
                    )}
                    {selectedUser.specialization && (
                      <div>
                        <p className="text-sm text-gray-500">Specialization</p>
                        <p className="text-gray-900">{selectedUser.specialization}</p>
                      </div>
                    )}
                  </>
                )}

                {selectedUser.address && (
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">{selectedUser.address}</p>
                  </div>
                )}

                {selectedUser.bio && (
                  <div>
                    <p className="text-sm text-gray-500">Bio</p>
                    <p className="text-gray-900">{selectedUser.bio}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="text-gray-900">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`inline-block px-3 py-1 mt-1 text-sm rounded-full font-medium ${
                    selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedUser);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FiEdit2 className="mr-2" /> Edit User
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;