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
  FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminFiles = ({ sidebarOpen }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    year: '',
    semester: '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, selectedSubject, selectedYear, selectedSemester, selectedDepartment, files]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [filesRes, subjectsRes] = await Promise.all([
        api.get('/files'),
        api.get('/subjects')
      ]);
      
      console.log('Files fetched:', filesRes.data); // Debug log
      console.log('Subjects fetched:', subjectsRes.data); // Debug log
      
      // Process files to ensure year field exists
      const processedFiles = (filesRes.data.files || []).map(f => ({
        ...f,
        year: f.year || getYearFromSemester(f.semester),
        semester: f.semester || 1
      }));
      
      setFiles(processedFiles);
      setFilteredFiles(processedFiles);
      setSubjects(subjectsRes.data.subjects || []);
      
      // Extract unique departments from subjects
      const uniqueDepts = [...new Set((subjectsRes.data.subjects || []).map(s => s.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get year from semester number (1-8)
  const getYearFromSemester = (semesterNum) => {
    if (!semesterNum) return '1st Year';
    const yearMap = {
      1: '1st Year', 2: '1st Year',
      3: '2nd Year', 4: '2nd Year',
      5: '3rd Year', 6: '3rd Year',
      7: '4th Year', 8: '4th Year'
    };
    return yearMap[semesterNum] || '1st Year';
  };

  // Helper function to get semester within year from semester number
  const getSemesterWithinYear = (semesterNum) => {
    if (!semesterNum) return 1;
    return semesterNum % 2 === 0 ? 2 : 1;
  };

  // Helper function to convert year+semester to semester number (1-8)
  const getSemesterNumber = (year, semester) => {
    const yearMap = {
      '1st Year': 1,
      '2nd Year': 2,
      '3rd Year': 3,
      '4th Year': 4
    };
    const yearNum = yearMap[year] || 1;
    return (yearNum - 1) * 2 + parseInt(semester);
  };

  const filterFiles = () => {
    let filtered = files;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(f => f.subject?._id === selectedSubject);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(f => f.year === selectedYear);
    }

    if (selectedSemester !== 'all') {
      filtered = filtered.filter(f => f.semester === parseInt(selectedSemester));
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(f => f.subject?.department === selectedDepartment);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.originalName?.toLowerCase().includes(term) ||
        f.subject?.name?.toLowerCase().includes(term) ||
        f.subject?.code?.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term) ||
        f.year?.toLowerCase().includes(term)
      );
    }

    setFilteredFiles(filtered);
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
    console.log('File selected:', e.target.files[0]); // Debug log
  };
  
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    if (!formData.subjectId) {
      toast.error('Please select a subject');
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

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'png'];
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toast.error('File type not allowed. Please upload PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, or PNG files.');
      return;
    }

    // Convert year+semester to semester number for backend compatibility
    const semesterNumber = getSemesterNumber(formData.year, formData.semester);

    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    uploadData.append('subjectId', formData.subjectId);
    uploadData.append('year', formData.year);
    uploadData.append('semester', formData.semester);
    uploadData.append('semesterNumber', semesterNumber);
    uploadData.append('description', formData.description || '');

    console.log('Uploading file with data:', {
      subjectId: formData.subjectId,
      year: formData.year,
      semester: formData.semester,
      semesterNumber,
      fileName: selectedFile.name
    }); // Debug log

    setUploading(true);
    try {
      const response = await api.post('/files/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      
      console.log('Upload response:', response.data); // Debug log
      
      toast.success('File uploaded successfully');
      setShowUploadModal(false);
      resetForm();
      fetchData(); // Refresh the file list
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
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
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/files/download/${fileId}`, { 
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Download progress: ${percentCompleted}%`);
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
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

  const resetForm = () => {
    setFormData({ subjectId: '', year: '', semester: '', description: '' });
    setSelectedFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get color for year badge
  const getYearColor = (year) => {
    const colors = {
      '1st Year': 'bg-blue-100 text-blue-800',
      '2nd Year': 'bg-green-100 text-green-800',
      '3rd Year': 'bg-purple-100 text-purple-800',
      '4th Year': 'bg-orange-100 text-orange-800'
    };
    return colors[year] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div
      className="container mx-auto px-4 py-8 transition-all duration-300"
      style={{ marginLeft: sidebarOpen ? 208 : 64 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">File Management</h1>
          <p className="text-purple-100 truncate mt-1">
            Manage study materials across 4 years • 8 semesters
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="bg-white text-purple-600 px-4 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center whitespace-nowrap"
            title="Refresh"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center whitespace-nowrap shadow-lg"
          >
            <FiUpload className="mr-2" /> Upload File
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Files</p>
              <p className="text-2xl font-bold text-gray-800">{files.length}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiFile className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Subjects</p>
              <p className="text-2xl font-bold text-gray-800">{subjects.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiBook className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Size</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatFileSize(files.reduce((acc, f) => acc + (f.size || 0), 0))}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiDownload className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Downloads</p>
              <p className="text-2xl font-bold text-gray-800">
                {files.reduce((acc, f) => acc + (f.downloads || 0), 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiDownload className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files by name, subject, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <FiBook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <FiGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Semesters</option>
              {semesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSubject('all');
              setSelectedYear('all');
              setSelectedSemester('all');
              setSelectedDepartment('all');
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map(file => (
            <div key={file._id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-w-0 hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center">
                <FiFile className="h-8 w-8 text-white mr-3 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-white truncate">{file.originalName}</h3>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <FiBook className="mr-2 text-purple-500 flex-shrink-0" />
                    <span className="text-sm truncate">{file.subject?.name} ({file.subject?.code})</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiUser className="mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm truncate">Uploaded by: {file.uploadedBy?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiCalendar className="mr-2 text-blue-500 flex-shrink-0" />
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getYearColor(file.year)}`}>
                      {file.year} - Semester {file.semester}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Size: {formatFileSize(file.size)}</span>
                    <span>Downloads: {file.downloads || 0}</span>
                  </div>
                  {file.description && (
                    <div className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="line-clamp-2">{file.description}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Uploaded: {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div className="flex justify-end space-x-2 mt-auto pt-3 border-t">
                  <button
                    onClick={() => handleDownload(file._id, file.originalName)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <FiDownload className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <FiFile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No files found</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Upload Your First File
          </button>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject *</label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a subject</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code}) - {s.department || 'No Dept'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Year</option>
                {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Choose File *</label>
            <input
              type="file"
              onChange={handleFileSelect}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Max file size: 10MB. Allowed formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG
            </p>
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
              onClick={() => { setShowUploadModal(false); resetForm(); }}
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
    </div>
  );
};

export default AdminFiles;