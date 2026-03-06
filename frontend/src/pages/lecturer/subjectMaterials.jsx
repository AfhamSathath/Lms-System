import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import {
  FiUpload, FiTrash2, FiDownload, FiSearch, FiFilter, FiPlus,
  FiCheckCircle, FiAlertCircle, FiBook, FiX, FiEye, FiEdit2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const SubjectMaterials = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({
    files: [],
    subjects: [],
    departments: [],
    curriculum: null
  });

  const [filters, setFilters] = useState({
    search: '',
    subject: 'all',
    fileType: 'all',
    semester: 'all',
    academicYear: 'all'
  });

  const [modals, setModals] = useState({
    upload: false,
    curriculumCheck: false
  });

  const [uploadForm, setUploadForm] = useState({
    subjectId: '',
    fileType: 'lecture_notes',
    title: '',
    description: '',
    file: null,
    semester: '',
    academicYear: '',
    topic: '',
    weekNumber: '',
    tags: ''
  });

  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filesRes, subjectsRes, deptRes] = await Promise.all([
        api.get('/api/subject-files?limit=100').catch(() => ({ data: { files: [] } })),
        api.get('/api/subjects?isActive=true').catch(() => ({ data: { subjects: [] } })),
        api.get('/api/departments').catch(() => ({ data: { departments: [] } }))
      ]);

      setState({
        files: filesRes.data.files || [],
        subjects: subjectsRes.data.subjects || [],
        departments: deptRes.data.departments || [],
        curriculum: null
      });
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = useMemo(() => {
    return state.files.filter(f => {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        f.title?.toLowerCase().includes(searchTerm) ||
        f.subject?.code?.toLowerCase().includes(searchTerm) ||
        f.subject?.name?.toLowerCase().includes(searchTerm);

      const matchesFilters =
        (filters.subject === 'all' || f.subject?._id === filters.subject) &&
        (filters.fileType === 'all' || f.fileType === filters.fileType) &&
        (filters.semester === 'all' || f.semester === Number(filters.semester)) &&
        (filters.academicYear === 'all' || f.academicYear === filters.academicYear);

      return matchesSearch && matchesFilters;
    });
  }, [state.files, filters]);

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const subject = state.subjects.find(s => s._id === subjectId);

    setUploadForm(prev => ({
      ...prev,
      subjectId,
      semester: subject?.semester || prev.semester,
      academicYear: subject?.year || prev.academicYear
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.file || !uploadForm.subjectId || !uploadForm.title || !uploadForm.academicYear || !uploadForm.semester) {
      toast.error('Please fill required fields');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('subjectId', uploadForm.subjectId);
    formData.append('fileType', uploadForm.fileType);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('semester', uploadForm.semester);
    formData.append('academicYear', uploadForm.academicYear);
    formData.append('topic', uploadForm.topic);
    formData.append('weekNumber', uploadForm.weekNumber);
    formData.append('tags', JSON.stringify(uploadForm.tags.split(',').map(t => t.trim())));

    const selectedSub = state.subjects.find(s => s._id === uploadForm.subjectId);
    formData.append('departmentId', selectedSub?.department || '');

    try {
      await api.post('/api/subject-files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('File uploaded successfully');
      toggleModal('upload', false);
      setUploadForm({
        subjectId: '',
        fileType: 'lecture_notes',
        title: '',
        description: '',
        file: null,
        semester: '',
        academicYear: '',
        topic: '',
        weekNumber: '',
        tags: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Delete this file?')) {
      try {
        await api.delete(`/api/subject-files/${fileId}`);
        toast.success('File deleted');
        fetchData();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const checkCurriculum = async (subjectId) => {
    try {
      const subject = state.subjects.find(s => s._id === subjectId);
      const res = await api.get(`/api/subject-files/curriculum/${subjectId}/${subject?.year || '1st Year'}/${filters.semester || 1}`);
      setSelectedSubject(subject);
      setState(p => ({ ...p, curriculum: res.data }));
      toggleModal('curriculumCheck', true);
    } catch (error) {
      toast.error('Failed to check curriculum');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/api/subject-files/download/${fileId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const toggleModal = (modalName, show) => {
    setModals(prev => ({ ...prev, [modalName]: show }));
  };

  const getFileTypeIcon = (fileType) => {
    const icons = {
      lecture_notes: '📝',
      slides: '📊',
      lab_manual: '🔬',
      assignment: '📋',
      past_paper: '📄',
      solution: '✅',
      reference: '📚',
      syllabus: '📌',
      curriculum: '🎯',
      grading_rubric: '✏️',
      reading_material: '📖',
      video_link: '🎥'
    };
    return icons[fileType] || '📁';
  };

  const getFileTypeColor = (fileType) => {
    const colors = {
      lecture_notes: 'bg-blue-100 text-blue-800',
      slides: 'bg-purple-100 text-purple-800',
      lab_manual: 'bg-orange-100 text-orange-800',
      assignment: 'bg-yellow-100 text-yellow-800',
      past_paper: 'bg-red-100 text-red-800',
      solution: 'bg-green-100 text-green-800',
      reference: 'bg-indigo-100 text-indigo-800',
      syllabus: 'bg-pink-100 text-pink-800'
    };
    return colors[fileType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={`flex-1 p-6 transition-all duration-300`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FiBook /> Subject Materials & Curriculum
            </h1>
            <p className="text-purple-100 mt-1">Upload and manage curriculum resources</p>
          </div>
          <button
            onClick={() => toggleModal('upload', true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-purple-50 transition"
          >
            <FiUpload /> Upload Material
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search files..."
            value={filters.search}
            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />

          <select
            value={filters.subject}
            onChange={(e) => setFilters(p => ({ ...p, subject: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Subjects</option>
            {state.subjects.map(s => (
              <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
            ))}
          </select>

          <select
            value={filters.fileType}
            onChange={(e) => setFilters(p => ({ ...p, fileType: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            <option value="lecture_notes">Lecture Notes</option>
            <option value="slides">Slides</option>
            <option value="lab_manual">Lab Manual</option>
            <option value="assignment">Assignment</option>
            <option value="past_paper">Past Paper</option>
            <option value="solution">Solution</option>
            <option value="reference">Reference</option>
            <option value="syllabus">Syllabus</option>
          </select>

          <select
            value={filters.semester}
            onChange={(e) => setFilters(p => ({ ...p, semester: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>

          <button
            onClick={() => setFilters({
              search: '',
              subject: 'all',
              fileType: 'all',
              semester: 'all',
              academicYear: 'all'
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="grid gap-6">
        {filteredFiles.map(file => (
          <div key={file._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{getFileTypeIcon(file.fileType)}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{file.title}</h3>
                    <p className="text-sm text-gray-500">
                      {file.subject?.code} - {file.subject?.name}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">{file.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFileTypeColor(file.fileType)}`}>
                {file.fileType.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-4">
              <div>✓ Size: {file.displayFileSize}</div>
              <div>✓ Sem {file.semester}</div>
              <div>✓ {file.academicYear}</div>
              <div>📥 {file.downloadCount} downloads</div>
            </div>

            {file.tags.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {file.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleDelete(file._id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
              >
                <FiTrash2 size={16} /> Delete
              </button>
              <button
                onClick={() => handleDownload(file._id, file.title)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <FiDownload size={16} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modals.upload && (
        <UploadModal
          isOpen={modals.upload}
          onClose={() => toggleModal('upload', false)}
          formData={uploadForm}
          setFormData={setUploadForm}
          onSubjectChange={handleSubjectChange}
          onSubmit={handleUpload}
          subjects={state.subjects}
        />
      )}

      {modals.curriculumCheck && state.curriculum && (
        <CurriculumModal
          isOpen={modals.curriculumCheck}
          onClose={() => toggleModal('curriculumCheck', false)}
          subject={selectedSubject}
          curriculum={state.curriculum}
        />
      )}
    </div>
  );
};

// Upload Modal Component
const UploadModal = ({ isOpen, onClose, formData, setFormData, onSubjectChange, onSubmit, subjects }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Upload Subject Material</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <select
                value={formData.subjectId}
                onChange={onSubjectChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Academic Year *</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData(p => ({ ...p, academicYear: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Material Type *</label>
              <select
                value={formData.fileType}
                onChange={(e) => setFormData(p => ({ ...p, fileType: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="lecture_notes">Lecture Notes</option>
                <option value="slides">Slides</option>
                <option value="lab_manual">Lab Manual</option>
                <option value="assignment">Assignment</option>
                <option value="past_paper">Past Paper</option>
                <option value="solution">Solution</option>
                <option value="reference">Reference</option>
                <option value="syllabus">Syllabus</option>
                <option value="curriculum">Curriculum</option>
                <option value="grading_rubric">Grading Rubric</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Introduction to Programming"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Topic/Chapter</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData(p => ({ ...p, topic: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Chapter 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(p => ({ ...p, semester: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Week Number</label>
              <input
                type="number"
                value={formData.weekNumber}
                onChange={(e) => setFormData(p => ({ ...p, weekNumber: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                min="1"
                max="16"
                placeholder="1-16"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows="3"
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., important, exam, practice"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload File *</label>
            <input
              type="file"
              onChange={(e) => setFormData(p => ({ ...p, file: e.target.files[0] }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, ZIP</p>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Upload Material
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Curriculum Modal Component
const CurriculumModal = ({ isOpen, onClose, subject, curriculum }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Curriculum Compliance</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        {subject && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-semibold">{subject.code} - {subject.name}</p>
            <p className="text-sm text-gray-600">Credits: {subject.credits}</p>
          </div>
        )}

        {curriculum && (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Overall Completion</span>
                <span className="text-2xl font-bold">{curriculum.compliance.completePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${curriculum.compliance.completePercentage}%` }}
                />
              </div>
            </div>

            {/* File Types Checklist */}
            <div className="space-y-2">
              {Object.entries(curriculum.grouped).map(([type, data]) => (
                <div key={type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{type.replace(/_/g, ' ')}</span>
                    {data.status === 'uploaded' ? (
                      <FiCheckCircle className="text-green-600" size={20} />
                    ) : (
                      <FiAlertCircle className="text-yellow-600" size={20} />
                    )}
                  </div>
                  {data.files.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {data.files.map(f => (
                        <div key={f._id}>✓ {f.title}</div>
                      ))}
                    </div>
                  )}
                  {data.files.length === 0 && (
                    <div className="text-sm text-red-600">⚠ No files uploaded</div>
                  )}
                </div>
              ))}
            </div>

            {curriculum.compliance.missing.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-semibold text-yellow-900 mb-2">Missing Materials:</p>
                <ul className="list-disc list-inside text-sm text-yellow-800">
                  {curriculum.compliance.missing.map(item => (
                    <li key={item}>{item.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectMaterials;