import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import {
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiUsers,
  FiRefreshCw,
  FiChevronDown,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiDownload,
  FiUpload,
  FiLock,
  FiUnlock,
  FiCalendar,
  FiBookOpen,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminUsers = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    employeeId: '',
    department: '',
    yearOfStudy: '',
    semester: '',
    phone: '',
    address: '',
    qualifications: '',
    specialization: '',
    gender: '',
    dateOfBirth: '',
    emergencyContact: '',
    isActive: true
  });

  const academicYears = ['1', '2', '3', '4', '5'];
  const semesters = [1, 2];
  const roles = [
    { value: 'student', label: 'Student', icon: '👨‍🎓', color: 'bg-blue-100 text-blue-800' },
    { value: 'lecturer', label: 'Lecturer', icon: '👨‍🏫', color: 'bg-green-100 text-green-800' },
    { value: 'hod', label: 'Head of Department', icon: '👔', color: 'bg-purple-100 text-purple-800' },
    { value: 'dean', label: 'Dean', icon: '👨‍💼', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'admin', label: 'Admin', icon: '👨‍💻', color: 'bg-red-100 text-red-800' },
    { value: 'registrar', label: 'Registrar', icon: '📋', color: 'bg-indigo-100 text-indigo-800' }
  ];
  const genders = ['male', 'female', 'other'];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedRole, selectedYear, selectedSemester, selectedDepartment, selectedStatus, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('api/users');
      console.log('Fetch Users Response:', response.data);

      // Handle different response structures more robustly
      let usersData = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          usersData = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          usersData = response.data.results;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          usersData = response.data.items;
        } else if (typeof response.data === 'object') {
          // If it's an object but not an array, try to find any array property
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            usersData = possibleArrays[0];
          }
        }
      }

      console.log('Processed Users Data:', usersData);

      if (!usersData.length) {
        console.warn('No users found in response:', response.data);
      }

      setUsers(usersData);
      setFilteredUsers(usersData);

      // Calculate stats from users data
      if (usersData.length > 0) {
        const total = usersData.length;
        const active = usersData.filter(u => u && u.isActive).length;
        const inactive = total - active;

        // Calculate new users this month
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const newThisMonth = usersData.filter(u => {
          if (!u || !u.createdAt) return false;
          const createdDate = new Date(u.createdAt);
          return !isNaN(createdDate) && createdDate >= thirtyDaysAgo;
        }).length;

        // Calculate by year
        const byYear = {};
        usersData
          .filter(u => u && u.role === 'student' && u.yearOfStudy)
          .forEach(u => {
            const year = `year${u.yearOfStudy}`;
            byYear[year] = (byYear[year] || 0) + 1;
          });

        setStats({
          total,
          active,
          inactive,
          newThisMonth,
          byYear
        });

        // Extract unique departments
        const uniqueDepts = [...new Set(usersData.map(u => u && u.department).filter(Boolean))];
        setDepartments(uniqueDepts);
      } else {
        // Reset stats if no users
        setStats({
          total: 0,
          active: 0,
          inactive: 0,
          newThisMonth: 0,
          byYear: {}
        });
        setDepartments([]);
      }

    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u && u.role === selectedRole);
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(u => u && u.yearOfStudy === parseInt(selectedYear));
    }

    // Semester filter
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(u => u && u.semester === parseInt(selectedSemester));
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(u => u && u.department === selectedDepartment);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(u => u && u.isActive === (selectedStatus === 'active'));
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u && (
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.studentId?.toLowerCase().includes(term) ||
          u.employeeId?.toLowerCase().includes(term) ||
          u.department?.toLowerCase().includes(term)
        )
      );
    }

    // Sort by name
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-capitalize IDs
    if (name === 'studentId' || name === 'employeeId') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      studentId: '',
      employeeId: '',
      department: '',
      yearOfStudy: '',
      semester: '',
      phone: '',
      address: '',
      qualifications: '',
      specialization: '',
      gender: '',
      dateOfBirth: '',
      emergencyContact: '',
      isActive: true
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // Validate required fields based on role
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.role === 'student' && !formData.studentId) {
      toast.error('Student ID is required for students');
      return;
    }

    if (['lecturer', 'hod', 'dean'].includes(formData.role) && !formData.employeeId) {
      toast.error('Employee ID is required for staff');
      return;
    }

    if (formData.role === 'student' && (!formData.yearOfStudy || !formData.semester)) {
      toast.error('Year and semester are required for students');
      return;
    }

    if (formData.role !== 'admin' && !formData.department) {
      toast.error('Department is required');
      return;
    }

    try {
      await api.post('api/users', formData);
      toast.success('User added successfully');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Add user error:', error);
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
      employeeId: u.employeeId || '',
      department: u.department || '',
      yearOfStudy: u.yearOfStudy || '',
      semester: u.semester || '',
      phone: u.phone || '',
      address: u.address || '',
      qualifications: u.qualifications || '',
      specialization: u.specialization || '',
      gender: u.gender || '',
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '',
      emergencyContact: u.emergencyContact || '',
      isActive: u.isActive !== undefined ? u.isActive : true
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
      await api.put(`api/users/${selectedUser._id}`, updateData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Edit user error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      await api.delete(`api/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`api/users/${id}/toggle-status`);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Failed to toggle user status');
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('Send password reset email to this user?')) return;

    try {
      await api.post(`api/users/${id}/reset-password`);
      toast.success('Password reset email sent');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to send reset email');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', bulkFile);

    setUploading(true);
    try {
      const response = await api.post('api/users/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Bulk upload response:', response.data);

      // Check if the bulk upload was successful
      if (response.data) {
        const importedCount = response.data.count ||
          response.data.imported ||
          response.data.total ||
          response.data.users?.length ||
          'unknown';

        toast.success(`Successfully imported ${importedCount} users`);

        // Clear the modal and file
        setShowBulkUploadModal(false);
        setBulkFile(null);
        setUploadProgress(0);

        // Add a small delay to ensure the backend has processed all users
        setTimeout(() => {
          fetchUsers(); // Refresh the user list
        }, 500);
      } else {
        toast.success('Bulk upload completed');
        setShowBulkUploadModal(false);
        setBulkFile(null);
        setUploadProgress(0);
        setTimeout(() => {
          fetchUsers();
        }, 500);
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error(error.response?.data?.message || 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,email,password,role,studentId,employeeId,department,yearOfStudy,semester,phone,address\n" +
      "John Doe,john@example.com,password123,student,STU001,,Computer Science,1,1,0771234567,Colombo\n" +
      "Jane Smith,jane@example.com,password123,lecturer,,LEC001,Computer Science,,,,Kandy\n" +
      "Admin User,admin@example.com,password123,admin,,,,,,,,\n" +
      "HOD User,hod@example.com,password123,hod,,HOD001,Computer Science,,,,,";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "users_template.csv");
    link.click();
  };

  const getRoleBadge = (role) => {
    const roleInfo = roles.find(r => r.value === role);
    return roleInfo?.color || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role) => {
    const roleInfo = roles.find(r => r.value === role);
    return roleInfo?.icon || '👤';
  };

  const getYearBadge = (year) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-purple-100 text-purple-800'
    };
    return colors[year] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-800 flex items-center'
      : 'bg-red-100 text-red-800 flex items-center';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
            <p className="text-purple-100 mt-1">
              Manage students, lecturers, HODs, deans, and administrators
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                fetchUsers();
                toast.success('Refreshing user list...');
              }}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors flex items-center"
              title="Refresh"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <FiUpload className="mr-2" /> Bulk Upload
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center shadow-lg"
            >
              <FiUserPlus className="mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats.total || 0}
            icon={<FiUsers className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Active Users"
            value={stats.active || 0}
            icon={<FiCheckCircle className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-100"
          />
          <StatCard
            title="New This Month"
            value={stats.newThisMonth || 0}
            icon={<FiClock className="h-6 w-6 text-purple-600" />}
            bgColor="bg-purple-100"
          />
          <StatCard
            title="Inactive"
            value={stats.inactive || 0}
            icon={<FiXCircle className="h-6 w-6 text-red-600" />}
            bgColor="bg-red-100"
          />
        </div>
      )}

      {/* Year Distribution */}
      {stats?.byYear && Object.keys(stats.byYear).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(stats.byYear).map(([year, count]) => (
            <div key={year} className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getYearBadge(parseInt(year.replace('year', '')))}`}>
                  Year {year.replace('year', '')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {/* Search */}
          <div className="relative lg:col-span-2">
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
                <option key={role.value} value={role.value}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <FiBookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                <option key={year} value={year}>Year {year}</option>
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

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Active Filters */}
        {(selectedRole !== 'all' || selectedYear !== 'all' || selectedSemester !== 'all' ||
          selectedDepartment !== 'all' || selectedStatus !== 'all' || searchTerm) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Active filters:</span>
              {selectedRole !== 'all' && (
                <FilterBadge
                  label={`Role: ${roles.find(r => r.value === selectedRole)?.label || selectedRole}`}
                  onRemove={() => setSelectedRole('all')}
                />
              )}
              {selectedDepartment !== 'all' && (
                <FilterBadge
                  label={`Dept: ${selectedDepartment}`}
                  onRemove={() => setSelectedDepartment('all')}
                />
              )}
              {selectedYear !== 'all' && (
                <FilterBadge
                  label={`Year: ${selectedYear}`}
                  onRemove={() => setSelectedYear('all')}
                />
              )}
              {selectedSemester !== 'all' && (
                <FilterBadge
                  label={`Sem: ${selectedSemester}`}
                  onRemove={() => setSelectedSemester('all')}
                />
              )}
              {selectedStatus !== 'all' && (
                <FilterBadge
                  label={`Status: ${selectedStatus}`}
                  onRemove={() => setSelectedStatus('all')}
                />
              )}
              {searchTerm && (
                <FilterBadge
                  label={`Search: "${searchTerm}"`}
                  onRemove={() => setSearchTerm('')}
                />
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('all');
                  setSelectedYear('all');
                  setSelectedSemester('all');
                  setSelectedDepartment('all');
                  setSelectedStatus('all');
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year/Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                u && (
                  <tr
                    key={u._id || Math.random()}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => openViewModal(u)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitials(u.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{u.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{u.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(u.role)}`}>
                        {getRoleIcon(u.role)} {u.role || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-mono">
                        {u.role === 'student' ? (u.studentId || '-') : (u.employeeId || '-')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.role === 'student' ? (
                        <div className="flex flex-wrap gap-1">
                          {u.yearOfStudy && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getYearBadge(u.yearOfStudy)}`}>
                              Year {u.yearOfStudy}
                            </span>
                          )}
                          {u.semester && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                              Sem {u.semester}
                            </span>
                          )}
                        </div>
                      ) : u.role === 'lecturer' && u.qualifications ? (
                        <span className="text-xs text-gray-600">{u.qualifications}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(u.isActive)}`}>
                        {u.isActive ? (
                          <><FiCheckCircle className="mr-1 h-3 w-3" /> Active</>
                        ) : (
                          <><FiXCircle className="mr-1 h-3 w-3" /> Inactive</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.lastLogin ? formatDate(u.lastLogin) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit User"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u._id, u.isActive)}
                          className={`p-1 rounded ${u.isActive
                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                          title={u.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {u.isActive ? <FiLock className="h-5 w-5" /> : <FiUnlock className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleResetPassword(u._id)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                          title="Reset Password"
                        >
                          <FiEyeOff className="h-5 w-5" />
                        </button>
                        {u._id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete User"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new user or try adjusting your filters.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <FiUserPlus className="mr-2 h-5 w-5" />
                  Add User
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Add New User"
        size="lg"
      >
        <UserForm
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleAddUser}
          handleInputChange={handleInputChange}
          onCancel={() => { setShowAddModal(false); resetForm(); }}
          roles={roles}
          academicYears={academicYears}
          semesters={semesters}
          departments={departments}
          genders={genders}
          submitText="Create User"
          isEdit={false}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
        title="Edit User"
        size="lg"
      >
        <UserForm
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleEditUser}
          handleInputChange={handleInputChange}
          onCancel={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
          roles={roles}
          academicYears={academicYears}
          semesters={semesters}
          departments={departments}
          genders={genders}
          submitText="Update User"
          isEdit={true}
        />
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedUser(null); }}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <UserProfile
            user={selectedUser}
            roles={roles}
            onEdit={() => {
              setShowViewModal(false);
              openEditModal(selectedUser);
            }}
            onToggleStatus={() => {
              handleToggleStatus(selectedUser._id, selectedUser.isActive);
              setShowViewModal(false);
            }}
            onClose={() => setShowViewModal(false)}
            getRoleBadge={getRoleBadge}
            getYearBadge={getYearBadge}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
          />
        )}
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={showBulkUploadModal}
        onClose={() => { setShowBulkUploadModal(false); setBulkFile(null); setUploadProgress(0); }}
        title="Bulk Import Users"
        size="md"
      >
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files[0])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Upload CSV with columns: name, email, password, role, studentId, employeeId, department, yearOfStudy, semester, phone, address
            </p>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <FiDownload className="mr-2" /> Download Template
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => { setShowBulkUploadModal(false); setBulkFile(null); setUploadProgress(0); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !bulkFile}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Helper Components

const StatCard = ({ title, value, icon, bgColor }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex items-center">
      <div className={`p-3 ${bgColor} rounded-lg mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

const FilterBadge = ({ label, onRemove }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
    {label}
    <button onClick={onRemove} className="ml-2 hover:text-purple-900">
      ×
    </button>
  </span>
);

const UserForm = ({
  formData,
  setFormData,
  handleSubmit,
  handleInputChange,
  onCancel,
  roles,
  academicYears,
  semesters,
  departments,
  genders,
  submitText,
  isEdit = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData(prev => ({
      ...prev,
      role,
      studentId: '',
      employeeId: '',
      yearOfStudy: '',
      semester: ''
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="john@example.com"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!isEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Role-specific fields */}
      {(formData.role === 'student' || ['lecturer', 'hod', 'dean'].includes(formData.role)) && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {formData.role === 'student' ? 'Student Information' : 'Staff Information'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                    placeholder="STU001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>Year {year}</option>
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
            {['lecturer', 'hod', 'dean'].includes(formData.role) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                    placeholder="EMP001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="PhD, MSc, BSc"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Computer Science, Mathematics"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Computer Science"
              />
            </div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="+94 77 123 4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Gender</option>
              {genders.map(gender => (
                <option key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Name: Phone"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter address"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      {isEdit && (
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Account is active
            </label>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {submitText}
        </button>
      </div>
    </form>
  );
};

const UserProfile = ({ user, roles, onEdit, onToggleStatus, onClose, getRoleBadge, getYearBadge, getStatusBadge, formatDate }) => {
  const roleInfo = roles.find(r => r.value === user.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-3xl">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
          <div className="flex items-center mt-2 space-x-2">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
              {roleInfo?.icon} {user.role}
            </span>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(user.isActive)}`}>
              {user.isActive ? (
                <><FiCheckCircle className="mr-1 h-4 w-4" /> Active</>
              ) : (
                <><FiXCircle className="mr-1 h-4 w-4" /> Inactive</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identification */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Identification</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Student/Employee ID:</span>
              <span className="text-sm font-medium text-gray-900">
                {user.studentId || user.employeeId}
              </span>
            </div>
            {user.department && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department:</span>
                <span className="text-sm font-medium text-gray-900">{user.department}</span>
              </div>
            )}
          </div>
        </div>

        {/* Academic Info */}
        {user.role === 'student' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Academic Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Year of Study:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getYearBadge(user.yearOfStudy)}`}>
                  Year {user.yearOfStudy}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Current Semester:</span>
                <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">
                  Semester {user.semester}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Professional Info */}
        {['lecturer', 'hod', 'dean'].includes(user.role) && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Professional Information</h3>
            <div className="space-y-2">
              {user.qualifications && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Qualifications:</span>
                  <span className="text-sm font-medium text-gray-900">{user.qualifications}</span>
                </div>
              )}
              {user.specialization && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Specialization:</span>
                  <span className="text-sm font-medium text-gray-900">{user.specialization}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
          <div className="space-y-2">
            {user.phone && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <FiPhone className="mr-2 h-4 w-4" /> Phone:
                </span>
                <span className="text-sm font-medium text-gray-900">{user.phone}</span>
              </div>
            )}
            {user.email && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <FiMail className="mr-2 h-4 w-4" /> Email:
                </span>
                <span className="text-sm font-medium text-gray-900">{user.email}</span>
              </div>
            )}
            {user.address && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <FiMapPin className="mr-2 h-4 w-4" /> Address:
                </span>
                <span className="text-sm font-medium text-gray-900">{user.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Personal Information</h3>
          <div className="space-y-2">
            {user.gender && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gender:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{user.gender}</span>
              </div>
            )}
            {user.dateOfBirth && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date of Birth:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(user.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
            )}
            {user.emergencyContact && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Emergency Contact:</span>
                <span className="text-sm font-medium text-gray-900">{user.emergencyContact}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-gray-500">Created</span>
              <p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Last Login</span>
              <p className="text-sm font-medium text-gray-900">{formatDate(user.lastLogin)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Updated</span>
              <p className="text-sm font-medium text-gray-900">{formatDate(user.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          onClick={onToggleStatus}
          className={`px-6 py-2 rounded-lg transition-colors ${user.isActive
            ? 'bg-orange-600 text-white hover:bg-orange-700'
            : 'bg-green-600 text-white hover:bg-green-700'
            }`}
        >
          {user.isActive ? 'Deactivate Account' : 'Activate Account'}
        </button>
        <button
          onClick={onEdit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <FiEdit2 className="mr-2" /> Edit User
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AdminUsers;