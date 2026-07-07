export const ENGINEERING_BRANCHES = [
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Electronics Engineering',
  'Electronics & Telecommunication Engineering',
  'Chemical Engineering',
  'Automobile Engineering',
  'Biotechnology',
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Computer Science and Technology',
  'Computer Science and Design',
  'Computer Science and Business Systems',
  'Electrical and Computer Engineering',
  'Mathematics and Computing',
  'Information Technology (Artificial Intelligence & Robotics)',
  'Internet of Things (IoT)',
  'Artificial Intelligence (AI)',
  'Artificial Intelligence (AI) and Data Science',
  'Artificial Intelligence and Machine Learning'
];

export const MANAGEMENT_BRANCHES = [
  'Finance',
  'Marketing',
  'Human Resources',
  'Operations',
  'Business Analytics',
  'International Business',
  'Entrepreneurship'
];

export const SCIENCE_BRANCHES = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Computer Science',
  'Biotechnology',
  'Microbiology'
];

export const ENGINEERING_COURSES = ['Diploma', 'B.Tech', 'B.E.', 'M.Tech'];
export const MANAGEMENT_COURSES = ['MBA', 'BBA', 'B.Com'];
export const CS_COURSES = ['BCA', 'MCA'];
export const SCIENCE_COURSES = ['B.Sc', 'M.Sc', 'B.Pharm', 'Ph.D'];

const buildCourseBranchOptions = () => {
  const options = [];

  ENGINEERING_COURSES.forEach((course) => {
    ENGINEERING_BRANCHES.forEach((branch) => {
      options.push({ course, branch, label: `${course} - ${branch}` });
    });
  });

  options.push({ course: 'B.Arch', branch: 'Architecture', label: 'B.Arch - Architecture' });

  CS_COURSES.forEach((course) => {
    [
      'Computer Science & Engineering (CSE)',
      'Information Technology (IT)',
      'Artificial Intelligence (AI)',
      'Artificial Intelligence and Machine Learning',
      'Artificial Intelligence (AI) and Data Science'
    ].forEach((branch) => {
      options.push({ course, branch, label: `${course} - ${branch}` });
    });
  });

  MANAGEMENT_COURSES.forEach((course) => {
    MANAGEMENT_BRANCHES.forEach((branch) => {
      options.push({ course, branch, label: `${course} - ${branch}` });
    });
  });

  SCIENCE_COURSES.forEach((course) => {
    SCIENCE_BRANCHES.forEach((branch) => {
      options.push({ course, branch, label: `${course} - ${branch}` });
    });
  });

  return options;
};

export const COURSE_BRANCH_OPTIONS = buildCourseBranchOptions();

export const COURSES = [...new Set(COURSE_BRANCH_OPTIONS.map((item) => item.course))];
export const BRANCHES = [...new Set(COURSE_BRANCH_OPTIONS.map((item) => item.branch))];

export const COMPANIES = [
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Oracle', 'IBM',
  'TCS', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra', 'Cognizant', 'Capgemini',
  'Accenture', 'Deloitte', 'EY', 'KPMG', 'PwC', 'Goldman Sachs', 'Morgan Stanley', 'JP Morgan',
  'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'PhonePe', 'Razorpay', 'Ola', 'Uber',
  'BYJU\'S', 'Unacademy', 'Freshworks', 'Zoho', 'SAP', 'Salesforce', 'Intel', 'NVIDIA',
  'Qualcomm', 'Samsung', 'L&T', 'Reliance Jio', 'Airtel', 'Startup / Self-employed', 'Freelance', 'Other'
];

export const JOB_ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer',
  'Backend Developer', 'Mobile Developer', 'DevOps Engineer', 'Site Reliability Engineer',
  'Cloud Architect', 'Data Scientist', 'Machine Learning Engineer', 'AI Engineer', 'Data Analyst',
  'Business Analyst', 'Product Manager', 'Associate Product Manager', 'UX Designer', 'UI/UX Designer',
  'QA Engineer', 'Test Automation Engineer', 'Technical Lead', 'Engineering Manager',
  'Project Manager', 'Scrum Master', 'Consultant', 'Management Consultant', 'Research Scientist',
  'Professor / Lecturer', 'Founder / Co-founder', 'Intern', 'Graduate Trainee', 'Other'
];

const normalize = (value = '') => String(value || '').trim().toLowerCase();

export const getCourseBranchLabel = (course = '', branch = '') => {
  const match = COURSE_BRANCH_OPTIONS.find(
    (item) => normalize(item.course) === normalize(course) && normalize(item.branch) === normalize(branch)
  );
  return match?.label || (course && branch ? `${course} - ${branch}` : '');
};

export const parseCourseBranchLabel = (label = '') => {
  const match = COURSE_BRANCH_OPTIONS.find((item) => item.label === label);
  if (match) return { course: match.course, branch: match.branch };
  const parts = String(label).split(' - ');
  if (parts.length >= 2) {
    return { course: parts[0].trim(), branch: parts.slice(1).join(' - ').trim() };
  }
  return { course: '', branch: '' };
};

export const isValidCourseBranchPair = (course, branch) =>
  COURSE_BRANCH_OPTIONS.some(
    (item) => normalize(item.course) === normalize(course) && normalize(item.branch) === normalize(branch)
  );

export const isPlaceholderOption = (value) => normalize(value) === 'other';

export const isValidCompany = (company) => {
  const value = String(company || '').trim();
  if (!value || isPlaceholderOption(value)) return false;
  if (COMPANIES.some((item) => normalize(item) === normalize(value) && !isPlaceholderOption(item))) {
    return true;
  }
  return value.length >= 2;
};

export const isValidJobRole = (jobRole) => {
  const value = String(jobRole || '').trim();
  if (!value || isPlaceholderOption(value)) return false;
  if (JOB_ROLES.some((item) => normalize(item) === normalize(value) && !isPlaceholderOption(item))) {
    return true;
  }
  return value.length >= 2;
};
