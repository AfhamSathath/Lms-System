import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiBook, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiCalendar,
  FiGrid, FiUsers, FiAward, FiDownload, FiUpload, FiLayers, FiEye,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Subject data based on curriculum
const subjectOptions = {
  'Computer Science': {
    '1st Year': {
      1: [
        { code: 'CO1121', name: 'Basic Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'CO1122', name: 'Basic Computer Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1112' },
        { code: 'CO1112', name: 'Practical work on CO1122', credits: 1, category: 'Practical' },
        { code: 'CO1123', name: 'Formal Methods for Problem Solving', credits: 3, category: 'Lecture' },
        { code: 'CO1124', name: 'Computer Systems & PC Applications', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1114' },
        { code: 'CO1114', name: 'Practical work on CO1124', credits: 1, category: 'Practical' },
        { code: 'CO1125', name: 'Statistics for Science and Technology', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1115' },
        { code: 'CO1115', name: 'Practical work on CO1125', credits: 1, category: 'Practical' },
        { code: 'CO1126', name: 'Management Information System', credits: 3, category: 'Management' },
        { code: 'GEP-I', name: 'General English Proficiency - I', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'CO1221', name: 'Systems Analysis & Design', credits: 3, category: 'Lecture' },
        { code: 'CO1222', name: 'Data Structures & Algorithms', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1212' },
        { code: 'CO1212', name: 'Practical work on CO1222', credits: 1, category: 'Practical' },
        { code: 'CO1223', name: 'Data Base Management Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1213' },
        { code: 'CO1213', name: 'Practical work on CO1223', credits: 1, category: 'Practical' },
        { code: 'CO1224', name: 'MultiMedia & HyperMedia Development', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO1214' },
        { code: 'CO1214', name: 'Practical work on CO1224', credits: 1, category: 'Practical' },
        { code: 'CO1225', name: 'Computer Architecture', credits: 3, category: 'Lecture' },
        { code: 'CO1226', name: 'Social Harmony', credits: 2, category: 'General' },
      ]
    },
    '2nd Year': {
      1: [
        { code: 'CO2121', name: 'Advanced Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'CO2122', name: 'Operating Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2112' },
        { code: 'CO2112', name: 'Practical work on CO2122', credits: 1, category: 'Practical' },
        { code: 'CO2123', name: 'Software Engineering', credits: 3, category: 'Lecture' },
        { code: 'CO2124', name: 'Internet and Web Design', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2114' },
        { code: 'CO2114', name: 'Practical work on CO2124', credits: 1, category: 'Practical' },
        { code: 'CO2125', name: 'Object Oriented Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2115' },
        { code: 'CO2115', name: 'Practical work on CO2125', credits: 1, category: 'Practical' },
        { code: 'CO2126', name: 'Sri Lankan Studies', credits: 2, category: 'General' },
        { code: 'GEP-III', name: 'General English Proficiency - III', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'CO2221', name: 'Data Communication Systems', credits: 3, category: 'Lecture' },
        { code: 'CO2222', name: 'Visual System Development Tools', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2212' },
        { code: 'CO2212', name: 'Practical work on CO2222', credits: 1, category: 'Practical' },
        { code: 'CO2223', name: 'Computer Graphics', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2213' },
        { code: 'CO2213', name: 'Practical work on CO2223', credits: 1, category: 'Practical' },
        { code: 'CO2224', name: 'Human Computer Interaction', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CO2214' },
        { code: 'CO2214', name: 'Practical work on CO2224', credits: 1, category: 'Practical' },
        { code: 'CO2225', name: 'Software Management Techniques', credits: 3, category: 'Management' },
        { code: 'CO2226', name: 'Automata Theory', credits: 3, category: 'Lecture' },
      ]
    },
    '3rd Year': {
      1: [
        { code: 'CS3121', name: 'Logic Programming & Expert Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3111' },
        { code: 'CS3111', name: 'Practical work on CS3121', credits: 1, category: 'Practical' },
        { code: 'CS3122', name: 'Advanced Database Management Systems', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3112' },
        { code: 'CS3112', name: 'Practical work on CS3122', credits: 1, category: 'Practical' },
        { code: 'CS3123', name: 'Systems & Network Administration', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3113' },
        { code: 'CS3113', name: 'Practical work on CS3123', credits: 1, category: 'Practical' },
        { code: 'CS3124', name: 'Data Security', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3114' },
        { code: 'CS3114', name: 'Practical work on CS3124', credits: 1, category: 'Practical' },
        { code: 'CS3135', name: 'Theory of Computing', credits: 3, category: 'Lecture' },
        { code: 'EC3101', name: 'Foundations of Management', credits: 3, category: 'Management' },
      ],
      2: [
        { code: 'CS3221', name: 'Assembly Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3211' },
        { code: 'CS3211', name: 'Practical work on CS3221', credits: 1, category: 'Practical' },
        { code: 'CS3222', name: 'Software Quality Assurance', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3212' },
        { code: 'CS3212', name: 'Practical work on CS3222', credits: 1, category: 'Practical' },
        { code: 'CS3233', name: 'Professional Issues in IT', credits: 3, category: 'Lecture' },
        { code: 'CS3224', name: 'Computer Networks', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS3214' },
        { code: 'CS3214', name: 'Practical work on CS3222', credits: 1, category: 'Practical' },
        { code: 'CS3235', name: 'Industrial Training/Project', credits: 6, category: 'Project' },
      ]
    },
    '4th Year': {
      1: [
        { code: 'CS4121', name: 'Advanced Computer Architecture', credits: 3, category: 'Lecture' },
        { code: 'CS4122', name: 'Machine Learning', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS4112' },
        { code: 'CS4112', name: 'Practical work on CS4122', credits: 1, category: 'Practical' },
        { code: 'CS4123', name: 'Distributed Systems', credits: 3, category: 'Lecture' },
        { code: 'CS4124', name: 'Research Methodology', credits: 3, category: 'Lecture' },
        { code: 'CS41P1', name: 'Research Project - Part I', credits: 3, category: 'Project' },
      ],
      2: [
        { code: 'CS4221', name: 'Advanced Networking', credits: 3, category: 'Lecture' },
        { code: 'CS4222', name: 'Cloud Computing', credits: 3, category: 'Lecture' },
        { code: 'CS4223', name: 'Ethical Hacking', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS4213' },
        { code: 'CS4213', name: 'Practical work on CS4223', credits: 1, category: 'Practical' },
        { code: 'CS42P2', name: 'Research Project - Part II', credits: 6, category: 'Project' },
      ]
    }
  },
  'Software Engineering': {
    '1st Year': {
      1: [
        { code: 'SE1101', name: 'Fundamentals of Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1101P' },
        { code: 'SE1101P', name: 'Programming Lab', credits: 1, category: 'Practical' },
        { code: 'SE1102', name: 'Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'SE1103', name: 'Digital Logic Design', credits: 3, category: 'Lecture' },
        { code: 'SE1104', name: 'Communication Skills', credits: 2, category: 'General' },
        { code: 'SE1105', name: 'Introduction to Software Engineering', credits: 3, category: 'Lecture' },
      ],
      2: [
        { code: 'SE1201', name: 'Object Oriented Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1201P' },
        { code: 'SE1201P', name: 'OOP Lab', credits: 1, category: 'Practical' },
        { code: 'SE1202', name: 'Data Structures', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1202P' },
        { code: 'SE1202P', name: 'Data Structures Lab', credits: 1, category: 'Practical' },
        { code: 'SE1203', name: 'Database Systems', credits: 3, category: 'Lecture' },
        { code: 'SE1204', name: 'Web Development Basics', credits: 3, category: 'Lecture' },
      ]
    },
    '2nd Year': {
      1: [
        { code: 'SE2101', name: 'Software Requirements Engineering', credits: 3, category: 'Lecture' },
        { code: 'SE2102', name: 'Algorithms Analysis', credits: 3, category: 'Lecture' },
        { code: 'SE2103', name: 'UI/UX Design', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE2103P' },
        { code: 'SE2103P', name: 'UI/UX Lab', credits: 1, category: 'Practical' },
        { code: 'SE2104', name: 'Professional Development', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'SE2201', name: 'Software Design and Architecture', credits: 3, category: 'Lecture' },
        { code: 'SE2202', name: 'Mobile App Development', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE2202P' },
        { code: 'SE2202P', name: 'Mobile Dev Lab', credits: 1, category: 'Practical' },
        { code: 'SE2203', name: 'Quality Assurance', credits: 3, category: 'Lecture' },
        { code: 'SE2204', name: 'Operating Systems', credits: 3, category: 'Lecture' },
      ]
    },
    '3rd Year': {
      1: [
        { code: 'SE3101', name: 'Software Project Management', credits: 3, category: 'Management' },
        { code: 'SE3102', name: 'Enterprise Architecture', credits: 3, category: 'Lecture' },
        { code: 'SE3103', name: 'Cloud Applications Development', credits: 3, category: 'Lecture' },
        { code: 'SE3104', name: 'Software Testing', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE3104P' },
        { code: 'SE3104P', name: 'Testing Lab', credits: 1, category: 'Practical' },
      ],
      2: [
        { code: 'SE3201', name: 'DevOps Practices', credits: 3, category: 'Lecture' },
        { code: 'SE3202', name: 'Advanced Web Development', credits: 3, category: 'Lecture' },
        { code: 'SE3203', name: 'Ethics in Computing', credits: 2, category: 'General' },
        { code: 'SE32P1', name: 'Group Project', credits: 4, category: 'Project' },
      ]
    },
    '4th Year': {
      1: [
        { code: 'SE4101', name: 'Software Evolution', credits: 3, category: 'Lecture' },
        { code: 'SE4102', name: 'IT Governance', credits: 3, category: 'Management' },
        { code: 'SE41P1', name: 'Capstone Project - Part I', credits: 4, category: 'Project' },
      ],
      2: [
        { code: 'SE4201', name: 'Software Entrepreneurship', credits: 3, category: 'Management' },
        { code: 'SE42P2', name: 'Capstone Project - Part II', credits: 6, category: 'Project' },
        { code: 'SE4202', name: 'Industrial Internship', credits: 4, category: 'Project' },
      ]
    }
  },
  'Information Technology': {
    '1st Year': {
      1: [
        { code: 'IT1101', name: 'Introduction to IT', credits: 3, category: 'Lecture' },
        { code: 'IT1102', name: 'Programming Fundamentals', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT1102P' },
        { code: 'IT1102P', name: 'Programming Lab', credits: 1, category: 'Practical' },
        { code: 'IT1103', name: 'Mathematics for IT', credits: 3, category: 'Lecture' },
        { code: 'IT1104', name: 'Digital Literacy', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'IT1201', name: 'Web Technologies', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT1201P' },
        { code: 'IT1201P', name: 'Web Lab', credits: 1, category: 'Practical' },
        { code: 'IT1202', name: 'Database Management', credits: 3, category: 'Lecture' },
        { code: 'IT1203', name: 'Computer Networks Basics', credits: 3, category: 'Lecture' },
      ]
    },
    '2nd Year': {
      1: [
        { code: 'IT2101', name: 'System Administration', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT2101P' },
        { code: 'IT2101P', name: 'SysAdmin Lab', credits: 1, category: 'Practical' },
        { code: 'IT2102', name: 'Information Security', credits: 3, category: 'Lecture' },
        { code: 'IT2103', name: 'Business Analysis', credits: 3, category: 'Management' },
      ],
      2: [
        { code: 'IT2201', name: 'Network Security', credits: 3, category: 'Lecture' },
        { code: 'IT2202', name: 'Cloud Infrastructure', credits: 3, category: 'Lecture' },
        { code: 'IT2203', name: 'IT Support Services', credits: 3, category: 'Lecture' },
      ]
    },
    '3rd Year': {
      1: [
        { code: 'IT3101', name: 'Enterprise Networks', credits: 3, category: 'Lecture' },
        { code: 'IT3102', name: 'Cyber Security', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT3102P' },
        { code: 'IT3102P', name: 'Security Lab', credits: 1, category: 'Practical' },
        { code: 'IT3103', name: 'IT Project Management', credits: 3, category: 'Management' },
      ],
      2: [
        { code: 'IT3201', name: 'Data Center Management', credits: 3, category: 'Lecture' },
        { code: 'IT3202', name: 'IT Service Management', credits: 3, category: 'Management' },
        { code: 'IT32P1', name: 'Industrial Placement', credits: 6, category: 'Project' },
      ]
    },
    '4th Year': {
      1: [
        { code: 'IT4101', name: 'Emerging Technologies', credits: 3, category: 'Lecture' },
        { code: 'IT4102', name: 'IT Strategy', credits: 3, category: 'Management' },
        { code: 'IT41P1', name: 'Final Year Project - Part I', credits: 4, category: 'Project' },
      ],
      2: [
        { code: 'IT4201', name: 'Digital Transformation', credits: 3, category: 'Lecture' },
        { code: 'IT42P2', name: 'Final Year Project - Part II', credits: 6, category: 'Project' },
      ]
    }
  }
};

const AdminSubjects = ({ sidebarOpen }) => {
  const [subjects, setSubjects] = useState([]);
  const [groupedSubjects, setGroupedSubjects] = useState({});
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [departments] = useState(['Computer Science', 'Software Engineering', 'Information Technology']);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedDepartmentView, setSelectedDepartmentView] = useState('Computer Science');
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showDepartmentViewModal, setShowDepartmentViewModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [seedOption, setSeedOption] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: '',
    year: '',
    semester: '',
    department: 'Computer Science',
    category: 'Lecture',
    hasPractical: false,
    practicalCode: '',
    lecturer: '',
    description: '',
  });

  const academicYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = [1, 2];
  const categories = ['Lecture', 'Practical', 'General', 'Management', 'Project'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [searchTerm, selectedYear, selectedSemester, selectedDepartment, selectedCategory, subjects]);

  // Update available subjects when year, semester, or department changes
  useEffect(() => {
    if (formData.year && formData.semester && formData.department) {
      const deptSubjects = subjectOptions[formData.department]?.[formData.year]?.[formData.semester] || [];
      setAvailableSubjects(deptSubjects);
      
      // Reset name and code when year/semester/department changes
      if (!formData.name && !formData.code) {
        // Only reset if they're empty (not when editing)
      }
    } else {
      setAvailableSubjects([]);
    }
  }, [formData.year, formData.semester, formData.department]);

  // Fetch subjects, lecturers, and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, lecturersRes, statsRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/users?role=lecturer'),
        api.get('/subjects/stats/by-year')
      ]);
      
      setSubjects(subjectsRes.data.subjects);
      setFilteredSubjects(subjectsRes.data.subjects);
      setLecturers(lecturersRes.data.users);
      setStats(statsRes.data.stats);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects by department for grouped view
  const fetchSubjectsByDepartment = async (department) => {
    try {
      const res = await api.get(`/subjects/department/${department}`);
      setGroupedSubjects(res.data.subjects);
      setSelectedDepartmentView(department);
      setShowDepartmentViewModal(true);
    } catch (error) {
      toast.error('Failed to fetch department subjects');
    }
  };

  // Filter subjects
  const filterSubjects = () => {
    let filtered = subjects;
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(s => s.year === selectedYear);
    }
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(s => s.semester === parseInt(selectedSemester));
    }
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(s => s.department === selectedDepartment);
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.department.toLowerCase().includes(term)
      );
    }
    setFilteredSubjects(filtered);
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // Handle subject selection from dropdown
  const handleSubjectSelect = (e) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;
    
    // Find the selected subject from available subjects
    const selected = availableSubjects.find(sub => sub.code === selectedCode);
    if (selected) {
      setFormData({
        ...formData,
        name: selected.name,
        code: selected.code,
        credits: selected.credits,
        category: selected.category,
        hasPractical: selected.hasPractical || false,
        practicalCode: selected.practicalCode || '',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      credits: '',
      year: '',
      semester: '',
      department: 'Computer Science',
      category: 'Lecture',
      hasPractical: false,
      practicalCode: '',
      lecturer: '',
      description: '',
    });
  };

  // Add subject
  const handleAddSubject = async e => {
    e.preventDefault();
    try {
      await api.post('/subjects', formData);
      toast.success('Subject added successfully');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Add failed');
    }
  };

  // Open edit modal
  const openEditModal = subject => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      year: subject.year,
      semester: subject.semester,
      department: subject.department,
      category: subject.category || 'Lecture',
      hasPractical: subject.hasPractical || false,
      practicalCode: subject.practicalCode || '',
      lecturer: subject.lecturer?._id || '',
      description: subject.description || ''
    });
    setShowEditModal(true);
  };

  // Edit subject
  const handleEditSubject = async e => {
    e.preventDefault();
    try {
      await api.put(`/subjects/${selectedSubject._id}`, formData);
      toast.success('Subject updated successfully');
      setShowEditModal(false);
      setSelectedSubject(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  // Delete subject
  const handleDeleteSubject = async id => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success('Subject deleted');
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
  };

  // Seed subjects for a department
  const handleSeedSubjects = async () => {
    try {
      const res = await api.post('/subjects/seed', { department: seedOption });
      toast.success(res.data.message);
      setShowSeedModal(false);
      fetchData();
    } catch (error) {
      toast.error('Seeding failed');
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return toast.error('Please select a CSV file');
    
    const formData = new FormData();
    formData.append('file', bulkFile);
    
    try {
      await api.post('/subjects/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Bulk upload successful');
      setShowBulkUploadModal(false);
      setBulkFile(null);
      fetchData();
    } catch (error) {
      toast.error('Bulk upload failed');
    }
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const csvContent = "name,code,credits,year,semester,department,category,hasPractical,practicalCode,description\n" +
      "Basic Mathematics,CO1121,3,1st Year,1,Computer Science,Lecture,false,,\n" +
      "Programming Lab,CO1112,1,1st Year,1,Computer Science,Practical,false,,\n" +
      "Data Structures,CO1222,3,1st Year,2,Computer Science,Lecture,true,CO1212,\n" +
      "Data Structures Lab,CO1212,1,1st Year,2,Computer Science,Practical,false,,";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subjects_template.csv");
    link.click();
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

  // Get color for category badge
  const getCategoryColor = (category) => {
    const colors = {
      'Lecture': 'bg-indigo-100 text-indigo-800',
      'Practical': 'bg-green-100 text-green-800',
      'General': 'bg-yellow-100 text-yellow-800',
      'Management': 'bg-purple-100 text-purple-800',
      'Project': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300" style={{ marginLeft: sidebarOpen ? 208 : 64 }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Subject Management</h1>
          <p className="text-blue-100 truncate mt-1">Manage subjects across 3 departments • 4 years • 8 semesters</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowStatsModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
          >
            <FiAward className="mr-2" /> Stats
          </button>
          <button
            onClick={() => setShowSeedModal(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center text-sm"
          >
            <FiUpload className="mr-2" /> Seed Data
          </button>
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm"
          >
            <FiDownload className="mr-2" /> Bulk Upload
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
          >
            <FiPlus className="mr-2" /> Add Subject
          </button>
          <button
            onClick={fetchData}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center text-sm"
            title="Refresh"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Department Quick View Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {departments.map(dept => {
          const deptSubjects = subjects.filter(s => s.department === dept);
          const totalCredits = deptSubjects.reduce((sum, s) => sum + s.credits, 0);
          
          return (
            <div 
              key={dept} 
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => fetchSubjectsByDepartment(dept)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{dept}</h3>
                <FiEye className="h-5 w-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Subjects</p>
                  <p className="text-2xl font-bold text-gray-800">{deptSubjects.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Credits</p>
                  <p className="text-2xl font-bold text-purple-600">{totalCredits}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {academicYears.map(year => {
                  const count = deptSubjects.filter(s => s.year === year).length;
                  return count > 0 ? (
                    <span key={year} className={`text-xs px-2 py-1 rounded-full ${getYearColor(year)}`}>
                      {year.charAt(0)}: {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects by name, code, or department..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <FiGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <FiLayers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedYear('all');
              setSelectedSemester('all');
              setSelectedDepartment('all');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubjects.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiBook className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        {s.hasPractical && (
                          <span className="text-xs text-green-600 flex items-center">
                            <FiCheckCircle className="mr-1 h-3 w-3" /> Has Practical
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {s.code}
                    </span>
                    {s.practicalCode && (
                      <span className="ml-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {s.practicalCode}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.credits}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getYearColor(s.year)}`}>
                      {s.year}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Semester {s.semester}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(s.category)}`}>
                      {s.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {s.lecturer ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.lecturer.name}</p>
                        <p className="text-xs text-gray-500">{s.lecturer.lecturerId}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(s)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit Subject"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(s._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Subject"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <FiBook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No subjects found</p>
            <button
              onClick={() => setShowSeedModal(true)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Seed Default Subjects
            </button>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Add New Subject"
        size="lg"
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>

            {/* Subject Selection Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select from Curriculum <span className="text-gray-500 text-xs">(Optional - Pre-fills subject details)</span>
              </label>
              <div className="relative">
                <select
                  onChange={handleSubjectSelect}
                  value={formData.code}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={!formData.year || !formData.semester}
                >
                  <option value="">
                    {!formData.year || !formData.semester 
                      ? 'Select year and semester first' 
                      : availableSubjects.length === 0 
                      ? 'No subjects available for this selection'
                      : '-- Choose a subject from curriculum --'}
                  </option>
                  {availableSubjects.map(sub => (
                    <option key={sub.code} value={sub.code}>
                      {sub.code} - {sub.name} ({sub.credits} credits)
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select a subject to automatically fill the details below
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Data Structures & Algorithms"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder="e.g., CO1222"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credits *</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                min="1"
                max="5"
                required
                placeholder="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Lecturer</label>
              <select
                name="lecturer"
                value={formData.lecturer}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Lecturer</option>
                {lecturers.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.name} ({l.lecturerId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Practical Work Section */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="hasPractical"
                checked={formData.hasPractical}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                This subject has practical work
              </label>
            </div>

            {formData.hasPractical && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Practical Code</label>
                  <input
                    type="text"
                    name="practicalCode"
                    value={formData.practicalCode}
                    onChange={handleInputChange}
                    placeholder="e.g., CO1212"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter subject description..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedSubject(null); resetForm(); }}
        title="Edit Subject"
        size="lg"
      >
        <form onSubmit={handleEditSubject} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credits *</label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleInputChange}
                min="1"
                max="5"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign Lecturer</label>
              <select
                name="lecturer"
                value={formData.lecturer}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Lecturer</option>
                {lecturers.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.name} ({l.lecturerId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Practical Work Section */}
          <div className="border-t pt-4">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                name="hasPractical"
                checked={formData.hasPractical}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                This subject has practical work
              </label>
            </div>

            {formData.hasPractical && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Practical Code</label>
                  <input
                    type="text"
                    name="practicalCode"
                    value={formData.practicalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => { setShowEditModal(false); setSelectedSubject(null); resetForm(); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Update Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Seed Data Modal */}
      <Modal
        isOpen={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        title="Seed Default Subjects"
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            This will populate the database with default subjects for all departments based on the curriculum.
            Duplicate subjects will be skipped.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
            <select
              value={seedOption}
              onChange={e => setSeedOption(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This action will create multiple subjects at once. Please ensure you want to proceed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowSeedModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSeedSubjects}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Seed Subjects
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={showBulkUploadModal}
        onClose={() => { setShowBulkUploadModal(false); setBulkFile(null); }}
        title="Bulk Upload Subjects"
        size="md"
      >
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={e => setBulkFile(e.target.files[0])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload CSV with columns: name, code, credits, year, semester, department, category, hasPractical, practicalCode, description
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <FiDownload className="mr-2" /> Download Template
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => { setShowBulkUploadModal(false); setBulkFile(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Upload
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Department View Modal */}
      <Modal
        isOpen={showDepartmentViewModal}
        onClose={() => setShowDepartmentViewModal(false)}
        title={`${selectedDepartmentView} Department - Subjects`}
        size="lg"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {academicYears.map(year => {
            const yearData = groupedSubjects[year];
            if (!yearData || (yearData.semester1?.length === 0 && yearData.semester2?.length === 0)) return null;

            return (
              <div key={year} className="mb-8">
                <h3 className={`text-lg font-semibold mb-4 p-2 rounded-lg ${getYearColor(year)}`}>
                  {year}
                </h3>

                {/* Semester 1 */}
                {yearData.semester1?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Semester 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {yearData.semester1.map(sub => (
                        <div key={sub._id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{sub.name}</p>
                              <p className="text-xs text-gray-500">{sub.code}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(sub.category)}`}>
                              {sub.category}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="text-gray-600">Credits: {sub.credits}</span>
                            {sub.lecturer ? (
                              <span className="text-xs text-gray-500">{sub.lecturer.name}</span>
                            ) : (
                              <span className="text-xs text-gray-400">No lecturer</span>
                            )}
                          </div>
                          {sub.hasPractical && (
                            <div className="mt-1 text-xs text-green-600 flex items-center">
                              <FiCheckCircle className="mr-1 h-3 w-3" />
                              Practical: {sub.practicalCode}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Semester 2 */}
                {yearData.semester2?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Semester 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {yearData.semester2.map(sub => (
                        <div key={sub._id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{sub.name}</p>
                              <p className="text-xs text-gray-500">{sub.code}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(sub.category)}`}>
                              {sub.category}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="text-gray-600">Credits: {sub.credits}</span>
                            {sub.lecturer ? (
                              <span className="text-xs text-gray-500">{sub.lecturer.name}</span>
                            ) : (
                              <span className="text-xs text-gray-400">No lecturer</span>
                            )}
                          </div>
                          {sub.hasPractical && (
                            <div className="mt-1 text-xs text-green-600 flex items-center">
                              <FiCheckCircle className="mr-1 h-3 w-3" />
                              Practical: {sub.practicalCode}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t pt-4 mt-4">
          <button
            onClick={() => setShowDepartmentViewModal(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Subject Statistics"
        size="lg"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            {academicYears.map(year => {
              const yearStats = stats?.[year] || { 
                totalSubjects: 0, 
                semester1: 0, 
                semester2: 0, 
                totalCredits: 0,
                byDepartment: {},
                byCategory: {}
              };
              
              return (
                <div key={year} className="border rounded-lg overflow-hidden">
                  <div className={`p-4 ${getYearColor(year)}`}>
                    <h3 className="text-lg font-semibold">{year}</h3>
                  </div>
                  <div className="p-4">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Total Subjects</p>
                        <p className="text-xl font-bold text-gray-800">{yearStats.totalSubjects}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Semester 1</p>
                        <p className="text-xl font-bold text-blue-600">{yearStats.semester1}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Semester 2</p>
                        <p className="text-xl font-bold text-green-600">{yearStats.semester2}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Total Credits</p>
                        <p className="text-xl font-bold text-purple-600">{yearStats.totalCredits}</p>
                      </div>
                    </div>

                    {/* Department Breakdown */}
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">By Department</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.entries(yearStats.byDepartment).map(([dept, deptStats]) => (
                          <div key={dept} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-sm">{dept}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Total:</span>
                                <span className="font-semibold">{deptStats.total}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Sem 1:</span>
                                <span className="font-semibold text-blue-600">{deptStats.semester1}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Sem 2:</span>
                                <span className="font-semibold text-green-600">{deptStats.semester2}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(yearStats.byCategory).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">By Category</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(yearStats.byCategory).map(([cat, count]) => (
                            <span key={cat} className={`px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(cat)}`}>
                              {cat}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Bars */}
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Semester 1 Coverage</span>
                          <span>{((yearStats.semester1 / (yearStats.totalSubjects || 1)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(yearStats.semester1 / (yearStats.totalSubjects || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Semester 2 Coverage</span>
                          <span>{((yearStats.semester2 / (yearStats.totalSubjects || 1)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(yearStats.semester2 / (yearStats.totalSubjects || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t pt-4 mt-4">
          <button
            onClick={() => setShowStatsModal(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSubjects;