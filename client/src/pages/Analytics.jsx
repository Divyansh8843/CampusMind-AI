import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  FileText, 
  MessageSquare, 
  Activity, 
  Target, 
  TrendingUp,
  Star,
  Zap,
  RefreshCw,
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  // User Data State
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  
  // Filters
  const [branchFilter, setBranchFilter] = useState('All');
  const [filterYear, setFilterYear] = useState('All Years');
  const [filterSkill, setFilterSkill] = useState('All Skills');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Fetch User Stats (Once + Interval)
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/analytics/me`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) {
        setUserData(res.data.data);
      }
    } catch (err) {
      console.error("User stats error:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch Leaderboard (On Page/Filter Change)
  const fetchLeaderboard = async (isBackground = false) => {
    if (!isBackground) setLoadingLeaderboard(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/analytics/leaderboard`, { 
        headers: { Authorization: `Bearer ${token}` },
        params: {
            page: pagination.page,
            limit: pagination.limit,
            branch: branchFilter,
            year: filterYear,
            skill: filterSkill
        }
      });
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      console.error("Leaderboard error:", err);
      if (!isBackground) toast.error("Failed to load leaderboard.");
    } finally {
      if (!isBackground) setLoadingLeaderboard(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchUserData();
    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Leaderboard Effect (Initial + Real-time Sync)
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(() => fetchLeaderboard(true), 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [pagination.page, branchFilter, filterYear, filterSkill]);

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.pages) {
          setPagination(prev => ({ ...prev, page: newPage }));
      }
  };

  if (loadingUser && !userData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 size={32} className="text-blue-600 dark:text-blue-400" />
            Your Progress
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time usage and performance overview.
          </p>
        </div>
        <button
          onClick={() => { fetchUserData(); fetchLeaderboard(); }}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Refresh All"
        >
          <RefreshCw size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>

    {/* User Stats Section */}
    {userData && (
        <>
            {/* Usage Limits */}
          {!userData.usage.isPremium && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Resume Analyses</h3>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {userData.usage.resumeRemaining} of 3 remaining
                    </p>
                  </div>
                  <FileText size={40} className="text-amber-500/50" />
                </div>
                <NavLink to="/pricing" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline">
                  <Star size={14} /> Upgrade for unlimited
                </NavLink>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Mock Interviews</h3>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {userData.usage.interviewRemaining} of 3 remaining
                    </p>
                  </div>
                  <Activity size={40} className="text-amber-500/50" />
                </div>
                <NavLink to="/pricing" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline">
                  <Star size={14} /> Upgrade for unlimited
                </NavLink>
              </div>
            </div>
          )}

          {userData.usage.isPremium && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6 flex items-center gap-4">
              <Zap size={48} className="text-green-600 dark:text-green-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Premium Member</h3>
                <p className="text-slate-600 dark:text-slate-400">Unlimited access to all AI features.</p>
              </div>
            </div>
          )}

          {/* Totals Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Documents", value: userData.totals.documents, icon: FileText, color: "text-blue-600 bg-blue-100 dark:bg-blue-500/20" },
              { label: "Resume Analyses", value: userData.totals.resumeAnalyses, icon: FileText, color: "text-purple-600 bg-purple-100 dark:bg-purple-500/20" },
              { label: "Interviews", value: userData.totals.interviews, icon: Activity, color: "text-green-600 bg-green-100 dark:bg-green-500/20" },
              { label: "Chat Messages", value: userData.totals.chatSessions, icon: MessageSquare, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/20" }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

        {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} /> Recent Resume Scores
              </h3>
              <div className="space-y-3">
                {userData.recentResumes?.length > 0 ? userData.recentResumes.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className={`font-bold ${r.score >= 80 ? 'text-green-600' : r.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {r.score}%
                    </span>
                    <span className="text-xs text-slate-500 truncate max-w-[180px]">{r.topic || 'General'}</span>
                    <span className="text-xs text-slate-400">{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm py-4">No resume analyses yet.</p>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Target size={20} /> Recent Interview Results
              </h3>
              <div className="space-y-3">
                {userData.recentInterviews?.length > 0 ? userData.recentInterviews.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <span className={`font-bold ${r.score >= 80 ? 'text-green-600' : r.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {r.score}%
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{r.type} • {r.topic}</span>
                    <span className="text-xs text-slate-400">{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm py-4">No interview results yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
    )}

      {/* Global Leaderboard - Real-time & Paginated */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Target size={24} className="text-yellow-500" /> 
                    Global Leaderboard
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Resumes: +20 XP • Interviews: +Score XP • Docs: +5 XP
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 <div className="relative">
                    <select 
                        value={branchFilter}
                        onChange={(e) => { setBranchFilter(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                        className="pl-3 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="All">All Branches</option>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="IT">IT</option>
                        <option value="MECH">MECH</option>
                        <option value="CIVIL">CIVIL</option>
                    </select>
                 </div>

                 <div className="relative">
                    <select 
                        value={filterYear}
                        onChange={(e) => { setFilterYear(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                        className="pl-3 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option>All Years</option>
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
                    </select>
                 </div>

                 <div className="relative">
                    <select 
                        value={filterSkill}
                        onChange={(e) => { setFilterSkill(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                        className="pl-3 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option>All Skills</option>
                        <option>React</option>
                        <option>Python</option>
                        <option>JavaScript</option>
                        <option>Node.js</option>
                        <option>Java</option>
                        <option>C++</option>
                        <option>Design</option>
                        <option>Figma</option>
                        <option>Machine Learning</option>
                    </select>
                 </div>
            </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
            {loadingLeaderboard ? (
                 <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                 </div>
            ) : (
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-semibold rounded-lg">
                        <tr>
                            <th className="px-6 py-4 rounded-l-xl">Rank</th>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Year & Branch</th>
                            <th className="px-6 py-4">Top Skills</th>
                            <th className="px-6 py-4 text-right rounded-r-xl">Total XP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {leaderboard.length > 0 ? (
                            leaderboard.map((student, index) => {
                                const globalRank = (pagination.page - 1) * pagination.limit + index + 1;
                                return (
                                <tr key={student._id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${globalRank <= 3 ? 'font-medium' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                            globalRank === 1 ? "bg-yellow-100 text-yellow-600" :
                                            globalRank === 2 ? "bg-slate-200 text-slate-600" :
                                            globalRank === 3 ? "bg-amber-100 text-amber-700" :
                                            "bg-transparent text-slate-500"
                                        }`}>
                                            {globalRank}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                            {student.picture ? (
                                                <img src={student.picture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs">?</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className={globalRank <= 3 ? "text-slate-900 dark:text-white" : ""}>
                                                {student.name}
                                            </div>
                                            <div className="text-xs text-slate-500">{student.enrollment || 'Student'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {student.year || 'N/A'} • {student.branch || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                                            {student.skills?.slice(0, 2).map((s, i) => (
                                                <span key={i} className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded text-slate-500 border border-slate-200 dark:border-white/10">
                                                    {s}
                                                </span>
                                            ))}
                                            {student.skills?.length > 2 && <span className="text-[10px] text-slate-400">+{student.skills.length - 2}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold ${globalRank <= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                            {student.totalXP}
                                        </span>
                                        <span className="text-xs text-slate-400 ml-1">XP</span>
                                    </td>
                                </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                    No students found for this filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-white/5 pt-4">
            <div className="text-xs text-slate-500">
                Showing {leaderboard.length} of {pagination.total} students
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || loadingLeaderboard}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Page {pagination.page} of {pagination.pages}
                </div>
                 <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages || loadingLeaderboard}
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

export default Analytics;
