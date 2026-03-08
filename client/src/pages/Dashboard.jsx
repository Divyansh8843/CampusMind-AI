import React, { useEffect, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageSquare, 
  Upload, 
  Clock, 
  FileText, 
  ArrowRight,
  Activity,
  Server,
  Database,
  Shield,
  HardDrive,
  Star,
  CheckCircle,
  BarChart3,
  Users,
  Briefcase,
  Calendar,
  Code,
  Rocket
} from 'lucide-react';

import { motion } from 'framer-motion';

const Dashboard = () => {
    const [user, setUser] = useState({});
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const refreshUser = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                const u = res.data.user;
                setUser(u);
                localStorage.setItem('user', JSON.stringify(u));
            }
        } catch (e) {
            console.error("Refresh user error:", e);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchDocuments();
    }, []);

    useEffect(() => {
        const paymentSuccess = searchParams.get('payment') === 'success';
        if (paymentSuccess) {
            refreshUser();
            window.history.replaceState({}, '', '/dashboard');
        }
    }, [searchParams]);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/upload`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDocuments(res.data.documents);
            }
        } catch (error) {
            console.error("Error fetching docs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Real-time Stats
    const totalSizeBytes = documents.reduce((acc, doc) => acc + (doc.size || 0), 0);
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

    const container = {
        hidden: { opacity: 0 },
        show: {
             opacity: 1,
             transition: {
                 staggerChildren: 0.1
             }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                        Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">{user.name?.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Your complete academic & career dashboard.
                    </p>
                </div>
                {/* Upgrade Button */}
                {!user.subscription?.plan || user.subscription?.plan === 'free' ? (
                     <NavLink to="/pricing" className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                         <Star size={18} className="fill-white"/> Upgrade to Premium
                     </NavLink>
                ) : (
                    <div className="px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2">
                        <CheckCircle size={18} /> Premium Member
                    </div>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Knowledge Base", value: documents.length, icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
                    { label: "Community Rep", value: `${user.xp || 0} XP`, icon: Star, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/10" },
                    { label: "Account Status", value: user.subscription?.plan === 'monthly' || user.subscription?.plan === 'yearly' ? "Premium" : "Free", icon: Shield, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-500/10" }
                ].map((stat, idx) => (
                    <motion.div variants={item} key={idx} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                     {/* Core Features */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <NavLink 
                            to="/chat" 
                            className="group bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg shadow-blue-900/20 hover:shadow-xl hover:scale-[1.02] transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <MessageSquare size={24} />
                                </div>
                                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1">AI Tutor</h3>
                                <p className="text-blue-100 text-sm">Study, Lecture Notes & Peer Match.</p>
                            </div>
                        </NavLink>

                        <NavLink 
                            to="/community" 
                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:scale-[1.02] transition-all relative overflow-hidden shadow-sm dark:shadow-none"
                        >
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                    <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-slate-400" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1">Community</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Ask, Answer & Earn XP.</p>
                            </div>
                        </NavLink>

                        <NavLink 
                            to="/jobs" 
                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-pink-300 dark:hover:border-pink-500/30 hover:scale-[1.02] transition-all relative overflow-hidden shadow-sm dark:shadow-none"
                        >
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="p-3 bg-pink-50 dark:bg-pink-500/10 rounded-xl border border-pink-100 dark:border-pink-500/20">
                                    <Briefcase size={24} className="text-pink-600 dark:text-pink-400" />
                                </div>
                                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-slate-400" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1">Jobs & Internships</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Launch your career.</p>
                            </div>
                        </NavLink>

                        <NavLink 
                            to="/hackathons" 
                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-purple-300 dark:hover:border-purple-500/30 hover:scale-[1.02] transition-all relative overflow-hidden shadow-sm dark:shadow-none"
                        >
                             <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl" />
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                                    <Code size={24} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-slate-400" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1">Hackathons</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Build & Win Prizes.</p>
                            </div>
                        </NavLink>

                        <NavLink 
                            to="/planner" 
                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:scale-[1.02] transition-all relative overflow-hidden shadow-sm dark:shadow-none"
                        >
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl border border-cyan-100 dark:border-cyan-500/20">
                                    <Calendar size={24} className="text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-slate-400" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1">Study Planner</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Organize your exams.</p>
                            </div>
                        </NavLink>

                         <NavLink 
                            to="/resume" 
                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-orange-300 dark:hover:border-orange-500/30 hover:scale-[1.02] transition-all relative overflow-hidden shadow-sm dark:shadow-none"
                        >
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-100 dark:border-orange-500/20">
                                    <FileText size={24} className="text-orange-600 dark:text-orange-400" />
                                </div>
                                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-slate-400" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1">Resume AI</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Beat the ATS.</p>
                            </div>
                        </NavLink>
                    </div>

                    {/* Recent Uploads */}
                    <motion.div variants={item}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                <Clock size={20} className="text-slate-400" />
                                Recent Files
                            </h2>
                            <NavLink to="/resources" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View All</NavLink>
                        </div>
                        
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8 text-slate-500">Loading...</div>
                            ) : documents.length > 0 ? (
                                documents.slice(0, 3).map((doc) => (
                                    <div key={doc._id} className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-blue-500/30 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm dark:shadow-none">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">{doc.originalName}</h4>
                                                <p className="text-xs text-slate-500">
                                                    {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-white/5 rounded-2xl border-dashed">
                                    <p className="text-slate-400 mb-2">No documents found.</p>
                                    <NavLink to="/resources" className="text-blue-500 dark:text-blue-400 text-sm hover:underline">Get Started</NavLink>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar Widgets (Desktop) */}
                <div className="space-y-6">
                    {/* System Status Widget */}
                     <motion.div variants={item} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2 mb-4">
                            <Server size={20} className="text-slate-500 dark:text-slate-400" />
                            <h3 className="font-bold text-slate-800 dark:text-white">System Status</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">AI Engine</span>
                                </div>
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">ONLINE</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                                <div className="flex items-center gap-2">
                                     <Database size={12} className="text-blue-500" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Database</span>
                                </div>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">CONNECTED</span>
                            </div>
                        </div>
                    </motion.div>
                    
                    {/* Usage Limits (Free Tier) */}
                    {(!user.subscription?.plan || user.subscription?.plan === 'free') && (
                        <motion.div variants={item} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
                            <h3 className="font-bold mb-2 text-slate-800 dark:text-white">Free Tier Limits</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                Resume: {3 - (user.usage?.resumeAnalysis || 0)} left • Interview: {3 - (user.usage?.mockInterviews || 0)} left
                            </p>
                            <NavLink to="/pricing" className="block w-full text-center py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
                                Upgrade for Unlimited
                            </NavLink>
                        </motion.div>
                    )}

                    {/* Interview Promo */}
                    <motion.div variants={item} className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
                        <h3 className="font-bold mb-2 text-slate-800 dark:text-white">Interview Prep</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                             Practice with our AI interviewer to ace your next job.
                        </p>
                        <NavLink to="/interview" className="block w-full text-center py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 rounded-lg text-sm transition-colors border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:border-purple-300">
                             Start Mock Interview
                        </NavLink>
                    </motion.div>
                    {/* Future Innovations (Phase 2) */}
                    <NavLink to="/advanced">
                        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden mt-6 cursor-pointer group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/30 transition-all"></div>
                            <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10">
                                <Rocket size={20} className="text-purple-400 group-hover:animate-pulse" /> Phase 2 Innovation Lab
                            </h3>
                            <ul className="space-y-3 relative z-10 text-left">
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div> Smart Syllabus Tracker
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Salary Negotiator Bot
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-300">
                                     <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Hackathon Squad Builder
                                </li>
                                 <li className="flex items-center gap-3 text-sm text-slate-300">
                                     <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div> Voice AI Interviewer
                                </li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-purple-300 font-bold flex items-center justify-between">
                                <span>Experimental Access Unlocked</span>
                                <ArrowRight size={14} />
                            </div>
                        </motion.div>
                    </NavLink>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
