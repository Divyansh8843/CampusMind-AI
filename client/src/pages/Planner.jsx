import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is imported
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Briefcase, 
  BookOpen, 
  AlertCircle,
  Trophy,
  Brain,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Planner = () => {
    const [userStats, setUserStats] = useState({ level: 1, xp: 0, badges: [] });
    // AI Planner State
    const [showPlannerModal, setShowPlannerModal] = useState(false);
    const [syllabus, setSyllabus] = useState('');
    const [examDate, setExamDate] = useState('');
    const [generating, setGenerating] = useState(false);

    // Core Planner State
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', deadline: '', type: 'study', priority: 'medium' });

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchTasks();
        fetchUserStats();
    }, []);

    // Calendar View Logic
    const [viewMode, setViewMode] = useState('board'); // 'board' | 'calendar'
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 min-h-[100px]" />);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
             const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
             const dateStr = dateObj.toISOString().split('T')[0];
             const dayTasks = tasks.filter(t => t.deadline && new Date(t.deadline).toISOString().split('T')[0] === dateStr);
             const isToday = new Date().toDateString() === dateObj.toDateString();

             days.push(
                <div key={day} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 min-h-[100px] relative group hover:shadow-md transition-all ${isToday ? 'bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-500' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold ${isToday ? 'text-blue-600 bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-500'}`}>{day}</span>
                        {dayTasks.length > 0 && <span className="text-[10px] text-slate-400 font-medium">{dayTasks.length} tasks</span>}
                    </div>
                    
                    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayTasks.map(task => (
                            <div 
                                key={task._id} 
                                onClick={() => handleComplete(task._id)}
                                className={`text-[10px] p-1 rounded border cursor-pointer truncate flex items-center gap-1 hover:brightness-95 transition-all ${
                                    task.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200 line-through opacity-60' : 
                                    task.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200 font-bold' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}
                                title={task.title}
                            >
                                {task.status === 'completed' && <CheckCircle size={8} />}
                                {task.title}
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        className="absolute bottom-1 right-1 w-6 h-6 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                        onClick={() => {
                             setNewTask({ ...newTask, deadline: dateStr });
                             setShowAddModal(true);
                        }}
                        title="Add Task to this date"
                    >
                        <Plus size={14} />
                    </button>
                </div>
             );
        }
        return days;
    };

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/planner`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setTasks(res.data.tasks);
        } catch (error) {
            console.error("Fetch Tasks Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/analytics/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setUserStats(res.data.analytics || { level: 1, xp: 0, badges: [] });
        } catch (error) {
            console.error("Fetch Stats Error:", error);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/planner`, newTask, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setTasks([...tasks, res.data.task]);
                setShowAddModal(false);
                setNewTask({ title: '', deadline: '', type: 'study', priority: 'medium' });
                toast.success("Task added & Email sent!");
            }
        } catch (error) {
            toast.error("Failed to add task");
        }
    };

    const handleGenerateSchedule = async (e) => {
        e.preventDefault();
        setGenerating(true);
        toast.loading("AI Agent Analyzing Syllabus...", { id: 'ai-gen' });
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/planner/generate`, {
                syllabus,
                examDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setTasks([...tasks, ...res.data.tasks]);
                setShowPlannerModal(false);
                setSyllabus('');
                setExamDate('');
                toast.success(res.data.message, { id: 'ai-gen' });
            }
        } catch (error) {
            toast.error("AI Generation Failed", { id: 'ai-gen' });
        } finally {
            setGenerating(false);
        }
    };

    const handleComplete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_BASE_URL}/api/planner/${id}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                // Update local state and stats
                setTasks(tasks.map(t => t._id === id ? { ...t, status: 'completed' } : t));
                setUserStats(prev => ({ 
                    ...prev, 
                    xp: prev.xp + res.data.xpGained,
                    level: res.data.newLevel || prev.level
                }));
                
                toast.success(`Task Completed! +${res.data.xpGained} XP Earned!`, {
                    icon: '🎉',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
                
                if (res.data.newLevel) {
                    toast.success(`LEVEL UP! You are now Level ${res.data.newLevel}! 👑`, { duration: 5000 });
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to complete task");
        }
    };

    // Group tasks by status
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // XP Progress
    const level = userStats?.level || 1;
    const nextLevelXP = level * 1000;
    const currentXP = userStats?.xp || 0;
    const progress = Math.min((currentXP / nextLevelXP) * 100, 100);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="max-w-7xl mx-auto space-y-8 pb-12"
        >
            <Toaster position="top-right" />
            
            {/* Gamification Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-fullblur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <Trophy className="text-yellow-300 w-8 h-8" />
                            Level {level} Scholar
                        </h1>
                        <p className="text-blue-100 mt-1">Keep completing tasks to unlock themes and badges!</p>
                        
                        <div className="mt-4 w-full md:w-96">
                            <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-wider text-blue-200">
                                <span>XP Progress</span>
                                <span>{currentXP} / {nextLevelXP} XP</span>
                            </div>
                            <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {userStats?.badges?.map((badge, i) => (
                             <div key={i} className="flex flex-col items-center bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20" title={badge.name}>
                                 <span className="text-2xl">{badge.icon || '🏅'}</span>
                                 <span className="text-[10px] font-bold mt-1 uppercase">{badge.name}</span>
                             </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div>
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="text-blue-600" /> My Schedule
                    </h2>
                </div>
                
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
                    <button 
                        onClick={() => setViewMode('board')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutGrid size={16} /> Board
                    </button>
                    <button 
                         onClick={() => setViewMode('calendar')}
                         className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calendar size={16} /> Calendar
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowPlannerModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all font-bold"
                    >
                        <Brain size={20} /> AI Planner
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all font-bold"
                    >
                        <Plus size={20} /> Add Task
                    </button>
                </div>
            </div>

            {viewMode === 'board' ? (
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Due Soon Column */}
                    <div className="md:col-span-2 space-y-6">
                        <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                             Pending Tasks ({pendingTasks.length})
                        </h3>
                        
                        {loading ? (
                            <div className="text-center py-12 text-slate-500">Loading planner...</div>
                        ) : pendingTasks.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 text-slate-500">
                                No pending tasks. Use the AI Planner to generate a schedule! 🎓
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingTasks.map((task) => (
                                    <motion.div 
                                        key={task._id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`bg-white dark:bg-slate-900 border-l-4 p-4 rounded-xl shadow-sm flex items-center gap-4 group hover:shadow-md transition-all ${
                                            task.priority === 'critical' ? 'border-l-red-500' :
                                            task.priority === 'high' ? 'border-l-orange-500' :
                                            'border-l-blue-500'
                                        }`}
                                    >
                                        <button 
                                            onClick={() => handleComplete(task._id)}
                                            className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center justify-center"
                                            title="Mark Complete for XP"
                                        >
                                            <CheckCircle size={16} className="opacity-0 group-hover:opacity-100 text-green-600" />
                                        </button>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {task.type} • {task.priority}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{task.title}</h3>
                                            {task.description && <p className="text-sm text-slate-500 line-clamp-1 mt-1">{task.description}</p>}
                                            <div className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-2">
                                                <Clock size={12} className={new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-slate-400'} />
                                                <span className={new Date(task.deadline) < new Date() ? 'text-red-500' : ''}>
                                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                                                +{task.xpReward} XP
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Completed / Stats Column */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                             History
                        </h3>
                         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                            <div className="text-center mb-6">
                                <div className="text-4xl font-black text-green-500 mb-1">{completedTasks.length}</div>
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tasks Crushed</div>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                 {completedTasks.map(task => (
                                     <div key={task._id} className="text-sm text-slate-400 line-through flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                         <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                                         <span>{task.title}</span>
                                     </div>
                                 ))}
                                 {completedTasks.length === 0 && <span className="text-xs text-slate-400 text-center block py-4">No completed tasks yet. Get to work!</span>}
                            </div>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xl">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                             <ChevronLeft className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                             <ChevronRight className="text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                    
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-px mb-2 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-xs font-bold text-slate-400 uppercase tracking-widest py-2">{d}</div>
                        ))}
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 lg:gap-2">
                        {renderCalendar()}
                    </div>
                </div>
            )}

            {/* Add Task Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-100 dark:border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add New Task</h2>
                            <form onSubmit={handleAddTask} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 px-4 py-3 text-slate-900 dark:text-white outline-none transition-all font-medium"
                                        placeholder="e.g. Complete Calculus Assignment"
                                        value={newTask.title}
                                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 px-4 py-3 text-slate-900 dark:text-white outline-none transition-all"
                                            value={newTask.deadline}
                                            onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                                         <select 
                                            className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 px-4 py-3 text-slate-900 dark:text-white outline-none"
                                            value={newTask.priority}
                                            onChange={e => setNewTask({...newTask, priority: e.target.value})}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                                    <select 
                                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 px-4 py-3 text-slate-900 dark:text-white outline-none"
                                        value={newTask.type}
                                        onChange={e => setNewTask({...newTask, type: e.target.value})}
                                    >
                                        <option value="study">Study</option>
                                        <option value="assignment">Assignment</option>
                                        <option value="exam">Exam</option>
                                        <option value="project">Project</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Planner Modal */}
            <AnimatePresence>
                {showPlannerModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPlannerModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-8 shadow-2xl border border-slate-100 dark:border-white/10 relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Brain size={100} />
                            </div>

                            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                                <Brain className="text-purple-600" /> AI Intelligent Planner
                            </h2>
                            <p className="text-slate-500 mb-6">Paste your syllabus or topics, and the AI will generate an optimized study schedule using genetic algorithms based on difficulty.</p>
                            
                            <form onSubmit={handleGenerateSchedule} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exam / Deadline Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 px-4 py-3 text-slate-900 dark:text-white outline-none transition-all"
                                        value={examDate}
                                        onChange={e => setExamDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Syllabus / Topics (Comma Separated)</label>
                                    <textarea 
                                        required
                                        rows="5"
                                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 px-4 py-3 text-slate-900 dark:text-white outline-none transition-all font-mono text-sm"
                                        placeholder="e.g. Linear Algebra, Calculus Limits, Derivatives, Integrals, Vector Spaces..."
                                        value={syllabus}
                                        onChange={e => setSyllabus(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPlannerModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={generating}
                                        className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                                    >
                                        {generating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Brain size={18} /> Generate Schedule
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Planner;
