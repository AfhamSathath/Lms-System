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
  FiUser,
  FiCalendar,
  FiGrid,
  FiChevronDown,
  FiRefreshCw,
  FiFolder,
  FiEye,
  FiShare2,
  FiStar,
  FiClock,
  FiTag,
  FiUsers,
  FiBarChart2,
  FiEdit2,
  FiAlertCircle  // Added missing import
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminFiles = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [apiError, setApiError] = useState(false); // Track if backend is available
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [selectedUploader, setSelectedUploader] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    course: '',
    year: '',
    semester: '',
    fileType: 'lecture_notes',
    description: '',
    tags: '',
    isPublic: true
  });

  const [selectedFileObj, setSelectedFileObj] = useState(null);

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  const semesters = [1, 2];
  const fileTypes = [
    { value: 'lecture_notes', label: 'Lecture Notes', icon: '📝' },
    { value: 'tutorial', label: 'Tutorial', icon: '📚' },
    { value: 'assignment', label: 'Assignment', icon: '📋' },
    { value: 'past_paper', label: 'Past Paper', icon: '📄' },
    { value: 'syllabus', label: 'Syllabus', icon: '📌' },
    { value: 'reading_material', label: 'Reading Material', icon: '📖' },
    { value: 'lab_manual', label: 'Lab Manual', icon: '🔬' },
    { value: 'project_guideline', label: 'Project Guideline', icon: '🎯' },
    { value: 'announcement', label: 'Announcement', icon: '📢' },
    { value: 'supplementary_material', label: 'Supplementary', icon: '📎' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, selectedCourse, selectedYear, selectedSemester, 
      selectedDepartment, selectedFaculty, selectedFileType, 
      selectedUploader, dateRange, files]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setApiError(false);
      
      // Try to fetch data, but don't fail completely if some endpoints are missing
      let filesRes = { data: { files: [] } };
      let coursesRes = { data: { courses: [] } };
      let statsRes = { data: { stats: {} } };
      
      try {
        filesRes = await api.get('/files');
      } catch (error) {
        console.warn('Files endpoint not available:', error);
      }
      
      try {
        coursesRes = await api.get('/courses?isActive=true');
      } catch (error) {
        console.warn('Courses endpoint not available:', error);
      }
      
      try {
        statsRes = await api.get('/files/stats');
      } catch (error) {
        console.warn('Stats endpoint not available:', error);
      }
      
      setFiles(filesRes.data.files || []);
      setFilteredFiles(filesRes.data.files || []);
      setCourses(coursesRes.data.courses || []);
      setStats(statsRes.data.stats || {});
      
      // Extract unique departments and faculties
      const uniqueDepts = [...new Set((coursesRes.data.courses || []).map(c => c.department?.name).filter(Boolean))];
      const uniqueFaculties = [...new Set((coursesRes.data.courses || []).map(c => c.faculty?.name).filter(Boolean))];
      const uniqueUploaders = [...new Set((filesRes.data.files || []).map(f => f.uploadedBy?.name).filter(Boolean))];
      
      setDepartments(uniqueDepts);
      setFaculties(uniqueFaculties);
    } catch (error) {
      console.error('Error fetching data:', error);
      setApiError(true);
      toast.error('Backend server not responding. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.originalName?.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term) ||
        f.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        f.course?.courseName?.toLowerCase().includes(term) ||
        f.course?.courseCode?.toLowerCase().includes(term)
      );
    }

    // Course filter
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(f => f.course?._id === selectedCourse);
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(f => f.yearOfStudy === parseInt(selectedYear));
    }

    // Semester filter
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(f => f.semester === parseInt(selectedSemester));
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(f => f.department?.name === selectedDepartment);
    }

    // Faculty filter
    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(f => f.faculty?.name === selectedFaculty);
    }

    // File type filter
    if (selectedFileType !== 'all') {
      filtered = filtered.filter(f => f.fileType === selectedFileType);
    }

    // Uploader filter
    if (selectedUploader !== 'all') {
      filtered = filtered.filter(f => f.uploadedBy?.name === selectedUploader);
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(f => new Date(f.uploadedAt) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      filtered = filtered.filter(f => new Date(f.uploadedAt) <= new Date(dateRange.to));
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    setFilteredFiles(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (e) => {
    setSelectedFileObj(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFileObj) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.course) {
      toast.error('Please select a course');
      return;
    }

    if (!formData.year) {
      toast.error('Please select academic year');
      return;
    }

    if (!formData.semester) {
      toast.error('Please select semester');
      return;
    }

    // Validate file size (50MB max)
    if (selectedFileObj.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', selectedFileObj);
    uploadData.append('courseId', formData.course);
    uploadData.append('yearOfStudy', formData.year);
    uploadData.append('semester', formData.semester);
    uploadData.append('fileType', formData.fileType);
    uploadData.append('description', formData.description);
    uploadData.append('tags', formData.tags);
    uploadData.append('isPublic', formData.isPublic);

    setUploading(true);
    try {
      const response = await api.post('/files/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      
      toast.success('File uploaded successfully');
      setShowUploadModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const response = await api.put(`/files/${selectedFile._id}`, {
        description: formData.description,
        fileType: formData.fileType,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        isPublic: formData.isPublic,
        yearOfStudy: formData.year,
        semester: formData.semester
      });

      toast.success('File updated successfully');
      setShowEditModal(false);
      setSelectedFile(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update file');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await api.delete(`/files/${fileId}`);
      toast.success('File deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected');
      return;
    }

    if (!window.confirm(`Delete ${selectedFiles.length} selected files?`)) return;

    try {
      await api.delete('/files/bulk', { data: { fileIds: selectedFiles } });
      toast.success(`${selectedFiles.length} files deleted successfully`);
      setSelectedFiles([]);
      setShowBulkDeleteModal(false);
      fetchData();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete files');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/download/${fileId}`, { 
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Download progress: ${percentCompleted}%`);
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f._id));
    }
  };

  const openViewModal = (file) => {
    setSelectedFile(file);
    setShowViewModal(true);
  };

  const openEditModal = (file) => {
    setSelectedFile(file);
    setFormData({
      course: file.course?._id || '',
      year: file.yearOfStudy || '',
      semester: file.semester || '',
      fileType: file.fileType || 'lecture_notes',
      description: file.description || '',
      tags: file.tags?.join(', ') || '',
      isPublic: file.isPublic || true
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      course: '',
      year: '',
      semester: '',
      fileType: 'lecture_notes',
      description: '',
      tags: '',
      isPublic: true
    });
    setSelectedFileObj(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileIcon = (mimeType, fileType) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.startsWith('video/')) return '🎥';
    if (mimeType?.startsWith('audio/')) return '🎵';
    if (mimeType?.includes('pdf')) return '📕';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📘';
    if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return '📊';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📗';
    
    // Fallback to file type
    const typeIcons = {
      'lecture_notes': '📝',
      'tutorial': '📚',
      'assignment': '📋',
      'past_paper': '📄',
      'syllabus': '📌',
      'reading_material': '📖',
      'lab_manual': '🔬',
      'project_guideline': '🎯',
      'announcement': '📢',
      'supplementary_material': '📎'
    };
    return typeIcons[fileType] || '📁';
  };

  const getFileTypeColor = (fileType) => {
    const colors = {
      'lecture_notes': 'bg-blue-100 text-blue-800',
      'tutorial': 'bg-green-100 text-green-800',
      'assignment': 'bg-yellow-100 text-yellow-800',
      'past_paper': 'bg-purple-100 text-purple-800',
      'syllabus': 'bg-indigo-100 text-indigo-800',
      'reading_material': 'bg-pink-100 text-pink-800',
      'lab_manual': 'bg-orange-100 text-orange-800',
      'project_guideline': 'bg-red-100 text-red-800',
      'announcement': 'bg-teal-100 text-teal-800',
      'supplementary_material': 'bg-gray-100 text-gray-800'
    };
    return colors[fileType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loader fullScreen />;

  // Show backend connection error if API is not available
  if (apiError) {
    return (
      <div className="container mx-auto px-4 py-8 transition-all duration-300"
           style={{ marginLeft: sidebarOpen ? 208 : 64 }}>
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <FiAlertCircle className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-xl font-bold text-red-700">Backend Connection Error</h2>
          </div>
          <p className="text-red-600 mb-4">
            Cannot connect to the backend server. Please ensure:
          </p>
          <ul className="list-disc list-inside text-red-600 space-y-2 mb-6">
            <li>The backend server is running on port 5001</li>
            <li>Your API endpoints are correctly configured</li>
            <li>Check the console for more detailed error messages</li>
          </ul>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300"
         style={{ marginLeft: sidebarOpen ? 208 : 64 }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">File Management</h1>
            <p className="text-purple-100 mt-1">
              Upload, manage, and share educational materials
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStatsModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center"
            >
              <FiBarChart2 className="mr-2" /> Statistics
            </button>
            {selectedFiles.length > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all flex items-center"
              >
                <FiTrash2 className="mr-2" /> Delete ({selectedFiles.length})
              </button>
            )}
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              className="bg-white text-purple-600 px-6 py-3 rounded-xl hover:bg-purple-50 transition-all flex items-center shadow-lg"
            >
              <FiUpload className="mr-2" /> Upload File
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FiFile className="h-6 w-6 text-blue-600" />}
            label="Total Files"
            value={stats.totalFiles || 0}
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={<FiDownload className="h-6 w-6 text-green-600" />}
            label="Total Downloads"
            value={stats.totalDownloads || 0}
            bgColor="bg-green-100"
          />
          <StatCard
            icon={<FiFolder className="h-6 w-6 text-purple-600" />}
            label="Total Size"
            value={formatFileSize(stats.totalSize || 0)}
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={<FiUsers className="h-6 w-6 text-orange-600" />}
            label="Active Uploaders"
            value={Object.keys(stats.topUploaders || {}).length}
            bgColor="bg-orange-100"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files by name, description, tags, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* File Type Filter */}
          <div className="relative">
            <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All File Types</option>
              {fileTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Years</option>
              {academicYears.map((year, idx) => (
                <option key={year} value={idx + 1}>{year}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Course Filter */}
          <div className="relative">
            <FiBook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course._id} value={course._id}>
                  {course.courseCode} - {course.courseName}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <FiGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Faculty Filter */}
          <div className="relative">
            <FiBook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="all">All Faculties</option>
              {faculties.map(fac => (
                <option key={fac} value={fac}>{fac}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              placeholder="From"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="date"
              placeholder="To"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="selectAll" className="text-sm text-gray-600">
              Select All ({filteredFiles.length} files)
            </label>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCourse('all');
              setSelectedYear('all');
              setSelectedSemester('all');
              setSelectedDepartment('all');
              setSelectedFaculty('all');
              setSelectedFileType('all');
              setDateRange({ from: '', to: '' });
              setSelectedFiles([]);
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map(file => (
            <FileCard
              key={file._id}
              file={file}
              isSelected={selectedFiles.includes(file._id)}
              onSelect={() => handleSelectFile(file._id)}
              onView={() => openViewModal(file)}
              onEdit={() => openEditModal(file)}
              onDelete={() => handleDelete(file._id)}
              onDownload={() => handleDownload(file._id, file.originalName)}
              getFileIcon={getFileIcon}
              getFileTypeColor={getFileTypeColor}
              formatFileSize={formatFileSize}
              fileTypes={fileTypes}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          onUpload={() => {
            resetForm();
            setShowUploadModal(true);
          }}
        />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          resetForm();
        }}
        title="Upload File"
        size="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course *
              </label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - {course.courseName} ({course.department?.name || 'No Dept'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                {academicYears.map((year, idx) => (
                  <option key={year} value={idx + 1}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type *
              </label>
              <select
                name="fileType"
                value={formData.fileType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {fileTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., important, exam, revision"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter file description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Make this file public (visible to all enrolled students)
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose File *
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Max file size: 50MB. All supported formats accepted.
              </p>
            </div>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(false);
                resetForm();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFile(null);
          resetForm();
        }}
        title="Edit File Metadata"
        size="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                {academicYears.map((year, idx) => (
                  <option key={year} value={idx + 1}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Type
              </label>
              <select
                name="fileType"
                value={formData.fileType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {fileTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Make this file public
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedFile(null);
                resetForm();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Update File
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedFile(null);
        }}
        title="File Details"
        size="lg"
      >
        {selectedFile && (
          <div className="space-y-6">
            {/* File Header */}
            <div className="flex items-center space-x-4">
              <div className="text-4xl">
                {getFileIcon(selectedFile.mimeType, selectedFile.fileType)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{selectedFile.originalName}</h2>
                <p className="text-sm text-gray-500">
                  Uploaded by {selectedFile.uploadedBy?.name || 'Unknown'} on {selectedFile.uploadedAt ? new Date(selectedFile.uploadedAt).toLocaleString() : 'Unknown date'}
                </p>
              </div>
            </div>

            {/* File Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Course" value={selectedFile.course ? `${selectedFile.course.courseCode || ''} - ${selectedFile.course.courseName || ''}` : 'N/A'} />
              <DetailItem label="Department" value={selectedFile.department?.name || 'N/A'} />
              <DetailItem label="Faculty" value={selectedFile.faculty?.name || 'N/A'} />
              <DetailItem label="File Type" value={fileTypes.find(t => t.value === selectedFile.fileType)?.label || selectedFile.fileType || 'N/A'} />
              <DetailItem label="Year of Study" value={selectedFile.yearOfStudy ? `${selectedFile.yearOfStudy}${getOrdinal(selectedFile.yearOfStudy)} Year` : 'N/A'} />
              <DetailItem label="Semester" value={selectedFile.semester ? `Semester ${selectedFile.semester}` : 'N/A'} />
              <DetailItem label="File Size" value={formatFileSize(selectedFile.size)} />
              <DetailItem label="Downloads" value={selectedFile.downloads || 0} />
              <DetailItem label="MIME Type" value={selectedFile.mimeType || 'N/A'} />
              <DetailItem label="Public" value={selectedFile.isPublic ? 'Yes' : 'No'} />
            </div>

            {/* Tags */}
            {selectedFile.tags && selectedFile.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFile.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selectedFile.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedFile.description}</p>
              </div>
            )}

            {/* Download History */}
            {selectedFile.downloadHistory && selectedFile.downloadHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Downloads</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFile.downloadHistory.slice(0, 5).map((history, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>User: {history.user?.name || 'Unknown'}</span>
                      <span className="text-gray-500">{history.downloadedAt ? new Date(history.downloadedAt).toLocaleString() : 'Unknown date'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => handleDownload(selectedFile._id, selectedFile.originalName)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <FiDownload className="mr-2" /> Download
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedFile);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FiEdit2 className="mr-2" /> Edit
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleDelete(selectedFile._id);
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <FiTrash2 className="mr-2" /> Delete
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Statistics Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="File Statistics"
        size="lg"
      >
        {stats && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatBox
                label="Total Files"
                value={stats.totalFiles || 0}
                icon={<FiFile className="h-8 w-8 text-blue-600" />}
                bgColor="bg-blue-100"
              />
              <StatBox
                label="Total Size"
                value={formatFileSize(stats.totalSize || 0)}
                icon={<FiFolder className="h-8 w-8 text-green-600" />}
                bgColor="bg-green-100"
              />
              <StatBox
                label="Avg File Size"
                value={formatFileSize((stats.totalSize || 0) / (stats.totalFiles || 1))}
                icon={<FiBarChart2 className="h-8 w-8 text-purple-600" />}
                bgColor="bg-purple-100"
              />
            </div>

            {/* By File Type */}
            {stats.byType && Object.keys(stats.byType).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Files by Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const fileType = fileTypes.find(t => t.value === type);
                    return (
                      <div key={type} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="flex items-center">
                          <span className="mr-2">{fileType?.icon || '📁'}</span>
                          <span className="text-sm font-medium">{fileType?.label || type}</span>
                        </span>
                        <span className="font-bold text-purple-600">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Uploaders */}
            {stats.topUploaders && Object.keys(stats.topUploaders).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Uploaders</h3>
                <div className="space-y-2">
                  {Object.entries(stats.topUploaders)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([uploader, count], idx) => (
                      <div key={uploader} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="flex items-center">
                          <span className="w-6 text-gray-500">{idx + 1}.</span>
                          <span className="font-medium">{uploader}</span>
                        </span>
                        <span className="font-bold text-purple-600">{count} files</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Monthly Uploads */}
            {stats.monthlyStats && Object.keys(stats.monthlyStats).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Uploads</h3>
                <div className="space-y-2">
                  {Object.entries(stats.monthlyStats)
                    .sort((a, b) => b[0].localeCompare(a[0]))
                    .slice(0, 6)
                    .map(([month, data]) => (
                      <div key={month} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">{month}</span>
                        <div className="flex items-center gap-4">
                          <span>{data.count || 0} files</span>
                          <span className="text-gray-500">{formatFileSize(data.size || 0)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Confirm Bulk Delete"
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete {selectedFiles.length} selected files? This action cannot be undone.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Warning: This will permanently delete these files from the server.
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete {selectedFiles.length} Files
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Helper Components

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

const FileCard = ({ file, isSelected, onSelect, onView, onEdit, onDelete, onDownload, getFileIcon, getFileTypeColor, formatFileSize, fileTypes }) => {
  const fileType = fileTypes?.find(t => t.value === file.fileType);

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      <div className="p-6">
        {/* Selection Checkbox */}
        <div className="flex justify-between items-start mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getFileTypeColor(file.fileType)}`}>
            {fileType?.icon} {fileType?.label || file.fileType}
          </span>
        </div>

        {/* File Icon and Name */}
        <div className="flex items-center mb-4 cursor-pointer" onClick={onView}>
          <div className="text-4xl mr-3">
            {getFileIcon(file.mimeType, file.fileType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{file.originalName}</h3>
            <p className="text-xs text-gray-500 truncate">{file.course?.courseCode} - {file.course?.courseName}</p>
          </div>
        </div>

        {/* File Metadata */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <FiUser className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{file.uploadedBy?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center">
            <FiCalendar className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown date'}</span>
          </div>
          <div className="flex items-center">
            <FiClock className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
            <span>{file.yearOfStudy ? `Year ${file.yearOfStudy}` : 'N/A'} • Sem {file.semester || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <FiFolder className="mr-2 h-4 w-4 text-gray-400" />
              {formatFileSize(file.size)}
            </span>
            <span className="flex items-center">
              <FiDownload className="mr-1 h-4 w-4 text-gray-400" />
              {file.downloads || 0}
            </span>
          </div>
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {file.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                #{tag}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{file.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-3 border-t">
          <button
            onClick={onView}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <FiEye className="h-4 w-4" />
          </button>
          <button
            onClick={onDownload}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Download"
          >
            <FiDownload className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Edit"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ onUpload }) => (
  <div className="text-center py-16 bg-white rounded-xl shadow-lg">
    <FiFile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500 text-lg">No files found</p>
    <p className="text-gray-400 text-sm mt-2">Upload your first file to get started</p>
    <button
      onClick={onUpload}
      className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all transform hover:scale-105 font-medium inline-flex items-center shadow-lg"
    >
      <FiUpload className="mr-2" /> Upload File
    </button>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value || 'N/A'}</p>
  </div>
);

const getOrdinal = (n) => {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

export default AdminFiles;