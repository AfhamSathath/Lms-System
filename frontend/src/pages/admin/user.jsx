import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Modal from '../../components/common/model';
import Loader from '../../components/common/Loader'; 
import toast from 'react-hot-toast';
import {
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiUsers,
  FiRefreshCw,
  FiChevronDown,
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiUnlock} from 'react-icons/fi';

const AdminUsers = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    lecturerId: '',
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

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'dean', label: 'Dean' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedRole, selectedDepartment, selectedStatus, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');
      const usersData = response.data.users || [];
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Calculate stats
      const total = usersData.length;
      const active = usersData.filter(u => u.isActive).length;
      const newThisMonth = usersData.filter(u => {
        const created = new Date(u.createdAt);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        return created >= thirtyDaysAgo;
      }).length;
      
      setStats({ total, active, inactive: total - active, newThisMonth });
      
      // Extract unique departments
      const uniqueDepts = [...new Set(usersData.map(u => u.department).filter(Boolean))];
      setDepartments(uniqueDepts);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.studentId?.toLowerCase().includes(term) ||
        u.lecturerId?.toLowerCase().includes(term)
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole);
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(u => u.department === selectedDepartment);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(u => u.isActive === (selectedStatus === 'active'));
    }

    setFilteredUsers(filtered);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare user data
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || undefined,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined
      };

      // Add role-specific fields
      if (formData.role === 'student') {
        userData.studentId = formData.studentId;
        userData.yearOfStudy = formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined;
        userData.semester = formData.semester ? parseInt(formData.semester) : undefined;
      } else if (['lecturer', 'hod', 'dean'].includes(formData.role)) {
        userData.lecturerId = formData.lecturerId;
        userData.qualifications = formData.qualifications || undefined;
        userData.specialization = formData.specialization || undefined;
      }

      await api.post('/auth/register', userData);
      
      toast.success('User added successfully');
      setShowAddModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Add user error:', error);
      toast.error(error.response?.data?.message || 'Failed to add user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = { ...formData };
      delete updateData.password; // Don't send password in update
      
      await api.put(`/api/users/${selectedUser._id}`, updateData);
      
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Edit user error:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/api/users/${id}/toggle-status`);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/api/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      studentId: user.studentId || '',
      lecturerId: user.lecturerId || '',
      department: user.department || '',
      yearOfStudy: user.yearOfStudy || '',
      semester: user.semester || '',
      phone: user.phone || '',
      address: user.address || '',
      qualifications: user.qualifications || '',
      specialization: user.specialization || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      emergencyContact: user.emergencyContact || '',
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      lecturer: 'bg-green-100 text-green-800',
      hod: 'bg-purple-100 text-purple-800',
      dean: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8" style={{ marginLeft: sidebarOpen ? 208 : 64 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-purple-100 mt-1">Manage all users in the system</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchUsers}
              className="bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 flex items-center"
            >
              <FiRefreshCw className="mr-2" /> Refresh
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 flex items-center"
            >
              <FiUserPlus className="mr-2" /> Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value={stats.total} icon={<FiUsers />} color="blue" />
          <StatCard title="Active Users" value={stats.active} icon={<FiCheckCircle />} color="green" />
          <StatCard title="Inactive Users" value={stats.inactive} icon={<FiXCircle />} color="red" />
          <StatCard title="New This Month" value={stats.newThisMonth} icon={<FiUsers />} color="purple" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year/Sem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                        {getInitials(u.name)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.studentId || u.lecturerId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.role === 'student' && u.yearOfStudy && (
                      <span className={`px-2 py-1 text-xs rounded-full ${getYearBadge(u.yearOfStudy)}`}>
                        Year {u.yearOfStudy} Sem {u.semester}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u._id, u.isActive)}
                        className={u.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? <FiLock /> : <FiUnlock />}
                      </button>
                      {u._id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User">
        <UserForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleAddUser}
          onCancel={() => setShowAddModal(false)}
          roles={roles}
          departments={departments}
          isEdit={false}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        <UserForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleEditUser}
          onCancel={() => setShowEditModal(false)}
          roles={roles}
          departments={departments}
          isEdit={true}
        />
      </Modal>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {React.cloneElement(icon, { className: 'h-6 w-6' })}
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};

const UserForm = ({ formData, onChange, onSubmit, onCancel, roles, departments, isEdit }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              required={!isEdit}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>
        {formData.role === 'student' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={onChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study *</label>
              <select
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={onChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                {[1,2,3,4,5].map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={onChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {[1,2].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </>
        )}
        {['lecturer', 'hod', 'dean'].includes(formData.role) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
              <input
                type="text"
                name="lecturerId"
                value={formData.lecturerId}
                onChange={onChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
              <input
                type="text"
                name="qualifications"
                value={formData.qualifications}
                onChange={onChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </>
        )}
        {formData.role !== 'admin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={onChange}
              required={formData.role !== 'admin'}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              list="departments"
            />
            <datalist id="departments">
              {departments.map(dept => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={onChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {isEdit && (
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={onChange}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-900">Account is active</label>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          {isEdit ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default AdminUsers;