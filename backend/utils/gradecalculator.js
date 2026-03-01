/**
 * Calculate grade based on marks
 * @param {number} marks - Marks obtained (0-100)
 * @returns {object} Grade information
 */
exports.calculateGrade = (marks) => {
  let grade, gradePoint, status;

  if (marks >= 85) {
    grade = 'A+';
    gradePoint = 4.0;
    status = 'pass';
  } else if (marks >= 80) {
    grade = 'A';
    gradePoint = 4.0;
    status = 'pass';
  } else if (marks >= 75) {
    grade = 'A-';
    gradePoint = 3.7;
    status = 'pass';
  } else if (marks >= 70) {
    grade = 'B+';
    gradePoint = 3.3;
    status = 'pass';
  } else if (marks >= 65) {
    grade = 'B';
    gradePoint = 3.0;
    status = 'pass';
  } else if (marks >= 60) {
    grade = 'B-';
    gradePoint = 2.7;
    status = 'pass';
  } else if (marks >= 55) {
    grade = 'C+';
    gradePoint = 2.3;
    status = 'pass';
  } else if (marks >= 50) {
    grade = 'C';
    gradePoint = 2.0;
    status = 'pass';
  } else if (marks >= 45) {
    grade = 'C-';
    gradePoint = 1.7;
    status = 'pass';
  } else if (marks >= 40) {
    grade = 'D+';
    gradePoint = 1.3;
    status = 'pass';
  } else if (marks >= 35) {
    grade = 'D';
    gradePoint = 1.0;
    status = 'pass';
  } else if (marks >= 30) {
    grade = 'E';
    gradePoint = 0.5;
    status = 'pass';
  } else {
    grade = 'F';
    gradePoint = 0.0;
    status = 'fail';
  }

  return { grade, gradePoint, status };
};

/**
 * Calculate grade point from marks
 * @param {number} marks - Marks obtained
 * @returns {number} Grade point
 */
exports.calculateGradePoint = (marks) => {
  return exports.calculateGrade(marks).gradePoint;
};

/**
 * Get grade from marks
 * @param {number} marks - Marks obtained
 * @returns {string} Grade
 */
exports.getGradeFromMarks = (marks) => {
  return exports.calculateGrade(marks).grade;
};

/**
 * Calculate GPA from results
 * @param {Array} results - Array of results with gradePoint and credits
 * @returns {number} GPA
 */
exports.calculateGPA = (results) => {
  if (!results || results.length === 0) return 0;

  let totalCredits = 0;
  let totalGradePoints = 0;

  results.forEach(result => {
    const credits = result.course?.credits || 0;
    totalCredits += credits;
    totalGradePoints += credits * result.gradePoint;
  });

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
};

/**
 * Check if grade is poor (F, E, D)
 * @param {string} grade - Grade
 * @returns {boolean} True if grade is poor
 */
exports.isPoorGrade = (grade) => {
  return ['F', 'E', 'D', 'D+'].includes(grade);
};