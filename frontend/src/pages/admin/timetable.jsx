import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch, FiClock, 
  FiMapPin, FiBook, FiUsers, FiFilter, FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminTimetables = ({ sidebarOpen }) => {
  const [timetables, setTimetables] = useState([]);
  const [filteredTimetables, setFilteredTimetables] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const examTypes = ['midterm', 'final', 'quiz', 'supplementary'];

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { filterTimetables(); }, [searchTerm, selectedYear, selectedSemester, selectedExamType, selectedDepartment, timetables]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetablesRes, subjectsRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/subjects')
      ]);
      
      // Process timetables to ensure year field exists
      const processedTimetables = (timetablesRes.data.timetables || []).map(t => ({
        ...t,
        year: t.year || getYearFromSemester(t.semester),
        semester: t.semester || 1
      }));
      
      setTimetables(processedTimetables);
      setFilteredTimetables(processedTimetables);
      setSubjects(subjectsRes.data.subjects || []);
      
      // Extract unique departments from subjects
      const uniqueDepts = [...new Set((subjectsRes.data.subjects || []).map(s => s.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally { setLoading(false); }
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

  const filterTimetables = () => {
    let filtered = timetables;
    
    if(selectedYear !== 'all') {
      filtered = filtered.filter(t => t.year === selectedYear);
    }
    if(selectedSemester !== 'all') {
      filtered = filtered.filter(t => t.semester === parseInt(selectedSemester));
    }
    if(selectedExamType !== 'all') {
      filtered = filtered.filter(t => t.examType === selectedExamType);
    }
    if(selectedDepartment !== 'all') {
      filtered = filtered.filter(t => t.department === selectedDepartment);
    }
    if(searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject?.name?.toLowerCase().includes(term) ||
        t.subject?.code?.toLowerCase().includes(term) ||
        t.venue?.toLowerCase().includes(term) ||
        t.department?.toLowerCase().includes(term)
      );
    }
    setFilteredTimetables(filtered);
  };

  const handleInputChange = e => setFormData({...formData,[e.target.name]:e.target.value});
  
  const resetForm = () => setFormData({
    subject:'', year:'', semester:'', examType:'final',
    date:'', startTime:'', endTime:'', venue:'', department:''
  });

  // Add timetable
  const handleAddTimetable = async (e) => {
    e.preventDefault();
    
    // Validate times
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH*60+startM) >= (endH*60+endM)) {
      return toast.error('End time must be after start time');
    }
    
    // Convert year+semester to semester number for backend compatibility
    const semesterNumber = getSemesterNumber(formData.year, formData.semester);
    
    const payload = { 
      ...formData, 
      semester: semesterNumber,
      year: formData.year,
      semesterWithinYear: parseInt(formData.semester)
    };
    
    try {
      await api.post('/timetables', payload);
      toast.success('Timetable added successfully');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add timetable');
    }
  };

  // Edit timetable
  const handleEditTimetable = async (e) => {
    e.preventDefault();
    if(!selectedTimetable) return toast.error('No timetable selected for editing');
    
    // Validate times
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH*60+startM) >= (endH*60+endM)) {
      return toast.error('End time must be after start time');
    }
    
    // Convert year+semester to semester number for backend compatibility
    const semesterNumber = getSemesterNumber(formData.year, formData.semester);
    
    const payload = { 
      ...formData, 
      semester: semesterNumber,
      year: formData.year,
      semesterWithinYear: parseInt(formData.semester)
    };
    
    try {
      await api.put(`/timetables/${selectedTimetable._id}`, payload);
      toast.success('Timetable updated successfully');
      setShowEditModal(false);
      setSelectedTimetable(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update timetable');
    }
  };

  const handleDeleteTimetable = async id => {
    if(!window.confirm('Are you sure to delete this timetable?')) return;
    try {
      await api.delete(`/timetables/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Delete failed');
    }
  };

  const openEditModal = timetable => {
    // Convert semester number back to year + semester within year
    const year = timetable.year || getYearFromSemester(timetable.semester);
    const semesterWithinYear = timetable.semesterWithinYear || getSemesterWithinYear(timetable.semester);
    
    setSelectedTimetable(timetable);
    setFormData({
      subject: timetable.subject?._id || '',
      year: year,
      semester: semesterWithinYear,
      examType: timetable.examType || 'final',
      date: timetable.date ? format(new Date(timetable.date),'yyyy-MM-dd') : '',
      startTime: timetable.startTime || '',
      endTime: timetable.endTime || '',
      venue: timetable.venue || '',
      department: timetable.department || '',
    });
    setShowEditModal(true);
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

  if(loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300" style={{ marginLeft: sidebarOpen ? 208 : 64 }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Exam Timetables</h1>
          <p className="text-purple-100 mt-1">Manage exam schedules across 4 years • 8 semesters</p>
        </div>
        <button 
          onClick={()=>setShowAddModal(true)} 
          className="mt-4 md:mt-0 bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center shadow-lg"
        >
          <FiPlus className="mr-2"/> Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative md:col-span-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e=>setSearchTerm(e.target.value)}
              placeholder="Search by subject or venue..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedYear} 
              onChange={e=>setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedSemester} 
              onChange={e=>setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none"
            >
              <option value="all">All Semesters</option>
              {semesters.map(s=><option key={s} value={s}>Semester {s}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Exam Type Filter */}
          <div className="relative">
            <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedExamType} 
              onChange={e=>setSelectedExamType(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none"
            >
              <option value="all">All Exam Types</option>
              {examTypes.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedDepartment} 
              onChange={e=>setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none appearance-none"
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
            onClick={()=>{
              setSearchTerm('');
              setSelectedYear('all');
              setSelectedSemester('all');
              setSelectedExamType('all');
              setSelectedDepartment('all');
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Timetable Cards */}
      {filteredTimetables.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTimetables.map(t => (
            <div key={t._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t.subject?.name}</h3>
                    <p className="text-purple-100 text-sm">{t.subject?.code}</p>
                  </div>
                  <span className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded-full">
                    {t.examType}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center text-gray-600">
                  <FiCalendar className="mr-2 text-purple-500"/>
                  {t.date ? format(new Date(t.date),'MMMM dd, yyyy') : '-'}
                </div>
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2 text-green-500"/>
                  {t.startTime || '-'} - {t.endTime || '-'}
                </div>
                <div className="flex items-center text-gray-600">
                  <FiMapPin className="mr-2 text-red-500"/>
                  {t.venue || '-'}
                </div>
                <div className="flex items-center text-gray-600">
                  <FiBook className="mr-2 text-blue-500"/>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getYearColor(t.year || getYearFromSemester(t.semester))}`}>
                    {t.year || getYearFromSemester(t.semester)} - Semester {t.semesterWithinYear || getSemesterWithinYear(t.semester)}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FiUsers className="mr-2 text-indigo-500"/>
                  {t.department || '-'}
                </div>
                <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                  <button 
                    onClick={()=>openEditModal(t)} 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 className="h-5 w-5"/>
                  </button>
                  <button 
                    onClick={()=>handleDeleteTimetable(t._id)} 
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="h-5 w-5"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
          <p className="text-gray-500 text-lg">No timetables found</p>
          <button
            onClick={()=>setShowAddModal(true)}
            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Your First Schedule
          </button>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={()=>{setShowAddModal(false);resetForm();}} title="Add Exam Schedule" size="lg">
        <TimetableForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
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
      <Modal isOpen={showEditModal} onClose={()=>{setShowEditModal(false);setSelectedTimetable(null);resetForm();}} title="Edit Exam Schedule" size="lg">
        <TimetableForm 
          formData={formData} 
          handleInputChange={handleInputChange} 
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

// TimetableForm Component
const TimetableForm = ({formData, handleInputChange, handleSubmit, subjects, academicYears, semesters, examTypes, departments, submitText, resetForm}) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
        <select 
          name="subject" 
          value={formData.subject} 
          onChange={handleInputChange} 
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="">Select Subject</option>
          {subjects.map(s => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.code}) - {s.department || 'No Dept'} - {s.year || 'N/A'} Sem {s.semester || 'N/A'}
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="">Select Semester</option>
          {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
        <select 
          name="examType" 
          value={formData.examType} 
          onChange={handleInputChange} 
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          {examTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
        <select 
          name="department" 
          value={formData.department} 
          onChange={handleInputChange} 
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="">Select Department</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
        <input 
          type="date" 
          name="date" 
          value={formData.date} 
          onChange={handleInputChange} 
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
        <input 
          type="text" 
          name="venue" 
          value={formData.venue} 
          onChange={handleInputChange} 
          required 
          placeholder="e.g., Hall A, Room 101"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
        <input 
          type="time" 
          name="startTime" 
          value={formData.startTime} 
          onChange={handleInputChange} 
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
        <input 
          type="time" 
          name="endTime" 
          value={formData.endTime} 
          onChange={handleInputChange} 
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
      </div>
    </div>

    <div className="flex justify-end space-x-3 pt-4">
      <button 
        type="button" 
        onClick={() => resetForm && resetForm()} 
        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
      <button 
        type="submit" 
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        {submitText}
      </button>
    </div>
  </form>
);

export default AdminTimetables;