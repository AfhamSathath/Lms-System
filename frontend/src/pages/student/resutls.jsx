import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import { FiAward, FiAlertCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const StudentResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedSemesters, setExpandedSemesters] = useState({});

  useEffect(() => {
    if (user) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchResults = async () => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/api/results/student/${user._id}`);
      setResults(response.data?.results || {});

      const semesters = Object.keys(response.data?.results || {});
      if (semesters.length > 0) {
        const latest = Math.max(...semesters);
        setExpandedSemesters({ [latest]: true });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSemester = (semester) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [semester]: !prev[semester]
    }));
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'A-': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'C-': 'bg-orange-100 text-orange-800',
      'D+': 'bg-orange-100 text-orange-800',
      'D': 'bg-red-100 text-red-800',
      'E': 'bg-red-100 text-red-800',
      'F': 'bg-red-100 text-red-800',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const calculateCGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    Object.keys(results).forEach(semester => {
      results[semester]?.subjects?.forEach(result => {
        totalCredits += result.subject.credits;
        totalGradePoints += result.subject.credits * result.gradePoint;
      });
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
  };

  const getPoorGradeSubjects = () => {
    const poorGrades = [];
    Object.keys(results).forEach(semester => {
      results[semester]?.subjects?.forEach(result => {
        if (['C-', 'D+', 'D', 'E'].includes(result.grade)) {
          poorGrades.push({ ...result, semester });
        }
      });
    });
    return poorGrades;
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const poorGradeSubjects = getPoorGradeSubjects();
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Results</h1>
        <p className="text-gray-600 mt-2">View your academic performance across all semesters</p>
      </div>

      {/* CGPA Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-90">Cumulative GPA (CGPA)</p>
            <p className="text-4xl font-bold mt-2">{calculateCGPA()}</p>
          </div>
          <FiAward className="h-16 w-16 opacity-50" />
        </div>
      </div>

      {/* Poor Grade Alerts */}
      {poorGradeSubjects.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8">
          <div className="flex">
            <FiAlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Academic Alert - {poorGradeSubjects.length} Subject(s) Need Attention
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {poorGradeSubjects.map((result, index) => (
                    <li key={index}>
                      {result.subject.name} - Grade: {result.grade} (Semester {result.semester})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results by Semester */}
      {hasResults ? (
        <div className="space-y-4">
          {Object.keys(results)
            .sort((a, b) => b - a)
            .map(semester => (
              <div key={semester} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Semester Header */}
                <div
                  className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSemester(semester)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Semester {semester}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {results[semester].subjects.length} Subjects
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">GPA</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {results[semester].gpa?.toFixed(2)}
                        </p>
                      </div>
                      {expandedSemesters[semester] ? (
                        <FiChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <FiChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Semester Results Table */}
                {expandedSemesters[semester] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credits
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Marks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grade Point
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results[semester].subjects.map((result, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.subject.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.subject.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.subject.credits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.marks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(result.grade)}`}>
                                {result.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.gradePoint}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${result.status === 'pass'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {result.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="7" className="px-6 py-4">
                            <div className="flex justify-end">
                              <div className="text-sm">
                                <span className="font-medium">Total Credits:</span>{' '}
                                {results[semester].totalCredits} |{' '}
                                <span className="font-medium">GPA:</span>{' '}
                                <span className="text-blue-600 font-bold">
                                  {results[semester].gpa?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <FiAward className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No results available yet</p>
          <p className="text-gray-400 mt-2">Your results will appear here once published</p>
        </div>
      )}
    </div>
  );
};

export default StudentResults;