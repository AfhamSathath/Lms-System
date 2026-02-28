import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import Notification from '../../components/common/notification';
import { FiPlus, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminNotifications = ({ sidebarOpen }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    recipientIds: [],
    title: '',
    message: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data.users);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'recipientIds') {
      const vals = Array.from(options)
        .filter(o => o.selected)
        .map(o => o.value);
      setFormData(f => ({ ...f, recipientIds: vals }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notifications/send', formData);
      toast.success('Notification sent');
      setShowModal(false);
      setFormData({ recipientIds: [], title: '', message: '' });
    } catch {
      toast.error('Failed to send notification');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }} // responsive margin like dashboard
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Notifications</h1>
          <p className="text-purple-100 truncate mt-1">
            Send and view system notifications
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center whitespace-nowrap"
        >
          <FiPlus className="mr-2" /> New Notification
        </button>
      </div>

      {/* Notifications List */}
      <div className="mb-8 grid grid-cols-1 gap-6">
        <Notification />
      </div>

      {/* Compose Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <h2 className="text-xl font-semibold mb-4">Compose Notification</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
            <select
              name="recipientIds"
              multiple
              value={formData.recipientIds}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Hold Ctrl (Cmd) to select multiple.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700"
            >
              <FiSend className="mr-2" /> Send
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminNotifications;