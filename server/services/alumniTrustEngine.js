import { compareNameToLinkedIn } from './resumeIntelligence.js';

export const TRUST_WEIGHTS = {
  name: 15,
  college: 25,
  degree: 15,
  branch: 10,
  graduationYear: 15,
  company: 10,
  linkedin: 10
};

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value) => normalize(value).split(' ').filter((token) => token.length > 1);

const similarity = (left = '', right = '') => {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;

  const tokensA = new Set(tokenize(a));
  const tokensB = tokenize(b);
  if (!tokensA.size || !tokensB.length) return 0;

  const overlap = tokensB.filter((token) => tokensA.has(token)).length;
  return Math.min(0.85, overlap / Math.max(tokensA.size, tokensB.length));
};

const scoreField = (weight, formValue, resumeValue) => {
  const ratio = similarity(formValue, resumeValue);
  return {
    score: Math.round(weight * ratio),
    max: weight,
    ratio,
    formValue: String(formValue || '').trim(),
    resumeValue: String(resumeValue || '').trim()
  };
};

const isValidLinkedInUrl = (url = '') => {
  // Use raw original value — do NOT normalize (stripping : // would break URL parsing)
  const raw = String(url || '').trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    const host = parsed.hostname.replace(/^www\./, '');
    return host === 'linkedin.com' && /^\/(in|pub)\/[a-z0-9\-_%]+\/?$/i.test(parsed.pathname);
  } catch {
    // Fallback: check if it at least looks like a linkedin profile link
    return /linkedin\.com\/(in|pub)\/[a-z0-9\-_%]+/i.test(raw);
  }
};

// Expand course/degree aliases so B.Tech matches "Bachelor of Technology", etc.
const DEGREE_ALIASES = {
  'b.tech': ['btech', 'b tech', 'bachelor of technology', 'b.tech.', 'be', 'b.e', 'b.e.'],
  'b.e.': ['be', 'b e', 'bachelor of engineering', 'btech', 'b.tech'],
  'm.tech': ['mtech', 'm tech', 'master of technology', 'm.tech.'],
  'mba': ['master of business administration', 'm.b.a', 'pgdm'],
  'bca': ['bachelor of computer applications', 'b.c.a'],
  'mca': ['master of computer applications', 'm.c.a'],
  'b.sc': ['bsc', 'b sc', 'bachelor of science', 'b.sc.'],
  'm.sc': ['msc', 'm sc', 'master of science', 'm.sc.'],
  'diploma': ['dip', 'polytechnic', 'diploma in engineering'],
  'b.arch': ['b arch', 'bachelor of architecture'],
  'b.com': ['bcom', 'b com', 'bachelor of commerce'],
  'bba': ['bachelor of business administration', 'b.b.a'],
  'ph.d': ['phd', 'doctorate', 'doctor of philosophy']
};

const expandDegree = (course = '') => {
  const norm = normalize(course);
  for (const [key, aliases] of Object.entries(DEGREE_ALIASES)) {
    if (norm === key || norm === normalize(key) || aliases.some(a => norm === normalize(a))) {
      // Return all aliases so similarity can match any form
      return [key, ...aliases].join(' ');
    }
  }
  return norm;
};

export const buildTrustScore = (formProfile = {}, resumeExtracted = {}) => {
  // Expand degree aliases for comparison
  const formDegree = expandDegree(formProfile.course);
  const resumeDegree = expandDegree(resumeExtracted.degree);

  const breakdown = {
    name: scoreField(TRUST_WEIGHTS.name, formProfile.name, resumeExtracted.name),
    college: scoreField(TRUST_WEIGHTS.college, formProfile.collegeName, resumeExtracted.college),
    degree: scoreField(TRUST_WEIGHTS.degree, formDegree, resumeDegree),
    branch: scoreField(TRUST_WEIGHTS.branch, formProfile.branch, resumeExtracted.branch),
    graduationYear: scoreField(
      TRUST_WEIGHTS.graduationYear,
      formProfile.graduationYear,
      resumeExtracted.graduation_year
    ),
    company: scoreField(TRUST_WEIGHTS.company, formProfile.company, resumeExtracted.company),
    linkedin: { score: 0, max: TRUST_WEIGHTS.linkedin, ratio: 0, formValue: '', resumeValue: '' }
  };

  const linkedin = String(formProfile.linkedin || '').trim();
  if (linkedin) {
    const formatValid = isValidLinkedInUrl(linkedin);
    const nameConsistency = compareNameToLinkedIn(formProfile.name, linkedin);
    // Valid format: at least 0.5 + name bonus. Invalid but has linkedin.com: partial 0.4
    const linkedinRatio = formatValid
      ? Math.max(0.5, nameConsistency)
      : /linkedin\.com/i.test(linkedin)
        ? 0.4
        : 0.2;
    breakdown.linkedin = {
      score: Math.round(TRUST_WEIGHTS.linkedin * linkedinRatio),
      max: TRUST_WEIGHTS.linkedin,
      ratio: linkedinRatio,
      formValue: linkedin,
      resumeValue: formatValid ? 'Valid LinkedIn profile format' : 'LinkedIn URL format issue — ensure it is linkedin.com/in/yourname'
    };
  }

  const total = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);

  return {
    total,
    breakdown,
    maxScore: 100
  };
};

export const resolveVerificationDecision = (trustScore = 0) => {
  if (trustScore >= 90) {
    return {
      status: 'verified',
      decision: 'verified',
      message: 'AI Trust Score passed. Verified Alumni badge granted.',
      verifiedBy: 'system'
    };
  }

  if (trustScore >= 70) {
    return {
      status: 'pending',
      decision: 'additional_proof_required',
      message:
        'Additional proof required. Your profile is mostly consistent — upload an updated resume or add LinkedIn for faster approval.',
      verifiedBy: null
    };
  }

  return {
    status: 'rejected',
    decision: 'failed',
    message:
      'Verification failed. Resume data does not sufficiently match your profile. Update your form or upload an accurate resume and retry.',
    verifiedBy: null
  };
};
