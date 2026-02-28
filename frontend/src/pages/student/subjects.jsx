import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiBook, FiUser, FiClock, FiDownload, FiSearch } from 'react-icons/fi';

const StudentSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, [selectedSemester]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get(`/subjects/semester/${selectedSemester}`);
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Subjects</h1>
        <p className="text-gray-600 mt-2">View all subjects for each semester</p>
      </div>

      {/* Semester Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Semester
        </label>
        <div className="flex flex-wrap gap-2">
          {semesters.map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedSemester === sem
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map(subject => (
            <div key={subject._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-xl font-semibold text-white">{subject.name}</h3>
                <p className="text-blue-100 text-sm mt-1">{subject.code}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <FiBook className="mr-2 text-blue-500" />
                    <span>Credits: {subject.credits}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiUser className="mr-2 text-green-500" />
                    <span>Lecturer: {subject.lecturer?.name || 'Not Assigned'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiClock className="mr-2 text-purple-500" />
                    <span>Semester: {subject.semester}</span>
                  </div>
                </div>

                {subject.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <FiDownload className="mr-2" />
                    Materials
                  </button>
                  {subject.syllabus && (
                    <button className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                      Syllabus
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <FiBook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No subjects found for Semester {selectedSemester}</p>
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;