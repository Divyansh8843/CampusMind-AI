import express from "express";
import authMiddleware from "../middleware/auth.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js"; // Added User Model
import Log from "../models/Log.js";
import { callAiService, isAiUnavailableError, summarizeAiError } from "../services/aiGateway.js";

import { checkUsageLimit, incrementUsage } from "../middleware/usage.js";

const router = express.Router();

// Local Heuristic Agent for Resume Analysis
const analyzeResumeLocally = (resumeText, jdText) => {
    const rText = resumeText.toLowerCase();
    const jText = (jdText || "").toLowerCase();
    
    // 1. Structure Check
    const sections = ["experience", "education", "projects", "skills", "certifications"];
    const foundSections = sections.filter(s => rText.includes(s));
    const structureScore = (foundSections.length / sections.length) * 20;

    // 2. JD Match (if JD provided)
    let keywordScore = 0;
    let missingKeywords = [];
    if (jText) {
        // Simple keyword extraction (ignore common words)
        const common = ["the", "and", "or", "to", "in", "a", "of", "for", "with", "on", "at", "is", "required", "responsibilities"];
        const jdKeywords = jText.split(/\W+/).filter(w => w.length > 3 && !common.includes(w));
        const uniqueKeywords = [...new Set(jdKeywords)]; // Dedup
        
        const matched = uniqueKeywords.filter(k => rText.includes(k));
        keywordScore = (matched.length / uniqueKeywords.length) * 50; // Max 50 pts for keywords
        
        missingKeywords = uniqueKeywords.filter(k => !rText.includes(k)).slice(0, 5);
    } else {
        // Default Scoring for General Quality
        keywordScore = 40; // Base score
    }

    // 3. Length/Content Check
    const lengthScore = Math.min(rText.length / 1000 * 10, 30); // Max 30 pts

    const totalScore = Math.min(Math.round(structureScore + keywordScore + lengthScore), 98); // Cap at 98%

    // Suggestions Logic
    const suggestions = [];
    if (foundSections.length < 3) suggestions.push("Add clear sections like 'Projects' and 'Experience'.");
    if (missingKeywords.length > 0) suggestions.push(`Include these keywords from the JD: ${missingKeywords.join(", ")}`);
    if (rText.length < 500) suggestions.push("Your resume is too short. Elaborate on your roles.");
    if (suggestions.length === 0) suggestions.push("Great job! Your resume looks strong.");

    return {
        match_percentage: `${totalScore}%`,
        missing_keywords: missingKeywords,
        suggestions: suggestions
    };
};

const RESUME_AI_TIMEOUT_MS = parseInt(process.env.AI_RESUME_TIMEOUT_MS || "15000", 10);

const buildResumeAdviceFallback = (analysis, jdText = "") => {
    const scoreLine = `Estimated match score: ${analysis?.match_percentage || "N/A"}.`;
    const keywordLine = analysis?.missing_keywords?.length
        ? `Add or strengthen these JD keywords: ${analysis.missing_keywords.join(", ")}.`
        : "Your keyword coverage looks reasonably aligned with the current job target.";
    const suggestionLines = (analysis?.suggestions || [])
        .slice(0, 3)
        .map((item) => `- ${item}`)
        .join("\n");
    const jdLine = jdText
        ? "Tailor your summary and top bullet points to mirror the role priorities in the job description."
        : "Add a role-specific summary for each application so the resume feels targeted, not generic.";

    return [
        "## Resume Review",
        scoreLine,
        "",
        "## Priority Improvements",
        keywordLine,
        jdLine,
        suggestionLines || "- Quantify impact with numbers, outcomes, and ownership.",
    ].join("\n");
};

// Multer Setup for Memory Storage
import multer from "multer";


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.RESUME_MAX_UPLOAD_MB || "5", 10) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set(["application/pdf", "text/plain"]);
    if (allowed.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or plain text resumes are allowed"));
    }
  },
});

// POST /api/resume/upload - Analyze Uploaded PDF
router.post("/upload", authMiddleware, upload.single('resume'), checkUsageLimit('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const jd = req.body.jd || "";
        let resumeText = "";

        // Parse PDF
       if (req.file.mimetype === 'application/pdf') {
    const pdfParse = (await import('../utils/pdf-wrapper.cjs')).default;
    const data = await pdfParse(req.file.buffer);
    resumeText = data.text;
} else {
            // Assume text/plain
            resumeText = req.file.buffer.toString('utf8');
        }

        if (!resumeText || resumeText.length < 50) {
            return res.status(400).json({ message: "Could not extract text from resume. Please upload a clear PDF." });
        }

        // 1. Perform Local Heuristic Analysis (Structured Data)
        const localAnalysis = analyzeResumeLocally(resumeText, jd);

        // 2. Perform AI Analysis (Python Microservice) for "Rewrite/Tailor Advice"
        let aiAdvice = buildResumeAdviceFallback(localAnalysis, jd);
        try {
             // Call Python Service
             const aiRes = await callAiService("/resume", {
                 resume_text: resumeText.substring(0, 5000), // Truncate to avoid huge payloads
                 job_description: jd.substring(0, 2000)
             }, {
                 timeout: RESUME_AI_TIMEOUT_MS,
             });
             if (aiRes.data && aiRes.data.response) {
                 aiAdvice = aiRes.data.response;
             }
        } catch (err) {
            const aiMessage = summarizeAiError(err);
            if (isAiUnavailableError(err)) {
                // console.warn(`AI resume advice fallback used: ${aiMessage}`);
            } else {
                console.error("AI Resume Agent Error:", aiMessage);
            }
        }

        // Merge Results
        const finalResponse = {
            ...localAnalysis,
            ai_advice: aiAdvice // Frontend can display this as "AI Suggestions"
        };
        
        // Save History
        try {
            const score = parseInt(localAnalysis.match_percentage);
            await Resume.create({
                userId: req.user.userId,
                score: isNaN(score) ? 0 : score,
                analysis: finalResponse,
                jobDescription: jd
            });
            
             await Log.create({
                action: 'Resume Upload & Analyzed',
                user: req.user.email,
                details: `Score: ${score}%`
            });

            // Award XP
            await User.findByIdAndUpdate(req.user.userId, { $inc: { xp: 50 } });
            await incrementUsage(req.user.userId, 'resume');

        } catch (dbError) {
             console.error("DB Save Error:", dbError);
        }

        res.json({ success: true, ...finalResponse });

    } catch (error) {
        console.error("Resume Upload Error:", error);
        res.status(500).json({ message: "Failed to process resume file" });
    }
});

// POST /api/resume/analyze (Legacy Text-Only)
router.post("/analyze", authMiddleware, checkUsageLimit('resume'), async (req, res) => {
  try {
      const { resume, jd } = req.body;
      
      // Perform Agentic Analysis locally
      const analysisData = analyzeResumeLocally(resume, jd);
      
      // Try to get AI Advice too
      let aiAdvice = buildResumeAdviceFallback(analysisData, jd);
      try {
             const aiRes = await callAiService("/resume", {
                 resume_text: resume, 
                 job_description: jd
             }, {
                 timeout: RESUME_AI_TIMEOUT_MS,
             });
             if (aiRes.data && aiRes.data.response) aiAdvice = aiRes.data.response;
      } catch (e) {
          const aiMessage = summarizeAiError(e);
          if (isAiUnavailableError(e)) {
              console.warn(`AI resume text-analysis fallback used: ${aiMessage}`);
          } else {
              console.error("AI Agent Warning:", aiMessage);
          }
      }

      const finalResponse = { ...analysisData, ai_advice: aiAdvice };

      // Save Analysis History
      try {
          const score = parseInt(analysisData.match_percentage);
          
          await Resume.create({
              userId: req.user.userId,
              score: isNaN(score) ? 0 : score,
              analysis: finalResponse,
              jobDescription: jd
          });

          await Log.create({
              action: 'Resume Analyzed (Text)',
              user: req.user.email,
              details: `Score: ${score}%`
          });
      } catch (dbError) {
          console.error("Failed to save resume history:", dbError);
      }

      // Increment Usage Counter
      await incrementUsage(req.user.userId, 'resume');
      
      // Award XP
      await User.findByIdAndUpdate(req.user.userId, { $inc: { xp: 50 } });

      res.json({ success: true, ...finalResponse });
  } catch (error) {
      console.error("Resume Analysis Error:", error);
      res.status(500).json({ message: "Failed to analyze resume" });
  }
});

export default router;
