import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, CheckCircle, Circle, Loader2, AlertCircle, X, ChevronDown, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SyllabusTracker = () => {
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const fileInputRef = useRef(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchSyllabus();
    }, []);

    const fetchSyllabus = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/syllabus`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.syllabus) setSyllabus(res.data.syllabus);
            else setSyllabus(null);
        } catch (e) {
            console.error(e);
            setSyllabus(null);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!/\.pdf$/i.test(file.name)) {
            toast.error('Please upload a PDF syllabus.');
            return;
        }
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('syllabus', file);
            const res = await axios.post(`${API_BASE_URL}/api/syllabus/upload`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setSyllabus(res.data.syllabus);
                toast.success('Syllabus parsed! Live progress bars ready.');
            } else throw new Error(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const toggleTopic = async (subjectIndex, topicIndex, completed) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_BASE_URL}/api/syllabus/topic`, {
                subjectIndex,
                topicIndex,
                completed
            }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setSyllabus(res.data.syllabus);
        } catch (e) {
            toast.error('Failed to update');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Toaster position="top-center" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="text-blue-600" size={32} /> Smart Syllabus Tracker
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Upload your syllabus PDF. Track progress per subject and sync with Study Plan & Lecture Weaver.
                    </p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleUpload} />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                    {uploading ? 'Parsing...' : 'Upload Syllabus PDF'}
                </button>
            </div>

            {!syllabus ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 text-center"
                >
                    <BookOpen size={48} className="mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-2">No syllabus yet. Upload your official university syllabus (PDF).</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">AI will parse subjects and topics so you can track progress and get warnings if you fall behind.</p>
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                        Upload PDF
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{syllabus.title}</h2>
                    {syllabus.subjects?.map((subject, sIdx) => {
                        const done = subject.topics?.filter(t => t.completed).length || 0;
                        const total = subject.topics?.length || 0;
                        const progress = total ? Math.round((done / total) * 100) : 0;
                        const isExpanded = expandedSubject === sIdx;
                        return (
                            <motion.div
                                key={sIdx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedSubject(isExpanded ? null : sIdx)}
                                    className="w-full p-4 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronRight size={20} className="text-slate-500" />}
                                        <span className="font-bold text-slate-900 dark:text-white">{subject.name}</span>
                                        <span className="text-sm text-slate-500">{done}/{total} done</span>
                                    </div>
                                    <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-slate-100 dark:border-white/5">
                                            <div className="p-4 space-y-2">
                                                {(subject.topics || []).map((topic, tIdx) => (
                                                    <div key={tIdx} className="flex items-center gap-3 py-1">
                                                        <button
                                                            onClick={() => toggleTopic(sIdx, tIdx, !topic.completed)}
                                                            className="flex items-center gap-2 text-left flex-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2"
                                                        >
                                                            {topic.completed ? (
                                                                <CheckCircle size={20} className="text-green-500 shrink-0" />
                                                            ) : (
                                                                <Circle size={20} className="text-slate-400 shrink-0" />
                                                            )}
                                                            <span className={topic.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}>{topic.name}</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SyllabusTracker;
