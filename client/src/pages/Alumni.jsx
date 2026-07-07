import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Mail, Building, Award, Loader2, Copy, CheckCircle, X, Users, User, UserPlus, Linkedin, Clock, Search, Activity, Briefcase, MapPin } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AlumniMap from '../components/AlumniMap';
import { useLiveLocation } from '../hooks/useLiveLocation';

const Alumni = () => {
    const [alumni, setAlumni] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [myConnections, setMyConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);
    const [activeTab, setActiveTab] = useState('map');
    const [selectedAlumni, setSelectedAlumni] = useState(null);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, message: '' });
    
    // For AI draft
    const [mentorshipEmail, setMentorshipEmail] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [myInterests, setMyInterests] = useState('');
    const [drafting, setDrafting] = useState(false);
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mapMarkers, setMapMarkers] = useState([]);
    const [mapStats, setMapStats] = useState({ alumni: 0, students: 0 });
    const [mapUpdatedAt, setMapUpdatedAt] = useState(null);
    const [mapLoading, setMapLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const { status: locationStatus, syncLocation } = useLiveLocation(activeTab === 'map');

    useEffect(() => {
        fetchData();

        // Listen for global user updates (from Profile page in same tab or other tabs)
        const handleUpdate = () => {
            fetchData();
        };
        window.addEventListener('user-updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        // Add real-time polling to keep alumni lists synchronized across all users instantly
        const fetchIntervalId = window.setInterval(() => fetchData(), 15000);

        return () => {
            window.removeEventListener('user-updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
            window.clearInterval(fetchIntervalId);
        };
    }, []);

    const fetchMapData = async (silent = false) => {
        try {
            if (!silent) setMapLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/community/alumni/map?t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMapMarkers(res.data.data || []);
                setMapStats(res.data.stats || { alumni: 0, students: 0 });
                setMapUpdatedAt(res.data.updatedAt || new Date().toISOString());
            }
        } catch (err) {
            if (!silent) toast.error('Failed to load live map data');
        } finally {
            if (!silent) setMapLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab !== 'map') return undefined;
        fetchMapData();
        const intervalId = window.setInterval(() => fetchMapData(true), 20000);
        return () => window.clearInterval(intervalId);
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const ts = Date.now();
            const [alumniRes, meRes, reqRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/community/alumni?t=${ts}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/auth/me?t=${ts}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/api/community/connections?t=${ts}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (alumniRes.data.success) setAlumni(alumniRes.data.data || []);
            if (meRes.data.success) {
                setMe(meRes.data.user);
                if (meRes.data.user.skills) setMyInterests(meRes.data.user.skills.slice(0, 3).join(', '));
            }
            if (reqRes.data.success) {
                const allReqs = reqRes.data.requests || [];
                setPendingRequests(allReqs.filter(r => r.status === 'pending'));
                setMyConnections(allReqs.filter(r => r.status === 'accepted'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendConnectionRequest = async (alumId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/community/connect`, { receiverId: alumId }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                toast.success("Connection request sent successfully!");
                await fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send connection request');
        }
    };

    const acceptRequest = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/community/connect/${requestId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                toast.success("Request accepted!");
                await fetchData();
            }
        } catch (err) {
            toast.error('Failed to accept request');
        }
    };

    const rejectRequest = async () => {
        if (!rejectModal.requestId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/community/connect/${rejectModal.requestId}/reject`, { rejectMessage: rejectModal.message }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                toast.success("Request rejected");
                setRejectModal({ open: false, requestId: null, message: '' });
                await fetchData();
            }
        } catch (err) {
            toast.error('Failed to reject request');
        }
    };

    const requestMentorship = async (alum) => {
        setSelectedAlumni(alum);
        setDrafting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/community/mentorship-email`, {
                alumniId: alum._id || alum.id,
                myInterests: myInterests || 'technology and career growth'
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setMentorshipEmail(res.data.email);
                setEmailSubject(res.data.subject);
                toast.success('AI-drafted mentorship message ready!');
            }
        } catch (err) {
            toast.error('Failed to draft message');
            setSelectedAlumni(null);
        } finally {
            setDrafting(false);
        }
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(mentorshipEmail);
        setCopied(true);
        toast.success('Template copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const sendDirectMessage = async () => {
        if (!selectedAlumni || !mentorshipEmail) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/community/send-mentorship-email-direct`, {
                alumniId: selectedAlumni._id || selectedAlumni.id,
                subject: emailSubject,
                message: mentorshipEmail
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (res.data.success) {
                toast.success('Message sent successfully!');
                setSelectedAlumni(null);
                setMentorshipEmail('');
            }
        } catch (err) {
            toast.error('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-purple-600" />
            </div>
        );
    }

    const isAlumni = me?.role === 'alumni';

    const filteredAlumni = alumni.filter(a => a._id !== me?._id).filter(a => {
        const query = searchQuery.toLowerCase();
        return (
            (a.name && a.name.toLowerCase().includes(query)) ||
            (a.company && a.company.toLowerCase().includes(query)) ||
            (a.role && a.role.toLowerCase().includes(query)) ||
            (a.skills && a.skills.some(s => s.toLowerCase().includes(query)))
        );
    });

    const calculateAIScore = (user) => {
        if (!user || user.role === 'alumni') return null;
        let score = 0;
        // Academic Performance (max 25 points)
        if (user.cgpa) score += Math.min(25, (parseFloat(user.cgpa) / 10) * 25);
        
        // Website Activities & Syllabus/Task Completion via XP (max 25 points)
        // Assume 500 XP is a very active student (100% activity score)
        if (user.xp) score += Math.min(25, (user.xp / 500) * 25);
        
        // Professional Profile Completeness (max 35 points)
        if (user.resumeUrl) score += 15;
        if (user.github) score += 10;
        if (user.linkedin) score += 5;
        if (user.portfolioUrl) score += 5;

        // Skills validation (max 15 points)
        if (user.skills && user.skills.length > 0) score += Math.min(15, user.skills.length * 3);

        return Math.min(100, Math.round(score));
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <Toaster position="top-center" />
            
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <Network className="text-purple-600" size={40} /> {isAlumni ? 'Alumni Dashboard' : 'Alumni Network'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                        {isAlumni 
                            ? 'Manage mentorship requests and explore the live India-wide alumni and student network map.' 
                            : 'Connect with verified alumni across India. Explore the live network map, send connection requests, and discover professional mentors.'}
                    </p>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('map')}
                    className={`pb-2 px-2 whitespace-nowrap font-bold text-lg transition-colors border-b-2 ${activeTab === 'map' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-2"><MapPin size={20} /> India Live Map</div>
                </button>

                {!isAlumni && (
                    <button 
                        onClick={() => setActiveTab('network')} 
                        className={`pb-2 px-2 whitespace-nowrap font-bold text-lg transition-colors border-b-2 ${activeTab === 'network' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <div className="flex items-center gap-2"><Users size={20} /> Global Network</div>
                    </button>
                )}
                
                <button 
                    onClick={() => setActiveTab('connections')} 
                    className={`pb-2 px-2 whitespace-nowrap font-bold text-lg transition-colors border-b-2 ${activeTab === 'connections' || (isAlumni && activeTab === 'network') ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-2"><Network size={20} /> {isAlumni ? 'Students Connected' : 'My Connections'}</div>
                </button>

                <button 
                    onClick={() => setActiveTab('requests')} 
                    className={`pb-2 px-2 whitespace-nowrap font-bold text-lg transition-colors border-b-2 ${activeTab === 'requests' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-2">
                        <UserPlus size={20} /> {isAlumni ? 'Incoming Requests' : 'Pending Requests'} 
                        {pendingRequests.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                        )}
                    </div>
                </button>
            </div>

            {activeTab === 'map' ? (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 shrink-0" size={18} />
                            <p>
                                {locationStatus === 'active'
                                  ? 'Live location is enabled. Your position updates automatically on the India network map.'
                                  : locationStatus === 'denied'
                                    ? 'Location access is blocked. Allow location in your browser settings to appear on the live map.'
                                    : 'Enable live location to appear on the real-time India network map. City and state are not required.'}
                            </p>
                        </div>
                        {locationStatus !== 'active' && (
                            <button
                                type="button"
                                onClick={syncLocation}
                                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                            >
                                Enable Live Location
                            </button>
                        )}
                    </div>
                    <AlumniMap
                        markers={mapMarkers}
                        loading={mapLoading}
                        lastUpdated={mapUpdatedAt}
                        stats={mapStats}
                        onRefresh={() => fetchMapData()}
                    />
                </div>
            ) : activeTab === 'network' && !isAlumni ? (
                <>
                    <div className="mb-6 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search alumni by name, company, role, or skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white shadow-sm"
                        />
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {filteredAlumni.map((alum, idx) => (
                        <motion.div
                            key={alum._id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-shadow flex flex-col"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <img src={alum.img} alt={alum.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-900" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{alum.name}</h3>
                                    <p className="text-sm text-purple-600 dark:text-purple-400">{alum.jobRole || alum.role}</p>
                                    {alum.company && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                            <Building size={12} /> {alum.company}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                        <Building size={12} /> {alum.collegeName || 'College not listed'}
                                    </div>
                                    {alum.passoutYear && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                            <Award size={12} /> Class of {alum.passoutYear}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Skills removed from alumni card */}

                            {alum.messageForStudents && (
                                <div className="mb-4 bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                    <p className="text-xs text-purple-700 dark:text-purple-300 italic">
                                        "{alum.messageForStudents}"
                                    </p>
                                </div>
                            )}

                            {alum.connectionStatus === 'accepted' && (
                                alum.showProfileDetails !== false ? (
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 space-y-2 border border-slate-100 dark:border-white/5">
                                        {alum.email && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Mail size={14} className="text-slate-400" /> <a href={`mailto:${alum.email}`} className="hover:text-purple-500">{alum.email}</a>
                                            </div>
                                        )}
                                        {alum.contactNo && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Activity size={14} className="text-red-400" /> <a href={`tel:${alum.contactNo}`} className="hover:text-red-500">{alum.contactNo}</a>
                                            </div>
                                        )}
                                        {alum.linkedin && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Linkedin size={14} className="text-blue-500" /> 
                                                <a href={alum.linkedin.startsWith('http') ? alum.linkedin : `https://${alum.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-blue-500 truncate">LinkedIn Profile</a>
                                            </div>
                                        )}
                                        {alum.portfolioUrl && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Users size={14} className="text-indigo-400" /> 
                                                <a href={alum.portfolioUrl.startsWith('http') ? alum.portfolioUrl : `https://${alum.portfolioUrl}`} target="_blank" rel="noreferrer" className="hover:text-indigo-500 truncate">Portfolio / Website</a>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-white/5 text-center text-xs text-slate-500">
                                        Detailed profile display disabled by user settings.
                                    </div>
                                )
                            )}

                            <div className="mt-auto space-y-2">
                                {alum.connectionStatus === 'accepted' ? (
                                    alum.allowDirectMessages !== false ? (
                                        <button
                                            onClick={() => requestMentorship(alum)}
                                            disabled={drafting}
                                            className="w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {drafting && selectedAlumni?._id === alum._id ? <><Loader2 size={16} className="animate-spin" /> Drafting...</> : <><Mail size={16} /> Direct Message</>}
                                        </button>
                                    ) : (
                                        <div className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700 text-sm">
                                            <Mail size={16} /> Messaging Disabled
                                        </div>
                                    )
                                ) : alum.connectionStatus === 'rejected' ? (
                                    <div className="w-full p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl space-y-2 text-center">
                                        <div className="text-sm font-bold text-red-600 dark:text-red-400">Connection Rejected</div>
                                        {alum.rejectMessage && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                                Reason: "{alum.rejectMessage}"
                                            </p>
                                        )}
                                        <button
                                            onClick={() => sendConnectionRequest(alum._id)}
                                            className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                                        >
                                            <UserPlus size={12} /> Correct & Connect Again
                                        </button>
                                    </div>
                                ) : alum.connectionStatus === 'pending' ? (
                                    <button disabled className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700">
                                        <Clock size={16} /> Request Pending
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => sendConnectionRequest(alum._id)}
                                        className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <UserPlus size={16} /> Connect
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {filteredAlumni.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            {searchQuery ? "No alumni match your search query." : "No alumni found in your network yet."}
                        </div>
                    )}
                </div>
                </>
            ) : activeTab === 'connections' || (isAlumni && activeTab === 'network') ? (
                <div className="w-full space-y-4 mb-8">
                    {myConnections.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-white/10">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Network</h3>
                            <p className="text-slate-500">
                                {isAlumni ? "Students connected with you will appear here." : "Your accepted connections appear here. Message them directly from the Global Network."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myConnections.map(conn => {
                                const user = isAlumni ? conn.senderId : conn.receiverId;
                                if (!user) return null;
                                if (isAlumni) {
                                    return (
                                        <motion.div
                                            key={conn._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-shadow flex flex-col"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <img src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-900" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{user.name}</h3>
                                                    <p className="text-sm text-purple-600 dark:text-purple-400">{user.role} {user.branch && `• ${user.branch}`}</p>
                                                    {user.collegeName && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                            <Building size={12} /> {user.collegeName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {user.email && (
                                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 space-y-2 border border-slate-100 dark:border-white/5">
                                                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                        <Mail size={14} className="text-slate-400" /> <a href={`mailto:${user.email}`} className="hover:text-purple-500 truncate">{user.email}</a>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-auto space-y-2">
                                                <button onClick={() => setSelectedUserProfile(user)} className="w-full py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2 text-sm">
                                                    View Profile
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                } else {
                                    return (
                                        <motion.div
                                            key={conn._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-shadow flex flex-col"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <img src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-900" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{user.name}</h3>
                                                    <p className="text-sm text-purple-600 dark:text-purple-400">{user.jobRole || user.role}</p>
                                                    {user.company && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                            <Building size={12} /> {user.company}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                        <Building size={12} /> {user.collegeName || 'College not listed'}
                                                    </div>
                                                    {user.passoutYear && (
                                                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                            <Award size={12} /> Class of {user.passoutYear}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {user.messageForStudents && (
                                                <div className="mb-4 bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                                    <p className="text-xs text-purple-700 dark:text-purple-300 italic">
                                                        "{user.messageForStudents}"
                                                    </p>
                                                </div>
                                            )}

                                            {user.showProfileDetails !== false ? (
                                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-4 space-y-2 border border-slate-100 dark:border-white/5">
                                                    {user.email && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                            <Mail size={14} className="text-slate-400" /> <a href={`mailto:${user.email}`} className="hover:text-purple-500">{user.email}</a>
                                                        </div>
                                                    )}
                                                    {user.contactNo && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                            <Activity size={14} className="text-red-400" /> <a href={`tel:${user.contactNo}`} className="hover:text-red-500">{user.contactNo}</a>
                                                        </div>
                                                    )}
                                                    {user.linkedin && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                            <Linkedin size={14} className="text-blue-500" /> 
                                                            <a href={user.linkedin.startsWith('http') ? user.linkedin : `https://${user.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-blue-500 truncate">LinkedIn Profile</a>
                                                        </div>
                                                    )}
                                                    {user.portfolioUrl && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                            <Users size={14} className="text-indigo-400" /> 
                                                            <a href={user.portfolioUrl.startsWith('http') ? user.portfolioUrl : `https://${user.portfolioUrl}`} target="_blank" rel="noreferrer" className="hover:text-indigo-500 truncate">Portfolio / Website</a>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-white/5 text-center text-xs text-slate-500">
                                                    Detailed profile display disabled by user settings.
                                                </div>
                                            )}

                                            <div className="mt-auto space-y-2">
                                                {user.allowDirectMessages !== false ? (
                                                    <button
                                                        onClick={() => requestMentorship(user)}
                                                        disabled={drafting}
                                                        className="w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {drafting && selectedAlumni?._id === user._id ? <><Loader2 size={16} className="animate-spin" /> Drafting...</> : <><Mail size={16} /> Direct Message</>}
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700 text-sm">
                                                        <Mail size={16} /> Messaging Disabled
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                }
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                    {pendingRequests.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-white/10">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
                            <p className="text-slate-500">You don't have any pending connection requests right now.</p>
                        </div>
                    ) : (
                        pendingRequests.map(req => {
                            const otherUser = isAlumni ? req.senderId : req.receiverId;
                            if (!otherUser) return null;
                            return (
                                <motion.div key={req._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <img src={otherUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.name}`} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{otherUser.name}</h4>
                                            <p className="text-sm text-slate-500">{otherUser.role} {otherUser.branch && `• ${otherUser.branch}`}</p>
                                        </div>
                                    </div>
                                    {isAlumni ? (
                                        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                                            <button onClick={() => setSelectedUserProfile(otherUser)} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors shadow-sm text-sm">
                                                View Profile
                                            </button>
                                            <button onClick={() => acceptRequest(req._id)} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm">
                                                Accept
                                            </button>
                                            <button onClick={() => setRejectModal({ open: true, requestId: req._id, message: '' })} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-sm text-sm">
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
                                            <button onClick={() => setSelectedUserProfile(otherUser)} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm text-sm">
                                                View Profile
                                            </button>
                                            <button disabled className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed text-sm">
                                                Request Sent
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            <AnimatePresence>
                {selectedUserProfile && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedUserProfile(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {selectedUserProfile.role === 'alumni' ? <Briefcase className="text-purple-500" /> : <Users className="text-blue-500" />} 
                                    {selectedUserProfile.role === 'alumni' ? 'Alumni Profile' : 'Student Profile'}
                                </h3>
                                <button onClick={() => setSelectedUserProfile(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <img src={selectedUserProfile.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserProfile.name}`} alt="" className="w-16 h-16 rounded-full border border-slate-200" />
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">{selectedUserProfile.name}</h4>
                                    <p className="text-sm text-slate-500">
                                        {selectedUserProfile.role === 'alumni' 
                                            ? `${selectedUserProfile.jobRole || 'Alumni'}${selectedUserProfile.company ? ` @ ${selectedUserProfile.company}` : ''}`
                                            : `${selectedUserProfile.enrollment || 'Student'} • ${selectedUserProfile.branch || 'Branch N/A'}${selectedUserProfile.cgpa ? ` • CGPA: ${selectedUserProfile.cgpa}` : ''}`}
                                    </p>
                                    {selectedUserProfile.role === 'alumni' && (
                                        <p className="text-xs text-purple-500 mt-1">
                                            {selectedUserProfile.collegeName || 'College not listed'}
                                            {selectedUserProfile.graduationYear || selectedUserProfile.passoutYear
                                              ? ` • Class of ${selectedUserProfile.graduationYear || selectedUserProfile.passoutYear}`
                                              : ''}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {selectedUserProfile.role === 'student' && (() => {
                                const score = calculateAIScore(selectedUserProfile);
                                const badgeColor = score >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50' 
                                                 : score >= 50 ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50'
                                                 : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50';
                                const badgeText = score >= 80 ? 'Advanced Background' 
                                                : score >= 50 ? 'Intermediate Background' 
                                                : 'Beginner Background';
                                return (
                                    <div className={`mb-6 p-3 rounded-xl border flex items-center justify-between ${badgeColor}`}>
                                        <div className="flex items-center gap-2">
                                            <Award size={20} />
                                            <div>
                                                <h4 className="font-bold text-sm">Overall Student Performance</h4>
                                                <p className="text-xs font-medium opacity-80">{badgeText}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black">{score}/100</span>
                                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">AI Score</p>
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            <div className="space-y-4">
                                {selectedUserProfile.role !== 'alumni' && (
                                    <div>
                                        <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Skills</span>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedUserProfile.skills && selectedUserProfile.skills.length > 0 ? selectedUserProfile.skills.map(s => (
                                                <span key={s} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded text-slate-700 dark:text-slate-300">{s}</span>
                                            )) : <span className="text-sm text-slate-500">No skills added</span>}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedUserProfile.role === 'alumni' && selectedUserProfile.messageForStudents && (
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/20">
                                        <p className="text-sm text-purple-700 dark:text-purple-300 italic">"{selectedUserProfile.messageForStudents}"</p>
                                    </div>
                                )}

                                {selectedUserProfile.role === 'alumni' && selectedUserProfile.course && (
                                    <div>
                                        <span className="block text-xs font-semibold text-slate-400 uppercase mb-1">Course & Branch</span>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{selectedUserProfile.course} • {selectedUserProfile.branch}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedUserProfile.role === 'student' && selectedUserProfile.github && (
                                        <a href={selectedUserProfile.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                            <Network size={16} /> GitHub
                                        </a>
                                    )}
                                    {selectedUserProfile.linkedin && (
                                        <a href={selectedUserProfile.linkedin.startsWith('http') ? selectedUserProfile.linkedin : `https://${selectedUserProfile.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                            <Linkedin size={16} /> LinkedIn
                                        </a>
                                    )}
                                    {selectedUserProfile.portfolioUrl && (
                                        <a href={selectedUserProfile.portfolioUrl.startsWith('http') ? selectedUserProfile.portfolioUrl : `https://${selectedUserProfile.portfolioUrl}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg col-span-2">
                                            <Users size={16} /> Portfolio / Website
                                        </a>
                                    )}
                                </div>
                                {selectedUserProfile.role === 'student' && selectedUserProfile.resumeUrl && (
                                    <a href={selectedUserProfile.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors mt-4">
                                        <Briefcase size={18} /> View Resume
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setRejectModal({ open: false, requestId: null, message: '' })}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reject Connection</h3>
                            <p className="text-sm text-slate-500 mb-4">Select a reason or write custom advice below.</p>
                            <select
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setRejectModal({
                                        ...rejectModal,
                                        message: val === 'Other' ? '' : val
                                    });
                                }}
                                className="w-full p-3 mb-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white text-sm"
                            >
                                <option value="">Select a common reason...</option>
                                <option value="Please update your resume before requesting.">Please update your resume before requesting.</option>
                                <option value="GitHub profile lacks projects or activity.">GitHub profile lacks projects or activity.</option>
                                <option value="LinkedIn profile is incomplete.">LinkedIn profile is incomplete.</option>
                                <option value="Please specify your career goals or interests.">Please specify your career goals or interests.</option>
                                <option value="CGPA or academic details are not updated.">CGPA or academic details are not updated.</option>
                                <option value="Other">Other (write custom reason below)</option>
                            </select>
                            <textarea
                                value={rejectModal.message}
                                onChange={(e) => setRejectModal({ ...rejectModal, message: e.target.value })}
                                placeholder="Reason or custom advice to the student..."
                                className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-500 text-slate-900 dark:text-white text-sm resize-none mb-4"
                            ></textarea>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setRejectModal({ open: false, requestId: null, message: '' })} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button onClick={rejectRequest} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                                    Confirm Reject
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedAlumni && mentorshipEmail && !isAlumni && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => { setSelectedAlumni(null); setMentorshipEmail(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Mail className="text-purple-600" /> Send Message
                                </h3>
                                <button onClick={() => { setSelectedAlumni(null); setMentorshipEmail(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X size={24} className="text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Your Interests (for AI context)</label>
                                    <input
                                        type="text"
                                        value={myInterests}
                                        onChange={(e) => setMyInterests(e.target.value)}
                                        placeholder="e.g., React, Machine Learning, Product Management"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Subject</label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        readOnly
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Message Body</label>
                                    <textarea
                                        value={mentorshipEmail}
                                        onChange={(e) => setMentorshipEmail(e.target.value)}
                                        rows={8}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={sendDirectMessage}
                                    disabled={sending}
                                    className="flex-1 py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                                >
                                    {sending ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <><Mail size={18} /> Send via Platform</>}
                                </button>
                                <button
                                    onClick={copyEmail}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {copied ? <><CheckCircle size={18} className="text-green-500" /> Copied!</> : <><Copy size={18} /> Copy Template</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Alumni;
