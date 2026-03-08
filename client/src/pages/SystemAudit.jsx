import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Activity, FileText, Search, Filter, Trash2, Eye, ArrowLeft, ChevronLeft, ChevronRight, Server, Database, Cpu, Globe, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const SystemAudit = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('All');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/log/all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    search: searchTerm,
                    action: filterAction
                }
            });
            if (res.data.success) {
                setLogs(res.data.logs);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            }
        } catch (error) {
            console.error("Fetch Logs Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filterAction]);

    // Debounced Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (pagination.page !== 1) setPagination(prev => ({ ...prev, page: 1 }));
            else fetchLogs();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const actionTypes = ['All', 'User Login', 'User Signup', 'Resume Upload', 'Syllabus Upload', 'AI Chat', 'Payment Success', 'Admin Access', 'Profile Update'];

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-7xl mx-auto space-y-8 pb-12"
        >
            {/* High-Tech Header */}
            <div className="bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-600/5 rounded-full blur-[100px] -ml-36 -mb-36"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Link to="/admin" className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all backdrop-blur-md border border-white/10 group">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest mb-3">
                                <Zap size={10} className="animate-pulse" /> Final Global Audit
                            </div>
                            <h1 className="text-4xl font-black tracking-tight">System <span className="text-blue-500">Intelligence</span></h1>
                            <p className="text-slate-400 mt-2 font-medium">Real-time oversight of global user interactions and AI core performance.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Events</p>
                            <p className="text-2xl font-black">{pagination.total.toLocaleString()}</p>
                        </div>
                        <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Server Latency</p>
                            <p className="text-2xl font-black">24<span className="text-sm font-normal text-slate-500">ms</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "AI Uptime", value: "99.98%", icon: Cpu, color: "text-blue-500" },
                    { label: "Active Regions", value: "142", icon: Globe, color: "text-emerald-500" },
                    { label: "Database Sync", value: "Normal", icon: Database, color: "text-purple-500" },
                    { label: "Audit Health", value: "Excellent", icon: Shield, color: "text-orange-500" },
                ].map((m, i) => (
                    <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-slate-50 dark:bg-white/5 ${m.color}`}>
                            <m.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{m.label}</p>
                            <p className="text-xl font-black dark:text-white">{m.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Logs Interface */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Activity className="text-blue-500" />
                        <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">Technical Audit Trail</h3>
                    </div>
                    
                    <div className="flex flex-1 max-w-2xl gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search by user or detail..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                            />
                        </div>
                        <select 
                            value={filterAction} 
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold dark:text-white outline-none"
                        >
                            {actionTypes.map(act => <option key={act} value={act}>{act}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                             <p className="text-slate-500 font-mono text-xs animate-pulse">DECRYPTING LOG STREAM...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-20 text-center text-slate-500 italic">Zero activity matching current filters.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-bold uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Network ID / User</th>
                                    <th className="px-6 py-4">Action Event</th>
                                    <th className="px-6 py-4">Execution Details</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="font-mono text-xs text-slate-500">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="font-bold text-slate-800 dark:text-white truncate" title={log.user}>{log.user}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                                                log.action.includes('Delete') ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 
                                                log.action.includes('Payment') ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                                log.action.includes('AI') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                                'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 italic">
                                            {log.details || 'Internal metadata trace'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Stream Block {pagination.page} / {pagination.pages} • {pagination.total} Total Events
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1 || loading}
                            className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={20} className="dark:text-white" />
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages || loading}
                            className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={20} className="dark:text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SystemAudit;
