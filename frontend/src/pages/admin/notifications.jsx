import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import NotificationList from '../../components/common/notification';
import { 
  FiPlus, FiSend, FiUser, FiUsers, FiFilter, FiSearch,
  FiCheckCircle, FiXCircle, FiMail, FiBell, FiUserCheck,
  FiRefreshCw, FiAlertCircle, FiCalendar, FiClock,
  FiChevronDown, FiEye, FiTrash2, FiEdit2, FiCopy
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminNotifications = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectAll, setSelectAll] = useState(false);
  const [refreshList, setRefreshList] = useState(0);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  const [formData, setFormData] = useState({
    recipientIds: [],
    recipientType: 'specific', // 'all', 'role', 'department', 'faculty', 'course', 'specific'
    role: '',
    department: '',
    faculty: '',
    course: '',
    title: '',
    message: '',
    priority: 'medium', // 'low', 'medium', 'high'
    type: 'announcement', // 'announcement', 'reminder', 'alert', 'deadline'
    scheduleType: 'now', // 'now', 'scheduled'
    scheduledDate: '',
    scheduledTime: '',
    expiresAt: '',
    action: {
      type: 'none', // 'none', 'link', 'deadline'
      url: '',
      label: ''
    },
    attachments: []
  });

  const roles = [
    { value: 'student', label: 'Students', icon: '👨‍🎓' },
    { value: 'lecturer', label: 'Lecturers', icon: '👨‍🏫' },
    { value: 'hod', label: 'HODs', icon: '👔' },
    { value: 'dean', label: 'Deans', icon: '👨‍💼' },
    { value: 'admin', label: 'Admins', icon: '👨‍💻' },
    { value: 'registrar', label: 'Registrars', icon: '📋' }
  ];

  const notificationTypes = [
    { value: 'announcement', label: 'Announcement', icon: '📢', color: 'bg-blue-100 text-blue-800' },
    { value: 'reminder', label: 'Reminder', icon: '⏰', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'alert', label: 'Alert', icon: '⚠️', color: 'bg-red-100 text-red-800' },
    { value: 'deadline', label: 'Deadline', icon: '⏳', color: 'bg-orange-100 text-orange-800' },
    { value: 'grade', label: 'Grade Update', icon: '📊', color: 'bg-green-100 text-green-800' },
    { value: 'course', label: 'Course Update', icon: '📚', color: 'bg-purple-100 text-purple-800' },
    { value: 'enrollment', label: 'Enrollment', icon: '📝', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'system', label: 'System', icon: '⚙️', color: 'bg-gray-100 text-gray-800' }
  ];

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchData();
    fetchScheduledNotifications();
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedRole, selectedDepartment, selectedFaculty, selectedCourse, users]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, coursesRes, statsRes] = await Promise.all([
        api.get('/users'),
        api.get('/courses?isActive=true'),
        api.get('/notifications/stats')
      ]);
      
      setUsers(usersRes.data.users || []);
      setFilteredUsers(usersRes.data.users || []);
      setCourses(coursesRes.data.courses || []);
      setStats(statsRes.data.stats || {});

      // Extract unique departments and faculties
      const uniqueDepts = [...new Set((usersRes.data.users || []).map(u => u.department).filter(Boolean))];
      const uniqueFaculties = [...new Set((usersRes.data.users || []).map(u => u.faculty?.name).filter(Boolean))];
      
      setDepartments(uniqueDepts);
      setFaculties(uniqueFaculties);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledNotifications = async () => {
    try {
      const res = await api.get('/notifications/scheduled');
      setScheduledNotifications(res.data.notifications || []);
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/notifications/templates');
      setTemplates(res.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole);
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(u => u.department === selectedDepartment);
    }
    
    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(u => u.faculty?.name === selectedFaculty);
    }
    
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(u => {
        if (u.role === 'student') {
          return u.enrolledCourses?.includes(selectedCourse);
        }
        if (u.role === 'lecturer') {
          return u.coursesTaught?.includes(selectedCourse);
        }
        return false;
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.studentId?.toLowerCase().includes(term) ||
        u.lecturerId?.toLowerCase().includes(term) ||
        u.department?.toLowerCase().includes(term)
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRecipientSelect = (e) => {
    const { options } = e.target;
    const selectedIds = Array.from(options)
      .filter(o => o.selected)
      .map(o => o.value);
    setFormData(prev => ({ ...prev, recipientIds: selectedIds }));
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setFormData(prev => ({ ...prev, recipientIds: [] }));
    } else {
      const allIds = filteredUsers.map(u => u._id);
      setFormData(prev => ({ ...prev, recipientIds: allIds }));
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
      case 'faculty':
        return users.filter(u => u.faculty?.name === formData.faculty).length;
      case 'course':
        return users.filter(u => {
          if (formData.role === 'student') {
            return u.enrolledCourses?.includes(formData.course);
          }
          if (formData.role === 'lecturer') {
            return u.coursesTaught?.includes(formData.course);
          }
          return false;
        }).length;
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
      case 'faculty':
        const facUsers = users.filter(u => u.faculty?.name === formData.faculty).map(u => u._id);
        if (facUsers.length === 0) {
          toast.error(`No users found in faculty: ${formData.faculty}`);
          return;
        }
        payload.recipientIds = facUsers;
        break;
      case 'course':
        const courseUsers = users.filter(u => {
          if (formData.role === 'student') {
            return u.enrolledCourses?.includes(formData.course);
          }
          if (formData.role === 'lecturer') {
            return u.coursesTaught?.includes(formData.course);
          }
          return false;
        }).map(u => u._id);
        if (courseUsers.length === 0) {
          toast.error(`No users found for this course`);
          return;
        }
        payload.recipientIds = courseUsers;
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

    // Handle scheduled notifications
    if (formData.scheduleType === 'scheduled') {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        toast.error('Please select scheduled date and time');
        return;
      }
      
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        toast.error('Scheduled time must be in the future');
        return;
      }
      
      payload.scheduledFor = scheduledDateTime.toISOString();
    }

    // Handle action
    if (formData.action.type !== 'none') {
      payload.action = {
        type: formData.action.type,
        url: formData.action.url,
        label: formData.action.label
      };
    }

    try {
      const response = await api.post('/notifications/send', payload);
      
      const recipientCount = getRecipientCount();
      const message = formData.scheduleType === 'scheduled' 
        ? `Notification scheduled for ${recipientCount} recipient(s)`
        : `Notification sent to ${recipientCount} recipient(s)`;
      
      toast.success(message);
      
      setShowModal(false);
      resetForm();
      setRefreshList(prev => prev + 1);
      
      if (formData.scheduleType === 'scheduled') {
        fetchScheduledNotifications();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification');
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      await api.post('/notifications/templates', {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        action: formData.action
      });
      toast.success('Template saved successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleUseTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority,
      action: template.action || { type: 'none', url: '', label: '' }
    }));
    setShowTemplateModal(false);
  };

  const handleDeleteScheduled = async (id) => {
    if (!window.confirm('Delete this scheduled notification?')) return;
    try {
      await api.delete(`/notifications/scheduled/${id}`);
      toast.success('Scheduled notification deleted');
      fetchScheduledNotifications();
    } catch (error) {
      console.error('Error deleting scheduled notification:', error);
      toast.error('Failed to delete');
    }
  };

  const handleEditScheduled = (notification) => {
    setFormData({
      ...formData,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      recipientType: notification.recipientType,
      role: notification.role || '',
      department: notification.department || '',
      faculty: notification.faculty || '',
      course: notification.course || '',
      scheduleType: 'scheduled',
      scheduledDate: notification.scheduledFor?.split('T')[0] || '',
      scheduledTime: notification.scheduledFor?.split('T')[1]?.slice(0, 5) || '',
      action: notification.action || { type: 'none', url: '', label: '' }
    });
    setShowScheduledModal(false);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      recipientIds: [],
      recipientType: 'specific',
      role: '',
      department: '',
      faculty: '',
      course: '',
      title: '',
      message: '',
      priority: 'medium',
      type: 'announcement',
      scheduleType: 'now',
      scheduledDate: '',
      scheduledTime: '',
      expiresAt: '',
      action: {
        type: 'none',
        url: '',
        label: ''
      },
      attachments: []
    });
    setSelectAll(false);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300"
         style={{ marginLeft: sidebarOpen ? 208 : 64 }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">Notification Center</h1>
            <p className="text-purple-100 mt-1">
              Send and manage notifications to specific users or groups
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStatsModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center"
            >
              <FiEye className="mr-2" /> Statistics
            </button>
            <button
              onClick={() => setShowScheduledModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all flex items-center"
            >
              <FiClock className="mr-2" /> Scheduled ({scheduledNotifications.length})
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-yellow-600 text-white px-6 py-3 rounded-xl hover:bg-yellow-700 transition-all flex items-center"
            >
              <FiCopy className="mr-2" /> Templates
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-white text-purple-600 px-6 py-3 rounded-xl hover:bg-purple-50 transition-all flex items-center shadow-lg"
            >
              <FiPlus className="mr-2" /> New Notification
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FiBell className="h-6 w-6 text-blue-600" />}
            label="Total Notifications"
            value={stats.total || 0}
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={<FiMail className="h-6 w-6 text-green-600" />}
            label="Unread"
            value={stats.unread || 0}
            bgColor="bg-green-100"
          />
          <StatCard
            icon={<FiCheckCircle className="h-6 w-6 text-purple-600" />}
            label="Read"
            value={stats.read || 0}
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={<FiClock className="h-6 w-6 text-orange-600" />}
            label="Scheduled"
            value={scheduledNotifications.length}
            bgColor="bg-orange-100"
          />
        </div>
      )}

      {/* Notifications List */}
      <div className="mb-8">
        <NotificationList refresh={refreshList} />
      </div>

      {/* Compose Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} size="lg" title="Compose Notification">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <RecipientTypeButton
                type="all"
                icon={<FiUsers />}
                label="All Users"
                current={formData.recipientType}
                onClick={() => setFormData(prev => ({ ...prev, recipientType: 'all', recipientIds: [] }))}
              />
              <RecipientTypeButton
                type="role"
                icon={<FiUserCheck />}
                label="By Role"
                current={formData.recipientType}
                onClick={() => setFormData(prev => ({ ...prev, recipientType: 'role', recipientIds: [] }))}
              />
              <RecipientTypeButton
                type="department"
                icon={<FiFilter />}
                label="By Department"
                current={formData.recipientType}
                onClick={() => setFormData(prev => ({ ...prev, recipientType: 'department', recipientIds: [] }))}
              />
              <RecipientTypeButton
                type="faculty"
                icon={<FiUsers />}
                label="By Faculty"
                current={formData.recipientType}
                onClick={() => setFormData(prev => ({ ...prev, recipientType: 'faculty', recipientIds: [] }))}
              />
              <RecipientTypeButton
                type="course"
                icon={<FiBook />}
                label="By Course"
                current={formData.recipientType}
                onClick={() => setFormData(prev => ({ ...prev, recipientType: 'course', recipientIds: [] }))}
              />
              <RecipientTypeButton
                type="specific"
                icon={<FiUser />}
                label="Specific Users"
                current={formData.recipientType}
                onClick={() => setFormData(prev => ({ ...prev, recipientType: 'specific', recipientIds: [] }))}
              />
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
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.icon} {role.label}
                  </option>
                ))}
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

          {/* Faculty Selection */}
          {formData.recipientType === 'faculty' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty</label>
              <select
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a faculty</option>
                {faculties.map(fac => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>
            </div>
          )}

          {/* Course Selection */}
          {formData.recipientType === 'course' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Specific Users Selection */}
          {formData.recipientType === 'specific' && (
            <SpecificUsersSelection
              filteredUsers={filteredUsers}
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              selectedDepartment={selectedDepartment}
              setSelectedDepartment={setSelectedDepartment}
              selectedFaculty={selectedFaculty}
              setSelectedFaculty={setSelectedFaculty}
              departments={departments}
              faculties={faculties}
              roles={roles}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectAll={selectAll}
              handleSelectAll={handleSelectAll}
              recipientIds={formData.recipientIds}
              handleRecipientSelect={handleRecipientSelect}
            />
          )}

          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {notificationTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center text-sm ${
                    formData.type === type.value
                      ? type.color
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="flex space-x-2">
              {['low', 'medium', 'high'].map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize flex-1 ${
                    formData.priority === priority
                      ? priorityColors[priority]
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Exam Schedule Update, Grade Posted, etc."
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
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

          {/* Action URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              {['none', 'link', 'deadline'].map(actionType => (
                <button
                  key={actionType}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    action: { ...prev.action, type: actionType }
                  }))}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    formData.action.type === actionType
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {actionType === 'none' && 'No Action'}
                  {actionType === 'link' && '🔗 Link'}
                  {actionType === 'deadline' && '⏰ Deadline'}
                </button>
              ))}
            </div>
            
            {formData.action.type !== 'none' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  name="action.url"
                  value={formData.action.url}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    action: { ...prev.action, url: e.target.value }
                  }))}
                  placeholder={formData.action.type === 'link' ? "https://..." : "Deadline URL"}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  name="action.label"
                  value={formData.action.label}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    action: { ...prev.action, label: e.target.value }
                  }))}
                  placeholder="Button label (e.g., View Details)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send Schedule</label>
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, scheduleType: 'now' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex-1 ${
                  formData.scheduleType === 'now'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Send Now
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, scheduleType: 'scheduled' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex-1 ${
                  formData.scheduleType === 'scheduled'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Schedule for Later
              </button>
            </div>
            
            {formData.scheduleType === 'scheduled' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <input
                  type="time"
                  name="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (Optional)</label>
            <input
              type="datetime-local"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Recipient Summary */}
          {formData.recipientType !== 'specific' && formData.recipientType && (
            <RecipientSummary count={getRecipientCount()} />
          )}

          {formData.recipientType === 'specific' && formData.recipientIds.length > 0 && (
            <RecipientSummary count={formData.recipientIds.length} />
          )}

          {/* Form Actions */}
          <FormActions
            onCancel={() => { setShowModal(false); resetForm(); }}
            onSaveTemplate={handleSaveAsTemplate}
            submitText={formData.scheduleType === 'scheduled' ? 'Schedule Notification' : 'Send Notification'}
          />
        </form>
      </Modal>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Notification Templates"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          {templates.length > 0 ? (
            templates.map(template => (
              <TemplateCard
                key={template._id}
                template={template}
                onUse={() => handleUseTemplate(template)}
                onDelete={async () => {
                  if (!window.confirm('Delete this template?')) return;
                  try {
                    await api.delete(`/notifications/templates/${template._id}`);
                    toast.success('Template deleted');
                    fetchTemplates();
                  } catch (error) {
                    toast.error('Failed to delete template');
                  }
                }}
              />
            ))
          ) : (
            <EmptyTemplates />
          )}
        </div>
      </Modal>

      {/* Scheduled Notifications Modal */}
      <Modal
        isOpen={showScheduledModal}
        onClose={() => setShowScheduledModal(false)}
        title="Scheduled Notifications"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          {scheduledNotifications.length > 0 ? (
            scheduledNotifications.map(notification => (
              <ScheduledCard
                key={notification._id}
                notification={notification}
                onEdit={() => handleEditScheduled(notification)}
                onDelete={() => handleDeleteScheduled(notification._id)}
              />
            ))
          ) : (
            <EmptyScheduled />
          )}
        </div>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Notification Statistics"
        size="lg"
      >
        {stats && (
          <div className="space-y-6 p-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatBox
                label="Total Notifications"
                value={stats.total}
                icon={<FiBell className="h-8 w-8 text-blue-600" />}
                bgColor="bg-blue-100"
              />
              <StatBox
                label="Read Rate"
                value={`${((stats.read / stats.total) * 100 || 0).toFixed(1)}%`}
                icon={<FiCheckCircle className="h-8 w-8 text-green-600" />}
                bgColor="bg-green-100"
              />
              <StatBox
                label="Avg Daily"
                value={Math.round(stats.total / 30) || 0}
                icon={<FiTrendingUp className="h-8 w-8 text-purple-600" />}
                bgColor="bg-purple-100"
              />
            </div>

            {/* By Type */}
            {stats.byType && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">By Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const typeInfo = notificationTypes.find(t => t.value === type);
                    return (
                      <div key={type} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="flex items-center">
                          <span className="mr-2">{typeInfo?.icon || '📢'}</span>
                          <span className="text-sm font-medium">{typeInfo?.label || type}</span>
                        </span>
                        <span className="font-bold text-purple-600">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* By Priority */}
            {stats.byPriority && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">By Priority</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {Object.entries(stats.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority]}`}>
                        {priority}
                      </span>
                      <span className="font-bold text-purple-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Stats */}
            {stats.dailyStats && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Last 30 Days</h3>
                <div className="space-y-2">
                  {stats.dailyStats.map(day => (
                    <div key={day._id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-sm">{day._id}</span>
                      <span className="font-bold text-purple-600">{day.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Senders */}
            {stats.topSenders && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Senders</h3>
                <div className="space-y-2">
                  {stats.topSenders.map((sender, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="flex items-center">
                        <span className="w-6 text-gray-500">{idx + 1}.</span>
                        <span className="font-medium">{sender.sender?.name}</span>
                      </span>
                      <span className="font-bold text-purple-600">{sender.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// Helper Components

const RecipientTypeButton = ({ type, icon, label, current, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-2 rounded-lg flex items-center justify-center text-sm ${
      current === type
        ? 'bg-purple-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {icon} <span className="ml-1 hidden sm:inline">{label}</span>
  </button>
);

const SpecificUsersSelection = ({
  filteredUsers,
  selectedRole,
  setSelectedRole,
  selectedDepartment,
  setSelectedDepartment,
  selectedFaculty,
  setSelectedFaculty,
  departments,
  faculties,
  roles,
  searchTerm,
  setSearchTerm,
  selectAll,
  handleSelectAll,
  recipientIds,
  handleRecipientSelect
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients</label>
    
    {/* Search and Filters */}
    <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
      <div className="relative md:col-span-1">
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
        {roles.map(role => (
          <option key={role.value} value={role.value}>{role.icon} {role.label}</option>
        ))}
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
      <select
        value={selectedFaculty}
        onChange={(e) => setSelectedFaculty(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="all">All Faculties</option>
        {faculties.map(fac => (
          <option key={fac} value={fac}>{fac}</option>
        ))}
      </select>
    </div>

    {/* Select All */}
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
      multiple
      value={recipientIds}
      onChange={handleRecipientSelect}
      className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[200px]"
      size={8}
    >
      {filteredUsers.map(u => (
        <option key={u._id} value={u._id} className="py-1">
          {u.name} ({u.role}) {u.department ? `- ${u.department}` : ''} - {u.email}
        </option>
      ))}
    </select>
    <p className="text-xs text-gray-500 mt-1">
      Hold Ctrl (Cmd) to select multiple. Selected: {recipientIds.length}
    </p>
  </div>
);

const RecipientSummary = ({ count }) => (
  <div className="bg-purple-50 p-3 rounded-lg">
    <p className="text-sm text-purple-700 flex items-center">
      <FiUsers className="mr-2" />
      This notification will be sent to <span className="font-bold mx-1">{count}</span> recipient(s)
    </p>
  </div>
);

const FormActions = ({ onCancel, onSaveTemplate, submitText }) => (
  <div className="flex justify-between items-center pt-4">
    <button
      type="button"
      onClick={onSaveTemplate}
      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
    >
      <FiCopy className="mr-2" /> Save as Template
    </button>
    <div className="flex space-x-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700"
      >
        <FiSend className="mr-2" /> {submitText}
      </button>
    </div>
  </div>
);

const TemplateCard = ({ template, onUse, onDelete }) => {
  const typeInfo = notificationTypes.find(t => t.value === template.type);
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo?.color || 'bg-gray-100'}`}>
              {typeInfo?.icon} {typeInfo?.label || template.type}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[template.priority]}`}>
              {template.priority}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">{template.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.message}</p>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={onUse}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Use Template"
          >
            <FiCopy className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete Template"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ScheduledCard = ({ notification, onEdit, onDelete }) => (
  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[notification.priority]}`}>
            {notification.priority}
          </span>
          <span className="text-xs text-gray-500 flex items-center">
            <FiClock className="mr-1" />
            {new Date(notification.scheduledFor).toLocaleString()}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-2">
          Recipients: {notification.recipientType} • {notification.recipientIds?.length || 0} users
        </p>
      </div>
      <div className="flex space-x-2 ml-4">
        <button
          onClick={onEdit}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          title="Edit"
        >
          <FiEdit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const EmptyTemplates = () => (
  <div className="text-center py-8">
    <FiCopy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-500">No templates saved yet</p>
    <p className="text-sm text-gray-400 mt-1">Save frequently used notifications as templates</p>
  </div>
);

const EmptyScheduled = () => (
  <div className="text-center py-8">
    <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-500">No scheduled notifications</p>
    <p className="text-sm text-gray-400 mt-1">Schedule notifications to be sent later</p>
  </div>
);

const StatCard = ({ icon, label, value, bgColor }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex items-center">
      <div className={`p-3 ${bgColor} rounded-lg mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

const StatBox = ({ label, value, icon, bgColor }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center">
      <div className={`p-2 ${bgColor} rounded-lg mr-3`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

export default AdminNotifications;