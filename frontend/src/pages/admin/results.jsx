import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FiAward, FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiDownload, FiFilter,
  FiBarChart2, FiPrinter, FiDownload as FiDownloadIcon, FiTrendingUp,
  FiPieChart, FiStar, FiClock, FiCheckCircle, FiXCircle, FiUsers,
  FiBookmark, FiGrid, FiLayers, FiCalendar, FiClock as FiTimeIcon,
  FiLock, FiUnlock, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const gradePoints = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'E': 0.0,
};

const AdminResults = ({ sidebarOpen }) => {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
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
  const [formData, setFormData] = useState({
    student: '', subject: '', year: '', semester: '', examType: 'final', marks: ''
  });
  const [lockedFields, setLockedFields] = useState({
    year: false,
    semester: false
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
        api.get('api/results'), 
        api.get('api/users?role=student'), 
        api.get('api/subjects')
      ]);
      
      // Ensure results have proper structure
      const processedResults = (resultsRes.data.results || []).map(result => ({
        ...result,
        year: result.year || 'N/A',
        semester: result.semester || 1,
        marks: result.marks || 0
      }));
      
      setResults(processedResults);
      
      // Process subjects to ensure they have year and semester information
      const processedSubjects = (subjectsRes.data.subjects || []).map(subject => ({
        ...subject,
        year: subject.year || '1st Year',
        semester: subject.semester || 1,
        department: subject.department || 'General'
      }));
      
      setSubjects(processedSubjects);
      setFilteredSubjects(processedSubjects);
      setStudents(studentsRes.data.users || []);

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

  const resetForm = () => {
    setFormData({ 
      student: '', subject: '', year: '', semester: '', examType: 'final', marks: ''
    });
    setLockedFields({
      year: false,
      semester: false
    });
    setFilteredSubjects(subjects);
  };

  // Handle student selection and filter subjects based on department
  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    const selectedStudent = students.find(s => s._id === studentId);
    
    setFormData(prev => ({
      ...prev,
      student: studentId
    }));

    if (selectedStudent && selectedStudent.department) {
      // Filter subjects based on student's department
      const deptSubjects = subjects.filter(s => 
        s.department === selectedStudent.department || s.department === 'General'
      );
      setFilteredSubjects(deptSubjects);
      
      if (deptSubjects.length === 0) {
        toast.info(`No subjects found for ${selectedStudent.department} department`);
      }
    } else {
      setFilteredSubjects(subjects);
    }
  };

  // Handle subject selection and auto-fill year and semester with locking
  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const selectedSubject = subjects.find(s => s._id === subjectId);
    
    if (selectedSubject) {
      setFormData(prev => ({
        ...prev,
        subject: subjectId,
        year: selectedSubject.year || prev.year,
        semester: selectedSubject.semester || prev.semester
      }));
      
      setLockedFields({
        year: true,
        semester: true
      });
    } else {
      setFormData(prev => ({
        ...prev,
        subject: subjectId
      }));
    }
  };

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
    setLockedFields({
      year: true,
      semester: true
    });
    setShowEditModal(true);
    
    // Filter subjects for the student's department in edit mode
    if (result.student?.department) {
      const deptSubjects = subjects.filter(s => 
        s.department === result.student.department || s.department === 'General'
      );
      setFilteredSubjects(deptSubjects);
    }
  };

  const calculateGradeStatus = (marks) => {
    const numMarks = parseFloat(marks) || 0;
    let grade;
    
    if (numMarks >= 75) grade = 'A+';
    else if (numMarks >= 70) grade = 'A';
    else if (numMarks >= 65) grade = 'A-';
    else if (numMarks >= 60) grade = 'B+';
    else if (numMarks >= 55) grade = 'B';
    else if (numMarks >= 50) grade = 'B-';
    else if (numMarks >= 45) grade = 'C+';
    else if (numMarks >= 40) grade = 'C';
    else if (numMarks >= 35) grade = 'C-';
    else if (numMarks >= 30) grade = 'D+';
    else if (numMarks >= 25) grade = 'D';
    else grade = 'E';

    const failGrades = ['D+', 'D', 'E'];
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
    
    const yearGroups = {};
    studentResults.forEach(r => {
      if (!yearGroups[r.year]) {
        yearGroups[r.year] = [];
      }
      yearGroups[r.year].push(r);
    });

    for (const [year, yearResults] of Object.entries(yearGroups)) {
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

    return yearlyGPAs.sort((a, b) => {
      const yearA = getYearNumber(a.year);
      const yearB = getYearNumber(b.year);
      return yearA - yearB;
    });
  };

  const calculateSemesterGPA = (studentId) => {
    const semesterGPAs = [];
    const studentResults = results.filter(r => r.student?._id === studentId);
    
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
        const avgCGPA = deptStudents.reduce((sum, s) => sum + parseFloat(calculateCGPA(s._id) || 0), 0) / deptStudents.length;
        
        const passedResults = deptResults.filter(r => calculateGradeStatus(r.marks).status === 'pass').length;
        const passRate = deptResults.length > 0 ? (passedResults / deptResults.length) * 100 : 0;
        
        const gradeDist = {};
        deptResults.forEach(r => {
          const { grade } = calculateGradeStatus(r.marks);
          gradeDist[grade] = (gradeDist[grade] || 0) + 1;
        });

        const topPerformers = deptStudents
          .map(s => ({
            name: s.name,
            studentId: s.studentId,
            cgpa: parseFloat(calculateCGPA(s._id))
          }))
          .filter(s => s.cgpa > 0)
          .sort((a, b) => b.cgpa - a.cgpa)
          .slice(0, 5);

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

    const totalSubjects = studentResults.length;
    const passedSubjects = studentResults.filter(r => calculateGradeStatus(r.marks).status === 'pass').length;
    const failedSubjects = totalSubjects - passedSubjects;
    const passPercentage = (passedSubjects / totalSubjects) * 100;

    const gradeDistribution = {};
    studentResults.forEach(r => {
      const { grade } = calculateGradeStatus(r.marks);
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

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

    Object.keys(subjectPerformance).forEach(subject => {
      subjectPerformance[subject].average = (subjectPerformance[subject].total / subjectPerformance[subject].count).toFixed(2);
    });

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

    const bestSubject = Object.entries(subjectPerformance)
      .sort((a, b) => b[1].average - a[1].average)[0];
    const worstSubject = Object.entries(subjectPerformance)
      .sort((a, b) => a[1].average - b[1].average)[0];

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

    let improvementTrend = 'stable';
    if (yearSemesterTrends.length >= 2) {
      const firstAvg = parseFloat(yearSemesterTrends[0].averageMarks);
      const lastAvg = parseFloat(yearSemesterTrends[yearSemesterTrends.length - 1].averageMarks);
      if (lastAvg > firstAvg + 5) improvementTrend = 'improving';
      else if (lastAvg < firstAvg - 5) improvementTrend = 'declining';
    }

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
    if (lockedFields[name]) {
      toast.error(`${name} is locked and cannot be modified`);
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleAddResult = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        semester: parseInt(formData.semester),
        marks: parseInt(formData.marks)
      };
      await api.post('api/results', submitData);
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
      const submitData = {
        ...formData,
        semester: parseInt(formData.semester),
        marks: parseInt(formData.marks)
      };
      await api.put(`api/results/${selectedResult._id}`, submitData);
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
      await api.delete(`api/results/${id}`);
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
      await api.post('api/results/bulk-upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    window.location.reload();
  };

  // PDF Download Function
  const handleDownloadTranscriptPDF = async () => {
    const input = document.getElementById('transcript-content');
    if (!input) return;

    toast.loading('Generating PDF...', { id: 'pdf' });

    try {
      const canvas = await html2canvas(input, { 
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      pdf.addImage(imgData, 'PNG', x, y, width, height);
      pdf.save(`transcript_${selectedStudent?.studentId || 'student'}.pdf`);
      
      toast.success('PDF downloaded successfully!', { id: 'pdf' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', { id: 'pdf' });
    }
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select 
                name="student" 
                value={formData.student} 
                onChange={handleStudentChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleSubjectChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a subject</option>
                {filteredSubjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code}) - {s.department} - {s.year || 'No Year'} Sem {s.semester || 'N/A'}
                  </option>
                ))}
              </select>
              {formData.student && filteredSubjects.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No subjects available for this student's department</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year {lockedFields.year && <FiLock className="inline ml-1 text-gray-500" size={14} />}
              </label>
              <select 
                name="year" 
                value={formData.year} 
                onChange={handleInputChange} 
                required
                disabled={lockedFields.year}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  lockedFields.year ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Year</option>
                {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
              {lockedFields.year && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <FiLock size={12} className="mr-1" /> Locked based on subject selection
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester {lockedFields.semester && <FiLock className="inline ml-1 text-gray-500" size={14} />}
              </label>
              <select 
                name="semester" 
                value={formData.semester} 
                onChange={handleInputChange} 
                required
                disabled={lockedFields.semester}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  lockedFields.semester ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Semester</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              {lockedFields.semester && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <FiLock size={12} className="mr-1" /> Locked based on subject selection
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
              <select 
                name="student" 
                value={formData.student} 
                onChange={handleStudentChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select 
                name="subject" 
                value={formData.subject} 
                onChange={handleSubjectChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a subject</option>
                {filteredSubjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code}) - {s.department} - {s.year || 'No Year'} Sem {s.semester || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year <FiLock className="inline ml-1 text-gray-500" size={14} />
              </label>
              <select 
                name="year" 
                value={formData.year} 
                onChange={handleInputChange} 
                required
                disabled={true}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none"
              >
                <option value="">Select Year</option>
                {academicYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester <FiLock className="inline ml-1 text-gray-500" size={14} />
              </label>
              <select 
                name="semester" 
                value={formData.semester} 
                onChange={handleInputChange} 
                required
                disabled={true}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none"
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
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <FiAlertCircle className="inline mr-1" /> Note: Year and semester will be validated against subject data
            </p>
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
            <img src="/public/esn.webp" alt="University Logo" className="mx-auto mb-2 h-16"/>
            <h2 className="text-2xl font-bold text-gray-900">Academic Transcript</h2>
            <p className="text-gray-600">Trincomalee Campus ,Eastern University Of SriLanka</p>
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
            onClick={handleDownloadTranscriptPDF}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <FiDownloadIcon className="mr-2" /> Download PDF
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