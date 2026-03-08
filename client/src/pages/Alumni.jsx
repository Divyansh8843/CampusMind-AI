import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Network, Mail, Building, Award, Loader2, Copy, CheckCircle, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Alumni = () => {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlumni, setSelectedAlumni] = useState(null);
    const [mentorshipEmail, setMentorshipEmail] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [myInterests, setMyInterests] = useState('');
    const [drafting, setDrafting] = useState(false);
    const [copied, setCopied] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchAlumni();
        fetchMyInterests();
    }, []);

    const fetchAlumni = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/community/alumni`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setAlumni(res.data.data || []);
            }
        } catch (err) {
            console.error('Fetch alumni error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyInterests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.user.skills) {
                setMyInterests(res.data.user.skills.slice(0, 3).join(', '));
            }
        } catch (err) {}
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
                toast.success('AI-drafted mentorship email ready!');
            }
        } catch (err) {
            toast.error('Failed to draft email');
        } finally {
            setDrafting(false);
        }
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(mentorshipEmail);
        setCopied(true);
        toast.success('Email copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <Toaster position="top-center" />
            <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                    <Network className="text-purple-600" size={40} /> Alumni Network Graph
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Visual knowledge graph of alumni from your branch working at top companies. Request mentorship with AI-drafted emails.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {alumni.map((alum, idx) => (
                    <motion.div
                        key={alum._id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <img src={alum.img} alt={alum.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-900" />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{alum.name}</h3>
                                <p className="text-sm text-purple-600 dark:text-purple-400">{alum.role}</p>
                                {alum.company && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                        <Building size={12} /> {alum.company}
                                    </div>
                                )}
                            </div>
                        </div>
                        {alum.skills && alum.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                                {alum.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => requestMentorship(alum)}
                            disabled={drafting}
                            className="w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {drafting && selectedAlumni?._id === alum._id ? (
                                <><Loader2 size={16} className="animate-spin" /> Drafting...</>
                            ) : (
                                <><Mail size={16} /> Request Mentorship</>
                            )}
                        </button>
                    </motion.div>
                ))}
            </div>

            {selectedAlumni && mentorshipEmail && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => { setSelectedAlumni(null); setMentorshipEmail(''); }}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI-Drafted Mentorship Email</h3>
                            <button onClick={() => { setSelectedAlumni(null); setMentorshipEmail(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Your Interests (for personalization)</label>
                            <input
                                type="text"
                                value={myInterests}
                                onChange={(e) => setMyInterests(e.target.value)}
                                placeholder="e.g., React, Machine Learning, Product Management"
                                className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Subject</label>
                            <input
                                type="text"
                                value={emailSubject}
                                readOnly
                                className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Email Body</label>
                            <textarea
                                value={mentorshipEmail}
                                onChange={(e) => setMentorshipEmail(e.target.value)}
                                rows={10}
                                className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={copyEmail}
                                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Email</>}
                            </button>
                            <a
                                href={`mailto:${selectedAlumni.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(mentorshipEmail)}`}
                                className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Mail size={16} /> Open in Mail
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default Alumni;
