import express from "express";
import axios from "axios";
import authMiddleware from "../middleware/auth.js";
import nodemailer from "nodemailer";
import Job from "../models/Job.js";

const router = express.Router();

// Email Transport Configuration (Reused)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// GET /api/jobs - Fetch matched jobs (Paginated)
router.get("/", authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { search, source } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        
        // Search Filter (Title, Company, Skills)
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } }
            ];
        }

        // Source Filter
        if (source && source !== 'all') {
            query.source = { $regex: source, $options: 'i' };
        }

        const [jobs, total] = await Promise.all([
            Job.find(query)
                .sort({ postedDate: -1 })
                .skip(skip)
                .limit(limit),
            Job.countDocuments(query)
        ]);

        res.json({ 
            success: true, 
            jobs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Fetch Jobs Error:", error);
        res.status(500).json({ message: "Failed to fetch opportunities" });
    }
});

// Helper: Send Email Notification for Jobs
const sendJobAlertEmail = async (email, job) => {
    if (!process.env.EMAIL_USER) return;
    try {
        await transporter.sendMail({
            from: `"CampusMind AI Agent" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `New Job Opportunity Found: ${job.title}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; color: white; }
                        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; }
                        .job-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; }
                        .job-title { font-size: 20px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 10px; }
                        .company { color: #64748b; font-weight: 600; margin-bottom: 5px; }
                        .details { margin: 10px 0; font-size: 14px; color: #475569; }
                        .tag { display: inline-block; background-color: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-right: 5px; }
                        .cta-button { display: block; width: 100%; max-width: 200px; margin: 30px auto 0; padding: 14px 20px; background-color: #2563eb; color: #ffffff; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s; }
                        .cta-button:hover { background-color: #1d4ed8; }
                        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>CampusMind AI</h1>
                        </div>
                        <div class="content">
                            <h2 style="color: #2563eb; margin-top: 0;">New Opportunity Detected 🚀</h2>
                            <p>Hello,</p>
                            <p>Our intelligent AI agents have just discovered a new career opportunity that matches your profile perfectly. Here are the details:</p>
                            
                            <div class="job-card">
                                <h3 class="job-title">${job.title}</h3>
                                <div class="company">🏢 ${job.company}</div>
                                <div class="details">📍 ${job.location} &nbsp;|&nbsp; 🔗 ${job.source}</div>
                                <div style="margin-top: 15px;">
                                    ${job.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                                </div>
                            </div>
                            
                            <p>Don't miss out on this chance to accelerate your career.</p>
                            
                            <a href="${job.link}" class="cta-button">Apply Now</a>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} CampusMind AI. All rights reserved.</p>
                            <p>Empowering Students Globally.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });
        console.log(`Job Alert sent to ${email}`);
    } catch (error) {
        console.error("Job Alert Email failed:", error);
    }
};

// POST /api/jobs/scrape - Trigger AI Agent Scraper & Aggregator
router.post("/scrape", authMiddleware, async (req, res) => {
    try {
        // High-Fidelity Agentic Scraper: Connecting to Global Job Nodes
        // Integrating live signals from open job networks (WeWorkRemotely / RemoteOK nodes)
        
        let validJob = null;
        let sourceUsed = "Aggregator Network";

        // Fetch user context for targeted agent scraping
        const User = (await import("../models/User.js")).default; 
        const user = await User.findById(req.user.userId);
        const userSkills = user?.skills || ["JavaScript", "Python", "Design"]; // Fallback context

        let newJobs = [];

        try {
            // Attempt 1: Fetch from WeWorkRemotely (Real Live Data)
            const response = await axios.get('https://weworkremotely.com/api/v1/remote-jobs.json');
            const categories = response.data;
            let allRealJobs = [];
            
            if (categories) {
                // Determine structure and flatten
                if (Array.isArray(categories)) {
                   Object.keys(categories).forEach(cat => {
                       if(Array.isArray(categories[cat])) {
                           allRealJobs.push(...categories[cat]);
                       }
                   });
                } else if (categories.jobs) {
                    allRealJobs = categories.jobs;
                } else {
                    // Object with category keys
                    Object.values(categories).forEach(catJobs => {
                        if (Array.isArray(catJobs)) allRealJobs.push(...catJobs);
                    });
                }
            }

            if (allRealJobs.length > 0) {
                // Filter for relevance
                const studentKeywords = ["intern", "junior", "trainee", "entry", "graduate", "fresher", "associate"];
                
                const relevantJobs = allRealJobs.filter(job => {
                    const title = job.title.toLowerCase();
                    const desc = (job.description || "").toLowerCase();
                    const isStudentFriendly = studentKeywords.some(k => title.includes(k));
                    const hasSkill = userSkills.some(skill => (title + " " + desc).includes(skill.toLowerCase()));
                    return isStudentFriendly || hasSkill; 
                });

                // Process WeWorkRemotely Jobs
                for (const job of relevantJobs.slice(0, 15)) { 
                    const exists = await Job.findOne({ link: job.url });
                    if (!exists) {
                        const isIntern = studentKeywords.some(k => job.title.toLowerCase().includes(k));
                        let tags = ["Remote", "Global"];
                        if (isIntern) tags.unshift("Student Friendly");
                        
                        const matchedSkills = userSkills.filter(s => (job.title + " " + job.description).toLowerCase().includes(s.toLowerCase()));
                        if(matchedSkills.length > 0) tags.push(...matchedSkills);

                        newJobs.push({
                            title: job.title,
                            company: job.company_name,
                            location: job.candidate_required_location || "Remote",
                            link: job.url,
                            description: job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 300) + "..." : "Global Remote Opportunity",
                            skills: [...new Set(tags)], 
                            source: "WeWorkRemotely",
                            postedDate: new Date(job.publication_date || Date.now())
                        });
                    }
                }
            }
        } catch (apiError) {
            console.error("WWR Error:", apiError.message);
        }

        // Secondary Agentic Node: ArbeitNow
        try {
            const response2 = await axios.get('https://arbeitnow.com/api/job-board-api');
            const jobs2 = response2.data.data;
            const studentKeywords = ["intern", "junior", "trainee", "entry", "graduate", "fresher", "associate"];

            if (jobs2 && jobs2.length > 0) {
                const relevantJobs2 = jobs2.filter(job => {
                    const title = job.title.toLowerCase();
                    const desc = (job.description || "").toLowerCase();
                    const isStudentFriendly = studentKeywords.some(k => title.includes(k));
                    const hasSkill = userSkills.some(skill => (title + " " + desc).includes(skill.toLowerCase()));
                    return isStudentFriendly || hasSkill;
                });

                for (const job of relevantJobs2.slice(0, 15)) {
                     const exists = await Job.findOne({ link: job.url });
                     if (!exists) {
                        const isIntern = studentKeywords.some(k => job.title.toLowerCase().includes(k));
                        let tags = ["Global"];
                        if (isIntern) tags.unshift("Student Friendly");
                         
                        const matchedSkills = userSkills.filter(s => (job.title + " " + job.description).toLowerCase().includes(s.toLowerCase()));
                        if(matchedSkills.length > 0) tags.push(...matchedSkills);

                        newJobs.push({
                            title: job.title,
                            company: job.company_name,
                            location: job.location || "Remote",
                            link: job.url,
                            description: job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 300) + "..." : "Global Opportunity",
                            skills: [...new Set(tags)],
                            source: "ArbeitNow",
                            postedDate: new Date(job.created_at || Date.now())
                        });
                     }
                }
            }
        } catch (apiError2) {
            console.error("ArbeitNow Error:", apiError2.message);
        }

        // RemoteOK Node (Third Source)
        try {
            const response3 = await axios.get('https://remoteok.com/api');
            const jobs3 = response3.data; // Array of objects
            
            if (jobs3 && jobs3.length > 0) {
                 // First item in RemoteOK is usually legal text, skip it
                 const validJobs3 = jobs3.slice(1);
                 const studentKeywords = ["intern", "junior", "trainee", "entry", "graduate", "fresher", "associate"];
                 
                 const relevantJobs3 = validJobs3.filter(job => {
                    const title = (job.position || "").toLowerCase();
                    const desc = (job.description || "").toLowerCase();
                    const isStudentFriendly = studentKeywords.some(k => title.includes(k));
                    const hasSkill = userSkills.some(skill => (title + " " + desc).includes(skill.toLowerCase()));
                    return job.company && (isStudentFriendly || hasSkill);
                });

                for (const job of relevantJobs3.slice(0, 10)) {
                     const exists = await Job.findOne({ link: job.url });
                     if (!exists) {
                        const isIntern = studentKeywords.some(k => (job.position || "").toLowerCase().includes(k));
                        let tags = ["Remote", "Global"];
                        if (isIntern) tags.unshift("Student Friendly");
                        
                        const matchedSkills = userSkills.filter(s => ((job.position || "") + " " + (job.description || "")).toLowerCase().includes(s.toLowerCase()));
                        if(matchedSkills.length > 0) tags.push(...matchedSkills);

                        newJobs.push({
                            title: job.position,
                            company: job.company,
                            location: job.location || "Remote",
                            link: job.url,
                            description: job.description ? job.description.replace(/<[^>]*>/g, '').substring(0, 300) + "..." : "Remote Opportunity",
                            skills: [...new Set(tags)], 
                            source: "RemoteOK",
                            postedDate: new Date(job.date || Date.now())
                        });
                     }
                }
            }
        } catch (err) {
             console.error("RemoteOK Error:", err.message);
        }

        if (newJobs.length > 0) {
            await Job.insertMany(newJobs);
            // Send Alert using the user object fetched earlier (only for the first one)
            if (user && user.email) {
                sendJobAlertEmail(user.email, newJobs[0]);
            }

            res.json({ 
                success: true, 
                message: `AI Agent found ${newJobs.length} new confirmed opportunities!`, 
                jobs: newJobs 
            });
        } else {
             res.json({ success: true, message: "Agent synced with global nodes. No new unique matches found.", jobs: [] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Agent Scraper Encountered Resistance" });
    }
});

export default router;
