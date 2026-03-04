import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import Loader from "../../components/common/loader";
import Modal from "../../components/common/model";
import { FiPlus, FiSend, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

const AdminNotifications = ({ sidebarOpen }) => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    recipientIds: [],
    role: "",
    title: "",
    message: "",
    type: "GENERAL",
    priority: "MEDIUM",
    link: "",
  });

  // ===============================
  // INITIAL LOAD
  // ===============================
  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      const [usersRes, notifRes, unreadRes] = await Promise.all([
        api.get("/api/users"),
        api.get("/api/notifications"),
        api.get("/api/notifications/unread-count"),
      ]);

      setUsers(usersRes.data.users || []);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(unreadRes.data.count || 0);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // LOCAL STATE UPDATE HELPERS
  // ===============================
  const updateUnreadCount = (list) => {
    const count = list.filter((n) => !n.isRead).length;
    setUnreadCount(count);
  };

  // ===============================
  // MARK AS READ
  // ===============================
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);

      const updated = notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      );

      setNotifications(updated);
      updateUnreadCount(updated);
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  // ===============================
  // MARK ALL
  // ===============================
  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");

      const updated = notifications.map((n) => ({
        ...n,
        isRead: true,
      }));

      setNotifications(updated);
      setUnreadCount(0);
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to update");
    }
  };

  // ===============================
  // DELETE
  // ===============================
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);

      const updated = notifications.filter((n) => n._id !== id);
      setNotifications(updated);
      updateUnreadCount(updated);

      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;

    try {
      await api.delete("/api/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All cleared");
    } catch {
      toast.error("Failed to clear");
    }
  };

  // ===============================
  // SEND NOTIFICATION
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      return toast.error("Title and message required");
    }

    if (!formData.role && formData.recipientIds.length === 0) {
      return toast.error("Select users or role");
    }

    try {
      setSending(true);

      await api.post("/api/notifications/send", formData);

      toast.success("Notification sent");

      setFormData({
        recipientIds: [],
        role: "",
        title: "",
        message: "",
        type: "GENERAL",
        priority: "MEDIUM",
        link: "",
      });

      setShowModal(false);
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, options } = e.target;

    if (name === "recipientIds") {
      const selected = Array.from(options)
        .filter((o) => o.selected)
        .map((o) => o.value);

      setFormData((prev) => ({ ...prev, recipientIds: selected }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [notifications]);

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-6 py-8"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-8 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Admin Notifications ({unreadCount} unread)
          </h1>
          <p className="text-purple-100">
            Send and manage system notifications
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMarkAllAsRead}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg"
          >
            Mark All
          </button>

          <button
            onClick={handleClearAll}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Clear All
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg flex items-center"
          >
            <FiPlus className="mr-2" />
            New
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <p>No notifications found</p>
        ) : (
          sortedNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-xl shadow ${notif.isRead ? "bg-gray-100" : "bg-purple-50"
                }`}
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{notif.title}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(notif.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="text-sm mt-2">{notif.message}</p>

              <div className="mt-3 flex gap-3 text-sm">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="text-blue-600"
                  >
                    Mark Read
                  </button>
                )}

                <button
                  onClick={() => handleDelete(notif._id)}
                  className="text-red-600 flex items-center"
                >
                  <FiTrash2 className="mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <h2 className="text-xl font-semibold mb-4">
          Compose Notification
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Broadcast */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select Role (Optional)</option>
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="admin">Admin</option>
          </select>

          {/* Specific Users */}
          <select
            name="recipientIds"
            multiple
            value={formData.recipientIds}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          <input
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          />

          <textarea
            name="message"
            placeholder="Message"
            value={formData.message}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            rows="4"
            required
          />

          <input
            name="link"
            placeholder="Redirect Link (optional)"
            value={formData.link}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />

          {/* Type */}
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="GENERAL">General</option>
            <option value="RESULT_PUBLISHED">Result</option>
            <option value="FILE_UPLOADED">File</option>
            <option value="TIMETABLE_UPDATED">Timetable</option>
            <option value="SYSTEM_ALERT">System Alert</option>
          </select>

          {/* Priority */}
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <button
            type="submit"
            disabled={sending}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FiSend className="mr-2" />
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminNotifications;