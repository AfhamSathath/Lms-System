import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/Authcontext";
import api from "../../services/api";
import {
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiCalendar,
  FiFile,
  FiAward,
  FiTrash2,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Notification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all"); // all | unread | read
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get("/api/notifications"),
        api.get("/api/notifications/unread-count"),
      ]);

      setNotifications(notifRes.data.notifications);
      setUnreadCount(countRes.data.count);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update");
    }
  };

  const deleteNotification = async (id) => {
    try {
      const target = notifications.find((n) => n._id === id);

      await api.delete(`/api/notifications/${id}`);

      setNotifications((prev) => prev.filter((n) => n._id !== id));

      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      toast.success("Notification deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;

    try {
      await api.delete("/api/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear");
    }
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  // ICON MAPPER (based on backend enum)
  const getIcon = (type) => {
    switch (type) {
      case "RESULT_PUBLISHED":
        return <FiAward className="text-yellow-500" />;
      case "FILE_UPLOADED":
        return <FiFile className="text-blue-500" />;
      case "TIMETABLE_UPDATED":
        return <FiCalendar className="text-purple-500" />;
      case "SYSTEM_ALERT":
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (statusFilter === "unread")
      filtered = filtered.filter((n) => !n.isRead);

    if (statusFilter === "read")
      filtered = filtered.filter((n) => n.isRead);

    if (typeFilter !== "all")
      filtered = filtered.filter((n) => n.type === typeFilter);

    return filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [notifications, statusFilter, typeFilter]);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-b-2 border-purple-600 rounded-full" />
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center text-white">
          <FiBell className="mr-2" />
          <h2 className="font-semibold text-lg">Notifications</h2>
        </div>
        {unreadCount > 0 && (
          <span className="bg-white text-purple-600 px-2 py-1 text-xs rounded-full font-bold">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* FILTERS */}
      <div className="p-4 border-b flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="all">All Types</option>
          <option value="RESULT_PUBLISHED">Results</option>
          <option value="FILE_UPLOADED">Files</option>
          <option value="TIMETABLE_UPDATED">Timetable</option>
          <option value="SYSTEM_ALERT">Alerts</option>
          <option value="GENERAL">General</option>
        </select>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm"
          >
            Mark all read
          </button>
        )}

        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm"
          >
            Clear all
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="max-h-[500px] overflow-y-auto divide-y">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No notifications found
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${!n.isRead ? "bg-purple-50" : ""
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{getIcon(n.type)}</div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{n.title}</h4>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {n.message}
                  </p>

                  <div className="mt-3 flex gap-3 text-xs">
                    {!n.isRead ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n._id);
                        }}
                        className="text-purple-600 flex items-center"
                      >
                        <FiEye className="mr-1" /> Mark read
                      </button>
                    ) : (
                      <span className="text-gray-400 flex items-center">
                        <FiEyeOff className="mr-1" /> Read
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n._id);
                      }}
                      className="text-red-600 flex items-center"
                    >
                      <FiTrash2 className="mr-1" /> Delete
                    </button>
                  </div>
                </div>

                {n.priority === "HIGH" && (
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                )}
                {n.priority === "MEDIUM" && (
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;