import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  MapPin, 
  ExternalLink, 
  Users, 
  Sparkles, 
  Calendar,
  Loader2,
  Search,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Code,
  X
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';


const Hackathons = () => {
    // Filter Logic
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterPlatform, setFilterPlatform] = useState('All');
    const [filterType, setFilterType] = useState('All Type'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [isRemote, setIsRemote] = useState(true);

    // Matching Modal
    const [matchingHackathon, setMatchingHackathon] = useState(null);
    const [myRole, setMyRole] = useState('Full Stack Developer');
    const [lookingFor, setLookingFor] = useState('UI/UX Designer');
    const [matchLoading, setMatchLoading] = useState(false);

    // Squad Builder
    const [showSquadBuilder, setShowSquadBuilder] = useState(false);
    const [squadSkill, setSquadSkill] = useState('');
    const [squad, setSquad] = useState([]);
    const [squadLoading, setSquadLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const fetchHackathons = async (forceRefresh = false) => {
        setLoading(true);
        if (forceRefresh) toast('Hunting for new hackathons...', { icon: '🕵️' });
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/hackathons`, {
                params: { 
                    page, 
                    limit: 10, 
                    remote: isRemote, 
                    refresh: forceRefresh,
                    type: filterType === 'All Type' ? undefined : filterType,
                    platform: filterPlatform === 'All' ? undefined : filterPlatform,
                    search: searchTerm
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setHackathons(res.data.hackathons);
                setTotalPages(res.data.totalPages || 1);
                if (forceRefresh) toast.success("Feed Updated!");
            }
        } catch (error) {
            console.error("Fetch Hackathons Error:", error);
            toast.error("Agent failed to reach global nodes.");
        } finally {
            setLoading(false);
        }
    };
    
    // Update useEffect to watch filters
    useEffect(() => {
        fetchHackathons();
    }, [page, isRemote, filterType, filterPlatform, searchTerm]);


    const handleMatchSubmit = async () => {
        if (!matchingHackathon) return;
        setMatchLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/hackathons/match`, {
                hackathonId: matchingHackathon.id,
                hackathonTitle: matchingHackathon.title,
                myRole,
                lookingFor
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                toast.success(res.data.message);
                if (res.data.match?.found) {
                    toast('🔥 TEAM ASSEMBLED!', { icon: '🚀', duration: 5000 });
                }
                setMatchingHackathon(null);
            }
        } catch (error) {
            toast.error("Matching failed. Try again.");
        } finally {
            setMatchLoading(false);
        }
    };

    const findSquad = async () => {
        if (!squadSkill.trim()) return;
        setSquadLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/hackathons/squad`, {
                params: { skill: squadSkill.trim() },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSquad(res.data.squad || []);
                if (res.data.squad.length === 0) {
                    toast('No students found with that skill. Try a different keyword.');
                } else {
                    toast.success(`Found ${res.data.squad.length} potential teammates!`);
                }
            }
        } catch (err) {
            toast.error('Failed to find squad');
        } finally {
            setSquadLoading(false);
        }
    };

    const searchSquad = async () => {
        if (!squadSkill.trim()) {
            toast.error('Enter a skill (e.g., React, Python, Designer)');
            return;
        }
        setSquadLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/hackathons/squad`, {
                params: { skill: squadSkill.trim(), limit: 10 },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSquad(res.data.squad || []);
                if (res.data.squad.length === 0) {
                    toast('No students found with that skill. Try a different keyword.');
                }
            }
        } catch (err) {
            toast.error('Failed to search squad');
        } finally {
            setSquadLoading(false);
        }
    };

    return (
        <div className="w-full relative min-h-screen">
            <Toaster position="top-center" />
            
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-extrabold flex items-center gap-3 mb-2 text-slate-800 dark:text-white"
                    >
                        <Globe className="text-blue-500 w-8 h-8" />
                        Hackathon Hunter
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold text-green-600 bg-green-100 rounded-full flex items-center gap-1 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Live
                        </span>
                    </motion.h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Agentic scanning of Devpost, Unstop & Hack2Skill.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
                    <button 
                         className="px-4 py-2 rounded-lg text-sm font-bold bg-white shadow text-blue-600 transition-all cursor-default"
                    >
                        Opportunities
                    </button>
                    <button
                        onClick={() => setShowSquadBuilder(true)}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                    >
                        Squad Builder
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by keywords..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                     <button
                        onClick={() => fetchHackathons(true)}
                        disabled={loading}
                        className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50"
                        title="Force Refresh Feed"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => setIsRemote(!isRemote)}
                        className={`px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isRemote ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border border-slate-200 text-slate-500'}`}
                    >
                        <MapPin size={18} /> {isRemote ? 'Remote Only' : 'All Modes'}
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                 {/* Platform Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'Devpost', 'Unstop', 'Hack2Skill'].map(p => (
                        <button
                            key={p}
                            onClick={() => setFilterPlatform(p)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                                filterPlatform === p 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                 {/* Type Filter */}
                <div className="flex gap-2">
                     {['All Type', 'Hackathon', 'Internship'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                                filterType === t
                                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                        >
                            {t}
                        </button>
                     ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                        ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    <AnimatePresence>
                        {hackathons.map((hack, index) => (
                            <motion.div 
                                key={hack.id || index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row gap-4 relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold text-white ${
                                    hack.platform === 'Devpost' ? 'bg-blue-600' : 
                                    hack.platform === 'Unstop' ? 'bg-orange-500' : 'bg-purple-600'
                                }`}>
                                    {hack.platform}
                                </div>

                                <div className="w-full md:w-40 h-32 md:h-full bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden shrink-0 relative">
                                    <img src={hack.image} alt={hack.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>

                                <div className="flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-blue-500 transition-colors line-clamp-2 text-slate-900 dark:text-white">
                                        {hack.title}
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} className="text-blue-500" /> {hack.date}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin size={12} className="text-green-500" /> {isRemote ? 'Remote' : 'All'}
                                        </div>
                                    </div>

                                    <div className="mt-auto flex items-center gap-2">
                                        <a 
                                            href={hack.link} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className={`px-3 py-1.5 ${hack.tags.includes('Internship') ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'} text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center gap-1`}
                                        >
                                            {hack.tags.includes('Internship') ? 'Apply for Job' : 'View Details'} <ExternalLink size={12} />
                                        </a>
                                        
                                        {!hack.tags.includes('Internship') && (
                                            <button 
                                                onClick={() => setMatchingHackathon(hack)}
                                                className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1"
                                            >
                                                <Users size={12} /> Find Teammate
                                            </button>
                                        )}
                                        
                                        {hack.tags.includes('Internship') && (
                                             <span className="flex-1 text-center text-xs font-medium text-green-600 bg-green-50 py-1.5 rounded-lg border border-green-100">
                                                 💼 Internship Opportunity
                                             </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Pagination */}
            <div className="mt-8 flex justify-center items-center gap-4">
                <button 
                    disabled={page === 1 || loading}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-50 hover:bg-slate-200 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Page {page} of {totalPages}
                </span>
                <button 
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-50 hover:bg-slate-200 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Matching Modal */}
            <AnimatePresence>
                {matchingHackathon && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setMatchingHackathon(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">Find a Teammate</h2>
                            <p className="text-sm text-slate-500 mb-4">for {matchingHackathon.title}</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">I am a</label>
                                    <select 
                                        value={myRole} 
                                        onChange={(e) => setMyRole(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none dark:text-white"
                                    >
                                        <option>Full Stack Developer</option>
                                        <option>Frontend Developer</option>
                                        <option>Backend Developer</option>
                                        <option>UI/UX Designer</option>
                                        <option>AI Engineer</option>
                                        <option>Product Manager</option>
                                        <option>Data Scientist</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Looking for a</label>
                                    <select 
                                        value={lookingFor} 
                                        onChange={(e) => setLookingFor(e.target.value)}
                                        className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none dark:text-white"
                                    >
                                        <option>UI/UX Designer</option>
                                        <option>Full Stack Developer</option>
                                        <option>Frontend Developer</option>
                                        <option>Backend Developer</option>
                                        <option>AI Engineer</option>
                                        <option>Product Manager</option>
                                        <option>Data Scientist</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={handleMatchSubmit}
                                    disabled={matchLoading}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {matchLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} 
                                    {matchLoading ? 'Broadcasting...' : 'Broadcast to Agent'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Squad Builder Modal */}
            <AnimatePresence>
                {showSquadBuilder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => { setShowSquadBuilder(false); setSquad([]); setSquadSkill(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Code size={24} className="text-purple-600" /> Hackathon Squad Builder
                                </h2>
                                <button onClick={() => { setShowSquadBuilder(false); setSquad([]); setSquadSkill(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Search for students by skill. Results sorted by XP (most experienced first).
                            </p>
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={squadSkill}
                                    onChange={(e) => setSquadSkill(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchSquad()}
                                    placeholder="e.g., React, Frontend, Python, Designer..."
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <button
                                    onClick={searchSquad}
                                    disabled={squadLoading}
                                    className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {squadLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} Search
                                </button>
                            </div>
                            {squad.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Suggested Squad Members ({squad.length})</h3>
                                    {squad.map((member, idx) => (
                                        <div key={member._id || idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img src={member.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} alt={member.name} className="w-12 h-12 rounded-full" />
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{member.name}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        {member.branch && <span>{member.branch}</span>}
                                                        {member.year && <span>• Year {member.year}</span>}
                                                        <span className="text-purple-600 dark:text-purple-400 font-bold">• {member.xp || 0} XP</span>
                                                    </div>
                                                    {member.skills && member.skills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {member.skills.slice(0, 3).map((skill, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors">
                                                Invite
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
);
};

export default Hackathons;
