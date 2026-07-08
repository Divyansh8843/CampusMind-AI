import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Shield, Users, Activity, Server, FileText, Search, Trash2, Eye, X,
  Calendar, Trophy, Bot, Brain, ChevronLeft, ChevronRight, CreditCard,
  TrendingUp, Crown, MessageSquare, ChevronDown, Briefcase, Globe, Plus,
  Pencil, CheckCircle, XCircle, Clock, UserCheck, UserX, BarChart3,
  DollarSign, Zap, Settings, Bell, LogOut, GraduationCap, Building2,
  AlertTriangle, RefreshCw, Download, ExternalLink, Mail, Phone, MapPin,
  Award, Star, Layers, ArrowUpRight, ArrowDownRight, Hash, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../utils/logger';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = (token) => ({
  get: (url, params = {}) => axios.get(`${API_BASE_URL}${url}`, { headers: { Authorization: `Bearer ${token}` }, params }),
  post: (url, data) => axios.post(`${API_BASE_URL}${url}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  patch: (url, data) => axios.patch(`${API_BASE_URL}${url}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  delete: (url) => axios.delete(`${API_BASE_URL}${url}`, { headers: { Authorization: `Bearer ${token}` } }),
});

// ─── Helper Components ────────────────────────────────────────────────────────

const PlanBadge = ({ plan }) => {
  const configs = {
    monthly: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30',
    yearly: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
    free: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10',
  };
  const labels = { monthly: 'Monthly Pro', yearly: 'Yearly Pro', free: 'Free' };
  const p = plan || 'free';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${configs[p] || configs.free}`}>
      {(p === 'monthly' || p === 'yearly') && <Crown size={10} className="fill-current" />}
      {labels[p] || 'Free'}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const configs = {
    admin: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    alumni: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30',
    student: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30',
  };
  const icons = { admin: <Shield size={10} />, alumni: <GraduationCap size={10} />, student: <Users size={10} /> };
  const r = role || 'student';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${configs[r] || configs.student}`}>
      {icons[r]}
      {r}
    </span>
  );
};

const AlumniVerificationBadge = ({ status }) => {
  const configs = {
    verified: 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30',
    pending: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30',
    rejected: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
    unverified: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10',
  };
  const icons = {
    verified: <CheckCircle size={10} />,
    pending: <Clock size={10} />,
    rejected: <XCircle size={10} />,
    unverified: <AlertTriangle size={10} />,
  };
  const s = status || 'unverified';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${configs[s] || configs.unverified}`}>
      {icons[s]}
      {s}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color, sub, trend }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl hover:shadow-lg hover:border-blue-500/30 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={22} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'text-green-600 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-0.5">{value ?? '—'}</h3>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

const Spinner = () => (
  <div className="flex justify-center items-center h-40">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Avatar = ({ user, size = 10 }) => (
  <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm`}>
    {user?.picture ? (
      <img src={user.picture} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
    ) : (
      <span>{user?.name?.[0]?.toUpperCase() || '?'}</span>
    )}
  </div>
);

// ─── User Detail Modal ────────────────────────────────────────────────────────

const UserDetailModal = ({ user, onClose, onUpdate, onDelete, token }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api(token).get(`/api/admin/users/${user._id}/full-details`);
        if (res.data.success) setDetails(res.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user._id, token]);

  const handleUpdate = async (updates) => {
    setUpdating(true);
    try {
      const res = await api(token).patch(`/api/admin/users/${user._id}`, updates);
      if (res.data.success) {
        setDetails(prev => ({ ...prev, user: res.data.user }));
        onUpdate();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api(token).delete(`/api/admin/users/${user._id}`);
      onDelete();
      onClose();
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  };

  const u = details?.user || user;

  const sections = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'override', label: 'Override', icon: Shield },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'performance', label: 'Performance', icon: Trophy },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Avatar user={u} size={14} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{u.name}</h2>
                <RoleBadge role={u.role} />
                <PlanBadge plan={u.subscription?.plan} />
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
                <Mail size={12} /> {u.email}
                {u.enrollment && <><span className="text-slate-300">·</span><Hash size={12} />{u.enrollment}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {updating && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Delete User"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Sub Nav */}
        <div className="flex gap-1 px-6 pt-4 pb-0 border-b border-slate-200 dark:border-white/10 overflow-x-auto flex-shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${activeSection === s.id ? 'text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-white'}`}
            >
              <s.icon size={13} /> {s.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? <Spinner /> : !details ? <div className="text-center text-slate-500 py-10">Failed to load details.</div> : (
            <>
              {/* OVERVIEW */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Branch', value: u.branch || 'N/A' },
                      { label: 'Year', value: u.year ? `Year ${u.year}` : 'N/A' },
                      { label: 'Semester', value: u.semester ? `Sem ${u.semester}` : 'N/A' },
                      { label: 'XP Points', value: `${u.xp || 0} XP` },
                      { label: 'Level', value: `Level ${u.level || 1}` },
                      { label: 'Streak', value: `${u.streak || 0} days` },
                      { label: 'CGPA', value: u.cgpa || 'N/A' },
                      { label: 'Joined', value: new Date(u.createdAt).toLocaleDateString() },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                        <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {u.role === 'alumni' && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-200 dark:border-purple-500/20">
                      <h4 className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2"><GraduationCap size={14} /> Alumni Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Company', value: u.company },
                          { label: 'Job Role', value: u.jobRole },
                          { label: 'College', value: u.collegeName },
                          { label: 'Grad Year', value: u.graduationYear },
                          { label: 'Verification', value: <AlumniVerificationBadge status={u.alumniVerification?.status} /> },
                          { label: 'City', value: u.city },
                        ].map(item => (
                          <div key={item.label}>
                            <p className="text-xs text-purple-400 mb-0.5">{item.label}</p>
                            <p className="font-semibold text-purple-800 dark:text-purple-200 text-sm">{item.value || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {u.skills?.length > 0 ? u.skills.map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-800 font-medium">{skill}</span>
                        )) : <span className="text-xs text-slate-400 italic">No skills listed</span>}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Social Links</h4>
                      <div className="space-y-2">
                        {u.github && <a href={u.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"><ExternalLink size={12} />GitHub</a>}
                        {u.linkedin && <a href={u.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"><ExternalLink size={12} />LinkedIn</a>}
                        {u.portfolioUrl && <a href={u.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"><Globe size={12} />Portfolio</a>}
                        {!u.github && !u.linkedin && !u.portfolioUrl && <span className="text-xs text-slate-400 italic">No social links</span>}
                      </div>
                    </div>
                  </div>

                  {details.resumes?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><FileText size={13} />Resume Analysis Scores</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {details.resumes.slice(0, 6).map(r => (
                          <div key={r._id} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-12 h-12 opacity-10 rounded-bl-full ${r.score >= 80 ? 'bg-green-500' : r.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <span className="text-xs text-slate-400">Match Score</span>
                            <h5 className={`text-2xl font-black ${r.score >= 80 ? 'text-green-600' : r.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{r.score}%</h5>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{new Date(r.timestamp).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OVERRIDE */}
              {activeSection === 'override' && (
                <div className="space-y-6">
                  <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-500/20">
                    <h3 className="text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-5 flex items-center gap-2">
                      <Shield size={16} /> Administrative Override — Changes are immediate
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[
                        {
                          label: 'Access Level (Role)',
                          el: <select value={u.role} onChange={e => handleUpdate({ role: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500">
                            <option value="student">Student</option>
                            <option value="alumni">Alumni</option>
                            <option value="admin">Administrator</option>
                          </select>
                        },
                        {
                          label: 'Subscription Plan',
                          el: <select value={u.subscription?.plan || 'free'} onChange={e => handleUpdate({ subscription: { plan: e.target.value, status: e.target.value === 'free' ? 'inactive' : 'active' } })}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500">
                            <option value="free">Free Tier</option>
                            <option value="monthly">Monthly Pro</option>
                            <option value="yearly">Yearly Pro</option>
                          </select>
                        },
                        {
                          label: 'Academic Branch',
                          el: <select value={u.branch || ''} onChange={e => handleUpdate({ branch: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500">
                            <option value="">N/A</option>
                            {['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'CIVIL', 'BBA', 'MBA'].map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        },
                        {
                          label: 'Year',
                          el: <select value={u.year || ''} onChange={e => handleUpdate({ year: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white outline-none">
                            <option value="">N/A</option>
                            {['1', '2', '3', '4'].map(y => <option key={y} value={y}>Year {y}</option>)}
                          </select>
                        },
                        {
                          label: 'Enrollment No.',
                          el: <input type="text" defaultValue={u.enrollment}
                            onBlur={e => e.target.value !== u.enrollment && handleUpdate({ enrollment: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500 outline-none font-mono" />
                        },
                        {
                          label: 'XP Points',
                          el: <input type="number" defaultValue={u.xp || 0}
                            onBlur={e => parseInt(e.target.value) !== u.xp && handleUpdate({ xp: parseInt(e.target.value) })}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-red-500 outline-none" />
                        },
                      ].map(item => (
                        <div key={item.label}>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">{item.label}</label>
                          {item.el}
                        </div>
                      ))}
                    </div>
                  </div>

                  {u.role === 'alumni' && u.alumniVerification && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-200 dark:border-purple-500/20">
                      <h3 className="text-sm font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2"><GraduationCap size={16} />Alumni Verification Override</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <AlumniVerificationBadge status={u.alumniVerification?.status} />
                        <span className="text-xs text-slate-500">Trust Score: <strong>{u.alumniVerification?.trustScore ?? 0}</strong></span>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Admin Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Reason for approval/rejection..."
                          className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={async () => {
                          try {
                            await api(token).patch(`/api/admin/alumni/${u._id}/verification`, { action: 'approve', adminNotes: notes });
                            setDetails(prev => ({ ...prev, user: { ...prev.user, alumniVerification: { ...prev.user.alumniVerification, status: 'verified' } } }));
                            onUpdate();
                          } catch (e) { alert('Failed to approve'); }
                        }} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-500 transition-colors flex items-center justify-center gap-2">
                          <CheckCircle size={16} /> Approve Verification
                        </button>
                        <button onClick={async () => {
                          try {
                            await api(token).patch(`/api/admin/alumni/${u._id}/verification`, { action: 'reject', adminNotes: notes });
                            setDetails(prev => ({ ...prev, user: { ...prev.user, alumniVerification: { ...prev.user.alumniVerification, status: 'rejected' } } }));
                            onUpdate();
                          } catch (e) { alert('Failed to reject'); }
                        }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
                          <XCircle size={16} /> Reject Verification
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY */}
              {activeSection === 'activity' && (
                <div className="space-y-2">
                  {details.logs?.length > 0 ? details.logs.map(log => (
                    <div key={log._id} className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Activity size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{log.action}</p>
                        {log.details && <p className="text-xs text-slate-500 mt-0.5 truncate">{log.details}</p>}
                      </div>
                      <span className="text-xs text-slate-400 font-mono flex-shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  )) : <div className="text-center py-10 text-slate-400 text-sm italic">No activity recorded yet.</div>}
                </div>
              )}

              {/* DOCUMENTS */}
              {activeSection === 'documents' && (
                <div className="space-y-3">
                  {details.documents?.length > 0 ? details.documents.map(doc => (
                    <div key={doc._id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{doc.originalName}</p>
                        <p className="text-xs text-slate-400">{(doc.size / 1024).toFixed(1)} KB · {doc.fileType}</p>
                      </div>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )) : <div className="text-center py-10 text-slate-400 text-sm italic">No documents uploaded.</div>}
                </div>
              )}

              {/* PERFORMANCE */}
              {activeSection === 'performance' && (
                <div className="space-y-6">
                  {details.interviewResults?.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Trophy size={13} />Interview & Assessment Results</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {details.interviewResults.map(res => (
                          <div key={res._id} className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-14 h-14 opacity-10 rounded-bl-full ${res.score >= 80 ? 'bg-green-500' : res.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1.5 rounded-lg ${res.type === 'mock' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {res.type === 'mock' ? <Bot size={14} /> : <Brain size={14} />}
                              </div>
                              <span className="text-xs text-slate-400 uppercase font-bold">{res.type === 'mock' ? 'Mock' : 'Aptitude'}</span>
                            </div>
                            <h5 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{res.topic}</h5>
                            <span className={`text-2xl font-black ${res.score >= 80 ? 'text-green-600' : res.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{res.score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div className="text-center py-10 text-slate-400 text-sm italic">No interview results yet.</div>}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const token = localStorage.getItem('token');
  const client = api(token);

  // Core State
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [healthInsight, setHealthInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs: students | alumni | admins | community | careers | revenue
  const [activeTab, setActiveTab] = useState('students');

  // Users (students/alumni/admins)
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');

  // Viewing User Modal
  const [viewingUser, setViewingUser] = useState(null);

  // Alumni pending
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [alumniSubTab, setAlumniSubTab] = useState('all'); // 'all' | 'pending'
  const [alumniLoading, setAlumniLoading] = useState(false);

  // Community
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postPagination, setPostPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [expandedPost, setExpandedPost] = useState(null);

  // Careers
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({ title: '', company: '', location: '', type: 'Internship', link: '', skills: '', batch: '' });

  // Revenue
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Admin Profile
  const [adminProfile, setAdminProfile] = useState(null);
  const [showAdminProfile, setShowAdminProfile] = useState(false);

  const roleForTab = { students: 'student', alumni: 'alumni', admins: 'admin' };

  // ─── Fetchers ────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await client.get('/api/admin/stats');
      if (res.data.success) { setStats(res.data.stats); setLogs(res.data.logs); }
    } catch (e) { console.error(e); }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await client.get('/api/admin/health-insight');
      if (res.data.success) setHealthInsight(res.data.performance);
    } catch (e) { console.error(e); }
  }, []);

  const fetchUsers = useCallback(async (role = 'student', page = 1) => {
    setUsersLoading(true);
    try {
      const res = await client.get('/api/admin/users', {
        role, page, limit: pagination.limit,
        branch: filterBranch, year: filterYear, plan: filterPlan, search: searchTerm
      });
      if (res.data.success) {
        setUsers(res.data.users);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (e) { console.error(e); }
    finally { setUsersLoading(false); setLoading(false); }
  }, [filterBranch, filterYear, filterPlan, searchTerm, pagination.limit]);

  const fetchPendingAlumni = useCallback(async () => {
    setAlumniLoading(true);
    try {
      const res = await client.get('/api/admin/alumni/pending');
      if (res.data.success) setPendingAlumni(res.data.alumni);
    } catch (e) { console.error(e); }
    finally { setAlumniLoading(false); }
  }, []);

  const fetchPosts = useCallback(async (page = 1) => {
    setPostsLoading(true);
    try {
      const res = await client.get('/api/admin/community/posts', { page, limit: postPagination.limit });
      if (res.data.success) {
        setPosts(res.data.posts);
        setPostPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (e) { console.error(e); }
    finally { setPostsLoading(false); }
  }, [postPagination.limit]);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await client.get('/api/admin/jobs');
      if (res.data.success) setJobs(res.data.jobs);
    } catch (e) { console.error(e); }
    finally { setJobsLoading(false); }
  }, []);

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await client.get('/api/admin/revenue-stats');
      if (res.data.success) setRevenue(res.data.revenue);
    } catch (e) { console.error(e); }
    finally { setRevenueLoading(false); }
  }, []);

  const fetchAdminProfile = useCallback(async () => {
    try {
      const res = await client.get('/api/admin/profile');
      if (res.data.success) setAdminProfile(res.data);
    } catch (e) { console.error(e); }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats();
    fetchHealth();
    fetchAdminProfile();
    const interval = setInterval(() => { fetchStats(); fetchHealth(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (['students', 'alumni', 'admins'].includes(activeTab)) {
        fetchUsers(roleForTab[activeTab], 1);
      } else if (activeTab === 'community') {
        fetchPosts(1);
      } else if (activeTab === 'careers') {
        fetchJobs();
      } else if (activeTab === 'revenue') {
        fetchRevenue();
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [activeTab, searchTerm, filterBranch, filterYear, filterPlan]);

  useEffect(() => {
    if (activeTab === 'alumni') fetchPendingAlumni();
  }, [activeTab]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchUsers(roleForTab[activeTab], newPage);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await client.delete(`/api/admin/community/posts/${postId}`);
      fetchPosts(postPagination.page);
    } catch (e) { alert('Delete failed'); }
  };

  const handleDeleteAnswer = async (postId, answerId) => {
    try {
      await client.delete(`/api/admin/community/posts/${postId}/answers/${answerId}`);
      fetchPosts(postPagination.page);
    } catch (e) { alert('Failed to remove answer'); }
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...jobForm,
        skills: typeof jobForm.skills === 'string' ? jobForm.skills.split(',').map(s => s.trim()).filter(Boolean) : jobForm.skills,
        batch: typeof jobForm.batch === 'string' ? jobForm.batch.split(',').map(s => s.trim()).filter(Boolean) : jobForm.batch,
      };
      if (editingJob) await client.patch(`/api/admin/jobs/${editingJob}`, payload);
      else await client.post('/api/admin/jobs', payload);
      setShowJobModal(false);
      setEditingJob(null);
      setJobForm({ title: '', company: '', location: '', type: 'Internship', link: '', skills: '', batch: '' });
      fetchJobs();
    } catch (e) { alert('Failed to save job'); }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm('Remove this job post?')) return;
    try {
      await client.delete(`/api/admin/jobs/${id}`);
      fetchJobs();
    } catch (e) { alert('Delete failed'); }
  };

  // ─── Loading State ────────────────────────────────────────────────────────────

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-mono text-sm">Initializing Control Console...</p>
        </div>
      </div>
    );
  }

  // ─── Tab Config ───────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'students', label: 'Students', icon: Users, color: 'text-blue-600', activeColor: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-500/30' },
    { id: 'alumni', label: 'Alumni', icon: GraduationCap, color: 'text-purple-600', activeColor: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200 dark:border-purple-500/30' },
    { id: 'admins', label: 'Admins', icon: Shield, color: 'text-red-600', activeColor: 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-500/30' },
    { id: 'community', label: 'Community', icon: MessageSquare, color: 'text-emerald-600', activeColor: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-500/30' },
    { id: 'careers', label: 'Careers', icon: Briefcase, color: 'text-orange-600', activeColor: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-500/30' },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, color: 'text-yellow-600', activeColor: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-200 dark:border-yellow-500/30' },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-8 pb-16 px-2">

      {/* ── Hero Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] -mr-60 -mt-60 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> System Online · {healthInsight ? `${healthInsight.latencyEstimate}` : 'Measuring...'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              CampusMind <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Control</span>
            </h1>
            <p className="text-slate-400 max-w-lg">
              Global platform command center — monitoring {stats?.totalUsers || 0} users across all institutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Profile Button */}
            {adminProfile?.admin && (
              <button
                onClick={() => setShowAdminProfile(true)}
                className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
              >
                <Avatar user={adminProfile.admin} size={10} />
                <div className="text-left hidden md:block">
                  <p className="font-bold text-sm">{adminProfile.admin.name}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              </button>
            )}
            <Link to="/admin/documents" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all" title="Documents">
              <FileText size={20} />
            </Link>
            <Link to="/admin/audit" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all" title="Audit Logs">
              <Shield size={20} />
            </Link>
            <button onClick={() => { fetchStats(); fetchHealth(); }} className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all" title="Refresh">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Stats Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers} icon={Users} color="text-blue-600 bg-blue-100 dark:bg-blue-500/20" trend={12} />
        <StatCard label="Alumni" value={stats?.alumniCount} icon={GraduationCap} color="text-purple-600 bg-purple-100 dark:bg-purple-500/20" />
        <StatCard label="Admins" value={stats?.adminCount} icon={Shield} color="text-red-600 bg-red-100 dark:bg-red-500/20" />
        <StatCard label="Premium Users" value={stats?.premiumUsers} icon={Crown} color="text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20" trend={8} />
        <StatCard label="Est. Revenue" value={`$${stats?.revenueEstimate || 0}`} icon={DollarSign} color="text-green-600 bg-green-100 dark:bg-green-500/20" trend={5} />
        <StatCard label="Active Now" value={stats?.activeSessions || 0} icon={Activity} color="text-orange-600 bg-orange-100 dark:bg-orange-500/20" sub="Last 30 min" />
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); setPagination(prev => ({ ...prev, page: 1 })); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${activeTab === tab.id ? `${tab.activeColor} shadow-sm` : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'alumni' && pendingAlumni.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {pendingAlumni.length > 9 ? '9+' : pendingAlumni.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}

      {/* STUDENTS / ALUMNI / ADMINS */}
      {['students', 'alumni', 'admins'].includes(activeTab) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header + Filters */}
          <div className="p-6 border-b border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  {activeTab === 'students' && <><Users className="text-blue-500" size={20} />Student Enrollment Oversight</>}
                  {activeTab === 'alumni' && <><GraduationCap className="text-purple-500" size={20} />Alumni Directory</>}
                  {activeTab === 'admins' && <><Shield className="text-red-500" size={20} />Administrator Accounts</>}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{pagination.total} {activeTab} found</p>
              </div>
              {activeTab === 'alumni' && (
                <div className="flex gap-2">
                  <button onClick={() => setAlumniSubTab('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${alumniSubTab === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>All</button>
                  <button onClick={() => setAlumniSubTab('pending')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${alumniSubTab === 'pending' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                    Pending {pendingAlumni.length > 0 && <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{pendingAlumni.length}</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Pending Alumni Queue */}
            {activeTab === 'alumni' && alumniSubTab === 'pending' ? (
              <div className="space-y-3 mt-2">
                {alumniLoading ? <Spinner /> : pendingAlumni.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">✅ No pending verifications</div>
                ) : pendingAlumni.map(alum => (
                  <div key={alum._id} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar user={alum} size={10} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 dark:text-white">{alum.name}</p>
                        <AlumniVerificationBadge status={alum.alumniVerification?.status} />
                      </div>
                      <p className="text-xs text-slate-500">{alum.email}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{alum.collegeName || 'N/A'} · {alum.graduationYear || 'N/A'} · {alum.course || 'N/A'}</p>
                      {alum.linkedin && <a href={alum.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"><ExternalLink size={10} />LinkedIn</a>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={async () => {
                        try {
                          await client.patch(`/api/admin/alumni/${alum._id}/verification`, { action: 'approve' });
                          fetchPendingAlumni();
                          fetchStats();
                        } catch (e) { alert('Failed'); }
                      }} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-500 transition-colors flex items-center gap-1.5">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={async () => {
                        try {
                          await client.patch(`/api/admin/alumni/${alum._id}/verification`, { action: 'reject', adminNotes: 'Rejected by admin.' });
                          fetchPendingAlumni();
                        } catch (e) { alert('Failed'); }
                      }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-colors flex items-center gap-1.5">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Filters Row */
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
                  />
                </div>
                {activeTab === 'students' && (
                  <>
                    <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                      className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none text-sm dark:text-white">
                      <option value="All">All Branches</option>
                      {['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                      className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none text-sm dark:text-white">
                      <option value="All">All Years</option>
                      {['1', '2', '3', '4'].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                    <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                      className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 outline-none text-sm dark:text-white">
                      <option value="All">All Plans</option>
                      <option value="free">Free</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          {(activeTab !== 'alumni' || alumniSubTab === 'all') && (
            <div className="overflow-x-auto">
              {usersLoading ? <Spinner /> : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Details</th>
                      {activeTab === 'students' && <th className="px-6 py-4">Plan</th>}
                      {activeTab === 'alumni' && <th className="px-6 py-4">Verification</th>}
                      {activeTab === 'admins' && <th className="px-6 py-4">Role</th>}
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar user={user} size={10} />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === 'students' && (
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{user.branch || 'No branch'} · Year {user.year || '?'}</p>
                              {user.enrollment && <p className="text-xs text-slate-400 font-mono">{user.enrollment}</p>}
                            </div>
                          )}
                          {activeTab === 'alumni' && (
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{user.company || 'No company'}</p>
                              <p className="text-xs text-slate-400">{user.jobRole || 'N/A'} · {user.graduationYear || 'N/A'}</p>
                            </div>
                          )}
                          {activeTab === 'admins' && (
                            <p className="text-xs text-slate-500">{user.email}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === 'students' && <PlanBadge plan={user.subscription?.plan} />}
                          {activeTab === 'alumni' && <AlumniVerificationBadge status={user.alumniVerification?.status} />}
                          {activeTab === 'admins' && <RoleBadge role={user.role} />}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingUser(user)}
                              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                              title="View Full Profile"
                            >
                              <Eye size={16} />
                            </button>
                            {activeTab !== 'admins' && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete ${user.name}?`)) return;
                                  try {
                                    await client.delete(`/api/admin/users/${user._id}`);
                                    fetchUsers(roleForTab[activeTab], pagination.page);
                                    fetchStats();
                                  } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && !usersLoading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                          No {activeTab} found matching the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (activeTab !== 'alumni' || alumniSubTab === 'all') && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10">
              <p className="text-xs text-slate-500">Showing {users.length} of {pagination.total}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1 || usersLoading}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 px-2">{pagination.page} / {pagination.pages}</span>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages || usersLoading}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMMUNITY MODERATION */}
      {activeTab === 'community' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <MessageSquare className="text-emerald-500" size={20} /> Community Moderation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{postPagination.total} total posts</p>
          </div>
          {postsLoading ? <Spinner /> : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {posts.map(post => (
                <div key={post._id}>
                  <div className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors flex items-center gap-4">
                    <button onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                      className={`p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 transition-transform ${expandedPost === post._id ? 'rotate-180' : ''}`}>
                      <ChevronDown size={14} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{post.title}</p>
                      <p className="text-xs text-slate-400">{post.authorName} · {new Date(post.createdAt).toLocaleDateString()} · {post.answers?.length || 0} replies</p>
                    </div>
                    <button onClick={() => handleDeletePost(post._id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {expandedPost === post._id && (
                    <div className="px-14 py-4 bg-slate-50 dark:bg-white/3 space-y-3">
                      {post.answers?.length > 0 ? post.answers.map(ans => (
                        <div key={ans._id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 flex justify-between items-start group">
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{ans.authorName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{ans.content}</p>
                          </div>
                          <button onClick={() => handleDeleteAnswer(post._id, ans._id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )) : <p className="text-xs text-slate-400 italic text-center py-2">No replies yet.</p>}
                    </div>
                  )}
                </div>
              ))}
              {posts.length === 0 && <div className="py-12 text-center text-slate-400 text-sm italic">No posts found.</div>}
            </div>
          )}
          {postPagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-white/10">
              <p className="text-xs text-slate-500">Page {postPagination.page} of {postPagination.pages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => { setPostPagination(p => ({ ...p, page: p.page - 1 })); fetchPosts(postPagination.page - 1); }}
                  disabled={postPagination.page === 1} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => { setPostPagination(p => ({ ...p, page: p.page + 1 })); fetchPosts(postPagination.page + 1); }}
                  disabled={postPagination.page === postPagination.pages} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CAREERS */}
      {activeTab === 'careers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2"><Briefcase className="text-orange-500" size={20} />Career Management</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage job & internship listings for students</p>
            </div>
            <button
              onClick={() => { setEditingJob(null); setJobForm({ title: '', company: '', location: '', type: 'Internship', link: '', skills: '', batch: '' }); setShowJobModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20"
            >
              <Plus size={18} /> Add Listing
            </button>
          </div>
          {jobsLoading ? <Spinner /> : jobs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 italic text-sm">No career listings. Add one above!</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 text-[11px] uppercase tracking-widest font-bold border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{job.title}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">{job.location}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{job.company}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600">{job.type}</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${job.isActive !== false ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                        {job.isActive !== false ? 'Active' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingJob(job._id); setJobForm({ ...job, skills: job.skills?.join(', '), batch: job.batch?.join(', ') }); setShowJobModal(true); }}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"><Pencil size={15} /></button>
                        <button onClick={() => handleDeleteJob(job._id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* REVENUE */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {revenueLoading ? <Spinner /> : revenue ? (
            <>
              {/* Revenue KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard label="Monthly MRR" value={`$${revenue.mrr}`} icon={TrendingUp} color="text-green-600 bg-green-100 dark:bg-green-500/20" trend={6} />
                <StatCard label="Annual ARR" value={`$${revenue.arr}`} icon={BarChart3} color="text-blue-600 bg-blue-100 dark:bg-blue-500/20" />
                <StatCard label="Premium Users" value={revenue.premiumTotal} icon={Crown} color="text-yellow-600 bg-yellow-100 dark:bg-yellow-500/20" />
                <StatCard label="Conversion Rate" value={`${revenue.conversionRate}%`} icon={Zap} color="text-purple-600 bg-purple-100 dark:bg-purple-500/20" />
              </div>

              {/* Plan Distribution */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                  <DollarSign className="text-yellow-500" size={20} /> Revenue & Plan Management
                  <span className="ml-auto text-xs text-slate-400 font-mono">Global Billing Infrastructure Oversight</span>
                </h3>

                {/* Monetization Pulse Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent border border-yellow-500/20 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-xl"><TrendingUp className="text-yellow-600" size={24} /></div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white underline decoration-yellow-500/50">Monetization Pulse</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">System-wide monitoring of payment triggers, renewal loops, and churn analytics. Admin has global authority to override subscription tiers for institutional grants.</p>
                    </div>
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      tier: 'FREE TIER',
                      label: 'Standard',
                      count: revenue.freeCount,
                      pct: revenue.totalUsers > 0 ? ((revenue.freeCount / revenue.totalUsers) * 100).toFixed(0) : 0,
                      revenue: '$0',
                      color: 'border-slate-200 dark:border-white/10',
                      badge: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400',
                    },
                    {
                      tier: 'PREMIUM ANALYTICS',
                      label: 'Monthly Pro — Active',
                      count: revenue.monthlyCount,
                      pct: revenue.totalUsers > 0 ? ((revenue.monthlyCount / revenue.totalUsers) * 100).toFixed(0) : 0,
                      revenue: `$${revenue.monthlyRevenue}/mo`,
                      color: 'border-yellow-500/30',
                      badge: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
                    },
                    {
                      tier: 'ENTERPRISE GRANT',
                      label: 'Yearly Pro — Institutional',
                      count: revenue.yearlyCount,
                      pct: revenue.totalUsers > 0 ? ((revenue.yearlyCount / revenue.totalUsers) * 100).toFixed(0) : 0,
                      revenue: `$${revenue.yearlyRevenue}/yr`,
                      color: 'border-orange-500/30',
                      badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
                    },
                  ].map(plan => (
                    <div key={plan.tier} className={`p-5 rounded-2xl border ${plan.color} bg-white dark:bg-white/3 space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${plan.badge}`}>{plan.tier}</span>
                        <span className="text-xs font-bold text-green-600">{plan.revenue}</span>
                      </div>
                      <h4 className="font-black text-lg text-slate-900 dark:text-white">{plan.label}</h4>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-black text-slate-800 dark:text-white">{plan.count}</span>
                          <span className="text-sm text-slate-400 ml-1">users</span>
                        </div>
                        <span className="text-sm text-slate-400">{plan.pct}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${plan.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">Failed to load revenue data. <button onClick={fetchRevenue} className="text-blue-500 underline">Retry</button></div>
          )}
        </div>
      )}

      {/* ── Live Logs ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2"><Activity size={18} className="text-blue-500" />Live System Logs</h3>
          <button onClick={fetchStats} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"><RefreshCw size={15} /></button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-60 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg min-w-[75px] text-center">{new Date(log.time).toLocaleTimeString()}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{log.action}</p>
                {log.user && <p className="text-[10px] text-slate-400">{log.user}</p>}
                {log.details && <p className="text-[10px] text-slate-400 italic truncate">{log.details}</p>}
              </div>
            </div>
          ))}
          {logs.length === 0 && <div className="py-6 text-center text-slate-400 text-sm italic">No system logs yet.</div>}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* User Detail Modal */}
      <AnimatePresence>
        {viewingUser && (
          <UserDetailModal
            user={viewingUser}
            token={token}
            onClose={() => setViewingUser(null)}
            onUpdate={() => { fetchUsers(roleForTab[activeTab], pagination.page); fetchStats(); }}
            onDelete={() => { fetchUsers(roleForTab[activeTab], pagination.page); fetchStats(); }}
          />
        )}
      </AnimatePresence>

      {/* Admin Profile Modal */}
      <AnimatePresence>
        {showAdminProfile && adminProfile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAdminProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Admin Control Panel</span>
                  <button onClick={() => setShowAdminProfile(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar user={adminProfile.admin} size={16} />
                  <div>
                    <h2 className="text-2xl font-black">{adminProfile.admin.name}</h2>
                    <p className="text-slate-400 text-sm">{adminProfile.admin.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <RoleBadge role={adminProfile.admin.role} />
                      <PlanBadge plan={adminProfile.admin.subscription?.plan} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'XP', value: adminProfile.admin.xp || 0 },
                    { label: 'Level', value: adminProfile.admin.level || 1 },
                    { label: 'Streak', value: `${adminProfile.admin.streak || 0}d` },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl text-center border border-slate-200 dark:border-white/10">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="font-black text-slate-800 dark:text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">My Recent Activity</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {adminProfile.recentActivity?.slice(0, 10).map((log, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-white/5 rounded-xl">
                        <Activity size={12} className="text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{log.action}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {!adminProfile.recentActivity?.length && <p className="text-xs text-slate-400 italic text-center py-3">No activity yet.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Modal */}
      <AnimatePresence>
        {showJobModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowJobModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">{editingJob ? 'Edit Listing' : 'Add Career Listing'}</h3>
                <button onClick={() => setShowJobModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveJob} className="p-6 space-y-4">
                {[
                  { label: 'Job Title', key: 'title', type: 'text', placeholder: 'e.g. Software Engineer Intern' },
                  { label: 'Company', key: 'company', type: 'text', placeholder: 'e.g. Google' },
                  { label: 'Location', key: 'location', type: 'text', placeholder: 'e.g. Bangalore, Remote' },
                  { label: 'Apply Link', key: 'link', type: 'url', placeholder: 'https://...' },
                  { label: 'Skills (comma-separated)', key: 'skills', type: 'text', placeholder: 'e.g. React, Python, SQL' },
                  { label: 'Eligible Batches (comma-separated)', key: 'batch', type: 'text', placeholder: 'e.g. 2025, 2026' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">{field.label}</label>
                    <input
                      type={field.type}
                      value={jobForm[field.key] || ''}
                      onChange={e => setJobForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:text-white"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Type</label>
                  <select value={jobForm.type} onChange={e => setJobForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white">
                    {['Internship', 'Full-Time', 'Part-Time', 'Contract', 'Remote'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowJobModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20">{editingJob ? 'Save Changes' : 'Add Listing'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
