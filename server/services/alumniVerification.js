import crypto from 'crypto';
import Document from '../models/Document.js';
import {
  isValidCompany,
  isValidCourseBranchPair,
  isValidJobRole
} from '../data/academicOptions.js';
import { extractResumeProfile } from './resumeIntelligence.js';
import { buildTrustScore, resolveVerificationDecision } from './alumniTrustEngine.js';

const normalize = (value) => String(value || '').trim().toLowerCase();

const INDIAN_INSTITUTION_KEYWORDS = [
  'university', 'institute', 'college', 'iit', 'nit', 'iiit', 'bits', 'vit', 'srm',
  'amity', 'lovely', 'manipal', 'symbiosis', 'vellore', 'engineering', 'polytechnic',
  'academy', 'school', 'technological', 'national', 'deemed', 'campus'
];

const isValidIndianInstitutionName = (name) => {
  const value = normalize(name);
  if (value.length < 4) return false;
  if (/^(test|fake|abc|xyz|asdf|demo|sample)\b/.test(value)) return false;
  const hasKeyword = INDIAN_INSTITUTION_KEYWORDS.some((keyword) => value.includes(keyword));
  const hasMeaningfulWords = value.split(/\s+/).filter((part) => part.length > 2).length >= 2;
  return hasKeyword || hasMeaningfulWords;
};

export const VERIFICATION_FIELDS = [
  'collegeName',
  'course',
  'branch',
  'graduationYear',
  'company',
  'jobRole',
  'resumeUrl'
];

export const MONITORED_VERIFICATION_FIELDS = [
  ...VERIFICATION_FIELDS,
  'linkedin',
  'name',
  'resumeDocumentId'
];

export const buildProfileFingerprint = (user) => {
  const payload = MONITORED_VERIFICATION_FIELDS.map((field) => normalize(user[field])).join('|');
  return crypto.createHash('sha256').update(payload).digest('hex');
};

const isValidLinkedInUrl = (url) => {
  // Use raw original value — do NOT normalize (stripping : // would break URL parsing)
  const raw = String(url || '').trim();
  if (!raw) return true; // empty is allowed (optional field)
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host !== 'linkedin.com') return false;
    return /^\/(in|pub)\/[a-z0-9\-_%]+\/?$/i.test(parsed.pathname);
  } catch {
    return /linkedin\.com\/(in|pub)\/[a-z0-9\-_%]+/i.test(raw);
  }
};

export const getResumeTextForUser = async (user) => {
  if (user.resumeDocumentId) {
    const document = await Document.findById(user.resumeDocumentId).select('+textContent');
    if (document?.textContent?.trim()) {
      return document.textContent.trim();
    }
  }

  const latestResumeDoc = await Document.findOne({
    userId: user._id,
    $or: [{ category: 'resume' }, { originalName: /\.(pdf|doc|docx|txt)$/i }]
  })
    .sort({ uploadDate: -1 })
    .select('+textContent');

  return latestResumeDoc?.textContent?.trim() || '';
};

const validateProfileBasics = (user) => {
  const checks = [];
  const addCheck = (key, passed, message) => checks.push({ key, passed, message });

  const mandatoryFields = [
    'collegeName',
    'course',
    'branch',
    'graduationYear',
    'company',
    'jobRole',
    'resumeUrl'
  ];
  const profileComplete = mandatoryFields.every((field) => String(user[field] || '').trim().length > 0);
  addCheck(
    'profileComplete',
    profileComplete,
    profileComplete
      ? 'All mandatory alumni onboarding fields are complete.'
      : 'College, course & branch, graduation year, company, role, and resume upload are required.'
  );

  const collegeValid = isValidIndianInstitutionName(user.collegeName);
  addCheck(
    'collegeValid',
    collegeValid,
    collegeValid ? 'College or university name is valid.' : 'Enter a valid Indian college or university name.'
  );

  const courseBranchValid = isValidCourseBranchPair(user.course, user.branch);
  addCheck(
    'courseBranchValid',
    courseBranchValid,
    courseBranchValid
      ? 'Course and branch combination is valid.'
      : 'Select a valid course & branch from the dropdown list.'
  );

  const graduationYear = String(user.graduationYear || '').trim();
  const currentYear = new Date().getFullYear();
  const graduationYearValid =
    /^\d{4}$/.test(graduationYear) &&
    Number(graduationYear) >= 1990 &&
    Number(graduationYear) <= currentYear;
  addCheck(
    'graduationYearValid',
    graduationYearValid,
    graduationYearValid
      ? 'Graduation year is valid.'
      : `Graduation year must be a 4-digit year between 1990 and ${currentYear}.`
  );

  const companyValid = isValidCompany(user.company);
  addCheck(
    'companyValid',
    companyValid,
    companyValid
      ? 'Company is valid.'
      : 'Select a company from the list or enter your company name (minimum 2 characters).'
  );

  const roleValid = isValidJobRole(user.jobRole);
  addCheck(
    'roleValid',
    roleValid,
    roleValid
      ? 'Professional role is valid.'
      : 'Select a role from the list or enter your professional role (minimum 2 characters).'
  );

  const linkedin = String(user.linkedin || '').trim();
  const linkedinValid = !linkedin || isValidLinkedInUrl(linkedin);
  addCheck(
    'linkedinValid',
    linkedinValid,
    linkedinValid ? 'LinkedIn profile URL format is valid.' : 'LinkedIn URL must be a valid linkedin.com/in/ profile link.'
  );

  const requiredKeys = [
    'profileComplete',
    'collegeValid',
    'courseBranchValid',
    'graduationYearValid',
    'companyValid',
    'roleValid',
    'linkedinValid'
  ];

  return {
    checks,
    canProceed: requiredKeys.every((key) => checks.find((check) => check.key === key)?.passed)
  };
};

/** AI-powered alumni verification: resume intelligence + trust score + decision engine. */
export const runAiAlumniVerification = async (user) => {
  const { checks, canProceed } = validateProfileBasics(user);
  if (!canProceed) {
    return {
      status: 'unverified',
      decision: 'incomplete',
      checks,
      trustScore: 0,
      trustBreakdown: {},
      resumeExtracted: {},
      extractionSource: null,
      rejectionReason: checks
        .filter((check) => !check.passed)
        .map((check) => check.message)
        .join(' '),
      profileFingerprint: buildProfileFingerprint(user),
      verifiedBy: null
    };
  }

  const resumeText = await getResumeTextForUser(user);
  if (!resumeText || resumeText.length < 40) {
    checks.push({
      key: 'resumeText',
      passed: false,
      message: 'Upload a readable resume (PDF or text) so AI can verify your profile.'
    });
    return {
      status: 'unverified',
      decision: 'resume_unreadable',
      checks,
      trustScore: 0,
      trustBreakdown: {},
      resumeExtracted: {},
      extractionSource: null,
      rejectionReason: 'Resume text could not be extracted. Upload a PDF resume with selectable text.',
      profileFingerprint: buildProfileFingerprint(user),
      verifiedBy: null
    };
  }

  const intelligence = await extractResumeProfile(resumeText);
  const resumeExtracted = intelligence.extracted || {};
  const trust = buildTrustScore(
    {
      name: user.name,
      collegeName: user.collegeName,
      course: user.course,
      branch: user.branch,
      graduationYear: user.graduationYear,
      company: user.company,
      jobRole: user.jobRole,
      linkedin: user.linkedin
    },
    resumeExtracted
  );

  const decision = resolveVerificationDecision(trust.total);

  checks.push({
    key: 'resumeIntelligence',
    passed: Boolean(intelligence.success),
    message: intelligence.success
      ? `Resume intelligence completed (${intelligence.source}).`
      : 'Resume intelligence could not extract enough structured data.'
  });

  checks.push({
    key: 'trustScore',
    passed: trust.total >= 70,
    message: `AI Trust Score: ${trust.total}/100`
  });

  Object.entries(trust.breakdown).forEach(([key, item]) => {
    checks.push({
      key: `match_${key}`,
      passed: item.score >= Math.round(item.max * 0.6),
      message: `${key}: ${item.score}/${item.max}`
    });
  });

  const now = new Date();

  return {
    status: decision.status,
    decision: decision.decision,
    checks,
    trustScore: trust.total,
    trustBreakdown: trust.breakdown,
    resumeExtracted,
    extractionSource: intelligence.source,
    rejectionReason: decision.status === 'rejected' ? decision.message : '',
    profileFingerprint: buildProfileFingerprint(user),
    verifiedBy: decision.verifiedBy,
    verifiedAt: decision.status === 'verified' ? now : null,
    rejectedAt: decision.status === 'rejected' ? now : null,
    message: decision.message
  };
};

export const runCommunityVerificationSubmit = runAiAlumniVerification;
export const runZeroTrustChecks = runAiAlumniVerification;

export const isAlumniZeroTrustVerified = (user) =>
  user?.role === 'alumni' && user?.alumniVerification?.status === 'verified';

export const hasVerificationFieldChanges = (user, updates) =>
  MONITORED_VERIFICATION_FIELDS.some((field) => {
    if (updates[field] === undefined) return false;
    return normalize(updates[field]) !== normalize(user[field]);
  });

export const shouldRecalculateTrust = (user, updates) =>
  user?.role === 'alumni' &&
  MONITORED_VERIFICATION_FIELDS.some((field) => updates[field] !== undefined);
