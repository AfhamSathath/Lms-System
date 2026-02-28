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
  FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminUsers = ({ sidebarOpen }) => {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

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
    semester: '',
    phone: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedRole, users]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
      setFilteredUsers(res.data.users);
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

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.studentId && u.studentId.includes(searchTerm)) ||
        (u.lecturerId && u.lecturerId.includes(searchTerm))
      );
    }

    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      semester: '',
      phone: '',
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
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
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      studentId: u.studentId || '',
      lecturerId: u.lecturerId || '',
      department: u.department || '',
      semester: u.semester || '',
      phone: u.phone || '',
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser._id}`, formData);
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

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage students, lecturers and administrators
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 flex items-center shadow-sm"
        >
          <FiUserPlus className="mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6 mb-8 flex gap-4">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="lecturer">Lecturers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-6 py-4 text-left">User</th>
              <th className="px-6 py-4 text-left">Role</th>
              <th className="px-6 py-4 text-left">ID</th>
              <th className="px-6 py-4 text-left">Department</th>
              <th className="px-6 py-4 text-left">Contact</th>
              <th className="px-6 py-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredUsers.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>

                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-xs rounded-full ${getRoleBadge(u.role)}`}>
                    {u.role}
                  </span>
                </td>

                <td className="px-6 py-4">
                  {u.studentId || u.lecturerId || '-'}
                </td>

                <td className="px-6 py-4">{u.department || '-'}</td>

                <td className="px-6 py-4">{u.phone || '-'}</td>

                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => openEditModal(u)} className="text-blue-600">
                    <FiEdit2 />
                  </button>

                  {u._id !== user?.id && (
                    <button onClick={() => handleDeleteUser(u._id)} className="text-red-600">
                      <FiTrash2 />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FiUser className="mx-auto text-4xl mb-3" />
            No users found
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        title={showAddModal ? 'Add User' : 'Edit User'}
        size="lg"
      >
        <form onSubmit={showAddModal ? handleAddUser : handleEditUser} className="space-y-4">

          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} required className="w-full border p-2 rounded" />

          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required className="w-full border p-2 rounded" />

          {showAddModal && (
            <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required className="w-full border p-2 rounded" />
          )}

          <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border p-2 rounded">
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="admin">Admin</option>
          </select>

          {formData.role === 'student' && (
            <input name="studentId" placeholder="Student ID" value={formData.studentId} onChange={handleInputChange} className="w-full border p-2 rounded" />
          )}

          {formData.role === 'lecturer' && (
            <input name="lecturerId" placeholder="Lecturer ID" value={formData.lecturerId} onChange={handleInputChange} className="w-full border p-2 rounded" />
          )}

          <input name="department" placeholder="Department" value={formData.department} onChange={handleInputChange} className="w-full border p-2 rounded" />

          <input name="semester" placeholder="Semester" value={formData.semester} onChange={handleInputChange} className="w-full border p-2 rounded" />

          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleInputChange} className="w-full border p-2 rounded" />

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              resetForm();
            }} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>

            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded">
              {showAddModal ? 'Create User' : 'Update User'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
};

export default AdminUsers;