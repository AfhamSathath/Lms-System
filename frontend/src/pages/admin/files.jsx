import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiFile, 
  FiUpload, 
  FiTrash2, 
  FiDownload,
  FiSearch,
  FiFilter,
  FiBook,
  FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminFiles = ({ sidebarOpen }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    semester: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, selectedSubject, selectedSemester, files]);

  const fetchData = async () => {
    try {
      const [filesRes, subjectsRes] = await Promise.all([
        api.get('/files'),
        api.get('/subjects')
      ]);
      setFiles(filesRes.data.files);
      setFilteredFiles(filesRes.data.files);
      setSubjects(subjectsRes.data.subjects);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = files;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(f => f.subject?._id === selectedSubject);
    }

    if (selectedSemester !== 'all') {
      filtered = filtered.filter(f => f.semester === parseInt(selectedSemester));
    }

    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFiles(filtered);
  };

  const handleFileSelect = (e) => setSelectedFile(e.target.files[0]);
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return toast.error('Please select a file');

    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    uploadData.append('subjectId', formData.subjectId);
    uploadData.append('semester', formData.semester);
    uploadData.append('description', formData.description);

    setUploading(true);
    try {
      await api.post('/files/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      toast.success('File uploaded successfully');
      setShowUploadModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      toast.success('File deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/files/download/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to download file');
    }
  };

  const resetForm = () => {
    setFormData({ subjectId: '', semester: '', description: '' });
    setSelectedFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }} // responsive margin like AdminDashboard
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">File Management</h1>
          <p className="text-purple-100 truncate mt-1">
            Manage all uploaded study materials
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center whitespace-nowrap"
        >
          <FiUpload className="mr-2" /> Upload File
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Semesters</option>
              {semesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('all');
                setSelectedSemester('all');
              }}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map(file => (
            <div key={file._id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-w-0">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center">
                <FiFile className="h-8 w-8 text-white mr-3" />
                <h3 className="text-lg font-semibold text-white truncate">{file.originalName}</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <FiBook className="mr-2 text-purple-500" />
                    <span className="text-sm truncate">{file.subject?.name}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiUser className="mr-2 text-green-500" />
                    <span className="text-sm truncate">Uploaded by: {file.uploadedBy?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Size: {formatFileSize(file.size)}</span>
                    <span>Downloads: {file.downloads || 0}</span>
                  </div>
                  <div className="text-sm text-gray-500">Semester: {file.semester}</div>
                  {file.description && (
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded truncate">
                      {file.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-end space-x-2 mt-auto">
                  <button
                    onClick={() => handleDownload(file._id, file.originalName)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiDownload className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <FiFile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No files found</p>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); resetForm(); }}
        title="Upload File"
        size="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a subject</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter file description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose File</label>
            <input
              type="file"
              onChange={handleFileSelect}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Max file size: 10MB. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG
            </p>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowUploadModal(false); resetForm(); }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminFiles;