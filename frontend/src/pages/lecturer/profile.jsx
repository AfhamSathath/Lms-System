import React, { useState } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Loader from '../../components/common/loader';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiBook,
  FiHash,
  FiEdit2,
  FiSave,
  FiX,
  FiCamera
} from 'react-icons/fi';

const LecturerProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/users/profile', formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-green-600 to-teal-600"></div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="inline-block">
                <div className="h-24 w-24 rounded-full bg-white p-1">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-green-600 to-teal-600 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors">
                  <FiCamera className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Edit Toggle */}
            <div className="absolute top-4 right-6">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <FiSave className="mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <FiX className="mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Profile Details */}
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Full Name
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email Address
                  </label>
                  <p className="text-lg text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Lecturer ID
                  </label>
                  <p className="text-lg font-semibold text-green-600">{user?.lecturerId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Department
                  </label>
                  <p className="text-lg text-gray-900">{user?.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <p className="text-lg text-gray-900">{user?.phone || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Address
                  </label>
                  <p className="text-lg text-gray-900">{user?.address || 'Not provided'}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label htmlFor="lecturer-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="lecturer-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="lecturer-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Cannot be changed)
                  </label>
                  <input
                    id="lecturer-email"
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="lecturer-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="lecturer-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department (Cannot be changed)
                  </label>
                  <input
                    type="text"
                    value={user?.department}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="lecturer-address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    id="lecturer-address"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter your address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiBook className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-800">Teaching Info</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Department:</span> <span className="font-medium">{user?.department}</span></p>
              <p><span className="text-gray-500">Lecturer ID:</span> <span className="font-medium">{user?.lecturerId}</span></p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiPhone className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-800">Contact Info</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Email:</span> <span className="font-medium">{user?.email}</span></p>
              <p><span className="text-gray-500">Phone:</span> <span className="font-medium">{user?.phone || 'Not provided'}</span></p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiMapPin className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="ml-3 font-semibold text-gray-800">Address</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">{user?.address || 'No address provided'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerProfile;