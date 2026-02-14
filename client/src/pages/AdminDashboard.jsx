import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Users, Activity, Clock, Server, FileText, Search, Filter, Trash2, Eye, X, Archive, Calendar, Trophy, Bot, Brain, Download, ChevronLeft, ChevronRight, CreditCard, TrendingUp, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../utils/logger';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    
    // Users Data & Pagination
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);

    // View User Modal State
    const [viewingUser, setViewingUser] = useState(null); // ID of user being viewed
    const [viewLoading, setViewLoading] = useState(false);
    const [userDetails, setUserDetails] = useState(null); // { user, logs, documents, resumes, interviewResults }

    // Filters
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterYear, setFilterYear] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    // Fetch Stats & Logs (Independent of pagination)
    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setStats(res.data.stats);
                setLogs(res.data.logs);
            }
        } catch (err) {
            console.error("Stats Error", err);
        }
    };

    // Fetch Users (Paginated)
    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                    branch: filterBranch,
                    year: filterYear,
                    search: searchTerm
                }
            });
            if (res.data.success) {
                setUsers(res.data.users);
                setPagination(prev => ({ ...prev, ...res.data.pagination }));
            }
        } catch (err) {
            console.error("Users Fetch Error", err);
            setError("Failed to load users");
        } finally {
            setUsersLoading(false);
            setLoading(false); // Initial load done
        }
    };

    // Initial Load & Intervals
    useEffect(() => {
        fetchStats();
        fetchUsers();
        const interval = setInterval(fetchStats, 10000); // Live stats
        return () => clearInterval(interval);
    }, []);

    // Effect for Filters & Search (Debounced)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filterBranch, filterYear, pagination.page]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        
        setDeleting(userId);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers(); // Refresh list
            fetchStats(); // Refresh stats
        } catch (err) {
            alert("Failed to delete user. Ensure you have permissions.");
        } finally {
            setDeleting(null);
        }
    };

    const handleViewUser = async (user) => {
        setViewingUser(user);
        setViewLoading(true);
        setUserDetails(null);
        
        logActivity('Admin Viewed Student', `Viewed profile of: ${user.email}`);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/users/${user._id}/full-details`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUserDetails(res.data.data);
            }
        } catch (err) {
            console.error("Fetch Details Error", err);
            alert("Failed to fetch user details.");
            setViewingUser(null);
        } finally {
            setViewLoading(false);
        }
    };

    if (loading && !stats) return <div className="text-center py-20">Loading Admin Console...</div>;

    const cards = [
        { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600 bg-blue-100 dark:bg-blue-500/20" },
        { label: "Premium Members", value: stats?.premiumUsers || 0, icon: Crown, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20" },
        { label: "Est. Revenue", value: `$${stats?.revenueEstimate || 0}`, icon: TrendingUp, color: "text-green-600 bg-green-100 dark:bg-green-500/20" },
        { label: "System Status", value: stats?.systemStatus, icon: Server, color: "text-purple-600 bg-purple-100 dark:bg-purple-500/20" },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto space-y-8 pb-12"
        >
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-500/30 text-white">
                    <Shield size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Console</h1>
                    <p className="text-slate-500 dark:text-slate-400">Real-time system monitoring and management.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.color}`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                         <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{card.value}</h3>
                         <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link to="/admin/documents" className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-between group">
                    <div>
                        <h3 className="text-xl font-bold mb-1">Manage Documents</h3>
                        <p className="text-blue-100 text-sm">View & Delete all student uploads</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                        <FileText size={24} />
                    </div>
                </Link>
            </div>

            {/* Student Directory */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                <div className="p-6 border-b border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Student Directory</h3>
                    
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name, email, or enrollment..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                        </div>
                        <select 
                            value={filterBranch} 
                            onChange={(e) => { setFilterBranch(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                            className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none dark:text-white"
                        >
                            <option value="All">All Branches</option>
                            <option value="CSE">CSE</option>
                            <option value="IT">IT</option>
                             <option value="ECE">ECE</option>
                            <option value="EE">EE</option>
                            <option value="ME">ME</option>
                            <option value="CE">CE</option>
                        </select>
                        <select 
                            value={filterYear} 
                            onChange={(e) => { setFilterYear(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                            className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none dark:text-white"
                        >
                            <option value="All">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    {usersLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Current Plan</th>
                                    <th className="px-6 py-4">Branch/Year</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    {user.picture ? (
                                                        <img src={user.picture} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users size={20} className="m-2 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.subscription?.plan === 'monthly' || user.subscription?.plan === 'yearly' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold border border-yellow-200 dark:border-yellow-500/20">
                                                    <Crown size={12} className="fill-yellow-600 dark:fill-yellow-400" />
                                                    {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
                                                    Free Tier
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium mr-2">
                                                {user.branch || 'Unknown'}
                                            </span>
                                            <span className="text-xs">Year {user.year || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-bold">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleViewUser(user)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    disabled={deleting === user._id || user.role === 'admin'}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                            No students found matching filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10">
                    <div className="text-xs text-slate-500">
                        Showing {users.length} of {pagination.total} students
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1 || usersLoading}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                             {pagination.page} / {pagination.pages}
                        </div>
                         <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages || usersLoading}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>

            {/* Live Logs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none mt-8">
                 <div className="p-6 border-b border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText size={20} /> Live System Logs
                    </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-64 overflow-y-auto">
                    {logs.map((log) => (
                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded min-w-[80px] text-center">
                                    {new Date(log.time).toLocaleTimeString()}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{log.action}</p>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-500">{log.user}</span>
                                        {log.details && <span className="text-[10px] text-slate-400 italic">{log.details}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No activity logs yet.</div>}
                </div>
            </div>

            {/* User Detail Modal */}
            <AnimatePresence>
                {viewingUser && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setViewingUser(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                                        <img src={viewingUser.picture} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{viewingUser.name}</h2>
                                        <p className="text-sm text-slate-500">{viewingUser.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingUser(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                    <X size={24} className="text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {viewLoading ? (
                                    <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
                                ) : userDetails ? (
                                    <>
                                        {/* Subscription & Academic Info */}
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                                <Shield size={16}/> Profile Overview
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <span className="text-xs text-slate-400 block mb-1">Plan</span>
                                                    <span className={`font-bold ${['monthly','yearly'].includes(userDetails.user.subscription?.plan) ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {userDetails.user.subscription?.plan?.toUpperCase() || 'FREE'}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <span className="text-xs text-slate-400 block mb-1">Enrollment</span>
                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{userDetails.user.enrollment || 'N/A'}</span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <span className="text-xs text-slate-400 block mb-1">Branch</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{userDetails.user.branch || 'N/A'}</span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <span className="text-xs text-slate-400 block mb-1">Year</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{userDetails.user.year ? `${userDetails.user.year}nd Year` : 'N/A'}</span>
                                                </div>
                                            </div>

                                            {/* Professional & Skills */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Skills & Expertise</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {userDetails.user.skills && userDetails.user.skills.length > 0 ? (
                                                            userDetails.user.skills.map((skill, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-100 dark:border-blue-900/30 font-medium">
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : <span className="text-xs text-slate-400 italic">No skills listed.</span>}
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Social & Gamification</h4>
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-bold border border-purple-100 dark:border-purple-900/30">
                                                                Level {userDetails.user.level || 1}
                                                            </div>
                                                            <div className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm font-bold border border-yellow-100 dark:border-yellow-900/30">
                                                                {userDetails.user.xp || 0} XP
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {userDetails.user.github && (
                                                            <a href={userDetails.user.github} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-center text-xs font-bold hover:bg-slate-800 transition-colors">
                                                                GitHub
                                                            </a>
                                                        )}
                                                        {userDetails.user.linkedin && (
                                                            <a href={userDetails.user.linkedin} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-center text-xs font-bold hover:bg-blue-700 transition-colors">
                                                                LinkedIn
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Resume Analysis History */}
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400"><FileText size={14}/></div> Resume Analysis Scores
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {userDetails.resumes && userDetails.resumes.length > 0 ? userDetails.resumes.map(resume => (
                                                    <div key={resume._id} className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col gap-2 relative overflow-hidden group">
                                                        <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full ${resume.score >= 80 ? 'bg-green-500' : resume.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                                        <div className="flex justify-between items-start z-10">
                                                            <div>
                                                                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Match Score</span>
                                                                <h4 className={`text-2xl font-bold ${resume.score >= 80 ? 'text-green-600' : resume.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                    {resume.score}%
                                                                </h4>
                                                            </div>
                                                            <span className="text-xs text-slate-400 font-mono text-right">
                                                                {new Date(resume.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 line-clamp-2 z-10">
                                                            {resume.jobDescription ? `JD: ${resume.jobDescription}` : 'General Analysis'}
                                                        </p>
                                                    </div>
                                                )) : <div className="col-span-full p-6 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed text-slate-400 text-sm">No resume analysis performed yet.</div>}
                                            </div>
                                        </section>

                                        {/* Interview & Aptitude Results */}
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"><Trophy size={14}/></div> Interview & Aptitude Results
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {userDetails.interviewResults && userDetails.interviewResults.length > 0 ? userDetails.interviewResults.map(res => (
                                                    <div key={res._id} className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                                                        <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full ${res.score >= 80 ? 'bg-green-500' : res.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                                        <div className="flex justify-between items-start z-10">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`p-2 rounded-lg ${res.type === 'mock' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                    {res.type === 'mock' ? <Bot size={16}/> : <Brain size={16}/>}
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">{res.type === 'mock' ? 'Mock Interview' : 'Aptitude Test'}</span>
                                                                    <h4 className="font-bold text-slate-800 dark:text-white line-clamp-1">{res.topic}</h4>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-2">
                                                            <span className={`text-2xl font-bold ${res.score >= 80 ? 'text-green-600' : res.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                {res.score}%
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-mono">
                                                                {new Date(res.timestamp).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )) : <div className="col-span-full p-6 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed text-slate-400 text-sm">No interview or aptitude records found.</div>}
                                            </div>
                                        </section>

                                        {/* Documents */}
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                                <Archive size={16}/> Uploaded Documents
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {userDetails.documents.length > 0 ? userDetails.documents.map(doc => (
                                                    <div key={doc._id} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between gap-3 group">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg shrink-0">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-sm font-semibold truncate text-slate-800 dark:text-white" title={doc.originalName}>{doc.originalName}</p>
                                                                <p className="text-xs text-slate-500">{new Date(doc.uploadDate).toLocaleDateString()} • {(doc.size / 1024).toFixed(1)} KB</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => window.open(doc.url || `${API_BASE_URL}/uploads/${doc.filename}`, '_blank')}
                                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                title="View/Download"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    if(!confirm("Delete this student's document?")) return;
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        await axios.delete(`${API_BASE_URL}/api/upload/${doc._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                                        setUserDetails(prev => ({ ...prev, documents: prev.documents.filter(d => d._id !== doc._id) }));
                                                                    } catch(e) { alert("Failed to delete document"); }
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )) : <div className="col-span-2 p-8 text-center bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">No documents uploaded.</div>}
                                            </div>
                                        </section>

                                        {/* Activity Logs */}
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                                                <Activity size={16}/> Recent Activity
                                            </h3>
                                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 divide-y divide-slate-200 dark:divide-white/5 max-h-60 overflow-y-auto">
                                                {userDetails.logs.length > 0 ? userDetails.logs.map(log => (
                                                    <div key={log._id} className="p-3 flex justify-between items-center bg-white dark:bg-transparent">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.action}</span>
                                                        <span className="text-xs text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                )) : <div className="p-4 text-center text-sm text-slate-400">No activity recorded.</div>}
                                            </div>
                                        </section>
                                    </>
                                ) : (
                                    <div className="text-center text-red-500">Failed to load user data.</div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminDashboard;
