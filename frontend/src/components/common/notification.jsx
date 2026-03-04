import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiX,
  FiCalendar,
  FiFile,
  FiAward,
  FiClock,
  FiTrash2,
  FiDownload,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Notification = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, result, file, timetable, alert

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notificationsRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notificationsRes.data.notifications);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      if (!notifications.find(n => n._id === id)?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const clearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        await api.delete('/notifications/clear-all');
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications cleared');
      } catch (error) {
        toast.error('Failed to clear notifications');
      }
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconClasses = "h-5 w-5";

    switch (type) {
      case 'result':
        return <FiAward className={`${iconClasses} text-yellow-500`} />;
      case 'file':
        return <FiFile className={`${iconClasses} text-blue-500`} />;
      case 'timetable':
        return <FiCalendar className={`${iconClasses} text-purple-500`} />;
      case 'alert':
        return <FiAlertCircle className={`${iconClasses} text-red-500`} />;
      default:
        return <FiInfo className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-50 border-red-200';
    if (priority === 'medium') return 'bg-yellow-50 border-yellow-200';

    switch (type) {
      case 'result':
        return 'bg-yellow-50 border-yellow-200';
      case 'file':
        return 'bg-blue-50 border-blue-200';
      case 'timetable':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit if not showing all
    if (!showAll) {
      filtered = filtered.slice(0, 10);
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const hasUnread = notifications.some(n => !n.isRead);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiBell className="h-6 w-6 text-white mr-2" />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>
          {unreadCount > 0 && (
            <span className="bg-white text-purple-600 px-2 py-1 rounded-full text-xs font-bold">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            <option value="result">Results</option>
            <option value="file">Files</option>
            <option value="timetable">Timetable</option>
            <option value="alert">Alerts</option>
            <option value="general">General</option>
          </select>
          {hasUnread && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors flex items-center"
            >
              <FiCheckCircle className="mr-1 h-4 w-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center"
            >
              <FiTrash2 className="mr-1 h-4 w-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-purple-50' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>

                    {/* Metadata */}
                    {notification.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        {notification.metadata.subjectId && (
                          <span className="mr-3">Subject: {notification.metadata.subjectName}</span>
                        )}
                        {notification.metadata.grade && (
                          <span className="mr-3">Grade: {notification.metadata.grade}</span>
                        )}
                        {notification.metadata.examType && (
                          <span>Exam: {notification.metadata.examType}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center space-x-3">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <FiEye className="mr-1 h-3 w-3" />
                          Mark as read
                        </button>
                      )}
                      {notification.isRead && (
                        <span className="text-xs text-gray-400 flex items-center">
                          <FiEyeOff className="mr-1 h-3 w-3" />
                          Read
                        </span>
                      )}

                      {/* Type-specific actions */}
                      {notification.type === 'file' && notification.metadata?.fileId && (
                        <button
                          onClick={() => window.open(`/files/download/${notification.metadata.fileId}`, '_blank')}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <FiDownload className="mr-1 h-3 w-3" />
                          Download
                        </button>
                      )}

                      {notification.type === 'result' && notification.metadata?.resultId && (
                        <Link
                          to={`/${user.role}/results`}
                          className="text-xs text-yellow-600 hover:text-yellow-800 flex items-center"
                        >
                          <FiAward className="mr-1 h-3 w-3" />
                          View Result
                        </Link>
                      )}

                      {notification.type === 'timetable' && notification.metadata?.timetableId && (
                        <Link
                          to={`/${user.role}/timetable`}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
                        >
                          <FiCalendar className="mr-1 h-3 w-3" />
                          View Schedule
                        </Link>
                      )}

                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center"
                      >
                        <FiTrash2 className="mr-1 h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Priority indicator */}
                  {notification.priority === 'high' && (
                    <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                  {notification.priority === 'medium' && (
                    <span className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiBell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications found</p>
            {(filter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setFilter('all');
                  setTypeFilter('all');
                }}
                className="mt-3 text-sm text-purple-600 hover:text-purple-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            {showAll ? 'Show less' : `View all (${notifications.length})`}
          </button>
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="text-center py-12">
          <FiBell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Notifications will appear here when there are updates
          </p>
        </div>
      )}
    </div>
  );
};

// Compact notification component for navbar dropdown
export const NotificationDropdown = ({ onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notificationsRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notificationsRes.data.notifications.slice(0, 5));
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'result':
        return <FiAward className="h-4 w-4 text-yellow-500" />;
      case 'file':
        return <FiFile className="h-4 w-4 text-blue-500" />;
      case 'timetable':
        return <FiCalendar className="h-4 w-4 text-purple-500" />;
      case 'alert':
        return <FiAlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FiInfo className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        {unreadCount > 0 && (
          <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
            {unreadCount} new
          </span>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-purple-50' : ''
                }`}
              onClick={() => {
                markAsRead(notification._id);
                if (notification.metadata?.resultId) {
                  window.location.href = `/${user.role}/results`;
                } else if (notification.metadata?.fileId) {
                  window.open(`/files/download/${notification.metadata.fileId}`, '_blank');
                } else if (notification.metadata?.timetableId) {
                  window.location.href = `/${user.role}/timetable`;
                }
                onClose();
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notification.isRead && (
                  <span className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full"></span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <FiBell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <Link
            to={`/${user.role}/notifications`}
            className="block text-center text-sm text-purple-600 hover:text-purple-800"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

// Notification badge component
export const NotificationBadge = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <FiBell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};

// Toast notification component
export const ToastNotification = ({ title, message, type = 'info' }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <FiAlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <FiInfo className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-600 mt-1">{message}</p>
      </div>
    </div>
  );
};

export default Notification;