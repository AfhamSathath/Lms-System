import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch, FiClock, FiMapPin, FiBook } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminTimetables = ({ sidebarOpen }) => {
  const [timetables, setTimetables] = useState([]);
  const [filteredTimetables, setFilteredTimetables] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [formData, setFormData] = useState({
    subject: '', semester: '', examType: 'final', date: '', startTime: '', endTime: '', venue: '', department: ''
  });

  const semesters = [1,2,3,4,5,6,7,8];
  const examTypes = ['midterm', 'final', 'quiz', 'supplementary'];

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { filterTimetables(); }, [searchTerm, selectedSemester, selectedExamType, timetables]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetablesRes, subjectsRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/subjects')
      ]);
      setTimetables(timetablesRes.data.timetables || []);
      setFilteredTimetables(timetablesRes.data.timetables || []);
      setSubjects(subjectsRes.data.subjects || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally { setLoading(false); }
  };

  const filterTimetables = () => {
    let filtered = timetables;
    if(selectedSemester !== 'all') filtered = filtered.filter(t => t.semester === parseInt(selectedSemester));
    if(selectedExamType !== 'all') filtered = filtered.filter(t => t.examType === selectedExamType);
    if(searchTerm) filtered = filtered.filter(t =>
      t.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.venue?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTimetables(filtered);
  };

  const handleInputChange = e => setFormData({...formData,[e.target.name]:e.target.value});
  const resetForm = () => setFormData({subject:'',semester:'',examType:'final',date:'',startTime:'',endTime:'',venue:'',department:''});

  // Add timetable
  const handleAddTimetable = async (e) => {
    e.preventDefault();
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH*60+startM) >= (endH*60+endM)) return toast.error('End time must be after start time');
    const payload = { ...formData, semester: Number(formData.semester) };
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
    const [startH, startM] = formData.startTime.split(':').map(Number);
    const [endH, endM] = formData.endTime.split(':').map(Number);
    if ((startH*60+startM) >= (endH*60+endM)) return toast.error('End time must be after start time');
    const payload = { ...formData, semester: Number(formData.semester) };
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
    setSelectedTimetable(timetable);
    setFormData({
      subject: timetable.subject?._id || '',
      semester: timetable.semester || '',
      examType: timetable.examType || 'final',
      date: timetable.date ? format(new Date(timetable.date),'yyyy-MM-dd') : '',
      startTime: timetable.startTime || '',
      endTime: timetable.endTime || '',
      venue: timetable.venue || '',
      department: timetable.department || '',
    });
    setShowEditModal(true);
  };

  if(loading) return <Loader fullScreen />;

  return (
    <div className={`container mx-auto px-4 py-8 transition-all duration-300 ${sidebarOpen ? 'ml-52' : 'ml-16'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Exam Timetables</h1>
          <p className="text-gray-600 mt-1">Manage exam schedules for all subjects</p>
        </div>
        <button onClick={()=>setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl flex items-center shadow-sm transition-colors">
          <FiPlus className="mr-2"/> Add Schedule
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
          <input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
            placeholder="Search by subject or venue..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <select value={selectedSemester} onChange={e=>setSelectedSemester(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="all">All Semesters</option>
          {semesters.map(s=><option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={selectedExamType} onChange={e=>setSelectedExamType(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="all">All Exam Types</option>
          {examTypes.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <button onClick={()=>{setSearchTerm('');setSelectedSemester('all');setSelectedExamType('all');}}
          className="w-full py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >Clear Filters</button>
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
                  <span className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded">{t.examType}</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center text-gray-600"><FiCalendar className="mr-2 text-purple-500"/>{t.date ? format(new Date(t.date),'MMMM dd, yyyy') : '-'}</div>
                <div className="flex items-center text-gray-600"><FiClock className="mr-2 text-green-500"/>{t.startTime || '-'} - {t.endTime || '-'}</div>
                <div className="flex items-center text-gray-600"><FiMapPin className="mr-2 text-red-500"/>{t.venue || '-'}</div>
                <div className="flex items-center text-gray-600"><FiBook className="mr-2 text-blue-500"/>Semester {t.semester || '-'} | {t.department || '-'}</div>
                <div className="flex justify-end space-x-2 mt-3">
                  <button onClick={()=>openEditModal(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><FiEdit2 className="h-5 w-5"/></button>
                  <button onClick={()=>handleDeleteTimetable(t._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 className="h-5 w-5"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
          <p className="text-gray-500 text-lg">No timetables found</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={()=>{setShowAddModal(false);resetForm();}} title="Add Exam Schedule" size="lg">
        <TimetableForm formData={formData} handleInputChange={handleInputChange} handleSubmit={handleAddTimetable} subjects={subjects} semesters={semesters} examTypes={examTypes} submitText="Add Schedule" resetForm={resetForm}/>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={()=>{setShowEditModal(false);setSelectedTimetable(null);resetForm();}} title="Edit Exam Schedule" size="lg">
        <TimetableForm formData={formData} handleInputChange={handleInputChange} handleSubmit={handleEditTimetable} subjects={subjects} semesters={semesters} examTypes={examTypes} submitText="Update Schedule" resetForm={resetForm}/>
      </Modal>
    </div>
  );
};

// TimetableForm Component
const TimetableForm = ({formData, handleInputChange, handleSubmit, subjects, semesters, examTypes, submitText, resetForm}) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
        <select name="subject" value={formData.subject} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
          <option value="">Select Subject</option>
          {subjects.map(s=><option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
        <select name="semester" value={formData.semester} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
          <option value="">Select Semester</option>
          {semesters.map(s=><option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
        <select name="examType" value={formData.examType} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
          {examTypes.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
        <input type="text" name="department" value={formData.department} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
        <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
        <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
        <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"/>
      </div>
    </div>
    <div className="flex justify-end space-x-3 pt-4">
      <button type="button" onClick={() => resetForm && resetForm()} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">{submitText}</button>
    </div>
  </form>
);

export default AdminTimetables;