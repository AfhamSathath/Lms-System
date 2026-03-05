import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch, FiClock, FiMapPin, FiBook, FiUsers, FiFilter, FiChevronDown
} from 'react-icons/fi';

import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';

const AdminTimetables = () => {
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState([]);
  const [filteredTimetables, setFilteredTimetables] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [formData, setFormData] = useState({
    subject: '', year: '', semester: '', examType: 'final',
    date: '', startTime: '', endTime: '', venue: '', department: ''
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];
  const examTypes = ['midterm', 'final', 'quiz', 'supplementary', 'special', 'practical', 'viva'];

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { filterTimetables(); }, [searchTerm, selectedYear, selectedSemester, selectedExamType, selectedDepartment, timetables]);

  // Fetch timetables & subjects
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([api.get('/api/timetables'), api.get('/api/subjects')]);
      const uniqueDepts = [...new Set((sRes.data.subjects || []).map(s => s.department).filter(Boolean))];
      setSubjects(sRes.data.subjects || []);
      setDepartments(uniqueDepts);
      setTimetables(tRes.data.timetables || []);
      setFilteredTimetables(tRes.data.timetables || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter timetables
  const filterTimetables = () => {
    let filtered = timetables;
    if (selectedYear !== 'all') filtered = filtered.filter(t => t.year === selectedYear);
    if (selectedSemester !== 'all') filtered = filtered.filter(t => t.semester === parseInt(selectedSemester));
    if (selectedExamType !== 'all') filtered = filtered.filter(t => t.examType === selectedExamType);
    if (selectedDepartment !== 'all') filtered = filtered.filter(t => t.department === selectedDepartment);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject?.name?.toLowerCase().includes(term) ||
        t.subject?.code?.toLowerCase().includes(term) ||
        t.venue?.toLowerCase().includes(term)
      );
    }
    setFilteredTimetables(filtered);
  };

  // Input change
  const handleInputChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Autofill & lock year, semester, department on subject select
  const handleSubjectChange = e => {
    const subjectId = e.target.value;
    const subject = subjects.find(s => s._id === subjectId);
    setFormData(prev => ({
      ...prev,
      subject: subjectId,
      year: subject?.year || '',
      semester: subject?.semester || '',
      department: subject?.department || prev.department
    }));
  };

  const resetForm = () => setFormData({ subject: '', year: '', semester: '', examType: 'final', date: '', startTime: '', endTime: '', venue: '', department: '' });

  // Add timetable
  const handleAddTimetable = async e => {
    e.preventDefault();
    if (!formData.subject || !formData.year || !formData.semester || !formData.department || !formData.date || !formData.startTime || !formData.endTime || !formData.venue) {
      return toast.error("Please fill all required fields");
    }
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH * 60 + startM) >= (endH * 60 + endM)) return toast.error('End time must be after start time');
    try {
      await api.post('/api/timetables', formData);
      toast.success('Timetable added successfully');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to add timetable');
    }
  };

  // Edit timetable
  const handleEditTimetable = async e => {
    e.preventDefault();
    if (!selectedTimetable) return toast.error('No timetable selected');
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH * 60 + startM) >= (endH * 60 + endM)) return toast.error('End time must be after start time');
    try {
      await api.put(`/api/timetables/${selectedTimetable._id}`, formData);
      toast.success('Timetable updated successfully');
      setShowEditModal(false);
      setSelectedTimetable(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to update timetable');
    }
  };

  const handleDeleteTimetable = async id => {
    if (!window.confirm('Are you sure to delete this timetable?')) return;
    try {
      await api.delete(`/api/timetables/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  const openEditModal = t => {
    setSelectedTimetable(t);
    setFormData({
      subject: t.subject?._id || '',
      year: t.year || '',
      semester: t.semester || '',
      examType: t.examType || 'final',
      date: t.date ? format(new Date(t.date), 'yyyy-MM-dd') : '',
      startTime: t.startTime || '',
      endTime: t.endTime || '',
      venue: t.venue || '',
      department: t.department || ''
    });
    setShowEditModal(true);
  };

  // Badge color for year
  const getYearColor = year => {
    switch (year) {
      case '1st Year': return 'bg-purple-200 text-purple-800';
      case '2nd Year': return 'bg-green-200 text-green-800';
      case '3rd Year': return 'bg-blue-200 text-blue-800';
      case '4th Year': return 'bg-pink-200 text-pink-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Exam Timetables</h1>
          <p className="text-purple-100 mt-1">Manage exam schedules across 4 years • 8 semesters</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="mt-4 md:mt-0 bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center shadow-lg">
          <FiPlus className="mr-2" /> Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by subject, code, or venue..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Years</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedExamType} onChange={e => setSelectedExamType(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Exam Types</option>
              {examTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none">
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => {
            setSearchTerm('');
            setSelectedYear('all');
            setSelectedSemester('all');
            setSelectedExamType('all');
            setSelectedDepartment('all');
          }} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Timetable Cards */}
      {filteredTimetables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTimetables.map(t => (
            <div key={t._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t.subject?.name}</h3>
                    <p className="text-purple-100 text-sm">{t.subject?.code}</p>
                  </div>
                  <span className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded-full">{t.examType}</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center text-gray-600"><FiCalendar className="mr-2 text-purple-500" />{t.date ? format(new Date(t.date), 'MMMM dd, yyyy') : '-'}</div>
                <div className="flex items-center text-gray-600"><FiClock className="mr-2 text-green-500" />{t.startTime || '-'} - {t.endTime || '-'}</div>
                <div className="flex items-center text-gray-600"><FiMapPin className="mr-2 text-red-500" />{t.venue || '-'}</div>
                <div className="flex items-center text-gray-600"><FiBook className="mr-2 text-blue-500" /><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getYearColor(t.year)}`}>{t.year} - Semester {t.semester}</span></div>
                <div className="flex items-center text-gray-600"><FiUsers className="mr-2 text-indigo-500" />{t.department || '-'}</div>
                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                  <button onClick={() => openEditModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><FiEdit2 className="h-5 w-5" /></button>
                  <button onClick={() => handleDeleteTimetable(t._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><FiTrash2 className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No timetables found</p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Create Your First Schedule</button>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Exam Schedule" size="lg">
        <TimetableForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubjectChange={handleSubjectChange}
          handleSubmit={handleAddTimetable}
          subjects={subjects}
          academicYears={academicYears}
          semesters={semesters}
          examTypes={examTypes}
          departments={departments}
          submitText="Add Schedule"
          resetForm={resetForm}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedTimetable(null); resetForm(); }} title="Edit Exam Schedule" size="lg">
        <TimetableForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubjectChange={handleSubjectChange}
          handleSubmit={handleEditTimetable}
          subjects={subjects}
          academicYears={academicYears}
          semesters={semesters}
          examTypes={examTypes}
          departments={departments}
          submitText="Update Schedule"
          resetForm={resetForm}
        />
      </Modal>
    </div>
  );
};

// Timetable Form Component
const TimetableForm = ({ formData, handleInputChange, handleSubjectChange, handleSubmit, subjects, academicYears, semesters, examTypes, departments, submitText, resetForm }) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-medium">Subject</label>
        <select name="subject" value={formData.subject} onChange={handleSubjectChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500">
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Department</label>
        <select name="department" value={formData.department} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" disabled={!!formData.subject}>
          <option value="">Select Department</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Year</label>
        <select name="year" value={formData.year} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" disabled={!!formData.subject}>
          <option value="">Select Year</option>
          {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Semester</label>
        <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" disabled={!!formData.subject}>
          <option value="">Select Semester</option>
          {semesters.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Exam Type</label>
        <select name="examType" value={formData.examType} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500">
          {examTypes.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Venue</label>
        <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Start Time</label>
        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
      <div>
        <label className="block mb-1 font-medium">End Time</label>
        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500" />
      </div>
    </div>
    <div className="flex justify-end space-x-2 mt-4">
      <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Reset</button>
      <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">{submitText}</button>
    </div>
  </form>
);

export default AdminTimetables;