import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Send, Sparkles, AlertCircle, UploadCloud, File, X, CheckCircle, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { logActivity } from '../utils/logger';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const ResumeAnalyzer = () => {
    const [resumeText, setResumeText] = useState('');
    const [jd, setJd] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [file, setFile] = useState(null); // Store file object
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        logActivity('Opened Resume Analyzer', 'User entered the resume tool');
    }, []);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/pdf') {
            setError("Only PDF files are supported currently.");
            return;
        }

        setLoading(true);
        setError('');
        setFileName(selectedFile.name);
        setFile(selectedFile); // Store file
        setAnalysis(null);
        setResumeText("File uploaded. Ready to analyze."); // Placeholder

        // Optional: Still extract text client-side for preview, but backend does the heavy lifting
        try {
            // We skip client-side extraction to rely on robust backend parsing
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setFileName('');
        }
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError('Please upload a resume PDF first.');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const token = localStorage.getItem('token');
            logActivity('Analyzed Resume', `File: ${fileName}, JD Length: ${jd.length}`);

            const formData = new FormData();
            formData.append('resume', file);
            formData.append('jd', jd);

            // Use the new Upload Endpoint
            const res = await axios.post(`${API_BASE_URL}/api/resume/upload`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Combine Local + AI Advice
            let output = "";
            if (res.data.match_percentage) output += `**Match Score: ${res.data.match_percentage}**\n\n`;
            if (res.data.suggestions && res.data.suggestions.length > 0) {
                 output += "### Suggestions:\n" + res.data.suggestions.map(s => `- ${s}`).join('\n') + "\n\n";
            }
            if (res.data.ai_advice) {
                output += "### AI Expert Feedback:\n" + res.data.ai_advice;
            } else {
                // Fallback if structured data is missing
                output = JSON.stringify(res.data, null, 2);
            }

            setAnalysis(output);
        } catch (err) {
            console.error("Analysis Error:", err);
            setError('Failed to analyze resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptimizeJD = async () => {
        if (!jd.trim()) return;
        setOptimizing(true);
        try {
            logActivity('Optimized JD', 'User requested AI improvement for JD');
            const token = localStorage.getItem('token');
            // Use 'general' type to bypass RAG restrictions
            const res = await axios.post(`${API_BASE_URL}/api/chat`, {
                message: `Please rewrite and improve this job description to be more professional and clear for a resume application context. Only return the improved text:\n\n${jd}`,
                type: 'general' 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJd(res.data.response);
        } catch (err) {
            console.error("Optimizing JD Error:", err);
            setError("Failed to optimize Job Description.");
        } finally {
            setOptimizing(false);
        }
    };

    const clearFile = () => {
        setResumeText('');
        setFileName('');
        setFile(null);
        setAnalysis(null);
        setError('');
    };

    // Drag and Drop Handlers
    const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const onDragLeave = () => setIsDragOver(false);
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-8 pb-12"
        >
            <div className="text-center py-8">
                <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3 text-slate-800 dark:text-white">
                    <Sparkles className="text-purple-600 dark:text-purple-400" size={32} />
                    Smart Resume Analyzer
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                    Upload your resume to receive AI-powered feedback, ATS scoring, and improvement suggestions instantly.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 h-[600px]">
                {/* LEFT: Inputs */}
                <div className="flex flex-col gap-6 h-full">
                    {/* File Upload Area */}
                    <div 
                        className={`flex-1 min-h-[200px] border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center p-8 relative overflow-hidden group ${
                            isDragOver 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' 
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500/50'
                        }`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
                         <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={handleFileUpload}
                            disabled={loading && !resumeText} // Disable while analyzing pdf, enable if text ready
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        
                        {loading && !resumeText ? (
                            <div className="flex flex-col items-center gap-3 animate-pulse">
                                <FileText size={48} className="text-purple-500" />
                                <p className="font-semibold text-slate-600 dark:text-slate-300">Reading PDF...</p>
                            </div>
                        ) : fileName ? (
                            <div className="flex flex-col items-center z-20">
                                <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3 shadow-sm">
                                    <File size={32} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{fileName}</h3>
                                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle size={14} /> Ready for Analysis
                                </p>
                                <button 
                                    onClick={(e) => {e.stopPropagation(); clearFile();}}
                                    className="mt-4 flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 bg-red-50 dark:bg-red-900/10 rounded-lg transition-colors z-30 relative"
                                >
                                     <X size={14}/> Remove File
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                    <UploadCloud size={32} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    Upload Resume
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Drag & drop your PDF here or click to browse
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Job Description */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-sm flex flex-col h-1/3">
                        <div className="flex justify-between items-center mb-2">
                             <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                 <FileText size={16} className="text-blue-500"/> Job Description (Optional)
                            </label>
                            <button 
                                onClick={handleOptimizeJD}
                                disabled={!jd.trim() || optimizing}
                                className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Use AI to polish the job description"
                            >
                                {optimizing ? (
                                    <div className="animate-spin w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                                ) : (
                                    <Wand2 size={12} />
                                )}
                                Optimize with AI
                            </button>
                        </div>
                        <textarea 
                            className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-800 dark:text-white placeholder-slate-400 custom-scrollbar"
                            placeholder="Paste the job description or write a draft..."
                            value={jd}
                            onChange={(e) => setJd(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !resumeText}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {loading ? 'Processing...' : <><Sparkles size={20} /> Analyze Resume</>}
                    </button>

                     {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium text-center">
                            {error}
                        </div>
                    )}
                </div>

                {/* RIGHT: Analysis Results */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-xl h-full flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                        <FileText className="text-purple-600 dark:text-purple-400" />
                        Analysis Report
                    </h2>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {loading && resumeText ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6">
                                <div className="relative">
                                     <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 rounded-full animate-spin border-t-blue-600"></div>
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <Sparkles size={20} className="text-blue-600 animate-pulse"/>
                                     </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="font-semibold text-lg text-slate-800 dark:text-white">Analyzing your profile...</p>
                                    <p className="text-sm">Reviewing keywords, structure, and impact.</p>
                                </div>
                            </div>
                        ) : analysis ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="prose dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300"
                            >
                                <div className="whitespace-pre-wrap leading-relaxed font-sans text-base">
                                    {analysis}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 gap-4 opacity-50">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                     <FileText size={48} />
                                </div>
                                <p className="font-medium text-lg">Upload your resume to see results</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ResumeAnalyzer;
