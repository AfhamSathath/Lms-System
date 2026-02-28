/**
 * Calculate grade based on marks
 * @param {number} marks - Marks obtained (0-100)
 * @returns {Object} - Grade information
 */
exports.calculateGrade = (marks) => {
  const numMarks = parseFloat(marks) || 0;
  let grade, gradePoint, status;

  if (numMarks >= 90) {
    grade = 'A+';
    gradePoint = 4.0;
    status = 'pass';
  } else if (numMarks >= 85) {
    grade = 'A';
    gradePoint = 4.0;
    status = 'pass';
  } else if (numMarks >= 80) {
    grade = 'A-';
    gradePoint = 3.7;
    status = 'pass';
  } else if (numMarks >= 75) {
    grade = 'B+';
    gradePoint = 3.3;
    status = 'pass';
  } else if (numMarks >= 70) {
    grade = 'B';
    gradePoint = 3.0;
    status = 'pass';
  } else if (numMarks >= 65) {
    grade = 'B-';
    gradePoint = 2.7;
    status = 'pass';
  } else if (numMarks >= 60) {
    grade = 'C+';
    gradePoint = 2.3;
    status = 'pass';
  } else if (numMarks >= 55) {
    grade = 'C';
    gradePoint = 2.0;
    status = 'pass';
  } else if (numMarks >= 50) {
    grade = 'C-';
    gradePoint = 1.7;
    status = 'pass';
  } else if (numMarks >= 45) {
    grade = 'D+';
    gradePoint = 1.3;
    status = 'fail';
  } else if (numMarks >= 40) {
    grade = 'D';
    gradePoint = 1.0;
    status = 'fail';
  } else if (numMarks >= 35) {
    grade = 'E';
    gradePoint = 0.7;
    status = 'fail';
  } else {
    grade = 'F';
    gradePoint = 0.0;
    status = 'fail';
  }

  return { grade, gradePoint, status };
};

/**
 * Calculate GPA for a set of results
 * @param {Array} results - Array of result objects with gradePoint
 * @returns {number} - Calculated GPA
 */
exports.calculateGPA = (results) => {
  if (!results || results.length === 0) return 0;

  const totalPoints = results.reduce((sum, r) => sum + (r.gradePoint || 0), 0);
  return totalPoints / results.length;
};

/**
 * Calculate CGPA across all semesters
 * @param {Array} semesterGPAs - Array of semester GPA objects
 * @returns {number} - Calculated CGPA
 */
exports.calculateCGPA = (semesterGPAs) => {
  if (!semesterGPAs || semesterGPAs.length === 0) return 0;

  const totalGPA = semesterGPAs.reduce((sum, sem) => sum + sem.gpa, 0);
  return totalGPA / semesterGPAs.length;
};

/**
 * Check if grade is poor (needs attention)
 * @param {string} grade - Grade letter
 * @returns {boolean} - True if grade is poor
 */
exports.isPoorGrade = (grade) => {
  const poorGrades = ['D+', 'D', 'E', 'F'];
  return poorGrades.includes(grade);
};

/**
 * Get academic year from year string
 * @param {string} yearString - Year string (e.g., "1st Year")
 * @returns {number} - Year number
 */
exports.getYearNumber = (yearString) => {
  const match = yearString?.match(/(\d+)/);
  return match ? parseInt(match[0]) : 0;
};

/**
 * Get year from semester number (1-8)
 * @param {number} semesterNumber - Semester number (1-8)
 * @returns {Object} - Year and semester within year
 */
exports.getYearFromSemester = (semesterNumber) => {
  const yearNum = Math.ceil(semesterNumber / 2);
  const semWithinYear = semesterNumber % 2 === 0 ? 2 : 1;
  
  const yearMap = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year'
  };

  return {
    year: yearMap[yearNum] || 'Unknown',
    semester: semWithinYear
  };
};

/**
 * Get semester number from year and semester within year
 * @param {string} year - Year string (e.g., "1st Year")
 * @param {number} semesterWithinYear - Semester within year (1 or 2)
 * @returns {number} - Overall semester number (1-8)
 */
exports.getSemesterNumber = (year, semesterWithinYear) => {
  const yearMap = {
    '1st Year': 1,
    '2nd Year': 2,
    '3rd Year': 3,
    '4th Year': 4
  };

  const yearNum = yearMap[year] || 0;
  return (yearNum - 1) * 2 + semesterWithinYear;
};