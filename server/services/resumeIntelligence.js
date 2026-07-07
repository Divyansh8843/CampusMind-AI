import { callAiService, isAiUnavailableError } from './aiGateway.js';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const heuristicExtract = (resumeText = '') => {
  const text = String(resumeText || '');
  const lowered = text.toLowerCase();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const extracted = {
    name: lines[0]?.slice(0, 80) || '',
    college: '',
    degree: '',
    branch: '',
    graduation_year: '',
    company: '',
    job_title: ''
  };

  const collegeMatch = text.match(
    /([A-Z][\w\s&.-]{3,80}(?:University|Institute|College|IIT|NIT|IIIT|BITS|VIT)[\w\s&.-]*)/i
  );
  if (collegeMatch) extracted.college = collegeMatch[1].trim();

  // Try abbreviated forms first, then full forms
  const degreePatterns = [
    { pattern: 'b.tech', label: 'B.Tech' },
    { pattern: 'b.e.', label: 'B.E.' },
    { pattern: 'b. tech', label: 'B.Tech' },
    { pattern: 'bachelor of technology', label: 'B.Tech' },
    { pattern: 'bachelor of engineering', label: 'B.E.' },
    { pattern: 'm.tech', label: 'M.Tech' },
    { pattern: 'master of technology', label: 'M.Tech' },
    { pattern: 'diploma', label: 'Diploma' },
    { pattern: 'mba', label: 'MBA' },
    { pattern: 'master of business', label: 'MBA' },
    { pattern: 'bca', label: 'BCA' },
    { pattern: 'bachelor of computer application', label: 'BCA' },
    { pattern: 'mca', label: 'MCA' },
    { pattern: 'master of computer application', label: 'MCA' },
    { pattern: 'b.sc', label: 'B.Sc' },
    { pattern: 'bachelor of science', label: 'B.Sc' },
    { pattern: 'm.sc', label: 'M.Sc' },
    { pattern: 'master of science', label: 'M.Sc' },
    { pattern: 'b.arch', label: 'B.Arch' },
    { pattern: 'bachelor of architecture', label: 'B.Arch' },
    { pattern: 'b.com', label: 'B.Com' },
    { pattern: 'bachelor of commerce', label: 'B.Com' },
    { pattern: 'bba', label: 'BBA' },
    { pattern: 'ph.d', label: 'Ph.D' },
    { pattern: 'phd', label: 'Ph.D' },
    { pattern: 'doctor of philosophy', label: 'Ph.D' },
    { pattern: 'b.pharm', label: 'B.Pharm' },
  ];
  for (const { pattern, label } of degreePatterns) {
    if (lowered.includes(pattern)) {
      extracted.degree = label;
      break;
    }
  }

  const branchKeywords = [
    'computer science',
    'information technology',
    'mechanical engineering',
    'electrical engineering',
    'civil engineering',
    'electronics',
    'artificial intelligence',
    'data science'
  ];
  for (const keyword of branchKeywords) {
    if (lowered.includes(keyword)) {
      extracted.branch = keyword.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    }
  }

  const yearMatch =
    lowered.match(/(?:graduat(?:ed|ion)|pass(?:ed)?\s*out|class\s*of)\D{0,12}(20\d{2}|19\d{2})/) ||
    lowered.match(/\b(20\d{2}|19\d{2})\b/);
  if (yearMatch) extracted.graduation_year = yearMatch[1];

  const expMatch = text.match(
    /(?:experience|employment|work history|professional experience)\s*[:\-]?\s*([\s\S]+?)(?:\n\n|\neducation|\nskills|\nprojects|$)/i
  );
  if (expMatch) {
    const expLines = expMatch[1].split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (expLines[0]) extracted.company = expLines[0].slice(0, 80);
    if (expLines[1]) extracted.job_title = expLines[1].slice(0, 80);
  }

  return extracted;
};

export const extractResumeProfile = async (resumeText = '') => {
  const cleaned = String(resumeText || '').trim();
  if (cleaned.length < 40) {
    return {
      success: false,
      extracted: heuristicExtract(cleaned),
      source: 'heuristic',
      message: 'Resume text is too short for reliable extraction.'
    };
  }

  try {
    const response = await callAiService('/alumni-verification/extract', {
      resume_text: cleaned.slice(0, 12000)
    });

    const extracted = response?.extracted || response?.data?.extracted;
    if (extracted && typeof extracted === 'object') {
      return {
        success: Boolean(response?.success ?? true),
        extracted: {
          name: String(extracted.name || '').trim(),
          college: String(extracted.college || '').trim(),
          degree: String(extracted.degree || '').trim(),
          branch: String(extracted.branch || '').trim(),
          graduation_year: String(extracted.graduation_year || '').trim(),
          company: String(extracted.company || '').trim(),
          job_title: String(extracted.job_title || '').trim()
        },
        source: response?.source || 'ai'
      };
    }
  } catch (error) {
    if (!isAiUnavailableError(error)) {
      console.error('Resume intelligence AI error:', error.message);
    }
  }

  return {
    success: true,
    extracted: heuristicExtract(cleaned),
    source: 'heuristic'
  };
};

export const compareNameToLinkedIn = (name = '', linkedin = '') => {
  const raw = String(linkedin || '').trim();
  if (!raw) return 0;

  // Extract slug from the raw URL — normalize destroys :// so use raw
  const slugMatch = raw.match(/linkedin\.com\/(?:in|pub)\/([a-z0-9\-_%]+)/i);
  if (!slugMatch) return 0;

  const slug = normalize(slugMatch[1].replace(/-/g, ' '));
  const nameTokens = normalize(name).split(' ').filter((token) => token.length > 1);
  if (!nameTokens.length) return 0;

  const hits = nameTokens.filter((token) => slug.includes(token)).length;
  // Give at least 0.3 if any part of name appears in slug
  const ratio = hits / Math.max(nameTokens.length, 1);
  return hits > 0 ? Math.max(0.3, Math.min(1, ratio)) : 0;
};
