import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Search, Filter, Trash2, Eye, Shield, Download, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const AdminDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBranch, setFilterBranch] = useState('All');
    
    // Deletion states
    const [deletingId, setDeletingId] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/upload/all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    branch: filterBranch,
                    search: searchTerm
                }
            });
            if (res.data.success) {
                setDocuments(res.data.documents);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            }
        } catch (error) {
            console.error("Fetch Docs Error:", error);
            // alert("Failed to fetch documents."); // Passive error handling preferred for search
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/upload/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (e) {
            console.error("Stats Fetch Error", e);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Debounced Search and Filter Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchDocuments();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterBranch, pagination.page]);

    
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document permanently?")) return;
        setDeletingId(docId);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/upload/${docId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDocuments(); // Refresh list
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Failed to delete document.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-7xl mx-auto space-y-8 pb-12"
        >
            {/* Premium Header */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all backdrop-blur-md border border-white/10">
                            <ArrowLeft size={24}/>
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-widest mb-3">
                                <FileText size={12} /> Resource Authority
                            </div>
                            <h1 className="text-4xl font-black tracking-tight">Document <span className="text-blue-400">Vault</span></h1>
                            <p className="text-blue-200/60 mt-2 font-medium">Global repository management for millions of academic assets.</p>
                        </div>
                    </div>
                    
                    {stats && (
                        <div className="flex gap-4">
                            <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Assets</p>
                                <p className="text-2xl font-black">{stats.totalCount}</p>
                            </div>
                            <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Data Volume</p>
                                <p className="text-2xl font-black">{(stats.totalSize / (1024 * 1024)).toFixed(1)} <span className="text-sm font-normal text-blue-400">MB</span></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search file, student name, enrollment..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                    <select 
                        value={filterBranch} 
                        onChange={(e) => { setFilterBranch(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                        className="px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none dark:text-white font-medium"
                    >
                        <option value="All">All Branches</option>
                        <option value="CSE">CSE</option>
                        <option value="IT">IT</option>
                        <option value="ECE">ECE</option>
                        <option value="EE">EE</option>
                        <option value="ME">ME</option>
                        <option value="CE">CE</option>
                    </select>
                </div>
            </div>

            {/* Documents List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">All Documents ({pagination.total})</h3>
                </div>
                
                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No documents found matching your criteria.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Document</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Branch/Enrollment</th>
                                    <th className="px-6 py-4">Uploaded</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {documents.map((doc) => (
                                    <tr key={doc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-semibold text-slate-900 dark:text-white truncate" title={doc.originalName}>{doc.originalName}</p>
                                                    <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{doc.userId?.name || 'Unknown'}</div>
                                            <div className="text-xs">{doc.userId?.email || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium mr-2">
                                                {doc.userId?.branch || '?'}
                                            </span>
                                            <span className="font-mono text-xs">{doc.userId?.enrollment || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono">
                                            {new Date(doc.uploadDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => window.open(doc.viewUrl || doc.url || `${API_BASE_URL}/uploads/${doc.filename}`, '_blank')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(doc._id)}
                                                    disabled={deletingId === doc._id}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10">
                    <div className="text-xs text-slate-500">
                        Showing {documents.length} of {pagination.total} documents
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1 || loading}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                             {pagination.page} / {pagination.pages}
                        </div>
                         <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages || loading}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default AdminDocuments;
