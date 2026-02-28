// Computer Science Department Subjects (from your images)
const computerScienceSubjects = {
  '1st Year': {
    semester1: [
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
    semester2: [
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
    semester1: [
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
    semester2: [
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
    semester1: [
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
    semester2: [
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
    semester1: [
      { code: 'CS4121', name: 'Advanced Computer Architecture', credits: 3, category: 'Lecture' },
      { code: 'CS4122', name: 'Machine Learning', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS4112' },
      { code: 'CS4112', name: 'Practical work on CS4122', credits: 1, category: 'Practical' },
      { code: 'CS4123', name: 'Distributed Systems', credits: 3, category: 'Lecture' },
      { code: 'CS4124', name: 'Research Methodology', credits: 3, category: 'Lecture' },
      { code: 'CS41P1', name: 'Research Project - Part I', credits: 3, category: 'Project' },
    ],
    semester2: [
      { code: 'CS4221', name: 'Advanced Networking', credits: 3, category: 'Lecture' },
      { code: 'CS4222', name: 'Cloud Computing', credits: 3, category: 'Lecture' },
      { code: 'CS4223', name: 'Ethical Hacking', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'CS4213' },
      { code: 'CS4213', name: 'Practical work on CS4223', credits: 1, category: 'Practical' },
      { code: 'CS42P2', name: 'Research Project - Part II', credits: 6, category: 'Project' },
    ]
  }
};

// Software Engineering Department Subjects
const softwareEngineeringSubjects = {
  '1st Year': {
    semester1: [
      { code: 'SE1101', name: 'Fundamentals of Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1101P' },
      { code: 'SE1101P', name: 'Programming Lab', credits: 1, category: 'Practical' },
      { code: 'SE1102', name: 'Mathematics for Computing', credits: 3, category: 'Lecture' },
      { code: 'SE1103', name: 'Digital Logic Design', credits: 3, category: 'Lecture' },
      { code: 'SE1104', name: 'Communication Skills', credits: 2, category: 'General' },
      { code: 'SE1105', name: 'Introduction to Software Engineering', credits: 3, category: 'Lecture' },
    ],
    semester2: [
      { code: 'SE1201', name: 'Object Oriented Programming', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1201P' },
      { code: 'SE1201P', name: 'OOP Lab', credits: 1, category: 'Practical' },
      { code: 'SE1202', name: 'Data Structures', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE1202P' },
      { code: 'SE1202P', name: 'Data Structures Lab', credits: 1, category: 'Practical' },
      { code: 'SE1203', name: 'Database Systems', credits: 3, category: 'Lecture' },
      { code: 'SE1204', name: 'Web Development Basics', credits: 3, category: 'Lecture' },
    ]
  },
  '2nd Year': {
    semester1: [
      { code: 'SE2101', name: 'Software Requirements Engineering', credits: 3, category: 'Lecture' },
      { code: 'SE2102', name: 'Algorithms Analysis', credits: 3, category: 'Lecture' },
      { code: 'SE2103', name: 'UI/UX Design', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE2103P' },
      { code: 'SE2103P', name: 'UI/UX Lab', credits: 1, category: 'Practical' },
      { code: 'SE2104', name: 'Professional Development', credits: 2, category: 'General' },
    ],
    semester2: [
      { code: 'SE2201', name: 'Software Design and Architecture', credits: 3, category: 'Lecture' },
      { code: 'SE2202', name: 'Mobile App Development', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE2202P' },
      { code: 'SE2202P', name: 'Mobile Dev Lab', credits: 1, category: 'Practical' },
      { code: 'SE2203', name: 'Quality Assurance', credits: 3, category: 'Lecture' },
      { code: 'SE2204', name: 'Operating Systems', credits: 3, category: 'Lecture' },
    ]
  },
  '3rd Year': {
    semester1: [
      { code: 'SE3101', name: 'Software Project Management', credits: 3, category: 'Management' },
      { code: 'SE3102', name: 'Enterprise Architecture', credits: 3, category: 'Lecture' },
      { code: 'SE3103', name: 'Cloud Applications Development', credits: 3, category: 'Lecture' },
      { code: 'SE3104', name: 'Software Testing', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'SE3104P' },
      { code: 'SE3104P', name: 'Testing Lab', credits: 1, category: 'Practical' },
    ],
    semester2: [
      { code: 'SE3201', name: 'DevOps Practices', credits: 3, category: 'Lecture' },
      { code: 'SE3202', name: 'Advanced Web Development', credits: 3, category: 'Lecture' },
      { code: 'SE3203', name: 'Ethics in Computing', credits: 2, category: 'General' },
      { code: 'SE32P1', name: 'Group Project', credits: 4, category: 'Project' },
    ]
  },
  '4th Year': {
    semester1: [
      { code: 'SE4101', name: 'Software Evolution', credits: 3, category: 'Lecture' },
      { code: 'SE4102', name: 'IT Governance', credits: 3, category: 'Management' },
      { code: 'SE41P1', name: 'Capstone Project - Part I', credits: 4, category: 'Project' },
    ],
    semester2: [
      { code: 'SE4201', name: 'Software Entrepreneurship', credits: 3, category: 'Management' },
      { code: 'SE42P2', name: 'Capstone Project - Part II', credits: 6, category: 'Project' },
      { code: 'SE4202', name: 'Industrial Internship', credits: 4, category: 'Project' },
    ]
  }
};

// Information Technology Department Subjects
const informationTechnologySubjects = {
  '1st Year': {
    semester1: [
      { code: 'IT1101', name: 'Introduction to IT', credits: 3, category: 'Lecture' },
      { code: 'IT1102', name: 'Programming Fundamentals', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT1102P' },
      { code: 'IT1102P', name: 'Programming Lab', credits: 1, category: 'Practical' },
      { code: 'IT1103', name: 'Mathematics for IT', credits: 3, category: 'Lecture' },
      { code: 'IT1104', name: 'Digital Literacy', credits: 2, category: 'General' },
    ],
    semester2: [
      { code: 'IT1201', name: 'Web Technologies', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT1201P' },
      { code: 'IT1201P', name: 'Web Lab', credits: 1, category: 'Practical' },
      { code: 'IT1202', name: 'Database Management', credits: 3, category: 'Lecture' },
      { code: 'IT1203', name: 'Computer Networks Basics', credits: 3, category: 'Lecture' },
    ]
  },
  '2nd Year': {
    semester1: [
      { code: 'IT2101', name: 'System Administration', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT2101P' },
      { code: 'IT2101P', name: 'SysAdmin Lab', credits: 1, category: 'Practical' },
      { code: 'IT2102', name: 'Information Security', credits: 3, category: 'Lecture' },
      { code: 'IT2103', name: 'Business Analysis', credits: 3, category: 'Management' },
    ],
    semester2: [
      { code: 'IT2201', name: 'Network Security', credits: 3, category: 'Lecture' },
      { code: 'IT2202', name: 'Cloud Infrastructure', credits: 3, category: 'Lecture' },
      { code: 'IT2203', name: 'IT Support Services', credits: 3, category: 'Lecture' },
    ]
  },
  '3rd Year': {
    semester1: [
      { code: 'IT3101', name: 'Enterprise Networks', credits: 3, category: 'Lecture' },
      { code: 'IT3102', name: 'Cyber Security', credits: 3, category: 'Lecture', hasPractical: true, practicalCode: 'IT3102P' },
      { code: 'IT3102P', name: 'Security Lab', credits: 1, category: 'Practical' },
      { code: 'IT3103', name: 'IT Project Management', credits: 3, category: 'Management' },
    ],
    semester2: [
      { code: 'IT3201', name: 'Data Center Management', credits: 3, category: 'Lecture' },
      { code: 'IT3202', name: 'IT Service Management', credits: 3, category: 'Management' },
      { code: 'IT32P1', name: 'Industrial Placement', credits: 6, category: 'Project' },
    ]
  },
  '4th Year': {
    semester1: [
      { code: 'IT4101', name: 'Emerging Technologies', credits: 3, category: 'Lecture' },
      { code: 'IT4102', name: 'IT Strategy', credits: 3, category: 'Management' },
      { code: 'IT41P1', name: 'Final Year Project - Part I', credits: 4, category: 'Project' },
    ],
    semester2: [
      { code: 'IT4201', name: 'Digital Transformation', credits: 3, category: 'Lecture' },
      { code: 'IT42P2', name: 'Final Year Project - Part II', credits: 6, category: 'Project' },
    ]
  }
};

// Helper function to get subjects by department
const getDepartmentSubjects = (department) => {
  switch(department) {
    case 'Computer Science':
      return computerScienceSubjects;
    case 'Software Engineering':
      return softwareEngineeringSubjects;
    case 'Information Technology':
      return informationTechnologySubjects;
    default:
      return computerScienceSubjects;
  }
};

// Helper function to get all subjects for seeding
const getAllSubjectsForSeeding = () => {
  const allSubjects = [];
  const departments = ['Computer Science', 'Software Engineering', 'Information Technology'];
  
  departments.forEach(dept => {
    const deptSubjects = getDepartmentSubjects(dept);
    
    Object.keys(deptSubjects).forEach(year => {
      ['semester1', 'semester2'].forEach(semKey => {
        const semester = semKey === 'semester1' ? 1 : 2;
        const subjects = deptSubjects[year][semKey] || [];
        
        subjects.forEach(sub => {
          allSubjects.push({
            ...sub,
            year,
            semester,
            department: dept,
            isActive: true
          });
        });
      });
    });
  });
  
  return allSubjects;
};

// Export using ES6 syntax
export {
  computerScienceSubjects,
  softwareEngineeringSubjects,
  informationTechnologySubjects,
  getDepartmentSubjects,
  getAllSubjectsForSeeding
};