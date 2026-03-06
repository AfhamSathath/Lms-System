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

  const getYearLabel = (num) => {
    const map = {
      1: '1st Year',
      2: '2nd Year',
      3: '3rd Year',
      4: '4th Year',
      5: '5th Year'
    };
    return map[num] || num;
  };

  const [error, setError] = useState(null);

  const fetchResults = async () => {
    // make sure we use the id field that is always populated by auth
    const studentId = user?.id || user?._id;
    console.log('fetchResults invoked, user:', user, 'studentId:', studentId);
    if (!studentId) {
      setError('Unable to determine your student ID.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/api/results/student/${studentId}`);
      if (!response.data || !response.data.success) {
        console.warn('unexpected API response', response);
      }

      // normalize results to plain object in case server returns an array
      let allResults = {};
      if (response?.data?.results) {
        if (Array.isArray(response.data.results)) {
          // convert array of sem objects into keyed object
          response.data.results.forEach(semObj => {
            if (semObj.year && semObj.semester != null) {
              allResults[`${semObj.year}-S${semObj.semester}`] = semObj;
            }
          });
        } else if (typeof response.data.results === 'object') {
          allResults = response.data.results;
        }
      }
      console.log('raw results from API', allResults);

      // attempt to filter to only the student's current year/semester
      const yrRaw = user?.yearOfStudy || user?.year;
      const sem = user?.semester;
      const assignedYear = typeof yrRaw === 'number' ? getYearLabel(yrRaw) : yrRaw;
      let filteredResults = {};
      let assignedKey;

      if (assignedYear && sem != null) {
        assignedKey = `${assignedYear}-S${sem}`;
        if (allResults && allResults[assignedKey]) {
          filteredResults = { [assignedKey]: allResults[assignedKey] };
          setExpandedSemesters({ [assignedKey]: true });
        } else {
          console.warn(`no results found for key ${assignedKey}, falling back to all results`);
          filteredResults = allResults;
        }
      } else {
        filteredResults = allResults;
      }

      setResults(filteredResults || {});
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load your results.');
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
  const hasResults = results && Object.keys(results).length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Results</h1>
        <p className="text-gray-600 mt-2">View your academic performance across all semesters</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

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
            .sort((a, b) => {
              // keys are like "1st Year-S1"; sort by year then semester descending
              const yearOrder = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, '5th Year': 5 };
              const [aYear, aSemStr] = a.split('-S');
              const [bYear, bSemStr] = b.split('-S');
              const aYearNum = yearOrder[aYear] || 0;
              const bYearNum = yearOrder[bYear] || 0;
              const aSem = parseInt(aSemStr) || 0;
              const bSem = parseInt(bSemStr) || 0;
              if (aYearNum !== bYearNum) return bYearNum - aYearNum;
              return bSem - aSem;
            })
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