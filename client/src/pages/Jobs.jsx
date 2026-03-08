import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  ExternalLink, 
  Search, 
  Sparkles, 
  Clock, 
  Building2,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Jobs = () => {
    const [jobs, setJobs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSource, setFilterSource] = useState("all");
    const [userSkills, setUserSkills] = useState([]);

    // Job Description modal + AI Rewrite
    const [jdModalOpen, setJdModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [jdText, setJdText] = useState("");
    const [rewritingJD, setRewritingJD] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchUserSkills();
    }, []);

    // Debounced Fetch
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchJobs();
        }, 800);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, filterSource, pagination.page]);

    const fetchUserSkills = async () => {
         try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.user.skills) {
                setUserSkills(res.data.user.skills);
            }
        } catch (error) {
            console.error("Fetch Skills Error:", error);
        }
    };

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/jobs`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    search: searchQuery,
                    source: filterSource
                }
            });
            if (res.data.success) {
                setJobs(res.data.jobs);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            }
        } catch (error) {
            console.error("Fetch Jobs Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScrape = async () => {
        setScraping(true);
        try {
            const token = localStorage.getItem('token');
            // Simulate agent "Thinking" delay
            await new Promise(r => setTimeout(r, 2000));
            
            const res = await axios.post(`${API_BASE_URL}/api/jobs/scrape`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                // Refresh list to show new job
                fetchJobs();
                toast.success(res.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Scraper awaiting slots. Try again.";
            toast.error(msg);
        } finally {
            setScraping(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const openJdModal = (job) => {
        setSelectedJob(job);
        setJdText(job.description || job.desc || "No description available.");
        setJdModalOpen(true);
    };

    const handleRewriteJD = async () => {
        if (!jdText.trim()) return;
        setRewritingJD(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/chat`, {
                message: `Rewrite the following Job Description to be more professional, clear, and structured. Use headings: Role, Key Responsibilities, Requirements, Benefits. Keep the same meaning:\n\n${jdText}`,
                type: 'general'
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.response) {
                setJdText(res.data.response);
                toast.success("Job description rewritten with AI!");
            } else throw new Error("No response");
        } catch (err) {
            toast.error("Rewrite failed. Try again.");
        } finally {
            setRewritingJD(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-7xl mx-auto space-y-8 pb-12"
        >
            <Toaster position="top-right" />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Briefcase size={32} className="text-blue-600 dark:text-blue-400" />
                        Internship & Job Finder
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">AI Agent searching 50+ platforms for student-friendly roles.</p>
                </div>
                <button
                    onClick={handleScrape}
                    disabled={scraping}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {scraping ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> Agent Scanning...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} /> Auto-Scan New Jobs
                        </>
                    )}
                </button>
            </div>

            {/* AI Insight Box */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                 <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center shrink-0">
                     <Search size={32} className="text-blue-600 dark:text-blue-400" />
                 </div>
                 <div className="flex-1">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Agent Status: Active</h3>
                     <p className="text-slate-600 dark:text-slate-400 mt-1">
                         I am actively monitoring global nodes (WeWorkRemotely, ArbeitNow, LinkedIn) for roles matching your profile. 
                         <br />Detected skills: <strong>{userSkills.length > 0 ? userSkills.join(", ") : "Loading skills..."}</strong>.
                     </p>
                 </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by role, company, or skill..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                    />
                </div>
                <select 
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    value={filterSource}
                    onChange={(e) => { setFilterSource(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                >
                    <option value="all">All Sources</option>
                    <option value="WeWorkRemotely">WeWorkRemotely</option>
                    <option value="ArbeitNow">ArbeitNow</option>
                    <option value="LinkedIn">LinkedIn</option>
                </select>
            </div>

            {/* Jobs Grid */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1,2,3,4,5,6].map(i => (
                             <div key={i} className="h-64 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {jobs.map((job) => (
                                <motion.div 
                                    key={job._id || job.title} // Fallback key
                                    layout
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col"
                                >
                                    {/* Match Score Badge (Heuristic) */}
                                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10">
                                         New
                                    </div>

                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white font-bold text-xl uppercase">
                                            {job.company?.[0] || "J"}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors pointer-events-none line-clamp-2">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                                <Building2 size={14} /> {job.company} 
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <MapPin size={16} /> {job.location || "Remote"}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Clock size={16} /> Posted {new Date(job.postedDate || job.posted || Date.now()).toLocaleDateString()}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {job.skills?.slice(0, 3).map((skill, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.source && (
                                                 <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
                                                    {job.source}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-auto flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openJdModal(job)}
                                            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16} /> View / Rewrite JD with AI
                                        </button>
                                        <a 
                                            href={job.url || job.link} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                        >
                                            Apply Now <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                         {/* Pagination Controls */}
                         {jobs.length > 0 && (
                            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 rounded-xl">
                                <div className="text-sm text-slate-500">
                                    Showing page {pagination.page} of {pagination.pages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1 || loading}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[3rem] text-center">
                                         {pagination.page} / {pagination.pages}
                                    </div>
                                     <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages || loading}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {jobs.length === 0 && !loading && (
                    <div className="text-center py-20 text-slate-500">
                        No jobs found. Click "Auto-Scan" to let the AI agent find new roles.
                    </div>
                )}
            </div>

            {/* Job Description Modal with AI Rewrite */}
            <AnimatePresence>
                {jdModalOpen && selectedJob && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setJdModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedJob.title} – Job Description</h3>
                                <button onClick={() => setJdModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto">
                                <div className="flex justify-end mb-2">
                                    <button onClick={handleRewriteJD} disabled={rewritingJD} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50">
                                        {rewritingJD ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>} Rewrite with AI
                                    </button>
                                </div>
                                <textarea className="w-full h-64 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-sm resize-none" value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Job description..." />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Jobs;
