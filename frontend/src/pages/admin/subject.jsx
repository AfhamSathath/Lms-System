// AdminSubjects.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import Loader from '../../components/common/loader';
import Modal from '../../components/common/model';
import {
  FiBook, FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar,
  FiGrid, FiUsers, FiAward, FiDownload, FiUpload, FiLayers, FiEye,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiChevronDown,
  FiBarChart2, FiFilter, FiDatabase, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// ==================== CONSTANTS & CONFIG ====================
const DEPARTMENTS = ['Computer Science', 'Software Engineering', 'Information Technology'];
const ACADEMIC_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const SEMESTERS = [1, 2];
const CATEGORIES = ['Lecture', 'Practical', 'General', 'Management', 'Project'];

const YEAR_COLORS = {
  '1st Year': 'bg-blue-100 text-blue-800',
  '2nd Year': 'bg-green-100 text-green-800',
  '3rd Year': 'bg-purple-100 text-purple-800',
  '4th Year': 'bg-orange-100 text-orange-800'
};

const CATEGORY_COLORS = {
  'Lecture': 'bg-indigo-100 text-indigo-800',
  'Practical': 'bg-green-100 text-green-800',
  'General': 'bg-yellow-100 text-yellow-800',
  'Management': 'bg-purple-100 text-purple-800',
  'Project': 'bg-pink-100 text-pink-800'
};

// ==================== CURRICULUM DATA ====================
const CURRICULUM = {
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
    },
    '2nd Year': {
      1: [
        { code: 'SE2101', name: 'Software Requirements Engineering', credits: 3, category: 'Lecture' },
        { code: 'SE2102', name: 'Algorithms Analysis', credits: 3, category: 'Lecture' },
        { code: 'SE2103', name: 'UI/UX Design', credits: 3, category: 'Lecture' },
        { code: 'SE2103P', name: 'UI/UX Lab', credits: 1, category: 'Practical' },
        { code: 'SE2104', name: 'Professional Development', credits: 2, category: 'General' },
      ],
      2: [
        { code: 'SE2201', name: 'Software Design and Architecture', credits: 3, category: 'Lecture' },
        { code: 'SE2202', name: 'Mobile App Development', credits: 3, category: 'Lecture' },
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
        { code: 'SE3104', name: 'Software Testing', credits: 3, category: 'Lecture' },
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
    },
    '2nd Year': {
      1: [
        { code: 'IT2101', name: 'System Administration', credits: 3, category: 'Lecture' },
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
        { code: 'IT3102', name: 'Cyber Security', credits: 3, category: 'Lecture' },
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

// ==================== HELPER FUNCTIONS ====================
const getYearColor = (year) => YEAR_COLORS[year] || 'bg-gray-100 text-gray-800';
const getCategoryColor = (category) => CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800';

const generateEmptySubjectForm = () => ({
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

// ==================== SUBJECT FILTERS COMPONENT ====================
const SubjectFilters = ({
  searchTerm, setSearchTerm,
  selectedYear, setSelectedYear,
  selectedSemester, setSelectedSemester,
  selectedDepartment, setSelectedDepartment,
  selectedCategory, setSelectedCategory,
  onClearFilters
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

      <div className="relative">
        <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Years</option>
          {ACADEMIC_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      <div className="relative">
        <FiGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <select
          value={selectedSemester}
          onChange={e => setSelectedSemester(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Semesters</option>
          {SEMESTERS.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
        </select>
      </div>

      <div className="relative">
        <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <select
          value={selectedDepartment}
          onChange={e => setSelectedDepartment(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
      </div>

      <div className="relative">
        <FiLayers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
    </div>

    <div className="mt-4 flex justify-end">
      <button
        onClick={onClearFilters}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
      >
        <FiFilter className="mr-2" /> Clear All Filters
      </button>
    </div>
  </div>
);

// ==================== DEPARTMENT CARD COMPONENT ====================
const DepartmentCard = ({ department, stats, onClick }) => {
  return (
    <div
      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => onClick(department)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{department}</h3>
        <FiEye className="h-5 w-5 text-gray-400" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Subjects</p>
          <p className="text-2xl font-bold text-gray-800">{stats?.count || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Credits</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.totalCredits || 0}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ACADEMIC_YEARS.map(year => {
          const count = stats?.yearCounts?.[year] || 0;
          return count > 0 ? (
            <span key={year} className={`text-xs px-2 py-1 rounded-full ${getYearColor(year)}`}>
              {year.charAt(0)}: {count}
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
};

// ==================== SUBJECT TABLE ROW COMPONENT ====================
const SubjectTableRow = ({ subject, onEdit, onDelete }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <FiBook className="h-4 w-4 text-blue-600" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{subject.name}</p>
          {subject.hasPractical && (
            <span className="text-xs text-green-600 flex items-center">
              <FiCheckCircle className="mr-1 h-3 w-3" /> Has Practical
            </span>
          )}
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        {subject.code}
      </span>
      {subject.practicalCode && (
        <span className="ml-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {subject.practicalCode}
        </span>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.credits}</td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getYearColor(subject.year)}`}>
        {subject.year}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Semester {subject.semester}</td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.department}</td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(subject.category)}`}>
        {subject.category}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      {subject.lecturer ? (
        <div>
          <p className="text-sm font-medium text-gray-900">{subject.lecturer.name}</p>
          <p className="text-xs text-gray-500">{subject.lecturer.lecturerId}</p>
        </div>
      ) : (
        <span className="text-sm text-gray-400">Not assigned</span>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      <button
        onClick={() => onEdit(subject)}
        className="text-blue-600 hover:text-blue-900 mr-3"
        title="Edit Subject"
      >
        <FiEdit2 className="h-5 w-5" />
      </button>
      <button
        onClick={() => onDelete(subject._id)}
        className="text-red-600 hover:text-red-900"
        title="Delete Subject"
      >
        <FiTrash2 className="h-5 w-5" />
      </button>
    </td>
  </tr>
);

// ==================== SUBJECT FORM COMPONENT ====================
const SubjectForm = ({
  formData,
  onChange,
  onSubjectSelect,
  availableSubjects,
  lecturers,
  isEditing = false
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
        <select
          name="department"
          value={formData.department}
          onChange={onChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
        <select
          name="year"
          value={formData.year}
          onChange={onChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select Year</option>
          {ACADEMIC_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
        <select
          name="semester"
          value={formData.semester}
          onChange={onChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select Semester</option>
          {SEMESTERS.map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
        </select>
      </div>

      {!isEditing && (
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select from Curriculum <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <select
              onChange={onSubjectSelect}
              value={formData.code}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
              disabled={!formData.year || !formData.semester}
            >
              <option value="">
                {!formData.year || !formData.semester
                  ? 'Select year and semester first'
                  : availableSubjects.length === 0
                    ? 'No subjects available'
                    : '-- Choose a subject --'}
              </option>
              {availableSubjects.map(sub => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} - {sub.name} ({sub.credits} credits)
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      <div className={isEditing ? "md:col-span-2" : ""}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
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
          onChange={onChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Lecturer</label>
        <select
          name="lecturer"
          value={formData.lecturer}
          onChange={onChange}
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



    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
      <textarea
        name="description"
        value={formData.description}
        onChange={onChange}
        rows="3"
        placeholder="Enter subject description..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================
const AdminSubjects = ({ sidebarOpen }) => {
  // State
  const [subjects, setSubjects] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({
    add: false,
    edit: false,
    delete: false,
    seed: false,
    bulk: false
  });
  const [stats, setStats] = useState(null);
  const [groupedSubjects, setGroupedSubjects] = useState({});

  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    year: 'all',
    semester: 'all',
    department: 'all',
    category: 'all'
  });

  // Modal state
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    stats: false,
    seed: false,
    departmentView: false,
    bulkUpload: false
  });

  // Other state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDepartmentView, setSelectedDepartmentView] = useState('Computer Science');
  const [bulkFile, setBulkFile] = useState(null);
  const [seedOption, setSeedOption] = useState('all');
  const [formData, setFormData] = useState(generateEmptySubjectForm());

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // ==================== DATA FETCHING ====================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all courses
      const subjectsRes = await api.get('api/courses');

      // Fetch lecturers
      const lecturersRes = await api.get('api/users', {
        params: { role: 'lecturer' }
      });

      // Fetch stats
      const statsRes = await api.get('api/courses/stats/all');

      // Handle different response structures
      const subjectsData = subjectsRes.data.data || subjectsRes.data.subjects || subjectsRes.data;
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

      const lecturersData = lecturersRes.data.data || lecturersRes.data.users || lecturersRes.data;
      setLecturers(Array.isArray(lecturersData) ? lecturersData : []);

      // Handle stats data
      const statsData = statsRes.data.data || statsRes.data.stats || statsRes.data;
      setStats(statsData || {});

      // Update pagination if available
      if (subjectsRes.data.pagination) {
        setPagination(subjectsRes.data.pagination);
      }

    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== DEPARTMENT STATS HELPER ====================
  const getDepartmentStats = useCallback((department) => {
    const deptSubjects = subjects.filter(s => s.department === department);
    const totalCredits = deptSubjects.reduce((sum, s) => sum + (s.credits || 0), 0);

    const yearCounts = {};
    ACADEMIC_YEARS.forEach(year => {
      yearCounts[year] = deptSubjects.filter(s => s.year === year).length;
    });

    return {
      count: deptSubjects.length,
      totalCredits,
      yearCounts
    };
  }, [subjects]);

  // ==================== FILTERING ====================
  const filteredSubjects = useMemo(() => {
    let filtered = subjects;

    if (filters.year !== 'all') {
      filtered = filtered.filter(s => s.year === filters.year);
    }
    if (filters.semester !== 'all') {
      filtered = filtered.filter(s => s.semester === parseInt(filters.semester));
    }
    if (filters.department !== 'all') {
      filtered = filtered.filter(s => s.department === filters.department);
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(s => s.category === filters.category);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term) ||
        s.department?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [subjects, filters]);

  // ==================== AVAILABLE SUBJECTS ====================
  const availableSubjects = useMemo(() => {
    if (formData.year && formData.semester && formData.department) {
      return CURRICULUM[formData.department]?.[formData.year]?.[formData.semester] || [];
    }
    return [];
  }, [formData.year, formData.semester, formData.department]);

  // ==================== HANDLERS ====================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      year: 'all',
      semester: 'all',
      department: 'all',
      category: 'all'
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubjectSelect = (e) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;

    const selected = availableSubjects.find(sub => sub.code === selectedCode);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        name: selected.name,
        code: selected.code,
        credits: selected.credits,
        category: selected.category,
      }));
    }
  };

  const resetForm = () => {
    setFormData(generateEmptySubjectForm());
  };

  const openModal = (modalName, data = null) => {
    if (data) {
      if (modalName === 'edit') {
        setSelectedSubject(data);
        setFormData({
          name: data.name || '',
          code: data.code || '',
          credits: data.credits || '',
          year: data.year || '',
          semester: data.semester || '',
          department: data.department || 'Computer Science',
          category: data.category || 'Lecture',
          lecturer: data.lecturer?._id || '',
          description: data.description || ''
        });
      } else if (modalName === 'departmentView') {
        setSelectedDepartmentView(data);
      }
    }
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    if (modalName === 'edit' || modalName === 'add') {
      setSelectedSubject(null);
      resetForm();
    }
    if (modalName === 'bulkUpload') {
      setBulkFile(null);
    }
  };

  // API Handlers - FIXED: All using '/courses' endpoint
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setActionLoading(prev => ({ ...prev, add: true }));
    try {
      await api.post('api/courses', formData);
      toast.success('Subject added successfully');
      closeModal('add');
      fetchData();
    } catch (error) {
      console.error('Add error:', error);
      toast.error(error.response?.data?.message || 'Add failed');
    } finally {
      setActionLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleEditSubject = async (e) => {
    e.preventDefault();
    setActionLoading(prev => ({ ...prev, edit: true }));
    try {
      await api.put(`api/courses/${selectedSubject._id}`, formData);
      toast.success('Subject updated successfully');
      closeModal('edit');
      fetchData();
    } catch (error) {
      console.error('Edit error:', error);
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setActionLoading(prev => ({ ...prev, edit: false }));
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      await api.delete(`api/courses/${id}`);
      toast.success('Subject deleted');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const fetchSubjectsByDepartment = async (department) => {
    try {
      const res = await api.get('api/courses', {
        params: { department }
      });

      // Handle different response structures
      const subjectsData = res.data.data || res.data.subjects || res.data;
      const deptSubjects = Array.isArray(subjectsData) ? subjectsData : [];

      // Group the subjects by year and semester
      const grouped = {};
      deptSubjects.forEach(subject => {
        if (!grouped[subject.year]) {
          grouped[subject.year] = { semester1: [], semester2: [] };
        }
        if (subject.semester === 1) {
          grouped[subject.year].semester1.push(subject);
        } else if (subject.semester === 2) {
          grouped[subject.year].semester2.push(subject);
        }
      });

      setGroupedSubjects(grouped);
      openModal('departmentView', department);
    } catch (error) {
      console.error('Fetch department subjects error:', error);
      toast.error('Failed to fetch department subjects');
    }
  };

  const handleSeedSubjects = async () => {
    setActionLoading(prev => ({ ...prev, seed: true }));
    try {
      const res = await api.post('api/courses/seed', {
        department: seedOption === 'all' ? undefined : seedOption
      });
      toast.success(res.data.message || 'Subjects seeded successfully');
      closeModal('seed');
      fetchData();
    } catch (error) {
      console.error('Seed error:', error);
      toast.error(error.response?.data?.message || 'Seeding failed');
    } finally {
      setActionLoading(prev => ({ ...prev, seed: false }));
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return toast.error('Please select a CSV file');

    const formData = new FormData();
    formData.append('file', bulkFile);

    setActionLoading(prev => ({ ...prev, bulk: true }));
    try {
      await api.post('api/courses/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Bulk upload successful');
      closeModal('bulkUpload');
      fetchData();
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error(error.response?.data?.message || 'Bulk upload failed');
    } finally {
      setActionLoading(prev => ({ ...prev, bulk: false }));
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,code,credits,year,semester,department,category";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "subjects_template.csv");
    link.click();
  };

  const handleExportSubjects = () => {
    const headers = ['Code', 'Name', 'Department', 'Year', 'Semester', 'Credits', 'Category', 'Lecturer'];
    const csvContent = filteredSubjects.map(sub =>
      `${sub.code},${sub.name},${sub.department},${sub.year},${sub.semester},${sub.credits},${sub.category},${sub.lecturer?.name || 'Not assigned'}`
    ).join('\n');

    const blob = new Blob([headers.join(',') + '\n' + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subjects_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchData();
  };

  if (loading) return <Loader fullScreen />;

  // ==================== RENDER ====================
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
            onClick={handleExportSubjects}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
            title="Export to CSV"
          >
            <FiDownload className="mr-2" /> Export
          </button>
          <button
            onClick={() => openModal('stats')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm"
          >
            <FiBarChart2 className="mr-2" /> Stats
          </button>
          <button
            onClick={() => openModal('seed')}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center text-sm"
          >
            <FiDatabase className="mr-2" /> Seed Data
          </button>
          <button
            onClick={() => openModal('bulkUpload')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
          >
            <FiUpload className="mr-2" /> Bulk Upload
          </button>
          <button
            onClick={() => {
              resetForm();
              openModal('add');
            }}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center text-sm"
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
        {DEPARTMENTS.map(dept => (
          <DepartmentCard
            key={dept}
            department={dept}
            stats={getDepartmentStats(dept)}
            onClick={fetchSubjectsByDepartment}
          />
        ))}
      </div>

      {/* Filters */}
      <SubjectFilters
        searchTerm={filters.searchTerm}
        setSearchTerm={(value) => handleFilterChange('searchTerm', value)}
        selectedYear={filters.year}
        setSelectedYear={(value) => handleFilterChange('year', value)}
        selectedSemester={filters.semester}
        setSelectedSemester={(value) => handleFilterChange('semester', value)}
        selectedDepartment={filters.department}
        setSelectedDepartment={(value) => handleFilterChange('department', value)}
        selectedCategory={filters.category}
        setSelectedCategory={(value) => handleFilterChange('category', value)}
        onClearFilters={clearFilters}
      />

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
                <SubjectTableRow
                  key={s._id}
                  subject={s}
                  onEdit={() => openModal('edit', s)}
                  onDelete={handleDeleteSubject}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <FiBook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No subjects found</p>
            <button
              onClick={() => openModal('seed')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Seed Default Subjects
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={modals.add}
        onClose={() => closeModal('add')}
        title="Add New Subject"
        size="lg"
      >
        <form onSubmit={handleAddSubject}>
          <SubjectForm
            formData={formData}
            onChange={handleInputChange}
            onSubjectSelect={handleSubjectSelect}
            availableSubjects={availableSubjects}
            lecturers={lecturers}
            isEditing={false}
          />
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
            <button
              type="button"
              onClick={() => closeModal('add')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading.add}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {actionLoading.add ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" />
                  Adding...
                </>
              ) : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        title="Edit Subject"
        size="lg"
      >
        <form onSubmit={handleEditSubject}>
          <SubjectForm
            formData={formData}
            onChange={handleInputChange}
            onSubjectSelect={handleSubjectSelect}
            availableSubjects={availableSubjects}
            lecturers={lecturers}
            isEditing={true}
          />
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
            <button
              type="button"
              onClick={() => closeModal('edit')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading.edit}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {actionLoading.edit ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" />
                  Updating...
                </>
              ) : 'Update Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Seed Data Modal */}
      <Modal
        isOpen={modals.seed}
        onClose={() => closeModal('seed')}
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
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
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
              onClick={() => closeModal('seed')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSeedSubjects}
              disabled={actionLoading.seed}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {actionLoading.seed ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" />
                  Seeding...
                </>
              ) : 'Seed Subjects'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={modals.bulkUpload}
        onClose={() => closeModal('bulkUpload')}
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
              Upload CSV with columns: name, code, credits, year, semester, department, category, description
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <FiFileText className="mr-2" /> Download Template
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => closeModal('bulkUpload')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading.bulk}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {actionLoading.bulk ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : 'Upload'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Department View Modal */}
      <Modal
        isOpen={modals.departmentView}
        onClose={() => closeModal('departmentView')}
        title={`${selectedDepartmentView} Department - Subjects`}
        size="lg"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {ACADEMIC_YEARS.map(year => {
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
            onClick={() => closeModal('departmentView')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={modals.stats}
        onClose={() => closeModal('stats')}
        title="Subject Statistics"
        size="lg"
      >
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            {ACADEMIC_YEARS.map(year => {
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
                        {Object.entries(yearStats.byDepartment || {}).map(([dept, deptStats]) => (
                          <div key={dept} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-sm">{dept}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Total:</span>
                                <span className="font-semibold">{deptStats.total || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Sem 1:</span>
                                <span className="font-semibold text-blue-600">{deptStats.semester1 || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>Sem 2:</span>
                                <span className="font-semibold text-green-600">{deptStats.semester2 || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(yearStats.byCategory || {}).length > 0 && (
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
            onClick={() => closeModal('stats')}
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