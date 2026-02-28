import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiFile, FiDownload, FiClock, FiUser, FiBook, FiSearch, FiFilter } from 'react-icons/fi';
import { saveAs } from 'file-saver';

const StudentFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [searchTerm, selectedSubject, files]);

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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = files;

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(file => file.subject?._id === selectedSubject);
    }

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFiles(filtered);
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });
      saveAs(response.data, fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    return '📁';
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Study Materials</h1>
        <p className="text-gray-600 mt-2">Access lecture notes, presentations, and other resources</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map(file => (
            <div key={file._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {file.originalName}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  {file.subject && (
                    <div className="flex items-center text-gray-600">
                      <FiBook className="mr-2 text-blue-500 flex-shrink-0" />
                      <span className="text-sm truncate">{file.subject.name}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <FiUser className="mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Uploaded by: {file.uploadedBy?.name}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiClock className="mr-2 text-purple-500 flex-shrink-0" />
                    <span className="text-sm">
                      {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {file.description && (
                    <p className="text-sm text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                      {file.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Size: {formatFileSize(file.size)}</span>
                    <span className="text-gray-500">Downloads: {file.downloads || 0}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(file._id, file.originalName)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
                >
                  <FiDownload className="mr-2" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <FiFile className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No files available</p>
          <p className="text-gray-400 mt-2">Check back later for study materials</p>
        </div>
      )}
    </div>
  );
};

export default StudentFiles;