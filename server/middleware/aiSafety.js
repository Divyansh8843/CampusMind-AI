const MAX_PROMPT_LEN = parseInt(process.env.MAX_PROMPT_LEN || "4000", 10);

const INJECTION_PATTERNS = [
  /ignore\s+all\s+previous\s+instructions/i,
  /reveal\s+(system|developer)\s+prompt/i,
  /bypass\s+(safety|guardrails|policy)/i,
  /act\s+as\s+root/i,
  /exfiltrate|steal|dump\s+credentials/i,
];

const OFF_TOPIC_PATTERNS = [
  /\b(how\s+to\s+make|recipe\s+for|cook|brew|coffee|tea\s+recipe)\b/i,
  /\b(pizza|burger|pasta|biryani|noodles)\b/i,
  /\b(weather|forecast|temperature\s+in)\b/i,
  /\b(movie|netflix|song|lyrics|cricket\s+score|football\s+score)\b/i,
  /\b(joke|pickup\s+line|riddle|horoscope|astrology)\b/i,
  /\b(bitcoin|crypto\s+price|stock\s+price|forex)\b/i,
  /\b(dating|girlfriend|boyfriend\s+advice)\b/i,
];

const SUPPORT_TOPIC_KEYWORDS = [
  "campusmind",
  "login",
  "sign in",
  "signin",
  "google",
  "student",
  "alumni",
  "verify",
  "verification",
  "profile",
  "pricing",
  "price",
  "plan",
  "subscription",
  "payment",
  "resume",
  "interview",
  "mock",
  "job",
  "hackathon",
  "feature",
  "dashboard",
  "chat",
  "support",
  "help",
  "document",
  "upload",
  "resource",
  "planner",
  "community",
  "mentor",
  "map",
  "location",
  "privacy",
  "policy",
  "terms",
  "service",
  "data",
  "account",
  "password",
  "email",
  "domain",
  "ac.in",
  "edu",
  "gmail",
  "platform",
  "campus",
  "alumni network",
  "study chat",
  "analyzer",
  "contact",
  "refund",
  "cancel",
  "delete account",
];

const STUDY_TOPIC_KEYWORDS = [
  "study",
  "exam",
  "syllabus",
  "chapter",
  "unit",
  "topic",
  "subject",
  "notes",
  "document",
  "upload",
  "assignment",
  "homework",
  "quiz",
  "mcq",
  "define",
  "explain",
  "summarize",
  "summary",
  "solve",
  "formula",
  "theorem",
  "algorithm",
  "code",
  "program",
  "lab",
  "practical",
  "viva",
  "semester",
  "course",
  "lecture",
  "question",
  "answer",
  "derive",
  "proof",
  "concept",
  "theory",
  "numerical",
  "problem",
  "dsa",
  "math",
  "physics",
  "chemistry",
  "biology",
  "engineering",
  "computer",
  "database",
  "network",
  "operating system",
  "os",
  "campusmind",
  "rag",
  "pdf",
  "file",
];

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const validatePromptInput = (value) => {
  if (typeof value !== "string") return { ok: false, reason: "Message must be text." };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, reason: "Message cannot be empty." };
  if (trimmed.length > MAX_PROMPT_LEN) {
    return { ok: false, reason: `Message too long. Max ${MAX_PROMPT_LEN} chars.` };
  }
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: "Unsafe prompt content detected." };
    }
  }
  return { ok: true };
};

const matchesKeywords = (message, keywords) => {
  const normalized = normalize(message);
  return keywords.some((keyword) => normalized.includes(keyword));
};

const isOffTopic = (message) => OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(message));

export const validateSupportScope = (message = "") => {
  const trimmed = String(message || "").trim();
  if (!trimmed) {
    return { allowed: false, message: "Please enter a support question about CampusMind AI." };
  }
  if (isOffTopic(trimmed)) {
    return {
      allowed: false,
      message:
        "I can only help with CampusMind AI platform questions — login, pricing, features, alumni verification, privacy policy, and terms of service. For general questions like recipes or entertainment, please use another assistant.",
    };
  }
  if (matchesKeywords(trimmed, SUPPORT_TOPIC_KEYWORDS)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    message:
      "I'm CampusMind AI Support and answer platform-related questions only — login, pricing, alumni verification, study/resume/interview tools, privacy policy, and terms of service. How can I help with CampusMind?",
  };
};

export const validateStudyScope = (message = "", hasDocumentContext = false) => {
  const trimmed = String(message || "").trim();
  if (!trimmed) {
    return { allowed: false, message: "Please ask a study question related to your uploaded materials or academic topics." };
  }
  if (isOffTopic(trimmed)) {
    return {
      allowed: false,
      message:
        "Study Chat answers academic and uploaded-document questions only. Please ask about your syllabus, notes, assignments, or subjects — not unrelated topics like recipes or entertainment.",
    };
  }
  if (hasDocumentContext || matchesKeywords(trimmed, STUDY_TOPIC_KEYWORDS)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    message:
      "Study Chat is limited to academic questions and your uploaded study materials. Try asking about a chapter, concept, assignment, or upload a document first.",
  };
};
