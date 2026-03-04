import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Loader from "../../components/common/loader";
import Modal from "../../components/common/model";
import { FiPlus, FiSend } from "react-icons/fi";
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
    title: "",
    message: "",
  });

  // ===============================
  // FETCH USERS + NOTIFICATIONS
  // ===============================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [usersRes, notifRes, unreadRes] = await Promise.all([
        api.get("api/users"),
        api.get("api/notifications"),
        api.get("api/notifications/unread-count"),
      ]);

      setUsers(usersRes.data.users || []);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(unreadRes.data.count || 0);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // GET NOTIFICATIONS
  // ===============================
  const fetchNotifications = async () => {
    try {
      const res = await api.get("api/notifications");
      setNotifications(res.data.notifications);
    } catch {
      toast.error("Failed to fetch notifications");
    }
  };

  // ===============================
  // GET UNREAD COUNT
  // ===============================
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("api/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch {
      toast.error("Failed to fetch unread count");
    }
  };

  // ===============================
  // MARK SINGLE AS READ
  // ===============================
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`api/notifications/${id}/read`);
      toast.success("Marked as read");
      fetchNotifications();
      fetchUnreadCount();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  // ===============================
  // MARK ALL AS READ
  // ===============================
  const handleMarkAllAsRead = async () => {
    try {
      await api.put("api/notifications/read-all");
      toast.success("All marked as read");
      fetchNotifications();
      fetchUnreadCount();
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  // ===============================
  // DELETE SINGLE
  // ===============================
  const handleDelete = async (id) => {
    try {
      await api.delete(`api/notifications/${id}`);
      toast.success("Notification deleted");
      fetchNotifications();
      fetchUnreadCount();
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  // ===============================
  // CLEAR ALL
  // ===============================
  const handleClearAll = async () => {
    try {
      await api.delete("api/notifications/clear-all");
      toast.success("All notifications cleared");
      fetchNotifications();
      fetchUnreadCount();
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  // ===============================
  // SEND NOTIFICATION
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.recipientIds.length === 0) {
      return toast.error("Select at least one recipient");
    }

    try {
      setSending(true);
      await api.post("api/notifications/send", formData);

      toast.success("Notification sent");

      setFormData({
        recipientIds: [],
        title: "",
        message: "",
      });

      setShowModal(false);
      fetchNotifications();
      fetchUnreadCount();
    } catch {
      toast.error("Failed to send notification");
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

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-4 py-8"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-8 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Notifications ({unreadCount} unread)
          </h1>
          <p className="text-purple-100">
            Manage and send system notifications
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMarkAllAsRead}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg"
          >
            Mark All Read
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

      {/* Notification List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p>No notifications found</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-lg shadow ${notif.isRead ? "bg-gray-100" : "bg-blue-50"
                }`}
            >
              <h3 className="font-semibold">{notif.title}</h3>
              <p className="text-sm">{notif.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notif.createdAt).toLocaleString()}
              </p>

              <div className="mt-3 flex gap-3">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="text-blue-600 text-sm"
                  >
                    Mark as Read
                  </button>
                )}

                <button
                  onClick={() => handleDelete(notif._id)}
                  className="text-red-600 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <h2 className="text-xl font-semibold mb-4">
          Compose Notification
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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