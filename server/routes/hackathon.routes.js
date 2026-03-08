import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import authMiddleware from "../middleware/auth.js";
import nodemailer from "nodemailer";
import { TeamRequest } from "../models/TeamRequest.js";
import User from "../models/User.js";

const router = express.Router();

// Email Config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendMatchFoundEmail = async (userEmail, partnerEmail, hackathonTitle, roleFound) => {
    if (!process.env.EMAIL_USER) return;
    try {
        const mailOptions = {
            subject: `🔥 Match Found: ${hackathonTitle}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                        .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 30px; text-align: center; color: white; }
                        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; }
                        .match-box { background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
                        .match-title { font-size: 18px; color: #5b21b6; margin-bottom: 20px; font-weight: 700; }
                        .role-badge { display: inline-block; background-color: #7c3aed; color: white; padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 600; margin-bottom: 15px; }
                        .email-link { display: inline-block; color: #2563eb; font-weight: 600; text-decoration: none; border-bottom: 2px solid #bfdbfe; transition: border-color 0.2s; }
                        .email-link:hover { border-color: #2563eb; }
                        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>CampusMind Match</h1>
                        </div>
                        <div class="content">
                            <h2 style="color: #7c3aed; margin-top: 0; text-align: center;">🔥 Perfect Team Match!</h2>
                            <p style="text-align: center;">Great news! Our AI matchmaking algorithm has found the perfect teammate for you for <strong>${hackathonTitle}</strong>.</p>
                            
                            <div class="match-box">
                                <div class="match-title">Potential Teammate Found</div>
                                <div>They are a:</div>
                                <div style="margin: 10px 0;"><span class="role-badge">${roleFound}</span></div>
                                
                                <div style="margin-top: 20px;">
                                    <p style="margin-bottom: 5px; font-size: 14px; color: #666;">Contact them immediately:</p>
                                    <a href="mailto:${partnerEmail}" class="email-link">${partnerEmail}</a>
                                </div>
                            </div>
                            
                            <p style="text-align: center; color: #666; font-style: italic;">"Great things in business are never done by one person. They're done by a team of people."</p>
                            <p style="text-align: center; font-weight: 600; margin-top: 20px;">Good luck hacking! 🚀</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} CampusMind AI. All rights reserved.</p>
                            <p>Connecting Innovators Worldwide.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail({ ...mailOptions, from: `"CampusMind Agent" <${process.env.EMAIL_USER}>`, to: userEmail });
        await transporter.sendMail({ ...mailOptions, from: `"CampusMind Agent" <${process.env.EMAIL_USER}>`, to: partnerEmail });
    } catch (err) {
        console.error("Email failed:", err);
    }
};

/**
 * @desc Get Live Global Hackathons (Hackathon Hunter Agent)
 * @route GET /api/hackathons
 */
// Basic In-Memory Cache to prevent DOS and ensure Scalability
const CACHE_TTL = 30 * 60 * 1000; // 30 Minutes
let hackathonCache = {
    data: [],
    lastUpdated: 0,
    isRemote: true
};

// GET /api/hackathons
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 10, remote = 'true', refresh = 'false' } = req.query;
        const isRemote = remote === 'true';
        const forceRefresh = refresh === 'true';

        // Check Cache Validity
        const now = Date.now();
        const isCacheValid = !forceRefresh && (now - hackathonCache.lastUpdated < CACHE_TTL) && (hackathonCache.isRemote === isRemote);

        if (isCacheValid && hackathonCache.data.length > 0) {
            console.log("Serving Hackathons from Cache 🚀");
            let filteredCache = hackathonCache.data;
            const { type, platform, search } = req.query;

            if (type && type !== 'All Type') {
                const filterTag = type === 'Hackathon' ? 'Hackathon' : 'Internship';
                filteredCache = filteredCache.filter(h => h.tags.includes(filterTag));
            }

            if (platform && platform !== 'All') {
                filteredCache = filteredCache.filter(h => h.platform === platform);
            }

            if (search && search.trim() !== '') {
                const lowerSearch = search.toLowerCase();
                filteredCache = filteredCache.filter(h => 
                    h.title.toLowerCase().includes(lowerSearch) || 
                    h.tags.some(t => t.toLowerCase().includes(lowerSearch))
                );
            }

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = pageNum * limitNum;
            
            return res.json({
                success: true,
                count: filteredCache.length,
                page: pageNum,
                totalPages: Math.ceil(filteredCache.length / limitNum),
                hackathons: filteredCache.slice(startIndex, endIndex),
                cached: true
            });
        }

        console.log("Cache Stale/Empty. Initializing High-Performance Scraper...");

        let globalOpportunities = [];

        // 1. Fetch from Unstop API 直接 (Direct Node Access)
        const fetchUnstop = async (type) => {
            try {
                const unstopUrl = `https://unstop.com/api/public/opportunity/search-result?opportunity=${type}&q=${isRemote ? 'remote' : ''}`;
                const response = await axios.get(unstopUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                });
                
                const data = response.data?.data?.data || [];
                return data.slice(0, 20).map(h => ({
                    id: `un-${h.id}`,
                    title: h.title,
                    link: `https://unstop.com/${h.type}/${h.slug}`,
                    image: h.banner_image || "https://d8it4huxumps7.cloudfront.net/uploads/images/unstop/branding-2023/logo_black.svg",
                    platform: "Unstop",
                    date: h.start_date ? new Date(h.start_date).toDateString() : "Open Now",
                    tags: [type === 'internships' ? "Internship" : "Hackathon", "Global", ...(h.filters?.map(f => f.name) || [])]
                }));
            } catch (e) {
                console.error(`Unstop ${type} Node Error:`, e.message);
                return [];
            }
        };

        // 2. Fetch from Devpost using Cheerio (Fast Agentic Parsing)
        const fetchDevpost = async () => {
            try {
                const devpostUrl = isRemote 
                    ? 'https://devpost.com/hackathons?challenge_type[]=online&sort_by=Submission+Deadline' 
                    : 'https://devpost.com/hackathons?sort_by=Submission+Deadline';
                
                const response = await axios.get(devpostUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                });

                const $ = cheerio.load(response.data);
                const hacks = [];

                $('.hackathon-tile').each((i, el) => {
                    if (i > 15) return;
                    const title = $(el).find('.main-content h3').text().trim();
                    const link = $(el).find('a').attr('href');
                    let image = $(el).find('.hackathon-thumbnail').attr('src') || "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Devpost_logo.svg/2560px-Devpost_logo.svg.png";
                    const date = $(el).find('.submission-period').text().trim();
                    const tags = [];
                    $(el).find('.theme-label').each((j, tag) => {
                        tags.push($(tag).text().trim());
                    });

                    if (title && link) {
                        hacks.push({
                            id: `dp-${Math.random().toString(36).substr(2, 9)}`,
                            title,
                            link,
                            image: image.startsWith('//') ? `https:${image}` : image,
                            platform: "Devpost",
                            date: date || "Upcoming",
                            tags: [...tags, "Hackathon"]
                        });
                    }
                });
                return hacks;
            } catch (e) {
                console.error("Devpost Node Error:", e.message);
                return [];
            }
        };

        // Parallel Agent Node Processing
        const [devpostData, unstopHacks, unstopJobs] = await Promise.all([
            fetchDevpost(),
            fetchUnstop('hackathons'),
            fetchUnstop('internships')
        ]);

        globalOpportunities = [...devpostData, ...unstopHacks, ...unstopJobs];

        // 3. Add Feature Node: Hack2Skill
        globalOpportunities.push({
            id: 'h2s-feat',
            title: 'Hack2Skill Global Series',
            link: 'https://hack2skill.com/hackathons',
            image: "https://hack2skill.com/assets/images/logo_black.svg",
            platform: "Hack2Skill",
            date: "Live Now",
            tags: ["Hackathon", "Web3", "Emerging Tech"]
        });

        // Update Cache
        hackathonCache = {
            data: globalOpportunities,
            lastUpdated: Date.now(),
            isRemote: isRemote
        };

        // Filter Logic
        let filteredResults = globalOpportunities;
        const { type, platform, search } = req.query;

        if (type && type !== 'All Type') {
            const filterTag = type === 'Hackathon' ? 'Hackathon' : 'Internship';
            filteredResults = filteredResults.filter(h => h.tags.includes(filterTag));
        }

        if (platform && platform !== 'All') {
            filteredResults = filteredResults.filter(h => h.platform === platform);
        }

        if (search && search.trim() !== '') {
            const lowerSearch = search.toLowerCase();
            filteredResults = filteredResults.filter(h => 
                h.title.toLowerCase().includes(lowerSearch) || 
                h.tags.some(t => t.toLowerCase().includes(lowerSearch))
            );
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        
        const paginatedResults = filteredResults.slice(startIndex, endIndex);

        res.json({
            success: true,
            count: filteredResults.length,
            page: pageNum,
            totalPages: Math.ceil(filteredResults.length / limitNum),
            hackathons: paginatedResults,
            cached: false
        });

    } catch (error) {
        console.error("Hackathon Scraper Agent failed:", error);
        
        if (hackathonCache.data.length > 0) {
            const pageNum = parseInt(req.query.page || 1);
            const limitNum = parseInt(req.query.limit || 10);
            return res.json({
                success: true, 
                message: "Agent encountered network resistance, serving cached data.",
                hackathons: hackathonCache.data.slice((pageNum-1)*limitNum, pageNum*limitNum),
                totalPages: Math.ceil(hackathonCache.data.length / limitNum),
                cached: true
            });
        }

        res.status(500).json({ success: false, message: "Global Scraper Agent failed to retrieve hackathons." });
    }
});



/**
 * @desc Hackathon Squad Builder - Find students by skill (real DB, sorted by XP)
 * @route GET /api/hackathons/squad?skill=React
 */
router.get("/squad", authMiddleware, async (req, res) => {
    try {
        const { skill, limit = 10 } = req.query;
        const userId = req.user.userId;
        if (!skill || !String(skill).trim()) {
            return res.json({ success: true, squad: [] });
        }
        const search = String(skill).trim();
        const students = await User.find({
            _id: { $ne: userId },
            role: 'student',
            domain: req.user.domain,
            skills: { $regex: search, $options: 'i' }
        })
            .sort({ xp: -1 })
            .limit(parseInt(limit, 10) || 10)
            .select('name picture skills xp branch year');
        res.json({ success: true, squad: students });
    } catch (err) {
        console.error("Squad builder error:", err);
        res.status(500).json({ message: "Failed to find squad" });
    }
});

/**
 * @desc Find a Teammate (Agentic Match)
 * @route POST /api/hackathons/match
 */
router.post("/match", authMiddleware, async (req, res) => {
    try {
        const { hackathonId, hackathonTitle, myRole, lookingFor } = req.body;

        // 1. Create Team Request
        const newReq = await TeamRequest.create({
            userId: req.user.userId,
            userEmail: req.user.email,
            hackathonId,
            hackathonTitle,
            myRole,
            lookingFor
        });

        // 2. Agent searches query for perfect match
        // Logic: Find someone who is LOOKING for 'myRole' and HAS 'lookingFor' role
        const match = await TeamRequest.findOne({
            hackathonId,
            status: 'pending',
            userId: { $ne: req.user.userId },
            myRole: lookingFor, 
            lookingFor: myRole
        });

        if (match) {
            match.status = 'matched';
            match.matchedWith = req.user.userId;
            await match.save();

            newReq.status = 'matched';
            newReq.matchedWith = match.userId;
            await newReq.save();

            await sendMatchFoundEmail(req.user.email, match.userEmail, hackathonTitle, match.myRole);

            // Gamification: Award XP to both
            await User.findByIdAndUpdate(req.user.userId, { $inc: { xp: 100 } });
            await User.findByIdAndUpdate(match.userId, { $inc: { xp: 100 } });

            return res.json({
                success: true,
                match: {
                    found: true,
                    partner: match.userEmail,
                    role: match.myRole
                },
                message: `Match Found! We connected you with a ${match.myRole}. Check your email.`
            });
        }
        
        res.json({
            success: true,
            match: { found: false },
            message: `Agent is looking for a ${lookingFor}. matches will act in real-time.`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Matching failed" });
    }
});

export default router;
