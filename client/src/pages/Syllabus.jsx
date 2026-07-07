import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, BookOpen, CheckCircle, Clock, TrendingUp, Loader2, X, FileText, Calendar, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Syllabus = () => {
    const [syllabuses, setSyllabuses] = useState([]);
    const [activeSyllabusId, setActiveSyllabusId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const fileInputRef = React.useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchSyllabuses();
    }, []);

    const fetchSyllabuses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/syllabus`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.syllabuses) {
                setSyllabuses(res.data.syllabuses);
                if (res.data.syllabuses.length > 0) {
                    setActiveSyllabusId(res.data.syllabuses[0]._id);
                }
            }
        } catch (err) {
            console.error('Fetch syllabus error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
            toast.error('Please upload PDF or DOCX only');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('syllabus', file);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/syllabus/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.success) {
                const newSyllabus = res.data.syllabus;
                setSyllabuses(prev => [newSyllabus, ...prev]);
                setActiveSyllabusId(newSyllabus._id);
                toast.success('Syllabus parsed! Live progress tracking enabled.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upload syllabus');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleTopic = async (subjectIndex, topicIndex) => {
        if (!activeSyllabus) return;
        const subject = activeSyllabus.subjects[subjectIndex];
        const topic = subject.topics[topicIndex];
        const newCompleted = !topic.completed;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_BASE_URL}/api/syllabus/topic`, {
                syllabusId: activeSyllabusId,
                subjectIndex,
                topicIndex,
                completed: newCompleted
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setSyllabuses(prev => prev.map(s => s._id === activeSyllabusId ? res.data.syllabus : s));
                toast.success(newCompleted ? 'Topic marked complete!' : 'Topic unchecked');
            }
        } catch (err) {
            toast.error('Failed to update topic');
        }
    };

    const activeSyllabus = syllabuses.find(s => s._id === activeSyllabusId);

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
                    <BookOpen className="text-blue-600" size={40} /> Smart Syllabus Tracker
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Upload multiple syllabuses. AI parses them and creates live progress bars. Syncs with Lecture Weaver & Study Plan.
                </p>
            </div>

            {syllabuses.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload size={48} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Upload Your Syllabus</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        Upload your official university syllabus PDF. AI will parse it and create a live progress tracker for each subject.
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                        {uploading ? <><Loader2 size={20} className="animate-spin" /> Parsing...</> : <><Upload size={20} /> Upload Syllabus PDF</>}
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {activeSyllabus?.title || 'Select Syllabus'} <ChevronDown size={24} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                    >
                                        <div className="max-h-60 overflow-y-auto py-2">
                                            {syllabuses.map(s => (
                                                <button
                                                    key={s._id}
                                                    onClick={() => { setActiveSyllabusId(s._id); setIsDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${s._id === activeSyllabusId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
                                                >
                                                    {s.title}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <p className="text-sm text-slate-500 mt-2 ml-1">{activeSyllabus?.subjects?.length || 0} subjects tracked</p>
                        </div>
                        
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {uploading ? <><Loader2 size={18} className="animate-spin" /> Parsing...</> : <><Upload size={18} /> Add Syllabus</>}
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                        </div>
                    </div>

                    {activeSyllabus?.subjects?.map((subject, sIdx) => {
                        const completed = subject.topics.filter(t => t.completed).length;
                        const total = subject.topics.length;
                        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return (
                            <motion.div
                                key={sIdx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-white/10"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{subject.name}</h3>
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-lg">
                                        <span className="text-sm text-slate-500">{completed}/{total} topics</span>
                                        <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {subject.topics.map((topic, tIdx) => (
                                        <button
                                            key={tIdx}
                                            onClick={() => toggleTopic(sIdx, tIdx)}
                                            className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${
                                                topic.completed
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-900/30'
                                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 hover:border-blue-300'
                                            }`}
                                        >
                                            {topic.completed ? (
                                                <CheckCircle size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0 mt-0.5" />
                                            )}
                                            <span className={`text-sm font-medium leading-tight ${topic.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                                                {topic.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Syllabus;
