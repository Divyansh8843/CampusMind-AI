export const getEmailDomain = (email = '') => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized.includes('@')) return '';
  return normalized.split('@')[1];
};

export const getAlumniVerificationStatus = (user = {}) =>
  user?.alumniVerification?.status || 'unverified';

export const getAlumniTrustScore = (user = {}) =>
  Number(user?.alumniVerification?.trustScore || 0);

export const isAlumniFullyVerified = (user = {}) => {
  if (!user || user.role !== 'alumni') return true;
  return getAlumniVerificationStatus(user) === 'verified';
};

export const isAlumniVerificationPending = (user = {}) =>
  user?.role === 'alumni' && getAlumniVerificationStatus(user) === 'pending';

export const getAlumniVerificationChecks = (user = {}) =>
  user?.alumniVerification?.checks || [];

export const getAlumniTrustBreakdown = (user = {}) =>
  user?.alumniVerification?.trustBreakdown || {};

export const hasCompleteStudentProfile = (user = {}) => {
  if (!user || user.role !== 'student') return true;

  const requiredFields = [
    user.collegeName,
    user.course,
    user.branch,
    user.year,
    user.enrollment
  ];

  return requiredFields.every((field) => String(field || '').trim().length > 0);
};

export const isPlaceholderOption = (value) =>
  String(value || '').trim().toLowerCase() === 'other';

export const isValidCustomCompany = (company) => {
  const value = String(company || '').trim();
  return value.length >= 2 && !isPlaceholderOption(value);
};

export const isValidCustomJobRole = (jobRole) => {
  const value = String(jobRole || '').trim();
  return value.length >= 2 && !isPlaceholderOption(value);
};

export const hasCompleteAlumniProfile = (user = {}) => {
  if (!user || user.role !== 'alumni') return true;

  const requiredFields = [
    user.name,
    user.collegeName,
    user.course,
    user.branch,
    user.graduationYear,
    user.company,
    user.jobRole,
    user.resumeUrl
  ];

  return requiredFields.every((field) => String(field || '').trim().length > 0)
    && !isPlaceholderOption(user.company)
    && !isPlaceholderOption(user.jobRole);
};
