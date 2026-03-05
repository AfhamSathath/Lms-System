import React, { useState, useEffect, useMemo } from 'react';
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
  FiBook,
  FiUser,
  FiCalendar,
  FiGrid,
  FiChevronDown,
  FiRefreshCw,
  FiFolder,
  FiEye,
  FiEdit2,
  FiBarChart2,
  FiX,
  FiInfo
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ==================== CONSTANTS ====================
const FILE_TYPES = [
  { value: 'lecture_notes', label: 'Lecture Notes', icon: '📝', color: 'blue' },
  { value: 'tutorial', label: 'Tutorial', icon: '📚', color: 'green' },
  { value: 'assignment', label: 'Assignment', icon: '📋', color: 'yellow' },
  { value: 'past_paper', label: 'Past Paper', icon: '📄', color: 'purple' },
  { value: 'syllabus', label: 'Syllabus', icon: '📌', color: 'indigo' },
  { value: 'reading_material', label: 'Reading Material', icon: '📖', color: 'pink' },
  { value: 'lab_manual', label: 'Lab Manual', icon: '🔬', color: 'orange' },
  { value: 'project_guideline', label: 'Project Guideline', icon: '🎯', color: 'red' },
  { value: 'announcement', label: 'Announcement', icon: '📢', color: 'teal' },
  { value: 'supplementary_material', label: 'Supplementary', icon: '📎', color: 'gray' }
];

const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const SEMESTERS = [1, 2];

// ==================== UTILITIES ====================
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const getFileIcon = (mimeType, fileType) => {
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType?.startsWith('video/')) return '🎥';
  if (mimeType?.startsWith('audio/')) return '🎵';
  if (mimeType?.includes('pdf')) return '📕';
  if (mimeType?.includes('word')) return '📘';
  if (mimeType?.includes('presentation')) return '📊';
  if (mimeType?.includes('excel')) return '📗';

  const typeIcon = FILE_TYPES.find(t => t.value === fileType)?.icon;
  return typeIcon || '📁';
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

const getOrdinal = (n) => {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

// Helper function to get year display text
const getYearDisplay = (yearValue, academicYears) => {
  if (!yearValue && yearValue !== 0) return '';

  // If it's a number like 1, convert to "1st Year"
  const yearNum = parseInt(yearValue);
  if (!isNaN(yearNum) && yearNum >= 1 && yearNum <= academicYears.length) {
    return academicYears[yearNum - 1];
  }

  // If it's already a formatted year like "1st Year", return as is
  return yearValue;
};

// ==================== MAIN COMPONENT ====================
const AdminFiles = () => {
  const { user } = useAuth();

  // State
  const [state, setState] = useState({
    files: [],
    subjects: [],
    stats: null,
    loading: true,
    apiError: false,
    selectedFiles: [],
    departments: [],
    uploaders: []
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    subjects: 'all',
    year: 'all',
    semester: 'all',
    fileType: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Modals
  const [modals, setModals] = useState({
    upload: false,
    edit: false,
    view: false,
    stats: false,
    bulkDelete: false
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    subjects: '',
    year: '',
    semester: '',
    fileType: 'lecture_notes',
    description: '',
    tags: '',
    isPublic: true,
    department: ''
  });

  const [selectedFileObj, setSelectedFileObj] = useState(null);

  // ==================== DATA FETCHING ====================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, apiError: false }));

    try {
      const [filesRes, subjectsRes, statsRes] = await Promise.allSettled([
        api.get('api/files'),
        api.get('api/subjects?isActive=true'),
        api.get('api/files/stats')
      ]);

      let files = filesRes.status === 'fulfilled' ? filesRes.value?.data?.files || [] : [];
      const subjects = subjectsRes.status === 'fulfilled' ? subjectsRes.value?.data?.subjects || [] : [];
      const stats = statsRes.status === 'fulfilled' ? statsRes.value?.data?.stats || null : null;

      // Debug: Log the data
      console.log('Files data:', files);
      console.log('Subjects data:', subjects);

      // Transform file data to handle different property names
      files = files.map(file => ({
        ...file,
        // Ensure subject data is accessible with both naming conventions
        subject: file.subject || file.subjects || {},
        subjects: file.subjects || file.subject || {}
      }));

      // Extract unique departments from subjects
      const uniqueDepts = [...new Set(subjects.map(c => c.department?.name || c.department).filter(Boolean))];

      // Extract unique uploaders from files
      const uniqueUploaders = [...new Set(files.map(f => f.uploadedBy?.name || f.uploadedBy).filter(Boolean))];

      setState(prev => ({
        ...prev,
        files,
        subjects,
        stats,
        departments: uniqueDepts,
        uploaders: uniqueUploaders,
        loading: false
      }));

      if (filesRes.status === 'rejected' || subjectsRes.status === 'rejected') {
        toast.error('Some data could not be loaded');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setState(prev => ({ ...prev, apiError: true, loading: false }));
      toast.error('Failed to connect to server');
    }
  };

  // ==================== FILTERING ====================
  const filteredFiles = useMemo(() => {
    if (!state.files || state.files.length === 0) return [];

    return state.files.filter(file => {
      try {
        // Search filter
        if (filters.search) {
          const term = filters.search.toLowerCase();
          const searchableFields = [
            file.originalName,
            file.description,
            ...(file.tags || []),
            file.subject?.name || file.subjects?.name || file.subjects?.subjectsName,
            file.subject?.code || file.subjects?.code || file.subjects?.subjectsCode,
            file.uploadedBy?.name
          ].filter(Boolean).map(field => field.toString().toLowerCase());

          if (!searchableFields.some(field => field.includes(term))) return false;
        }

        // subjects filter
        if (filters.subjects !== 'all') {
          const fileSubjectId = file.subject?._id || file.subjects?._id;
          if (fileSubjectId !== filters.subjects) return false;
        }

        // Year filter
        if (filters.year !== 'all') {
          const fileYear = file.yearOfStudy || file.year;
          if (fileYear !== parseInt(filters.year) && fileYear !== filters.year) return false;
        }

        // Semester filter
        if (filters.semester !== 'all') {
          const fileSemester = file.semester;
          if (fileSemester !== parseInt(filters.semester)) return false;
        }

        // File type filter
        if (filters.fileType !== 'all' && file.fileType !== filters.fileType) return false;

        // Date filters
        if (filters.dateFrom && file.uploadedAt && new Date(file.uploadedAt) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && file.uploadedAt && new Date(file.uploadedAt) > new Date(filters.dateTo)) return false;

        return true;
      } catch (error) {
        console.error('Filter error for file:', file, error);
        return false;
      }
    }).sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
      const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
      return dateB - dateA;
    });
  }, [state.files, filters]);

  // ==================== HANDLERS ====================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      subjects: 'all',
      year: 'all',
      semester: 'all',
      fileType: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setState(prev => ({ ...prev, selectedFiles: [] }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle subject selection with auto-fill for year, semester, and department
  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;

    if (!subjectId) {
      setFormData(prev => ({
        ...prev,
        subjects: '',
        year: '',
        semester: '',
        department: ''
      }));
      return;
    }

    const selectedSubject = state.subjects?.find(s => s._id === subjectId);

    if (selectedSubject) {
      // Extract year - handle both string and number formats
      let yearValue = '';
      if (selectedSubject.year) {
        if (typeof selectedSubject.year === 'string') {
          const yearMatch = selectedSubject.year.match(/^(\d+)/);
          if (yearMatch) {
            yearValue = yearMatch[1];
          } else {
            const yearIndex = ACADEMIC_YEARS.findIndex(y => y === selectedSubject.year);
            if (yearIndex !== -1) {
              yearValue = (yearIndex + 1).toString();
            }
          }
        } else {
          yearValue = selectedSubject.year.toString();
        }
      } else if (selectedSubject.yearOfStudy) {
        yearValue = selectedSubject.yearOfStudy.toString();
      }

      // Extract semester
      let semesterValue = '';
      if (selectedSubject.semester) {
        semesterValue = selectedSubject.semester.toString();
      }

      // Extract department
      let departmentValue = '';
      if (selectedSubject.department?.name) {
        departmentValue = selectedSubject.department.name;
      } else if (selectedSubject.department) {
        departmentValue = selectedSubject.department;
      }

      setFormData(prev => ({
        ...prev,
        subjects: subjectId,
        year: yearValue,
        semester: semesterValue,
        department: departmentValue
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      subjects: '',
      year: '',
      semester: '',
      fileType: 'lecture_notes',
      description: '',
      tags: '',
      isPublic: true,
      department: ''
    });
    setSelectedFileObj(null);
  };

  const toggleModal = (modalName, show) => {
    setModals(prev => ({ ...prev, [modalName]: show }));
    if (!show) {
      setSelectedFile(null);
      resetForm();
    }
  };

  const handleSelectFile = (fileId) => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.includes(fileId)
        ? prev.selectedFiles.filter(id => id !== fileId)
        : [...prev.selectedFiles, fileId]
    }));
  };

  const handleSelectAll = () => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.length === filteredFiles.length
        ? []
        : filteredFiles.map(f => f._id)
    }));
  };

  // ==================== API ACTIONS ====================
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFileObj) {
      toast.error('Please select a file');
      return;
    }

    if (!formData.subjects || !formData.year || !formData.semester) {
      toast.error('Please fill all required fields');
      return;
    }

    if (selectedFileObj.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', selectedFileObj);
    uploadData.append('subjectsId', formData.subjects);
    uploadData.append('academicYear', formData.year);
    uploadData.append('semester', formData.semester);
    uploadData.append('fileType', formData.fileType);
    uploadData.append('description', formData.description);
    uploadData.append('tags', formData.tags);
    uploadData.append('isPublic', formData.isPublic);

    setUploading(true);
    try {
      await api.post('api/files/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      toast.success('File uploaded successfully');
      toggleModal('upload', false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("No file selected for update");
      return;
    }

    if (!formData.subjects || !formData.year || !formData.semester) {
      toast.error("Please fill all required fields");
      return;
    }

    const updateData = {
      fileType: formData.fileType,
      academicYear: formData.year,
      semester: Number(formData.semester),
      description: formData.description || "",
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
      isPublic: formData.isPublic
    };

    setUploading(true);

    try {
      await api.put(`api/files/${selectedFile._id}`, updateData);
      toast.success("File updated successfully");
      toggleModal("edit", false);
      fetchData();
    } catch (error) {
      console.error(error.response?.data);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`api/files/${fileId}`);
      toast.success('File deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    const { selectedFiles } = state;
    if (selectedFiles.length === 0) return;

    try {
      await api.delete('api/files/bulk', { data: { fileIds: selectedFiles } });
      toast.success(`${selectedFiles.length} files deleted successfully`);
      setState(prev => ({ ...prev, selectedFiles: [] }));
      toggleModal('bulkDelete', false);
      fetchData();
    } catch (error) {
      toast.error('Bulk delete failed');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`api/files/download/${fileId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  // ==================== RENDER ====================
  if (state.loading) return <Loader fullScreen />;

  if (state.apiError) {
    return (
      <div className="container mx-auto px-4 py-8 transition-all duration-300">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <FiInfo className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-xl font-bold text-red-700">Connection Error</h2>
          </div>
          <p className="text-red-600 mb-4">Cannot connect to the backend server.</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300">

      {/* Header */}
      <Header
        stats={state.stats}
        selectedCount={state.selectedFiles.length}
        onUpload={() => toggleModal('upload', true)}
        onStats={() => toggleModal('stats', true)}
        onBulkDelete={() => toggleModal('bulkDelete', true)}
        formatFileSize={formatFileSize}
      />

      {/* Filters */}
      <Filters
        filters={filters}
        subjects={state.subjects}
        departments={state.departments || []}
        uploaders={state.uploaders || []}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
        selectedCount={filteredFiles.length}
        totalCount={state.files.length}
        selectAll={handleSelectAll}
        allSelected={state.selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
      />

      {/* Files Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map(file => (
            <FileCard
              key={file._id}
              file={file}
              isSelected={state.selectedFiles.includes(file._id)}
              onSelect={() => handleSelectFile(file._id)}
              onView={() => {
                setSelectedFile(file);
                toggleModal('view', true);
              }}
              onEdit={() => {
                setSelectedFile(file);

                // Extract year number from academicYear string
                let yearValue = '';
                if (file.academicYear) {
                  const yearMatch = file.academicYear.match(/^(\d+)/);
                  if (yearMatch) {
                    yearValue = yearMatch[1];
                  }
                }

                setFormData({
                  subjects: file.subject?._id || file.subjects?._id || '',
                  year: yearValue || '',
                  semester: file.semester?.toString() || '',
                  fileType: file.fileType || 'lecture_notes',
                  description: file.description || '',
                  tags: file.tags?.join(', ') || '',
                  isPublic: file.isPublic || false,
                  department: file.department?.name || file.department || ''
                });
                toggleModal('edit', true);
              }}
              onDelete={() => handleDelete(file._id)}
              onDownload={() => handleDownload(file._id, file.originalName)}
              getFileIcon={getFileIcon}
              getFileTypeColor={getFileTypeColor}
              formatFileSize={formatFileSize}
            />
          ))}
        </div>
      ) : (
        <EmptyState onUpload={() => toggleModal('upload', true)} />
      )}

      {/* Modals */}
      <UploadModal
        isOpen={modals.upload}
        onClose={() => toggleModal('upload', false)}
        formData={formData}
        onInputChange={handleInputChange}
        onSubjectChange={handleSubjectChange}
        onFileSelect={(e) => setSelectedFileObj(e.target.files[0])}
        onSubmit={handleUpload}
        uploading={uploading}
        uploadProgress={uploadProgress}
        subjects={state.subjects}
        academicYears={ACADEMIC_YEARS}
        semesters={SEMESTERS}
      />

      <EditModal
        isOpen={modals.edit}
        onClose={() => toggleModal('edit', false)}
        formData={formData}
        onInputChange={handleInputChange}
        onSubjectChange={handleSubjectChange}
        onSubmit={handleUpdate}
        file={selectedFile}
        subjects={state.subjects}
        academicYears={ACADEMIC_YEARS}
        semesters={SEMESTERS}
      />

      <ViewModal
        isOpen={modals.view}
        onClose={() => toggleModal('view', false)}
        file={selectedFile}
        onDownload={handleDownload}
        onEdit={() => {
          toggleModal('view', false);
          toggleModal('edit', true);
        }}
        onDelete={handleDelete}
        getFileIcon={getFileIcon}
        formatFileSize={formatFileSize}
        getFileTypeColor={getFileTypeColor}
      />

      <StatsModal
        isOpen={modals.stats}
        onClose={() => toggleModal('stats', false)}
        stats={state.stats}
        formatFileSize={formatFileSize}
      />

      <BulkDeleteModal
        isOpen={modals.bulkDelete}
        onClose={() => toggleModal('bulkDelete', false)}
        onConfirm={handleBulkDelete}
        count={state.selectedFiles.length}
      />
    </div>
  );
};

// ==================== SUB-COMPONENTS ====================

const Header = ({ stats, selectedCount, onUpload, onStats, onBulkDelete, formatFileSize }) => (
  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">File Management</h1>
        <p className="text-purple-100 mt-1">Upload, manage, and share educational materials</p>
      </div>

      <div className="flex gap-3">
        {stats && (
          <div className="hidden md:flex items-center gap-4 mr-4 bg-white/10 rounded-lg px-4 py-2">
            <StatBadge icon={<FiFile />} label="Files" value={stats.totalFiles || 0} />
            <StatBadge icon={<FiFolder />} label="Size" value={formatFileSize(stats.totalSize || 0)} />
            <StatBadge icon={<FiDownload />} label="Downloads" value={stats.totalDownloads || 0} />
          </div>
        )}

        <button
          onClick={onStats}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <FiBarChart2 className="mr-2" /> Stats
        </button>

        {selectedCount > 0 && (
          <button
            onClick={onBulkDelete}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FiTrash2 className="mr-2" /> Delete ({selectedCount})
          </button>
        )}

        <button
          onClick={onUpload}
          className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center"
        >
          <FiUpload className="mr-2" /> Upload
        </button>
      </div>
    </div>
  </div>
);

const StatBadge = ({ icon, label, value }) => (
  <div className="flex items-center">
    <span className="mr-2">{icon}</span>
    <span className="text-sm mr-1">{label}:</span>
    <span className="font-bold">{value}</span>
  </div>
);

const Filters = ({ filters, subjects, departments, uploaders, onFilterChange, onClear, selectedCount, totalCount, selectAll, allSelected }) => {
  // Get unique years from subjects for filter
  const yearOptions = ['all', ...new Set(subjects.map(s => s.year).filter(Boolean))];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-2">
          <SearchInput value={filters.search} onChange={(v) => onFilterChange('search', v)} />
        </div>

        <Select
          icon={<FiBook />}
          value={filters.subjects}
          onChange={(v) => onFilterChange('subjects', v)}
          options={[
            { value: 'all', label: 'All Subjects' },
            ...subjects.map(s => ({
              value: s._id,
              label: `${s.code || s.subjectsCode || ''} - ${s.name || s.subjectsName || 'Unknown'}`
            }))
          ]}
        />

        <Select
          icon={<FiGrid />}
          value={filters.fileType}
          onChange={(v) => onFilterChange('fileType', v)}
          options={[
            { value: 'all', label: 'All Types' },
            ...FILE_TYPES.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Select
          icon={<FiCalendar />}
          value={filters.year}
          onChange={(v) => onFilterChange('year', v)}
          options={[
            { value: 'all', label: 'All Years' },
            ...ACADEMIC_YEARS.map((year, idx) => ({ value: String(idx + 1), label: year }))
          ]}
        />

        <Select
          icon={<FiGrid />}
          value={filters.semester}
          onChange={(v) => onFilterChange('semester', v)}
          options={[
            { value: 'all', label: 'All Semesters' },
            ...SEMESTERS.map(s => ({ value: String(s), label: `Semester ${s}` }))
          ]}
        />

        {departments.length > 0 && (
          <Select
            icon={<FiBook />}
            value={filters.department || 'all'}
            onChange={(v) => onFilterChange('department', v)}
            options={[
              { value: 'all', label: 'All Departments' },
              ...departments.map(d => ({ value: d, label: d }))
            ]}
          />
        )}

        {uploaders.length > 0 && (
          <Select
            icon={<FiUser />}
            value={filters.uploader || 'all'}
            onChange={(v) => onFilterChange('uploader', v)}
            options={[
              { value: 'all', label: 'All Uploaders' },
              ...uploaders.map(u => ({ value: u, label: u }))
            ]}
          />
        )}

        <div className="flex gap-2 col-span-1">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="To"
          />
        </div>

        <button
          onClick={onClear}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={selectAll}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-gray-600">Select All ({selectedCount} files)</span>
        </label>

        <span className="text-sm text-gray-500">
          Showing {selectedCount} of {totalCount} files
        </span>
      </div>
    </div>
  );
};

const SearchInput = ({ value, onChange }) => (
  <div className="relative">
    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder="Search files by name, description, tags..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <FiX />
      </button>
    )}
  </div>
);

const Select = ({ icon, value, onChange, options }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{icon}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

const FileCard = ({ file, isSelected, onSelect, onView, onEdit, onDelete, onDownload, getFileIcon, getFileTypeColor, formatFileSize }) => {
  const fileType = FILE_TYPES.find(t => t.value === file.fileType);

  // Get subject info safely
  const subjectName = file.subject?.name || file.subjects?.name || file.subjects?.subjectsName || 'Unknown';
  const subjectCode = file.subject?.code || file.subjects?.code || file.subjects?.subjectsCode || '';
  const uploadedByName = file.uploadedBy?.name || 'Unknown';
  const uploadedDate = file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown';

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all ${isSelected ? 'ring-2 ring-purple-500' : ''}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFileTypeColor(file.fileType)}`}>
            {fileType?.icon} {fileType?.label || file.fileType}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={onView}>
          <span className="text-4xl">{getFileIcon(file.mimeType, file.fileType)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{file.originalName || 'Unnamed File'}</h3>
            <p className="text-xs text-gray-500 truncate">
              {subjectCode} • {subjectName}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <FiUser className="mr-2 text-gray-400 flex-shrink-0" size={14} />
            <span className="truncate">{uploadedByName}</span>
          </div>
          <div className="flex items-center">
            <FiCalendar className="mr-2 text-gray-400 flex-shrink-0" size={14} />
            <span>{uploadedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <FiFolder className="mr-2 text-gray-400 flex-shrink-0" size={14} />
              {formatFileSize(file.size)}
            </span>
            <span className="flex items-center">
              <FiDownload className="mr-1 text-gray-400 flex-shrink-0" size={14} />
              {file.downloads || 0}
            </span>
          </div>
        </div>

        {file.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {file.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #{tag}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{file.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <ActionButton icon={<FiEye />} onClick={onView} color="blue" tooltip="View Details" />
          <ActionButton icon={<FiDownload />} onClick={onDownload} color="green" tooltip="Download" />
          <ActionButton icon={<FiEdit2 />} onClick={onEdit} color="purple" tooltip="Edit" />
          <ActionButton icon={<FiTrash2 />} onClick={onDelete} color="red" tooltip="Delete" />
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, onClick, color, tooltip }) => (
  <button
    onClick={onClick}
    className={`p-2 text-${color}-600 hover:bg-${color}-50 rounded-lg transition-colors`}
    title={tooltip}
  >
    {icon}
  </button>
);

const EmptyState = ({ onUpload }) => (
  <div className="text-center py-16 bg-white rounded-xl shadow-lg">
    <FiFile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-500 text-lg">No files found</p>
    <p className="text-gray-400 text-sm mt-2">Upload your first file to get started</p>
    <button
      onClick={onUpload}
      className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all inline-flex items-center"
    >
      <FiUpload className="mr-2" /> Upload File
    </button>
  </div>
);

// ==================== MODAL COMPONENTS ====================

const UploadModal = ({ isOpen, onClose, formData, onInputChange, onSubjectChange, onFileSelect, onSubmit, uploading, uploadProgress, subjects, academicYears, semesters }) => {
  const validSubjects = Array.isArray(subjects) ? subjects.filter(subject =>
    subject && subject._id && (subject.name || subject.subjectsName)
  ) : [];

  const getYearDisplay = (yearValue) => {
    if (!yearValue) return '';
    const yearNum = parseInt(yearValue);
    if (!isNaN(yearNum) && yearNum >= 1 && yearNum <= academicYears.length) {
      return academicYears[yearNum - 1];
    }
    return yearValue;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload File" size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subjects"
              value={formData.subjects || ''}
              onChange={onSubjectChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">-- Select a Subject --</option>
              {validSubjects.length > 0 ? (
                validSubjects.map(subject => {
                  const subjectName = subject.name || subject.subjectsName || 'Unnamed Subject';
                  const subjectCode = subject.code || subject.subjectsCode || '';
                  const departmentName = subject.department?.name || subject.department || '';

                  return (
                    <option key={subject._id} value={subject._id}>
                      {subjectCode} - {subjectName} {departmentName ? `(${departmentName})` : ''}
                    </option>
                  );
                })
              ) : (
                <option value="" disabled>No subjects available</option>
              )}
            </select>
            {validSubjects.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠️ No subjects found. Please add subjects first.
              </p>
            )}
            {formData.department && (
              <p className="mt-1 text-sm text-purple-600 font-medium">
                📚 Department: {formData.department}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <select
              name="year"
              value={formData.year || ''}
              onChange={onInputChange}
              required
              disabled={!!formData.subjects && validSubjects.length > 0}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none ${formData.subjects && validSubjects.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
            >
              <option value="">-- Select Year --</option>
              {Array.isArray(academicYears) && academicYears.map((year, idx) => (
                <option key={year || idx} value={idx + 1}>
                  {year || `Year ${idx + 1}`}
                </option>
              ))}
            </select>
            {formData.year && formData.subjects && (
              <p className="mt-1 text-xs text-green-600">
                ✓ Auto-filled from subject: {getYearDisplay(formData.year)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              name="semester"
              value={formData.semester || ''}
              onChange={onInputChange}
              required
              disabled={!!formData.subjects && validSubjects.length > 0}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none ${formData.subjects && validSubjects.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
            >
              <option value="">-- Select Semester --</option>
              {Array.isArray(semesters) && semesters.map(s => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
            {formData.semester && formData.subjects && (
              <p className="mt-1 text-xs text-green-600">
                ✓ Auto-filled from subject: Semester {formData.semester}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Type <span className="text-red-500">*</span>
            </label>
            <select
              name="fileType"
              value={formData.fileType || 'lecture_notes'}
              onChange={onInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {FILE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags || ''}
              onChange={onInputChange}
              placeholder="e.g., important, exam, revision"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={onInputChange}
              rows="3"
              placeholder="Enter file description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic || false}
                onChange={onInputChange}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Make this file public</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={onFileSelect}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none file:mr-4 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
            />
            <p className="mt-1 text-xs text-gray-500">
              Max file size: 50MB. All formats accepted.
            </p>
          </div>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Uploading...</span>
              <span className="text-gray-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {formData.subjects && formData.year && formData.semester && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium flex items-center gap-1">
              <span>✓</span> Auto-filled from selected subject:
            </p>
            <p className="text-xs text-green-700 mt-1">
              Year: {getYearDisplay(formData.year)} • Semester: {formData.semester} • Department: {formData.department}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || validSubjects.length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EditModal = ({ isOpen, onClose, formData, onInputChange, onSubjectChange, onSubmit, file, subjects, academicYears, semesters }) => {
  const validSubjects = Array.isArray(subjects) ? subjects.filter(subject =>
    subject && subject._id && (subject.name || subject.subjectsName)
  ) : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit File Metadata" size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              name="subjects"
              value={formData.subjects || ''}
              onChange={onSubjectChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">-- Select a Subject --</option>
              {validSubjects.length > 0 ? (
                validSubjects.map(subject => {
                  const subjectName = subject.name || subject.subjectsName || 'Unnamed Subject';
                  const subjectCode = subject.code || subject.subjectsCode || '';
                  const departmentName = subject.department?.name || subject.department || '';

                  return (
                    <option key={subject._id} value={subject._id}>
                      {subjectCode} - {subjectName} {departmentName ? `(${departmentName})` : ''}
                    </option>
                  );
                })
              ) : (
                <option value="" disabled>No subjects available</option>
              )}
            </select>
            {formData.department && (
              <p className="mt-1 text-xs text-gray-500">Department: {formData.department}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              name="year"
              value={formData.year || ''}
              onChange={onInputChange}
              disabled={!!formData.subjects && validSubjects.length > 0}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none ${formData.subjects && validSubjects.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
            >
              <option value="">-- Select Year --</option>
              {Array.isArray(academicYears) && academicYears.map((year, idx) => (
                <option key={year || idx} value={idx + 1}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              name="semester"
              value={formData.semester || ''}
              onChange={onInputChange}
              disabled={!!formData.subjects && validSubjects.length > 0}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none ${formData.subjects && validSubjects.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
            >
              <option value="">-- Select Semester --</option>
              {Array.isArray(semesters) && semesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
            <select
              name="fileType"
              value={formData.fileType || 'lecture_notes'}
              onChange={onInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {FILE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags || ''}
              onChange={onInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={onInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic || false}
                onChange={onInputChange}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Make this file public</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
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
  );
};

const ViewModal = ({ isOpen, onClose, file, onDownload, onEdit, onDelete, getFileIcon, formatFileSize, getFileTypeColor }) => {
  if (!file) return null;

  const fileType = FILE_TYPES.find(t => t.value === file.fileType);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="File Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <span className="text-5xl">{getFileIcon(file.mimeType, file.fileType)}</span>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{file.originalName}</h2>
            <p className="text-sm text-gray-500">
              Uploaded by {file.uploadedBy?.name || 'Unknown'} • {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'Unknown date'}
            </p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getFileTypeColor(file.fileType)}`}>
            {fileType?.icon} {fileType?.label || file.fileType}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <DetailItem label="Subject" value={file.subject ? `${file.subject.code || ''} - ${file.subject.name || 'Unknown'}` : 'N/A'} />
          <DetailItem label="Department" value={file.department?.name || 'N/A'} />
          <DetailItem label="Year of Study" value={file.yearOfStudy ? `${file.yearOfStudy}${getOrdinal(file.yearOfStudy)} Year` : 'N/A'} />
          <DetailItem label="Semester" value={file.semester ? `Semester ${file.semester}` : 'N/A'} />
          <DetailItem label="File Size" value={formatFileSize(file.size)} />
          <DetailItem label="Downloads" value={file.downloads || 0} />
          <DetailItem label="MIME Type" value={file.mimeType || 'N/A'} />
          <DetailItem label="Public" value={file.isPublic ? 'Yes' : 'No'} />
        </div>

        {/* Tags */}
        {file.tags?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {file.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {file.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{file.description}</p>
          </div>
        )}

        {/* Download History */}
        {file.downloadHistory?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Downloads</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {file.downloadHistory.slice(0, 5).map((history, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <span>User: {history.user?.name || 'Unknown'}</span>
                  <span className="text-gray-500">{history.downloadedAt ? new Date(history.downloadedAt).toLocaleString() : 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => onDownload(file._id, file.originalName)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FiDownload /> Download
          </button>
          <button
            onClick={() => onEdit(file)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiEdit2 /> Edit
          </button>
          <button
            onClick={() => onDelete(file._id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FiTrash2 /> Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

const StatsModal = ({ isOpen, onClose, stats, formatFileSize }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="File Statistics" size="lg">
    {stats && (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Total Files" value={stats.totalFiles || 0} />
          <StatBox label="Total Size" value={formatFileSize(stats.totalSize || 0)} />
          <StatBox label="Avg File Size" value={formatFileSize((stats.totalSize || 0) / (stats.totalFiles || 1))} />
        </div>

        {/* By File Type */}
        {stats.byType && Object.keys(stats.byType).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Files by Type</h3>
            <div className="space-y-2">
              {Object.entries(stats.byType).map(([type, count]) => {
                const fileType = FILE_TYPES.find(t => t.value === type);
                return (
                  <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <span>{fileType?.icon || '📁'}</span>
                      <span className="font-medium">{fileType?.label || type}</span>
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
                  <div key={uploader} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="flex items-center gap-2">
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
                  <div key={month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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
);

const StatBox = ({ label, value }) => (
  <div className="bg-gray-50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xl font-bold text-purple-600">{value}</p>
  </div>
);

const BulkDeleteModal = ({ isOpen, onClose, onConfirm, count }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Confirm Bulk Delete" size="md">
    <div className="p-4">
      <p className="text-gray-600 mb-4">
        Are you sure you want to delete {count} file{count !== 1 ? 's' : ''}? This action cannot be undone.
      </p>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiInfo className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Warning: This will permanently delete these files from the server.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete {count} File{count !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  </Modal>
);

export default AdminFiles;