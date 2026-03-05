import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';

import {
  FiPlus, FiEdit2, FiTrash2, FiUser, FiBook, FiCheckCircle,
  FiAlertCircle, FiDownload, FiSearch, FiFilter, FiTrendingUp,
  FiAward, FiBarChart2, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const LecturerManagement = ({ sidebarOpen }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({
    assignments: [],
    lecturers: [],
    subjects: [],
    departments: []
  });

  const [filters, setFilters] = useState({
    search: '',
    department: 'all',
    semester: 'all',
    academicYear: 'all',
    status: 'all'
  });

  const [modals, setModals] = useState({
    assign: false,
    edit: false,
    qualify: false,
    progress: false
  });

  const [formData, setFormData] = useState({
    lecturerId: '',
    subjectId: '',
    departmentId: '',
    academicYear: '',
    semester: '',
    startDate: '',
    endDate: '',
    totalLectures: 30,
    totalPracticals: 15,
    totalAssignments: 10,
    minimumQualification: 'B.Tech',
    notes: ''
  });

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignRes, lecturersRes, subjectsRes, deptRes] = await Promise.all([
        api.get('/api/lecturer-assignments/all').catch(() => ({ data: { assignments: [] } })),
        api.get('/api/users?role=lecturer').catch(() => ({ data: { users: [] } })),
        api.get('/api/subjects?isActive=true').catch(() => ({ data: { subjects: [] } })),
        api.get('/api/departments').catch(() => ({ data: { departments: [] } }))
      ]);

      setState({
        assignments: assignRes.data.assignments || [],
        lecturers: lecturersRes.data.users || [],
        subjects: subjectsRes.data.subjects || [],
        departments: deptRes.data.departments || []
      });
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return state.assignments.filter(a => {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch =
        a.lecturer?.name?.toLowerCase().includes(searchTerm) ||
        a.subject?.code?.toLowerCase().includes(searchTerm) ||
        a.subject?.name?.toLowerCase().includes(searchTerm);

      const matchesFilters =
        (filters.department === 'all' || a.department?._id === filters.department) &&
        (filters.semester === 'all' || a.semester === Number(filters.semester)) &&
        (filters.academicYear === 'all' || a.academicYear === filters.academicYear) &&
        (filters.status === 'all' || a.status === filters.status);

      return matchesSearch && matchesFilters;
    });
  }, [state.assignments, filters]);

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!formData.lecturerId || !formData.subjectId || !formData.departmentId || !formData.academicYear || !formData.semester || !formData.startDate || !formData.endDate || !formData.minimumQualification) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.post('/api/lecturer-assignments/assign', {
        lecturerId: formData.lecturerId,
        subjectId: formData.subjectId,
        departmentId: formData.departmentId,
        academicYear: formData.academicYear,
        semester: Number(formData.semester),
        startDate: formData.startDate,
        endDate: formData.endDate,
        curriculum: {
          totalLectures: Number(formData.totalLectures),
          totalPracticals: Number(formData.totalPracticals),
          totalAssignments: Number(formData.totalAssignments)
        },
        qualifications: {
          minimumQualification: formData.minimumQualification
        },
        notes: formData.notes
      });

      const selectedLecturer = state.lecturers.find(l => l._id === formData.lecturerId);
      const selectedSubject = state.subjects.find(s => s._id === formData.subjectId);

      if (selectedLecturer && selectedSubject) {
        await api.post('/api/notifications/send', {
          recipientIds: [formData.lecturerId],
          title: 'New Subject Assignment',
          message: `You have been assigned to teach ${selectedSubject.name} (${selectedSubject.code}) for ${formData.academicYear}, Semester ${formData.semester}`,
          type: 'assignment',
          priority: 'normal',
          link: '/lecturer/dashboard'
        });
      }

      toast.success('Lecturer assigned successfully');
      toggleModal('assign', false);
      setFormData({
        lecturerId: '',
        subjectId: '',
        departmentId: '',
        academicYear: '',
        semester: '',
        startDate: '',
        endDate: '',
        totalLectures: 30,
        totalPracticals: 15,
        totalAssignments: 10,
        minimumQualification: 'B.Tech',
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Assignment failed');
    }
  };

  const handleUpdateStatus = async (assignmentId, status) => {
    try {
      await api.put(`/api/lecturer-assignments/${assignmentId}/status`, { status });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/api/lecturer-assignments/${assignmentId}`);
        toast.success('Assignment deleted');
        fetchData();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const toggleModal = (modalName, show) => {
    setModals(prev => ({ ...prev, [modalName]: show }));
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className={`flex-1 p-6 transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FiUser /> Lecturer Management
            </h1>
            <p className="text-blue-100 mt-1">Assign subjects and manage lecturer curriculum</p>
          </div>
          <button
            onClick={() => toggleModal('assign', true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-50 transition"
          >
            <FiPlus /> Assign Lecturer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Search lecturer, subject..."
            value={filters.search}
            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.department}
            onChange={(e) => setFilters(p => ({ ...p, department: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {state.departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          <select
            value={filters.semester}
            onChange={(e) => setFilters(p => ({ ...p, semester: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={() => setFilters({
              search: '',
              department: 'all',
              semester: 'all',
              academicYear: 'all',
              status: 'all'
            })}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lecturer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Year/Sem</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map(assignment => (
              <tr key={assignment._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{assignment.lecturer?.name}</div>
                  <div className="text-sm text-gray-500">{assignment.lecturer?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{assignment.subject?.code}</div>
                  <div className="text-sm text-gray-500">{assignment.subject?.name}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {assignment.academicYear} / Sem {assignment.semester}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${assignment.curriculum.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{assignment.curriculum.progressPercentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        toggleModal('progress', true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiTrendingUp size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(assignment._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modals.assign && (
        <AssignModal
          isOpen={modals.assign}
          onClose={() => toggleModal('assign', false)}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAssign}
          lecturers={state.lecturers}
          subjects={state.subjects}
          departments={state.departments}
        />
      )}

      {modals.progress && selectedAssignment && (
        <ProgressModal
          isOpen={modals.progress}
          onClose={() => toggleModal('progress', false)}
          assignment={selectedAssignment}
          onUpdate={() => { fetchData(); toggleModal('progress', false); }}
        />
      )}
    </div>
  );
}


// Assign Modal Component
const AssignModal = ({ isOpen, onClose, formData, setFormData, onSubmit, lecturers, subjects, departments }) => {
  if (!isOpen) return null;

  // Allowed departments - filtered list
  const ALLOWED_DEPARTMENTS = ['Computer Science', 'Software Engineering', 'Information Technology', 'CS', 'SE', 'IT'];

  // Filter departments to only show allowed ones
  const allowedDepts = departments.filter(d =>
    ALLOWED_DEPARTMENTS.some(allowed =>
      d.name?.trim().toLowerCase() === allowed.toLowerCase() ||
      d.code?.trim().toLowerCase() === allowed.toLowerCase()
    )
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Assign Lecturer to Subject</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lecturer *</label>
              <select
                value={formData.lecturerId}
                onChange={(e) => setFormData(p => ({ ...p, lecturerId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Lecturer</option>
                {lecturers.map(l => (
                  <option key={l._id} value={l._id}>{l.name} ({l.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => {
                  const subjId = e.target.value;
                  const selectedSubject = subjects.find(s => s._id === subjId);

                  let selectedDepartmentId = '';
                  let autoResolved = false;

                  if (selectedSubject && selectedSubject.department) {
                    const deptIdentifier = selectedSubject.department.toString().trim();

                    const matchedDept = allowedDepts.find(d =>
                      d._id?.toString() === deptIdentifier ||
                      d.code?.toLowerCase() === deptIdentifier.toLowerCase() ||
                      d.name?.toLowerCase() === deptIdentifier.toLowerCase()
                    );

                    if (matchedDept) {
                      selectedDepartmentId = matchedDept._id;
                      autoResolved = true;
                    } else if (deptIdentifier) {
                      // Only show error if there actually is a department string that didn't match
                      toast.error(`Subject department "${deptIdentifier}" is not in allowed list. Please select manually.`);
                    }
                  }

                  setFormData(p => ({
                    ...p,
                    subjectId: subjId,
                    departmentId: autoResolved ? matchedDept.name : '',
                    academicYear: selectedSubject?.year || '',
                    semester: selectedSubject?.semester ? selectedSubject.semester.toString() : ''
                  }));
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department *</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData(p => ({ ...p, departmentId: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!formData.departmentId && !!formData.subjectId}
              >
                <option value="">Select Department</option>
                {allowedDepts.length > 0 ? (
                  allowedDepts.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))
                ) : (
                  <>
                    {departments.filter(d => ALLOWED_DEPARTMENTS.includes(d.name)).map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                    {departments.filter(d => ALLOWED_DEPARTMENTS.includes(d.name)).length === 0 && (
                      <>
                        <option value="cs">Computer Science</option>
                        <option value="se">Software Engineering</option>
                        <option value="it">Information Technology</option>
                      </>
                    )}
                  </>
                )}
              </select>
              {formData.departmentId && formData.subjectId && (
                <p className="text-xs text-gray-500 mt-1">✓ Auto-selected & locked</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Academic Year *</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData(p => ({ ...p, academicYear: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!formData.subjectId}
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Semester *</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(p => ({ ...p, semester: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!formData.subjectId}
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Lectures</label>
              <input
                type="number"
                value={formData.totalLectures}
                onChange={(e) => setFormData(p => ({ ...p, totalLectures: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Practicals</label>
              <input
                type="number"
                value={formData.totalPracticals}
                onChange={(e) => setFormData(p => ({ ...p, totalPracticals: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Assignments</label>
              <input
                type="number"
                value={formData.totalAssignments}
                onChange={(e) => setFormData(p => ({ ...p, totalAssignments: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Minimum Qualification</label>
              <select
                value={formData.minimumQualification}
                onChange={(e) => setFormData(p => ({ ...p, minimumQualification: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="Ph.D">Ph.D</option>
                <option value="B.Sc">B.Sc</option>
                <option value="M.Sc">M.Sc</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              maxLength={1000}
            />
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Assign Lecturer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Progress Modal Component
const ProgressModal = ({ isOpen, onClose, assignment, onUpdate }) => {
  const [data, setData] = useState({
    lecturesCompleted: assignment.curriculum.lecturesCompleted || 0,
    practicalsCompleted: assignment.curriculum.practicalsCompleted || 0,
    assignmentsCompleted: assignment.curriculum.assignmentsCompleted || 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/lecturer-assignments/${assignment._id}/progress`, data);
      toast.success('Progress updated');
      onUpdate();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Update Progress</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Lectures Completed: {data.lecturesCompleted}/{assignment.curriculum.totalLectures}
            </label>
            <input
              type="range"
              min="0"
              max={assignment.curriculum.totalLectures}
              value={data.lecturesCompleted}
              onChange={(e) => setData(p => ({ ...p, lecturesCompleted: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Practicals Completed: {data.practicalsCompleted}/{assignment.curriculum.totalPracticals}
            </label>
            <input
              type="range"
              min="0"
              max={assignment.curriculum.totalPracticals}
              value={data.practicalsCompleted}
              onChange={(e) => setData(p => ({ ...p, practicalsCompleted: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Assignments Completed: {data.assignmentsCompleted}/{assignment.curriculum.totalAssignments}
            </label>
            <input
              type="range"
              min="0"
              max={assignment.curriculum.totalAssignments}
              value={data.assignmentsCompleted}
              onChange={(e) => setData(p => ({ ...p, assignmentsCompleted: Number(e.target.value) }))}
              className="w-full"
            />
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LecturerManagement;
