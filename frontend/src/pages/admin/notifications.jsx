import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import NotificationList from '../../components/common/notification';
import { 
  FiPlus, FiSend, FiUser, FiUsers, FiFilter, FiSearch,
  FiCheckCircle, FiXCircle, FiMail, FiBell, FiUserCheck,
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminNotifications = ({ sidebarOpen }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [refreshList, setRefreshList] = useState(0);
  
  const [formData, setFormData] = useState({
    recipientIds: [],
    recipientType: 'specific', // 'all', 'role', 'department', 'specific'
    role: '',
    department: '',
    title: '',
    message: '',
    priority: 'medium', // 'low', 'medium', 'high'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedRole, selectedDepartment, users]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
      setFilteredUsers(res.data.users);
      
      // Extract unique departments
      const uniqueDepts = [...new Set(res.data.users.map(u => u.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole);
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
        (u.lecturerId && u.lecturerId.toLowerCase().includes(term))
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    
    // Reset recipient IDs when changing recipient type
    if (name === 'recipientType' || name === 'role' || name === 'department') {
      setFormData(f => ({ ...f, recipientIds: [] }));
      setSelectAll(false);
    }
  };

  const handleRecipientSelect = (e) => {
    const { options } = e.target;
    const vals = Array.from(options)
      .filter(o => o.selected)
      .map(o => o.value);
    setFormData(f => ({ ...f, recipientIds: vals }));
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setFormData(f => ({ ...f, recipientIds: [] }));
    } else {
      const allIds = filteredUsers.map(u => u._id);
      setFormData(f => ({ ...f, recipientIds: allIds }));
    }
    setSelectAll(!selectAll);
  };

  const getRecipientCount = () => {
    switch(formData.recipientType) {
      case 'all':
        return users.length;
      case 'role':
        return users.filter(u => u.role === formData.role).length;
      case 'department':
        return users.filter(u => u.department === formData.department).length;
      case 'specific':
        return formData.recipientIds.length;
      default:
        return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let payload = { ...formData };
    
    // Prepare recipients based on type
    switch(formData.recipientType) {
      case 'all':
        payload.recipientIds = users.map(u => u._id);
        break;
      case 'role':
        const roleUsers = users.filter(u => u.role === formData.role).map(u => u._id);
        if (roleUsers.length === 0) {
          toast.error(`No users found with role: ${formData.role}`);
          return;
        }
        payload.recipientIds = roleUsers;
        break;
      case 'department':
        const deptUsers = users.filter(u => u.department === formData.department).map(u => u._id);
        if (deptUsers.length === 0) {
          toast.error(`No users found in department: ${formData.department}`);
          return;
        }
        payload.recipientIds = deptUsers;
        break;
      case 'specific':
        if (payload.recipientIds.length === 0) {
          toast.error('Please select at least one recipient');
          return;
        }
        break;
      default:
        toast.error('Please select recipient type');
        return;
    }

    try {
      await api.post('/notifications/send', payload);
      toast.success(`Notification sent to ${getRecipientCount()} recipient(s)`);
      setShowModal(false);
      setFormData({
        recipientIds: [],
        recipientType: 'specific',
        role: '',
        department: '',
        title: '',
        message: '',
        priority: 'medium',
      });
      setSelectAll(false);
      setRefreshList(prev => prev + 1); // Refresh notification list
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification');
    }
  };

  // Get color for priority badge
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Notifications</h1>
          <p className="text-purple-100 truncate mt-1">
            Send and manage system notifications to specific users or groups
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setRefreshList(prev => prev + 1)}
            className="bg-white bg-opacity-20 text-white px-4 py-3 rounded-lg hover:bg-opacity-30 transition-colors flex items-center whitespace-nowrap"
            title="Refresh"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center whitespace-nowrap"
          >
            <FiPlus className="mr-2" /> New Notification
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="mb-8">
        <NotificationList refresh={refreshList} />
      </div>

      {/* Compose Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg" title="Compose Notification">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setFormData(f => ({ ...f, recipientType: 'all', recipientIds: [] }))}
                className={`px-3 py-2 rounded-lg flex items-center justify-center text-sm ${
                  formData.recipientType === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiUsers className="mr-2" /> All Users
              </button>
              <button
                type="button"
                onClick={() => setFormData(f => ({ ...f, recipientType: 'role', recipientIds: [] }))}
                className={`px-3 py-2 rounded-lg flex items-center justify-center text-sm ${
                  formData.recipientType === 'role'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiUserCheck className="mr-2" /> By Role
              </button>
              <button
                type="button"
                onClick={() => setFormData(f => ({ ...f, recipientType: 'department', recipientIds: [] }))}
                className={`px-3 py-2 rounded-lg flex items-center justify-center text-sm ${
                  formData.recipientType === 'department'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter className="mr-2" /> By Department
              </button>
              <button
                type="button"
                onClick={() => setFormData(f => ({ ...f, recipientType: 'specific', recipientIds: [] }))}
                className={`px-3 py-2 rounded-lg flex items-center justify-center text-sm ${
                  formData.recipientType === 'specific'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiUser className="mr-2" /> Specific
              </button>
            </div>
          </div>

          {/* Role Selection */}
          {formData.recipientType === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a role</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          )}

          {/* Department Selection */}
          {formData.recipientType === 'department' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )}

          {/* Specific Users Selection */}
          {formData.recipientType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients</label>
              
              {/* Search and Filter for Users */}
              <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="lecturer">Lecturers</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Select All Option */}
              <div className="mb-2 flex items-center">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="selectAll" className="ml-2 text-sm text-gray-700">
                  Select All ({filteredUsers.length} users)
                </label>
              </div>

              {/* Users List */}
              <select
                name="recipientIds"
                multiple
                value={formData.recipientIds}
                onChange={handleRecipientSelect}
                className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[200px]"
                size={6}
              >
                {filteredUsers.map(u => (
                  <option key={u._id} value={u._id} className="py-1">
                    {u.name} ({u.role}) {u.department ? `- ${u.department}` : ''} - {u.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl (Cmd) to select multiple. Selected: {formData.recipientIds.length}
              </p>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="flex space-x-2">
              {['low', 'medium', 'high'].map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, priority }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    formData.priority === priority
                      ? getPriorityColor(priority)
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Exam Schedule Update"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              placeholder="Enter your notification message here..."
              required
            />
          </div>

          {/* Recipient Summary */}
          {formData.recipientType !== 'specific' && formData.recipientType && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700 flex items-center">
                <FiUsers className="mr-2" />
                This notification will be sent to <span className="font-bold mx-1">{getRecipientCount()}</span> recipients
              </p>
            </div>
          )}

          {formData.recipientType === 'specific' && formData.recipientIds.length > 0 && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700 flex items-center">
                <FiUser className="mr-2" />
                Selected <span className="font-bold mx-1">{formData.recipientIds.length}</span> recipient(s)
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setFormData({
                  recipientIds: [],
                  recipientType: 'specific',
                  role: '',
                  department: '',
                  title: '',
                  message: '',
                  priority: 'medium',
                });
                setSelectAll(false);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700"
            >
              <FiSend className="mr-2" /> Send Notification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminNotifications;