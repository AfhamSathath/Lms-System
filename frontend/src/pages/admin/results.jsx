import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import { 
  FiAward, FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiDownload, FiFilter,
  FiBarChart2, FiPrinter, FiDownload as FiDownloadIcon, FiTrendingUp,
  FiPieChart, FiStar, FiClock, FiCheckCircle, FiXCircle, FiUsers,
  FiBookmark, FiGrid, FiLayers, FiCalendar, FiClock as FiTimeIcon,
  FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const gradePoints = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'E': 0.7,
  'F': 0.0
};

// Subject data for auto-fill based on curriculum
const subjectOptions = {
  'Computer Science': {
    '1st Year': {
      1: [
        { code: 'CO1121', name: 'Basic Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'CO1122', name: 'Basic Computer Programming', credits: 3, category: 'Lecture' },
        { code: 'CO1112', name: 'Practical work on CO1122', credits: 1, category: 'Practical' },
        { code: 'CO1123', name: 'Formal Methods for Problem Solving', credits: 3, category: 'Lecture' },
        { code: 'CO1124', name: 'Computer Systems & PC Applications', credits: 3, category: 'Lecture' },
        { code: 'CO1114', name: 'Practical work on CO1124', credits: 1, category: 'Practical' },
        { code: 'CO1125', name: 'Statistics for Science and Technology', credits: 3, category: 'Lecture' },
        { code: 'CO1115', name: 'Practical work on CO1125', credits: 1, category: 'Practical' },
        { code: 'CO1126', name: 'Management Information System', credits: 3, category: 'Management' },
        { code: 'GEP-I', name: 'General English Proficiency - I', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'CO1221', name: 'Systems Analysis & Design', credits: 3, category: 'Lecture' },
        { code: 'CO1222', name: 'Data Structures & Algorithms', credits: 3, category: 'Lecture' },
        { code: 'CO1212', name: 'Practical work on CO1222', credits: 1, category: 'Practical' },
        { code: 'CO1223', name: 'Data Base Management Systems', credits: 3, category: 'Lecture' },
        { code: 'CO1213', name: 'Practical work on CO1223', credits: 1, category: 'Practical' },
        { code: 'CO1224', name: 'MultiMedia & HyperMedia Development', credits: 3, category: 'Lecture' },
        { code: 'CO1214', name: 'Practical work on CO1224', credits: 1, category: 'Practical' },
        { code: 'CO1225', name: 'Computer Architecture', credits: 3, category: 'Lecture' },
        { code: 'CO1226', name: 'Social Harmony', credits: 2, category: 'General' },
      ]
    },
    '2nd Year': {
      1: [
        { code: 'CO2121', name: 'Advanced Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'CO2122', name: 'Operating Systems', credits: 3, category: 'Lecture' },
        { code: 'CO2112', name: 'Practical work on CO2122', credits: 1, category: 'Practical' },
        { code: 'CO2123', name: 'Software Engineering', credits: 3, category: 'Lecture' },
        { code: 'CO2124', name: 'Internet and Web Design', credits: 3, category: 'Lecture' },
        { code: 'CO2114', name: 'Practical work on CO2124', credits: 1, category: 'Practical' },
        { code: 'CO2125', name: 'Object Oriented Programming', credits: 3, category: 'Lecture' },
        { code: 'CO2115', name: 'Practical work on CO2125', credits: 1, category: 'Practical' },
        { code: 'CO2126', name: 'Sri Lankan Studies', credits: 2, category: 'General' },
        { code: 'GEP-III', name: 'General English Proficiency - III', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'CO2221', name: 'Data Communication Systems', credits: 3, category: 'Lecture' },
        { code: 'CO2222', name: 'Visual System Development Tools', credits: 3, category: 'Lecture' },
        { code: 'CO2212', name: 'Practical work on CO2222', credits: 1, category: 'Practical' },
        { code: 'CO2223', name: 'Computer Graphics', credits: 3, category: 'Lecture' },
        { code: 'CO2213', name: 'Practical work on CO2223', credits: 1, category: 'Practical' },
        { code: 'CO2224', name: 'Human Computer Interaction', credits: 3, category: 'Lecture' },
        { code: 'CO2214', name: 'Practical work on CO2224', credits: 1, category: 'Practical' },
        { code: 'CO2225', name: 'Software Management Techniques', credits: 3, category: 'Management' },
        { code: 'CO2226', name: 'Automata Theory', credits: 3, category: 'Lecture' },
      ]
    },
    '3rd Year': {
      1: [
        { code: 'CS3121', name: 'Logic Programming & Expert Systems', credits: 3, category: 'Lecture' },
        { code: 'CS3111', name: 'Practical work on CS3121', credits: 1, category: 'Practical' },
        { code: 'CS3122', name: 'Advanced Database Management Systems', credits: 3, category: 'Lecture' },
        { code: 'CS3112', name: 'Practical work on CS3122', credits: 1, category: 'Practical' },
        { code: 'CS3123', name: 'Systems & Network Administration', credits: 3, category: 'Lecture' },
        { code: 'CS3113', name: 'Practical work on CS3123', credits: 1, category: 'Practical' },
        { code: 'CS3124', name: 'Data Security', credits: 3, category: 'Lecture' },
        { code: 'CS3114', name: 'Practical work on CS3124', credits: 1, category: 'Practical' },
        { code: 'CS3135', name: 'Theory of Computing', credits: 3, category: 'Lecture' },
        { code: 'EC3101', name: 'Foundations of Management', credits: 3, category: 'Management' },
      ],
      2: [
        { code: 'CS3221', name: 'Assembly Programming', credits: 3, category: 'Lecture' },
        { code: 'CS3211', name: 'Practical work on CS3221', credits: 1, category: 'Practical' },
        { code: 'CS3222', name: 'Software Quality Assurance', credits: 3, category: 'Lecture' },
        { code: 'CS3212', name: 'Practical work on CS3222', credits: 1, category: 'Practical' },
        { code: 'CS3233', name: 'Professional Issues in IT', credits: 3, category: 'Lecture' },
        { code: 'CS3224', name: 'Computer Networks', credits: 3, category: 'Lecture' },
        { code: 'CS3214', name: 'Practical work on CS3222', credits: 1, category: 'Practical' },
        { code: 'CS3235', name: 'Industrial Training/Project', credits: 6, category: 'Project' },
      ]
    },
    '4th Year': {
      1: [
        { code: 'CS4121', name: 'Advanced Computer Architecture', credits: 3, category: 'Lecture' },
        { code: 'CS4122', name: 'Machine Learning', credits: 3, category: 'Lecture' },
        { code: 'CS4112', name: 'Practical work on CS4122', credits: 1, category: 'Practical' },
        { code: 'CS4123', name: 'Distributed Systems', credits: 3, category: 'Lecture' },
        { code: 'CS4124', name: 'Research Methodology', credits: 3, category: 'Lecture' },
        { code: 'CS41P1', name: 'Research Project - Part I', credits: 3, category: 'Project' },
      ],
      2: [
        { code: 'CS4221', name: 'Advanced Networking', credits: 3, category: 'Lecture' },
        { code: 'CS4222', name: 'Cloud Computing', credits: 3, category: 'Lecture' },
        { code: 'CS4223', name: 'Ethical Hacking', credits: 3, category: 'Lecture' },
        { code: 'CS4213', name: 'Practical work on CS4223', credits: 1, category: 'Practical' },
        { code: 'CS42P2', name: 'Research Project - Part II', credits: 6, category: 'Project' },
      ]
    }
  },
  'Software Engineering': {
    '1st Year': {
      1: [
        { code: 'SE1101', name: 'Fundamentals of Programming', credits: 3, category: 'Lecture' },
        { code: 'SE1101P', name: 'Programming Lab', credits: 1, category: 'Practical' },
        { code: 'SE1102', name: 'Mathematics for Computing', credits: 3, category: 'Lecture' },
        { code: 'SE1103', name: 'Digital Logic Design', credits: 3, category: 'Lecture' },
        { code: 'SE1104', name: 'Communication Skills', credits: 2, category: 'General' },
        { code: 'SE1105', name: 'Introduction to Software Engineering', credits: 3, category: 'Lecture' },
      ],
      2: [
        { code: 'SE1201', name: 'Object Oriented Programming', credits: 3, category: 'Lecture' },
        { code: 'SE1201P', name: 'OOP Lab', credits: 1, category: 'Practical' },
        { code: 'SE1202', name: 'Data Structures', credits: 3, category: 'Lecture' },
        { code: 'SE1202P', name: 'Data Structures Lab', credits: 1, category: 'Practical' },
        { code: 'SE1203', name: 'Database Systems', credits: 3, category: 'Lecture' },
        { code: 'SE1204', name: 'Web Development Basics', credits: 3, category: 'Lecture' },
      ]
    }
  },
  'Information Technology': {
    '1st Year': {
      1: [
        { code: 'IT1101', name: 'Introduction to IT', credits: 3, category: 'Lecture' },
        { code: 'IT1102', name: 'Programming Fundamentals', credits: 3, category: 'Lecture' },
        { code: 'IT1102P', name: 'Programming Lab', credits: 1, category: 'Practical' },
        { code: 'IT1103', name: 'Mathematics for IT', credits: 3, category: 'Lecture' },
        { code: 'IT1104', name: 'Digital Literacy', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'IT1201', name: 'Web Technologies', credits: 3, category: 'Lecture' },
        { code: 'IT1201P', name: 'Web Lab', credits: 1, category: 'Practical' },
        { code: 'IT1202', name: 'Database Management', credits: 3, category: 'Lecture' },
        { code: 'IT1203', name: 'Computer Networks Basics', credits: 3, category: 'Lecture' },
      ]
    }
  }
};

const AdminResults = ({ sidebarOpen }) => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showSemesterGPAModal, setShowSemesterGPAModal] = useState(false);
  const [showStudentAnalysisModal, setShowStudentAnalysisModal] = useState(false);
  const [showDepartmentStatsModal, setShowDepartmentStatsModal] = useState(false);
  const [showYearlyStatsModal, setShowYearlyStatsModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [gpaData, setGpaData] = useState(null);
  const [semesterGPA, setSemesterGPA] = useState([]);
  const [studentAnalysis, setStudentAnalysis] = useState(null);
  const [departmentStats, setDepartmentStats] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [formData, setFormData] = useState({
    student: '', subject: '', year: '', semester: '', examType: 'final', marks: ''
  });

  // Academic years - 4 years with 2 semesters each
  const academicYears = [
    '1st Year', '2nd Year', '3rd Year', '4th Year'
  ];
  
  const semesters = [1, 2];
  const examTypes = ['midterm', 'final', 'quiz', 'assignment', 'supplementary'];

  // Helper function to get semester display name
  const getSemesterDisplay = (year, semester) => {
    if (!year || !semester) return 'N/A';
    return `${year} - Semester ${semester}`;
  };

  // Helper function to parse year and semester from result
  const parseYearSemester = (result) => {
    return {
      year: result.year || 'N/A',
      semester: result.semester || 'N/A'
    };
  };

  // Helper function to get year number from year string
  const getYearNumber = (yearString) => {
    const match = yearString?.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { filterResults(); }, [searchTerm, selectedYear, selectedSemester, selectedExamType, selectedDepartment, results]);

  const fetchData = async () => {
    try {
      const [resultsRes, studentsRes, subjectsRes] = await Promise.all([
        api.get('/results'), 
        api.get('/users?role=student'), 
        api.get('/subjects')
      ]);
      
      // Ensure results have proper structure
      const processedResults = (resultsRes.data.results || []).map(result => ({
        ...result,
        year: result.year || 'N/A',
        semester: result.semester || 1,
        marks: result.marks || 0
      }));
      
      setResults(processedResults);
      setFilteredResults(processedResults);
      setStudents(studentsRes.data.users || []);
      setSubjects(subjectsRes.data.subjects || []);

      // Extract unique departments from students
      const uniqueDepts = [...new Set((studentsRes.data.users || []).map(s => s.department || 'Unknown').filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally { 
      setLoading(false); 
    }
  };

  const filterResults = () => {
    let filtered = results || [];
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(r => r.year === selectedYear);
    }
    
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(r => r.semester === parseInt(selectedSemester));
    }
    
    if (selectedExamType !== 'all') {
      filtered = filtered.filter(r => r.examType === selectedExamType);
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(r => r.student?.department === selectedDepartment);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.student?.name?.toLowerCase().includes(term) ||
        r.student?.studentId?.toLowerCase().includes(term) ||
        r.student?.department?.toLowerCase().includes(term) ||
        r.subject?.name?.toLowerCase().includes(term) ||
        r.subject?.code?.toLowerCase().includes(term) ||
        r.year?.toLowerCase().includes(term)
      );
    }
    
    setFilteredResults(filtered);
  };

  // Update available subjects when year, semester, or student changes
  useEffect(() => {
    if (formData.year && formData.semester && formData.student) {
      // Find the selected student's department
      const selectedStudentObj = students.find(s => s._id === formData.student);
      if (selectedStudentObj?.department) {
        const deptSubjects = subjectOptions[selectedStudentObj.department]?.[formData.year]?.[formData.semester] || [];
        setAvailableSubjects(deptSubjects);
      } else {
        setAvailableSubjects([]);
      }
    } else {
      setAvailableSubjects([]);
    }
  }, [formData.year, formData.semester, formData.student, students]);

  // Handle subject selection from dropdown
  const handleSubjectSelect = (e) => {
    const selectedSubjectId = e.target.value;
    if (!selectedSubjectId) return;
    
    // Find the selected subject from available subjects
    const selected = availableSubjects.find(sub => sub._id === selectedSubjectId);
    if (selected) {
      setFormData({
        ...formData,
        subject: selected._id,
      });
    }
  };

  // Handle subject selection from curriculum dropdown
  const handleCurriculumSubjectSelect = (e) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;
    
    // Find the selected subject from available subjects
    const selected = availableSubjects.find(sub => sub.code === selectedCode);
    if (selected) {
      // Find the corresponding subject in the subjects list from API
      const subjectFromAPI = subjects.find(s => s.code === selected.code);
      if (subjectFromAPI) {
        setFormData({
          ...formData,
          subject: subjectFromAPI._id,
        });
        toast.success(`Selected: ${selected.name}`);
      } else {
        toast.error('This subject is not available in the system. Please add it first.');
      }
    }
  };

  const resetForm = () => setFormData({ 
    student: '', subject: '', year: '', semester: '', examType: 'final', marks: '' 
  });

  const openEditModal = (result) => {
    setSelectedResult(result);
    setFormData({
      student: result.student?._id || '',
      subject: result.subject?._id || '',
      year: result.year || '',
      semester: result.semester || '',
      examType: result.examType || 'final',
      marks: result.marks || ''
    });
    setShowEditModal(true);
  };

  const calculateGradeStatus = (marks) => {
    const numMarks = parseFloat(marks) || 0;
    let grade;
    
    if (numMarks >= 90) grade = 'A+';
    else if (numMarks >= 85) grade = 'A';
    else if (numMarks >= 80) grade = 'A-';
    else if (numMarks >= 75) grade = 'B+';
    else if (numMarks >= 70) grade = 'B';
    else if (numMarks >= 65) grade = 'B-';
    else if (numMarks >= 60) grade = 'C+';
    else if (numMarks >= 55) grade = 'C';
    else if (numMarks >= 50) grade = 'C-';
    else if (numMarks >= 45) grade = 'D+';
    else if (numMarks >= 40) grade = 'D';
    else grade = 'F';

    const failGrades = ['D+', 'D', 'F'];
    const status = failGrades.includes(grade) ? 'fail' : 'pass';

    return { grade, status };
  };

  // GPA Calculation Functions
  const calculateGPA = (studentId, year = null, semester = null) => {
    let studentResults = results.filter(r => r.student?._id === studentId);
    
    if (year && year !== 'N/A') {
      studentResults = studentResults.filter(r => r.year === year);
    }
    if (semester) {
      studentResults = studentResults.filter(r => r.semester === parseInt(semester));
    }
    
    if (studentResults.length === 0) return 0;

    const totalPoints = studentResults.reduce((sum, r) => {
      const { grade } = calculateGradeStatus(r.marks);
      return sum + (gradePoints[grade] || 0);
    }, 0);

    return (totalPoints / studentResults.length).toFixed(2);
  };

  const calculateCGPA = (studentId) => {
    const studentResults = results.filter(r => r.student?._id === studentId);
    if (studentResults.length === 0) return 0;

    const totalPoints = studentResults.reduce((sum, r) => {
      const { grade } = calculateGradeStatus(r.marks);
      return sum + (gradePoints[grade] || 0);
    }, 0);

    return (totalPoints / studentResults.length).toFixed(2);
  };

  const calculateYearlyGPA = (studentId) => {
    const yearlyGPAs = [];
    const studentResults = results.filter(r => r.student?._id === studentId);
    
    // Group by academic year
    const yearGroups = {};
    studentResults.forEach(r => {
      if (!yearGroups[r.year]) {
        yearGroups[r.year] = [];
      }
      yearGroups[r.year].push(r);
    });

    for (const [year, yearResults] of Object.entries(yearGroups)) {
      // Group by semester within year
      const semesterGPAs = [];
      for (let sem = 1; sem <= 2; sem++) {
        const semResults = yearResults.filter(r => r.semester === sem);
        if (semResults.length > 0) {
          const totalPoints = semResults.reduce((sum, r) => {
            const { grade } = calculateGradeStatus(r.marks);
            return sum + (gradePoints[grade] || 0);
          }, 0);
          const gpa = (totalPoints / semResults.length).toFixed(2);
          semesterGPAs.push({ semester: sem, gpa: parseFloat(gpa), subjects: semResults.length });
        }
      }

      // Calculate year GPA (average of semester GPAs)
      const yearGPA = semesterGPAs.length > 0 
        ? (semesterGPAs.reduce((sum, sem) => sum + sem.gpa, 0) / semesterGPAs.length).toFixed(2)
        : '0.00';

      yearlyGPAs.push({
        year,
        yearGPA: parseFloat(yearGPA),
        semesters: semesterGPAs,
        totalSubjects: yearResults.length
      });
    }

    // Sort by year order
    return yearlyGPAs.sort((a, b) => {
      const yearA = getYearNumber(a.year);
      const yearB = getYearNumber(b.year);
      return yearA - yearB;
    });
  };

  const calculateSemesterGPA = (studentId) => {
    const semesterGPAs = [];
    const studentResults = results.filter(r => r.student?._id === studentId);
    
    // Group by year and semester
    const yearSemGroups = {};
    studentResults.forEach(r => {
      const key = `${r.year}-S${r.semester}`;
      if (!yearSemGroups[key]) {
        yearSemGroups[key] = {
          year: r.year,
          semester: r.semester,
          results: []
        };
      }
      yearSemGroups[key].results.push(r);
    });

    Object.values(yearSemGroups).forEach(group => {
      const totalPoints = group.results.reduce((sum, r) => {
        const { grade } = calculateGradeStatus(r.marks);
        return sum + (gradePoints[grade] || 0);
      }, 0);
      const gpa = (totalPoints / group.results.length).toFixed(2);
      semesterGPAs.push({
        year: group.year,
        semester: group.semester,
        gpa: parseFloat(gpa),
        credits: group.results.length,
        displayName: `${group.year} - Sem ${group.semester}`
      });
    });

    // Sort by year and semester
    return semesterGPAs.sort((a, b) => {
      const yearA = getYearNumber(a.year);
      const yearB = getYearNumber(b.year);
      if (yearA === yearB) return a.semester - b.semester;
      return yearA - yearB;
    });
  };

  const calculateGPAPercentage = (gpa) => {
    return ((gpa || 0) / 4.0) * 100;
  };

  // Department Statistics Functions
  const calculateDepartmentStats = () => {
    const stats = {};
    
    departments.forEach(dept => {
      const deptStudents = students.filter(s => s.department === dept);
      const deptResults = results.filter(r => deptStudents.some(s => s._id === r.student?._id));
      
      if (deptStudents.length > 0) {
        // Calculate department averages
        const avgCGPA = deptStudents.reduce((sum, s) => sum + parseFloat(calculateCGPA(s._id) || 0), 0) / deptStudents.length;
        
        // Pass rate
        const passedResults = deptResults.filter(r => calculateGradeStatus(r.marks).status === 'pass').length;
        const passRate = deptResults.length > 0 ? (passedResults / deptResults.length) * 100 : 0;
        
        // Grade distribution
        const gradeDist = {};
        deptResults.forEach(r => {
          const { grade } = calculateGradeStatus(r.marks);
          gradeDist[grade] = (gradeDist[grade] || 0) + 1;
        });

        // Top performers
        const topPerformers = deptStudents
          .map(s => ({
            name: s.name,
            studentId: s.studentId,
            cgpa: parseFloat(calculateCGPA(s._id))
          }))
          .filter(s => s.cgpa > 0)
          .sort((a, b) => b.cgpa - a.cgpa)
          .slice(0, 5);

        // Year wise performance
        const yearPerformance = {};
        academicYears.forEach(year => {
          const yearResults = deptResults.filter(r => r.year === year);
          if (yearResults.length > 0) {
            const avgMarks = yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length;
            yearPerformance[year] = avgMarks.toFixed(2);
          }
        });

        stats[dept] = {
          studentCount: deptStudents.length,
          resultCount: deptResults.length,
          avgCGPA: avgCGPA.toFixed(2),
          passRate: passRate.toFixed(2),
          gradeDistribution: gradeDist,
          topPerformers: topPerformers,
          yearPerformance: yearPerformance
        };
      }
    });

    return stats;
  };

  // Yearly Statistics Functions
  const calculateYearlyStats = () => {
    const stats = {};
    
    academicYears.forEach(year => {
      const yearResults = results.filter(r => r.year === year);
      const yearStudents = [...new Set(yearResults.map(r => r.student?._id))];
      
      if (yearResults.length > 0) {
        // Calculate semester-wise stats
        const semesterStats = {};
        for (let sem = 1; sem <= 2; sem++) {
          const semResults = yearResults.filter(r => r.semester === sem);
          if (semResults.length > 0) {
            const avgMarks = semResults.reduce((sum, r) => sum + r.marks, 0) / semResults.length;
            const passedCount = semResults.filter(r => calculateGradeStatus(r.marks).status === 'pass').length;
            semesterStats[sem] = {
              resultCount: semResults.length,
              avgMarks: avgMarks.toFixed(2),
              passRate: ((passedCount / semResults.length) * 100).toFixed(2)
            };
          }
        }

        // Department performance for the year
        const deptPerformance = {};
        departments.forEach(dept => {
          const deptYearResults = yearResults.filter(r => 
            students.some(s => s._id === r.student?._id && s.department === dept)
          );
          if (deptYearResults.length > 0) {
            const avgMarks = deptYearResults.reduce((sum, r) => sum + r.marks, 0) / deptYearResults.length;
            deptPerformance[dept] = avgMarks.toFixed(2);
          }
        });

        stats[year] = {
          totalResults: yearResults.length,
          totalStudents: yearStudents.length,
          semesterStats,
          deptPerformance,
          overallAvgMarks: (yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length).toFixed(2),
          passRate: ((yearResults.filter(r => calculateGradeStatus(r.marks).status === 'pass').length / yearResults.length) * 100).toFixed(2)
        };
      }
    });

    return stats;
  };

  // Student Analysis Functions
  const analyzeStudentPerformance = (studentId) => {
    const studentResults = results.filter(r => r.student?._id === studentId);
    const student = students.find(s => s._id === studentId);
    
    if (studentResults.length === 0) return null;

    // Calculate overall statistics
    const totalSubjects = studentResults.length;
    const passedSubjects = studentResults.filter(r => calculateGradeStatus(r.marks).status === 'pass').length;
    const failedSubjects = totalSubjects - passedSubjects;
    const passPercentage = (passedSubjects / totalSubjects) * 100;

    // Grade distribution
    const gradeDistribution = {};
    studentResults.forEach(r => {
      const { grade } = calculateGradeStatus(r.marks);
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // Subject-wise performance
    const subjectPerformance = {};
    studentResults.forEach(r => {
      if (!subjectPerformance[r.subject?.name]) {
        subjectPerformance[r.subject?.name] = {
          total: 0,
          count: 0,
          best: 0,
          worst: 100
        };
      }
      subjectPerformance[r.subject?.name].total += r.marks;
      subjectPerformance[r.subject?.name].count += 1;
      subjectPerformance[r.subject?.name].best = Math.max(subjectPerformance[r.subject?.name].best, r.marks);
      subjectPerformance[r.subject?.name].worst = Math.min(subjectPerformance[r.subject?.name].worst, r.marks);
    });

    // Calculate averages
    Object.keys(subjectPerformance).forEach(subject => {
      subjectPerformance[subject].average = (subjectPerformance[subject].total / subjectPerformance[subject].count).toFixed(2);
    });

    // Year-Semester trends
    const yearSemesterTrends = [];
    academicYears.forEach(year => {
      for (let sem = 1; sem <= 2; sem++) {
        const semResults = studentResults.filter(r => r.year === year && r.semester === sem);
        if (semResults.length > 0) {
          const avgMarks = semResults.reduce((sum, r) => sum + r.marks, 0) / semResults.length;
          yearSemesterTrends.push({
            year,
            semester: sem,
            displayName: `${year} - Sem ${sem}`,
            averageMarks: avgMarks.toFixed(2),
            subjectsCount: semResults.length
          });
        }
      }
    });

    // Best and worst performing subjects
    const bestSubject = Object.entries(subjectPerformance)
      .sort((a, b) => b[1].average - a[1].average)[0];
    const worstSubject = Object.entries(subjectPerformance)
      .sort((a, b) => a[1].average - b[1].average)[0];

    // Exam type performance
    const examTypePerformance = {};
    studentResults.forEach(r => {
      if (!examTypePerformance[r.examType]) {
        examTypePerformance[r.examType] = {
          total: 0,
          count: 0
        };
      }
      examTypePerformance[r.examType].total += r.marks;
      examTypePerformance[r.examType].count += 1;
    });

    Object.keys(examTypePerformance).forEach(type => {
      examTypePerformance[type].average = (examTypePerformance[type].total / examTypePerformance[type].count).toFixed(2);
    });

    // Calculate improvement trend
    let improvementTrend = 'stable';
    if (yearSemesterTrends.length >= 2) {
      const firstAvg = parseFloat(yearSemesterTrends[0].averageMarks);
      const lastAvg = parseFloat(yearSemesterTrends[yearSemesterTrends.length - 1].averageMarks);
      if (lastAvg > firstAvg + 5) improvementTrend = 'improving';
      else if (lastAvg < firstAvg - 5) improvementTrend = 'declining';
    }

    // Calculate CGPA
    const cgpa = calculateCGPA(studentId);

    return {
      student: {
        name: student?.name,
        studentId: student?.studentId,
        department: student?.department
      },
      overall: {
        totalSubjects,
        passedSubjects,
        failedSubjects,
        passPercentage: passPercentage.toFixed(2),
        cgpa,
        improvementTrend
      },
      gradeDistribution,
      subjectPerformance,
      yearSemesterTrends,
      bestSubject: bestSubject ? { name: bestSubject[0], ...bestSubject[1] } : null,
      worstSubject: worstSubject ? { name: worstSubject[0], ...worstSubject[1] } : null,
      examTypePerformance
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    try {
      await api.post('/results', formData);
      toast.success('Result added successfully');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to add result');
    }
  };

  const handleEditResult = async (e) => {
    e.preventDefault();
    if (!selectedResult) return;
    try {
      await api.put(`/results/${selectedResult._id}`, formData);
      toast.success('Result updated successfully');
      setShowEditModal(false);
      setSelectedResult(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to update result');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try {
      await api.delete(`/results/${id}`);
      toast.success('Result deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return toast.error('Please select a CSV file');
    const data = new FormData();
    data.append('file', bulkFile);
    try {
      await api.post('/results/bulk-upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Bulk upload successful');
      setShowBulkUploadModal(false);
      setBulkFile(null);
      fetchData();
    } catch (error) {
      toast.error('Bulk upload failed');
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "StudentID,SubjectCode,Year,Semester,ExamType,Marks\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "results_template.csv");
    link.click();
  };

  const handleViewTranscript = (student) => {
    setSelectedStudent(student);
    const cgpa = calculateCGPA(student._id);
    const semesterGPAs = calculateSemesterGPA(student._id);
    setGpaData({ cgpa, semesterGPAs });
    setShowTranscriptModal(true);
  };

  const handleViewSemesterGPA = (student) => {
    setSelectedStudent(student);
    const semesterGPAs = calculateSemesterGPA(student._id);
    setSemesterGPA(semesterGPAs);
    setShowSemesterGPAModal(true);
  };

  const handleViewStudentAnalysis = (student) => {
    setSelectedStudent(student);
    const analysis = analyzeStudentPerformance(student._id);
    setStudentAnalysis(analysis);
    setShowStudentAnalysisModal(true);
  };

  const handleViewDepartmentStats = () => {
    const stats = calculateDepartmentStats();
    setDepartmentStats(stats);
    setShowDepartmentStatsModal(true);
  };

  const handleViewYearlyStats = () => {
    const stats = calculateYearlyStats();
    setYearlyStats(stats);
    setShowYearlyStatsModal(true);
  };

  const handlePrintTranscript = () => {
    const printContent = document.getElementById('transcript-content');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore React functionality
  };

  const handleDownloadTranscript = () => {
    const transcript = document.getElementById('transcript-content');
    const htmlContent = transcript.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript_${selectedStudent?.studentId || 'student'}.html`;
    link.click();
  };

  const getGradeColor = (grade) => {
    const colors = { 
      'A+':'bg-green-100 text-green-800',
      'A':'bg-green-100 text-green-800',
      'A-':'bg-green-100 text-green-800',
      'B+':'bg-blue-100 text-blue-800',
      'B':'bg-blue-100 text-blue-800',
      'B-':'bg-blue-100 text-blue-800',
      'C+':'bg-yellow-100 text-yellow-800',
      'C':'bg-yellow-100 text-yellow-800',
      'C-':'bg-orange-100 text-orange-800',
      'D+':'bg-orange-100 text-orange-800',
      'D':'bg-red-100 text-red-800',
      'E':'bg-red-100 text-red-800',
      'F':'bg-red-100 text-red-800'
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentColor = (department) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-yellow-100 text-yellow-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800'
    ];
    const index = (department?.length || 0) % colors.length;
    return colors[index];
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="container mx-auto px-4 py-8 transition-all duration-300" style={{ marginLeft: sidebarOpen ? 208 : 64 }}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">Result Management</h1>
          <p className="text-purple-100 truncate mt-1">Manage student results and grades across 4 years (8 semesters)</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleViewYearlyStats}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <FiCalendar className="mr-2" /> Yearly Stats
          </button>
          <button
            onClick={handleViewDepartmentStats}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <FiLayers className="mr-2" /> Department Stats
          </button>
          <button
            onClick={() => setShowBulkUploadModal(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FiDownload className="mr-2" /> Bulk Upload
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <FiPlus className="mr-2" /> Add Result
          </button>
        </div>
      </div>

      {/* Yearly Stats Cards - 4 Years */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {academicYears.map(year => {
          const yearResults = results.filter(r => r.year === year);
          const avgMarks = yearResults.length > 0 
            ? (yearResults.reduce((sum, r) => sum + r.marks, 0) / yearResults.length).toFixed(2)
            : '0.00';
          
          // Calculate semester breakdown
          const sem1Results = yearResults.filter(r => r.semester === 1).length;
          const sem2Results = yearResults.filter(r => r.semester === 2).length;
          
          return (
            <div key={year} className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{year}</span>
                <FiCalendar className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold text-purple-600">{avgMarks}%</p>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Sem1: {sem1Results}</span>
                <span>Sem2: {sem2Results}</span>
              </div>
              <p className="text-xs text-gray-500">Total: {yearResults.length} results</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-purple-600 h-1.5 rounded-full"
                  style={{ width: `${parseFloat(avgMarks)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {departments.slice(0, 4).map(dept => {
          const deptStudents = students.filter(s => s.department === dept);
          const deptResults = results.filter(r => deptStudents.some(s => s._id === r.student?._id));
          const avgCGPA = deptStudents.length > 0 
            ? (deptStudents.reduce((sum, s) => sum + parseFloat(calculateCGPA(s._id) || 0), 0) / deptStudents.length).toFixed(2)
            : '0.00';
          
          return (
            <div key={dept} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getDepartmentColor(dept)}`}>
                  {dept}
                </div>
                <FiBookmark className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Students</span>
                  <span className="font-semibold">{deptStudents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Results</span>
                  <span className="font-semibold">{deptResults.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Avg CGPA</span>
                  <span className="font-semibold text-purple-600">{avgCGPA}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(parseFloat(avgCGPA) / 4.0) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-gray-800">{students.length}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Results</p>
              <p className="text-2xl font-bold text-gray-800">{results.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiAward className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Academic Years</p>
              <p className="text-2xl font-bold text-gray-800">{academicYears.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiCalendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Passing Rate</p>
              <p className="text-2xl font-bold text-gray-800">
                {results.length > 0 
                  ? Math.round((results.filter(r => calculateGradeStatus(r.marks).status === 'pass').length / results.length) * 100) 
                  : 0}%
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Student Analysis Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FiPieChart className="mr-2 text-purple-600" />
          Student Performance Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.slice(0, 6).map(student => {
            const analysis = analyzeStudentPerformance(student._id);
            if (!analysis) return null;
            
            return (
              <div key={student._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  {/* Student Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">{student.name}</h3>
                        <p className="text-xs text-gray-500">{student.studentId}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      analysis.overall.improvementTrend === 'improving' ? 'bg-green-100 text-green-800' :
                      analysis.overall.improvementTrend === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {analysis.overall.improvementTrend}
                    </div>
                  </div>

                  {/* Department Badge */}
                  <div className="mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDepartmentColor(student.department)}`}>
                      {student.department || 'No Department'}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">CGPA</p>
                      <p className="text-lg font-bold text-purple-600">{analysis.overall.cgpa}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Pass %</p>
                      <p className="text-lg font-bold text-green-600">{analysis.overall.passPercentage}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Passed</p>
                      <div className="flex items-center">
                        <FiCheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <p className="text-lg font-bold text-gray-800">{analysis.overall.passedSubjects}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Failed</p>
                      <div className="flex items-center">
                        <FiXCircle className="h-4 w-4 text-red-500 mr-1" />
                        <p className="text-lg font-bold text-gray-800">{analysis.overall.failedSubjects}</p>
                      </div>
                    </div>
                  </div>

                  {/* Best & Worst Subjects */}
                  <div className="space-y-2 mb-4">
                    {analysis.bestSubject && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center">
                          <FiStar className="h-4 w-4 text-yellow-500 mr-1" />
                          Best:
                        </span>
                        <span className="font-medium">{analysis.bestSubject.name} ({analysis.bestSubject.average})</span>
                      </div>
                    )}
                    {analysis.worstSubject && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center">
                          <FiClock className="h-4 w-4 text-orange-500 mr-1" />
                          Needs Work:
                        </span>
                        <span className="font-medium">{analysis.worstSubject.name} ({analysis.worstSubject.average})</span>
                      </div>
                    )}
                  </div>

                  {/* Grade Distribution */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Grade Distribution</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(analysis.gradeDistribution).map(([grade, count]) => (
                        <span key={grade} className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade)}`}>
                          {grade}: {count}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-3 border-t">
                    <button
                      onClick={() => handleViewTranscript(student)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Transcript"
                    >
                      <FiPrinter className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleViewSemesterGPA(student)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Semester GPA"
                    >
                      <FiBarChart2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleViewStudentAnalysis(student)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Detailed Analysis"
                    >
                      <FiPieChart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {students.length > 6 && (
          <div className="text-center mt-4">
            <button className="text-purple-600 hover:text-purple-700 font-medium">
              View All {students.length} Students
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, subject, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Academic Year */}
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          {/* Semester */}
          <div className="relative">
            <FiTimeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          {/* Exam Type */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedExamType} 
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Exam Types</option>
              {examTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
            </select>
          </div>

          {/* Department */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4 flex justify-end">
          <button 
            onClick={() => { 
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

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map(r => {
                const { grade, status } = calculateGradeStatus(r.marks);
                const cgpa = calculateCGPA(r.student?._id);
                return (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <FiUser className="h-4 w-4 text-purple-600"/>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{r.student?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{r.student?.studentId || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDepartmentColor(r.student?.department)}`}>
                        {r.student?.department || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{r.subject?.name || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{r.subject?.code || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.year || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Semester {r.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{r.examType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.marks}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(grade)}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cgpa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => openEditModal(r)} 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Edit Result"
                      >
                        <FiEdit2 className="h-5 w-5"/>
                      </button>
                      <button 
                        onClick={() => handleDelete(r._id)} 
                        className="text-red-600 hover:text-red-900 mr-3"
                        title="Delete Result"
                      >
                        <FiTrash2 className="h-5 w-5"/>
                      </button>
                      <button 
                        onClick={() => handleViewTranscript(r.student)} 
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="View Transcript"
                      >
                        <FiPrinter className="h-5 w-5"/>
                      </button>
                      <button 
                        onClick={() => handleViewSemesterGPA(r.student)} 
                        className="text-purple-600 hover:text-purple-900"
                        title="Semester GPA"
                      >
                        <FiBarChart2 className="h-5 w-5"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <FiAward className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
            <p className="text-gray-500 text-lg">No results found</p>
          </div>
        )}
      </div>

      {/* Add Result Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add Result" size="lg">
        <form onSubmit={handleAddResult} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select 
                name="student" 
                value={formData.student} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.studentId}) - {s.department || 'No Dept'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select 
                name="semester" 
                value={formData.semester} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            {/* Curriculum Subject Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select from Curriculum <span className="text-gray-500 text-xs">(Optional - Auto-fills subject)</span>
              </label>
              <div className="relative">
                <select
                  onChange={handleCurriculumSubjectSelect}
                  value=""
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  disabled={!formData.student || !formData.year || !formData.semester}
                >
                  <option value="">
                    {!formData.student 
                      ? 'Select a student first' 
                      : !formData.year || !formData.semester 
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
                Select a subject to automatically fill the subject field below
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a subject</option>
                {subjects
                  .filter(s => !formData.year || s.year === formData.year)
                  .filter(s => !formData.semester || s.semester === parseInt(formData.semester))
                  .map(s => (
                    <option key={s._id} value={s._id}>
                      {s.code} - {s.name} ({s.credits} credits) - {s.department}
                    </option>
                  ))}
              </select>
              {formData.subject && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Subject selected
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
              <select 
                name="examType" 
                value={formData.examType} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {examTypes.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
              <input 
                type="number" 
                name="marks" 
                min="0" 
                max="100" 
                step="0.01" 
                value={formData.marks} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
              />
            </div>
          </div>

          {/* Preview Grade */}
          {formData.marks && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700">
                Calculated Grade: <span className="font-bold">{calculateGradeStatus(formData.marks).grade}</span> - 
                Status: <span className={`font-bold ${calculateGradeStatus(formData.marks).status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateGradeStatus(formData.marks).status}
                </span>
              </p>
            </div>
          )}

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
              Add Result
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Result Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedResult(null); resetForm(); }} title="Edit Result" size="lg">
        <form onSubmit={handleEditResult} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select 
                name="student" 
                value={formData.student} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.studentId}) - {s.department || 'No Dept'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select 
                name="semester" 
                value={formData.semester} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Semester</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a subject</option>
                {subjects
                  .filter(s => !formData.year || s.year === formData.year)
                  .filter(s => !formData.semester || s.semester === parseInt(formData.semester))
                  .map(s => (
                    <option key={s._id} value={s._id}>
                      {s.code} - {s.name} ({s.credits} credits) - {s.department}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
              <select 
                name="examType" 
                value={formData.examType} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {examTypes.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
              <input 
                type="number" 
                name="marks" 
                min="0" 
                max="100" 
                step="0.01" 
                value={formData.marks} 
                onChange={handleInputChange} 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
              />
            </div>
          </div>

          {/* Preview Grade */}
          {formData.marks && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700">
                Calculated Grade: <span className="font-bold">{calculateGradeStatus(formData.marks).grade}</span> - 
                Status: <span className={`font-bold ${calculateGradeStatus(formData.marks).status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateGradeStatus(formData.marks).status}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={() => { setShowEditModal(false); setSelectedResult(null); resetForm(); }} 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal isOpen={showBulkUploadModal} onClose={() => { setShowBulkUploadModal(false); setBulkFile(null); }} title="Bulk Upload Results" size="md">
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={e => setBulkFile(e.target.files[0])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
            />
            <p className="text-xs text-gray-500 mt-1">Upload CSV with columns: StudentID, SubjectCode, Year, Semester, ExamType, Marks</p>
            <p className="text-xs text-gray-500">Year options: 1st Year, 2nd Year, 3rd Year, 4th Year | Semester: 1 or 2</p>
          </div>
          <div className="flex justify-between pt-4">
            <button 
              type="button" 
              onClick={handleDownloadTemplate} 
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <FiDownloadIcon className="mr-2" /> Download Template
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

      {/* Transcript Modal */}
      <Modal isOpen={showTranscriptModal} onClose={() => { setShowTranscriptModal(false); setSelectedStudent(null); }} title="Student Transcript" size="lg">
        <div id="transcript-content" className="p-6 bg-white">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Academic Transcript</h2>
            <p className="text-gray-600">University Name</p>
          </div>

          {/* Student Info */}
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="font-semibold">{selectedStudent?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Student ID</p>
                <p className="font-semibold">{selectedStudent?.studentId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-semibold">{selectedStudent?.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CGPA</p>
                <p className="font-semibold">{gpaData?.cgpa || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Year-Semester wise GPA */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Year & Semester-wise GPA</h3>
            <div className="space-y-4">
              {gpaData?.semesterGPAs.map((sem, index) => {
                const percentage = calculateGPAPercentage(sem.gpa);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{sem.displayName}</span>
                      <span className="text-purple-600 font-semibold">GPA: {sem.gpa}</span>
                    </div>
                    {/* GPA Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Subjects: {sem.credits}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Results */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Detailed Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Year</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Semester</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Exam Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Marks</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results
                    .filter(r => r.student?._id === selectedStudent?._id)
                    .sort((a, b) => {
                      const yearA = getYearNumber(a.year);
                      const yearB = getYearNumber(b.year);
                      if (yearA === yearB) return a.semester - b.semester;
                      return yearA - yearB;
                    })
                    .map((r, idx) => {
                      const { grade } = calculateGradeStatus(r.marks);
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{r.subject?.name}</td>
                          <td className="px-4 py-2 text-sm">{r.year}</td>
                          <td className="px-4 py-2 text-sm">Semester {r.semester}</td>
                          <td className="px-4 py-2 text-sm capitalize">{r.examType}</td>
                          <td className="px-4 py-2 text-sm">{r.marks}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade)}`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer with Print/Download buttons */}
        <div className="flex justify-end space-x-3 border-t pt-4 mt-4">
          <button
            onClick={handlePrintTranscript}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiPrinter className="mr-2" /> Print
          </button>
          <button
            onClick={handleDownloadTranscript}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <FiDownloadIcon className="mr-2" /> Download
          </button>
          <button
            onClick={() => { setShowTranscriptModal(false); setSelectedStudent(null); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Semester GPA Modal */}
      <Modal isOpen={showSemesterGPAModal} onClose={() => { setShowSemesterGPAModal(false); setSelectedStudent(null); }} title="Year & Semester GPA Summary" size="md">
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{selectedStudent?.name}</h3>
            <p className="text-sm text-gray-500">Student ID: {selectedStudent?.studentId}</p>
            <p className="text-sm text-gray-500">Department: {selectedStudent?.department || 'N/A'}</p>
          </div>

          <div className="space-y-3">
            {semesterGPA.map((sem, index) => {
              const percentage = calculateGPAPercentage(sem.gpa);
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{sem.displayName}</span>
                    <span className="text-purple-600 font-semibold">GPA: {sem.gpa}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>Subjects: {sem.credits}</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {semesterGPA.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Overall CGPA:</span>
                <span className="text-xl font-bold text-purple-600">
                  {calculateCGPA(selectedStudent?._id)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4 mt-4">
          <button
            onClick={() => { setShowSemesterGPAModal(false); setSelectedStudent(null); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Student Analysis Modal */}
      <Modal isOpen={showStudentAnalysisModal} onClose={() => { setShowStudentAnalysisModal(false); setSelectedStudent(null); }} title="Detailed Student Analysis" size="lg">
        {studentAnalysis && (
          <div className="p-6">
            {/* Student Header */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold">{studentAnalysis.student.name}</h3>
              <div className="flex items-center mt-1 space-x-2">
                <p className="text-sm text-gray-500">ID: {studentAnalysis.student.studentId}</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDepartmentColor(studentAnalysis.student.department)}`}>
                  {studentAnalysis.student.department || 'No Department'}
                </span>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">CGPA</p>
                <p className="text-2xl font-bold text-purple-700">{studentAnalysis.overall.cgpa}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Pass Percentage</p>
                <p className="text-2xl font-bold text-green-700">{studentAnalysis.overall.passPercentage}%</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total Subjects</p>
                <p className="text-2xl font-bold text-blue-700">{studentAnalysis.overall.totalSubjects}</p>
              </div>
              <div className={`rounded-lg p-4 ${
                studentAnalysis.overall.improvementTrend === 'improving' ? 'bg-green-50' :
                studentAnalysis.overall.improvementTrend === 'declining' ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <p className="text-sm font-medium">Trend</p>
                <p className="text-2xl font-bold capitalize">{studentAnalysis.overall.improvementTrend}</p>
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Grade Distribution</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(studentAnalysis.gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className={`px-4 py-2 rounded-lg ${getGradeColor(grade)}`}>
                    <span className="font-bold">{grade}:</span> {count}
                  </div>
                ))}
              </div>
            </div>

            {/* Best and Worst Subjects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {studentAnalysis.bestSubject && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                    <FiStar className="mr-2" /> Best Performing Subject
                  </h4>
                  <p className="text-lg font-medium">{studentAnalysis.bestSubject.name}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Average: <span className="font-semibold">{studentAnalysis.bestSubject.average}</span></p>
                    <p>Best Score: <span className="font-semibold">{studentAnalysis.bestSubject.best}</span></p>
                  </div>
                </div>
              )}
              {studentAnalysis.worstSubject && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-700 mb-2 flex items-center">
                    <FiClock className="mr-2" /> Needs Improvement
                  </h4>
                  <p className="text-lg font-medium">{studentAnalysis.worstSubject.name}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Average: <span className="font-semibold">{studentAnalysis.worstSubject.average}</span></p>
                    <p>Worst Score: <span className="font-semibold">{studentAnalysis.worstSubject.worst}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Year-Semester Trends */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Year & Semester Performance Trends</h4>
              <div className="space-y-3">
                {studentAnalysis.yearSemesterTrends.map(sem => (
                  <div key={`${sem.year}-${sem.semester}`} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{sem.displayName}</span>
                      <span className="text-purple-600 font-semibold">{sem.averageMarks}% Avg</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${sem.averageMarks}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Subjects: {sem.subjectsCount}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Type Performance */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Performance by Exam Type</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(studentAnalysis.examTypePerformance).map(([type, data]) => (
                  <div key={type} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium capitalize">{type}</p>
                    <p className="text-sm">Average: <span className="font-semibold">{data.average}%</span></p>
                    <p className="text-sm">Count: {data.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t pt-4 mt-4">
          <button
            onClick={() => { setShowStudentAnalysisModal(false); setSelectedStudent(null); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Department Statistics Modal */}
      <Modal isOpen={showDepartmentStatsModal} onClose={() => setShowDepartmentStatsModal(false)} title="Department Statistics" size="lg">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {departmentStats && Object.entries(departmentStats).map(([dept, stats]) => (
              <div key={dept} className="border rounded-lg overflow-hidden">
                <div className={`p-4 ${getDepartmentColor(dept)}`}>
                  <h3 className="text-lg font-semibold">{dept} Department</h3>
                </div>
                <div className="p-4">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Students</p>
                      <p className="text-xl font-bold text-gray-800">{stats.studentCount}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Results</p>
                      <p className="text-xl font-bold text-gray-800">{stats.resultCount}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Avg CGPA</p>
                      <p className="text-xl font-bold text-purple-600">{stats.avgCGPA}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Pass Rate</p>
                      <p className="text-xl font-bold text-green-600">{stats.passRate}%</p>
                    </div>
                  </div>

                  {/* Grade Distribution */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Grade Distribution</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                        <span key={grade} className={`px-3 py-1 text-sm font-semibold rounded-full ${getGradeColor(grade)}`}>
                          {grade}: {count}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top Performers */}
                  {stats.topPerformers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Top Performers</h4>
                      <div className="space-y-2">
                        {stats.topPerformers.map((student, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.studentId}</p>
                            </div>
                            <span className="font-semibold text-purple-600">{student.cgpa}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Year Performance */}
                  {Object.keys(stats.yearPerformance).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Year-wise Performance</h4>
                      <div className="space-y-2">
                        {Object.entries(stats.yearPerformance).map(([year, avg]) => (
                          <div key={year} className="flex items-center">
                            <span className="w-24 text-sm">{year}:</span>
                            <div className="flex-1 ml-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${avg}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="ml-2 text-sm font-semibold">{avg}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t pt-4 mt-4">
          <button
            onClick={() => setShowDepartmentStatsModal(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Yearly Statistics Modal */}
      <Modal isOpen={showYearlyStatsModal} onClose={() => setShowYearlyStatsModal(false)} title="Yearly Statistics" size="lg">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {yearlyStats && Object.entries(yearlyStats).map(([year, stats]) => (
              <div key={year} className="border rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                  <h3 className="text-lg font-semibold">{year}</h3>
                </div>
                <div className="p-4">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Results</p>
                      <p className="text-xl font-bold text-gray-800">{stats.totalResults}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Students</p>
                      <p className="text-xl font-bold text-gray-800">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Average Marks</p>
                      <p className="text-xl font-bold text-purple-600">{stats.overallAvgMarks}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Pass Rate</p>
                      <p className="text-xl font-bold text-green-600">{stats.passRate}%</p>
                    </div>
                  </div>

                  {/* Semester Stats */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Semester Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map(sem => {
                        const semStats = stats.semesterStats[sem];
                        return semStats ? (
                          <div key={sem} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium mb-2">Semester {sem}</p>
                            <div className="space-y-1 text-sm">
                              <p>Results: <span className="font-semibold">{semStats.resultCount}</span></p>
                              <p>Average: <span className="font-semibold text-purple-600">{semStats.avgMarks}%</span></p>
                              <p>Pass Rate: <span className="font-semibold text-green-600">{semStats.passRate}%</span></p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div 
                                  className="bg-purple-600 h-1.5 rounded-full"
                                  style={{ width: `${semStats.avgMarks}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Department Performance */}
                  {Object.keys(stats.deptPerformance).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Department Performance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(stats.deptPerformance).map(([dept, avg]) => (
                          <div key={dept} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDepartmentColor(dept)}`}>
                                {dept}
                              </span>
                              <span className="font-semibold text-purple-600">{avg}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full"
                                style={{ width: `${avg}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t pt-4 mt-4">
          <button
            onClick={() => setShowYearlyStatsModal(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminResults;