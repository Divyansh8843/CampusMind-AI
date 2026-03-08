import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertTriangle, Zap, ArrowRight, BookOpen, Upload, RefreshCw, Loader2, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Resume = () => {
    const [resumeFile, setResumeFile] = useState(null);
    const [fileName, setFileName] = useState("");
    const [jdText, setJdText] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
            toast.error("Please upload PDF or DOCX only.");
            return;
        }
        setResumeFile(file);
        setFileName(file.name);
        setResult(null);
    };


    const handleRewriteJD = async () => {
        if (!jdText.trim()) {
            toast.error("Please enter a Job Description first.");
            return;
        }

        setIsRewriting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/chat`, {
                message: `Rewrite the following Job Description to be more professional, attractive, and structured (Use headings like Role, Responsibilities, Requirements, Benefits):\n\n${jdText}`,
                type: 'general'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.response) {
                 setJdText(res.data.response);
                 toast.success("Job Description Rewritten by AI!");
            } else {
                 throw new Error("No response from AI");
            }
        } catch (error) {
            console.error("Rewrite failed", error);
            toast.error("Failed to rewrite. Try again.");
        } finally {
            setIsRewriting(false);
        }
    };


    const handleAnalyze = async () => {
        if (!resumeFile) {
            toast.error("Please upload your resume PDF/DOCX first.");
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('resume', resumeFile);
            if (jdText.trim()) formData.append('jd', jdText.trim());

            const res = await axios.post(`${API_BASE_URL}/api/resume/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                setResult({
                    success: true,
                    match_percentage: typeof res.data.match_percentage === 'string' ? res.data.match_percentage : (res.data.match_percentage + '%'),
                    suggestions: res.data.suggestions || [],
                    missing_keywords: res.data.missing_keywords || [],
                    ai_advice: res.data.ai_advice
                });
                toast.success("Analysis complete! +50 XP");
            } else {
                throw new Error(res.data.message || 'Analysis failed');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Analysis failed. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const clearFile = () => {
        setFileName("");
        setResumeFile(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <Toaster position="top-center" />

            <div className="text-center mb-10">
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
                >
                    AI Resume Architect
                </motion.h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Upload your resume and optimize it for any Job Description instantly.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* Resume Upload Section (NO TEXT PASTE) */}
                    <div className={`bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border-2 border-dashed transition-all ${fileName ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'} text-center relative`}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload} 
                        />
                        
                        {!fileName ? (
                            <div className="flex flex-col items-center justify-center py-8 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                                    <Upload size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Upload Resume</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                    Drag & drop or click to upload PDF/DOCX.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Resume Uploaded</h3>
                                <p className="text-sm font-mono text-slate-600 dark:text-slate-300 mb-6 bg-white dark:bg-black/20 px-3 py-1 rounded border border-slate-200 dark:border-white/10">
                                    {fileName}
                                </p>
                                <button 
                                    onClick={clearFile}
                                    className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 transition-colors"
                                >
                                    <X size={12}/> Remove File
                                </button>
                            </div>
                        )}
                    </div>

                    {/* JD Section */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <BookOpen size={18} className="text-purple-500" /> 
                                Job Description
                            </label>
                            <button 
                                onClick={handleRewriteJD}
                                disabled={isRewriting || !jdText}
                                className="text-xs font-bold px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isRewriting ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>} Rewrite using AI
                            </button>
                        </div>
                        <textarea 
                            className="w-full h-48 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm text-slate-800 dark:text-slate-200 font-mono"
                            placeholder="Paste the Job Description here..."
                            value={jdText}
                            onChange={(e) => setJdText(e.target.value)}
                        ></textarea>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !resumeFile}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="animate-pulse">Analyzing Compatibility...</span>
                        ) : (
                            <>
                                <Zap size={20} className="fill-white" /> Analyze Resume vs JD
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Result Section (Unchanged logic, just ensure it renders) */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col min-h-[500px]"
                >
                    {!result ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                                <Zap size={40} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-600 dark:text-slate-500">Ready to Architect</h3>
                            <p className="max-w-xs">
                                Upload your resume and JD to get actionable AI feedback and optimization.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Score Header */}
                            <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl"></div>
                                 <div className="relative z-10">
                                     <div className="text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                                         {result.match_percentage}
                                     </div>
                                     <p className="text-blue-100 font-medium">ATS Score</p>
                                 </div>
                            </div>

                            <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                                {/* Suggestions */}
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-amber-500" /> Critical Improvements
                                    </h3>
                                    <ul className="space-y-3">
                                        {result.suggestions?.map((s, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Missing Keywords */}
                                {result.missing_keywords?.length > 0 && (
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <ArrowRight size={20} className="text-red-500" /> Missing Keywords
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {result.missing_keywords.map((k, i) => (
                                                <span key={i} className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* AI Advice */}
                                {result.ai_advice && (
                                    <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                            <Zap size={22} className="text-blue-500 fill-blue-500/20" /> Strategic AI Tailoring Advice
                                        </h3>
                                        <div className="bg-slate-50/80 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                            {result.ai_advice.split('\n\n').map((paragraph, index) => (
                                                <p 
                                                    key={index} 
                                                    className="text-slate-700 dark:text-slate-300 mb-4 last:mb-0 leading-loose text-[15px] text-justify font-medium"
                                                >
                                                    {paragraph.split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line.includes('**') || line.includes('* ') || line.includes('- ') ? (
                                                                <span className="block mt-2 pl-4 border-l-2 border-blue-400 dark:border-blue-600 text-slate-800 dark:text-slate-200 font-semibold shadow-sm p-1">
                                                                    {line.replace(/\*\*/g, '').replace(/^[-*]\s*/, '• ')}
                                                                </span>
                                                            ) : (
                                                                <span>{line.replace(/\*\*/g, '')}</span>
                                                            )}
                                                            {i !== paragraph.split('\n').length - 1 && <br />}
                                                        </React.Fragment>
                                                    ))}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Resume;
