import React, { useState, useRef, useEffect } from 'react';
import { FiCamera, FiX, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ProfilePictureUpload = ({ currentPicture, userName, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  // Get the full URL for the profile picture
  const getImageUrl = (path) => {
    if (!path) return null;
    
    // If it's already a full URL, return as is
    if (path.startsWith('http')) return path;
    
    // If it's a relative path starting with /uploads
    if (path.startsWith('/uploads')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${path}`;
    }
    
    // If it's just a filename
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/uploads/profiles/${path}`;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setImageError(false);
    };
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    const file = fileInputRef.current?.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    setUploading(true);
    try {
      const response = await api.post('/users/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Upload response:', response.data);

      toast.success('Profile picture updated successfully');
      
      // Pass the full URL to parent
      const pictureUrl = response.data.profilePicture;
      onUpdate(pictureUrl);
      
      setShowModal(false);
      setPreview(null);
      setImageError(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setUploading(true);
    try {
      await api.delete('/users/profile/picture');
      toast.success('Profile picture removed');
      onUpdate(null);
      setShowModal(false);
      setPreview(null);
      setImageError(false);
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove picture');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setShowModal(false);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageError = () => {
    console.error('Failed to load image:', currentPicture);
    setImageError(true);
  };

  const imageUrl = getImageUrl(currentPicture);

  return (
    <>
      {/* Profile Picture Display */}
      <div className="relative group">
        <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-1">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={userName}
              className="h-full w-full rounded-full object-cover"
              onError={handleImageError}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
              {imageError ? (
                <FiAlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <span className="text-3xl font-bold text-purple-600">
                  {getInitials(userName)}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
          title="Change profile picture"
        >
          <FiCamera className="h-4 w-4" />
        </button>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={handleCancel}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Profile Picture
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {/* Preview */}
              <div className="flex justify-center mb-6">
                <div className="h-32 w-32 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-1">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : imageUrl && !imageError ? (
                    <img
                      src={imageUrl}
                      alt={userName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-4xl font-bold text-purple-600">
                        {getInitials(userName)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2 rounded-lg transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <FiCamera className="inline mr-2 h-4 w-4" />
                    Choose Image
                  </label>
                </div>

                {preview && (
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {uploading ? (
                        <>
                          <FiLoader className="animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FiCheck className="mr-2" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {imageUrl && !preview && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleRemove}
                      disabled={uploading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      Remove current picture
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePictureUpload;