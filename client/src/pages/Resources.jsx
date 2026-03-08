import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Resources = () => {
    const [documents, setDocuments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    
    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("All");

    const fileInputRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    // Debounced Search and Filter
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDocuments();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterType, pagination.page]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/upload`, {
                headers: { Authorization: `Bearer ${token}` },
                 params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    search: searchTerm,
                    type: filterType
                }
            });
            if (res.data.success) {
                setDocuments(res.data.documents);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            }
        } catch (error) {
            console.error("Error fetching docs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFiles = (files) => {
        if (files && files[0]) {
            handleUpload(files[0]);
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                // Add new doc to list optimistically or fetch again.
                // Since pagination exists, fetching again (page 1) is safer to see it at top.
                setSearchTerm(""); // Reset search
                setPagination(prev => ({ ...prev, page: 1 })); 
                fetchDocuments();
            }
        } catch (err) {
            console.error(err);
             setUploadError("Failed to upload. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const deleteDocument = async (id) => {
        if(!confirm("Are you sure you want to delete this document?")) return;
        
        try {
            await axios.delete(`${API_BASE_URL}/api/upload/${id}`, {
                 headers: { Authorization: `Bearer ${token}` }
            });
            fetchDocuments();
        } catch (err) {
            console.error("Delete failed", err);
            alert("Could not delete document.");
        }
    }

    const downloadDocument = (doc) => {
        // Use Presigned View URL if available, otherwise fallback to URL or legacy local
        const url = doc.viewUrl || doc.url || `${API_BASE_URL}/uploads/${doc.filename}`;
        window.open(url, '_blank');
    };

    // Drag and Drop handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">Uploaded Documents</h1>
                    <p className="text-slate-500 dark:text-slate-400">Access and manage official study materials.</p>
                </div>
                
                 <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search files..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                            className="pl-9 pr-4 py-2 bg-transparent text-sm outline-none text-slate-700 dark:text-white placeholder:text-slate-400 w-40 md:w-64"
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="relative">
                        <select 
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                            className="appearance-none bg-transparent pl-3 pr-8 py-2 text-sm outline-none text-slate-700 dark:text-white cursor-pointer font-medium"
                        >
                            <option value="All">All Types</option>
                            <option value="pdf">PDF</option>
                            <option value="docx">DOCX</option>
                            <option value="txt">TXT</option>
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                 </div>
            </div>

            <div 
                className={`
                    relative p-8 md:p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all bg-slate-50 dark:bg-slate-800/10
                    ${dragActive 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.01]' 
                        : uploading 
                            ? 'border-blue-500/50 bg-slate-100 dark:bg-slate-800/50 cursor-wait'
                            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/20'
                    }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >  
            
                 <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={(e) => handleFiles(e.target.files)}
                    accept=".pdf,.txt,.docx,.md"
                    disabled={uploading}
                />

                <AnimatePresence mode='wait'>
                    {uploading ? (
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-blue-500 dark:text-blue-400 font-medium">Analyzing & Indexing Document...</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center gap-4"
                        >
                             <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-2 shadow-lg dark:shadow-black/20">
                                <UploadCloud size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                                    Click to upload new document
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                                    Share notes, research papers, or assignments (PDF, DOCX).
                                </p>
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()} 
                                className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Browse Files
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {uploadError && (
                    <div className="absolute bottom-4 text-red-500 dark:text-red-400 text-sm flex items-center gap-2 bg-red-100 dark:bg-red-900/20 px-4 py-2 rounded-full">
                        <XCircle size={16} /> {uploadError}
                    </div>
                )}
            </div>

            <div className="min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                         <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : documents.length === 0 && !uploading ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-sm">No documents found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <AnimatePresence>
                                {documents.map((doc) => (
                                    <motion.div 
                                        key={doc._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-2xl p-5 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all relative shadow-sm hover:shadow-md dark:shadow-none"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => downloadDocument(doc)}
                                                    className="p-1.5 text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => downloadDocument(doc)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => deleteDocument(doc._id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 truncate" title={doc.originalName}>
                                            {doc.originalName}
                                        </h3>
                                        <p className="text-xs text-slate-400 truncate">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(doc.uploadDate).toLocaleDateString()}
                                            </span>
                                            <span className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <CheckCircle size={12} /> Available
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Controls */}
                         {documents.length > 0 && (
                            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 rounded-xl">
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
            </div>
        </div>
    );
};

export default Resources;
