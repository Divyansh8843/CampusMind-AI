import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, BookOpen, Coffee, Volume2, VolumeX, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const MetaCampus = () => {
    const [students, setStudents] = useState([]);
    const [timer, setTimer] = useState({ phase: 'focus', timeRemaining: 25 * 60 * 1000 });
    const [topic, setTopic] = useState('General Study');
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    // Lo-Fi Audio ref
    const audioRef = React.useRef(new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'));
    audioRef.current.loop = true;

    // Join Server & Start Polling
    const joinCampus = async (e) => {
        if (e) e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/meta/join`, { topic }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setIsJoined(true);
                setStudents(res.data.students);
                setTimer(res.data.timer);
                if (!isMuted) audioRef.current.play().catch(e => console.log("Audio play blocked", e));
                toast.success(`Joined Meta-Campus Global Lobby studying ${topic}`);
            }
        } catch (err) {
            toast.error("Failed to join the Meta-Campus lobby.");
        }
    };

    // Polling and Timer Countdown
    useEffect(() => {
        let pollInterval;
        let tickInterval;

        if (isJoined) {
            // Poll server every 10 seconds for user list sync
            pollInterval = setInterval(() => {
                joinCampus(); 
            }, 10000);

            // Tick down local timer every second
            tickInterval = setInterval(() => {
                setTimer(prev => ({
                    ...prev,
                    timeRemaining: Math.max(0, prev.timeRemaining - 1000)
                }));
            }, 1000);
        }

        return () => {
            clearInterval(pollInterval);
            clearInterval(tickInterval);
        };
    }, [isJoined, topic]);

    const leaveCampus = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/meta/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {}
        setIsJoined(false);
        audioRef.current.pause();
        toast("Left Meta-Campus Lobby.", { icon: '👋' });
    };

    // Unmount cleanup
    useEffect(() => {
        return () => {
            if (isJoined) leaveCampus();
            audioRef.current.pause();
        };
    }, [isJoined]);

    const toggleAudio = () => {
        if (isMuted) {
            audioRef.current.play().catch(e => console.error(e));
        } else {
            audioRef.current.pause();
        }
        setIsMuted(!isMuted);
    };

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isJoined) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="https://images.unsplash.com/photo-1555680202-c86f0e12f086?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="LoFi Background" className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent block" />
                </div>
                
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="z-10 bg-slate-800/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-400">
                        <Coffee size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">Meta-Campus</h1>
                    <p className="text-slate-400 mb-8">Join the 24/7 Global Virtual Study Lobby. Sync your focus, crush your goals, and hold each other accountable.</p>
                    
                    <form onSubmit={joinCampus} className="space-y-4">
                        <div className="text-left">
                            <label className="block text-sm font-bold text-slate-300 mb-2">What are you studying right now?</label>
                            <input 
                                type="text"
                                required
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="e.g. Data Structures, React.js"
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                            Enter the Lobby
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-900 relative p-4 lg:p-8 flex flex-col overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <img src="https://images.unsplash.com/photo-1555680202-c86f0e12f086?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="LoFi Study Ambient" className="w-full h-full object-cover opacity-40 blur-sm scale-105" />
                <div className="absolute inset-0 bg-slate-900/60" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full">
                
                {/* Left Side: Timer & Controls */}
                <div className="lg:w-1/3 flex flex-col gap-6">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 ${timer.phase === 'focus' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                        
                        <h2 className="text-xl font-bold text-slate-300 mb-2 uppercase tracking-widest">{timer.phase === 'focus' ? 'Deep Focus' : 'Take a Break'}</h2>
                        <div className={`text-6xl md:text-7xl font-black tabular-nums transition-colors duration-500 ${timer.phase === 'focus' ? 'text-blue-400' : 'text-green-400'}`}>
                            {formatTime(timer.timeRemaining)}
                        </div>
                        <p className="text-slate-500 mt-4 text-sm font-mono flex items-center gap-2">
                            <Clock size={16} /> Global Sync Enabled
                        </p>
                    </motion.div>

                    <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300 font-bold flex items-center gap-2">
                                <Coffee size={18} className="text-amber-500" /> Lo-Fi Study Beats
                            </span>
                            <button onClick={toggleAudio} className={`p-2 rounded-full transition-colors ${!isMuted ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                                {!isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                        </div>
                        <button onClick={leaveCampus} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl transition-all flex justify-center items-center gap-2">
                            <LogOut size={18} /> Leave Lobby
                        </button>
                    </div>
                </div>

                {/* Right Side: Global Students */}
                <div className="lg:w-2/3 flex flex-col gap-4">
                    <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users size={24} className="text-blue-400" /> Live Campus 
                        </h2>
                        <div className="px-3 py-1 bg-blue-500/20 text-blue-400 font-bold rounded-lg text-sm border border-blue-500/30">
                            {students.length} Studying
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        <AnimatePresence>
                            {students.map(student => (
                                <motion.div 
                                    key={student.id} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-slate-800/60 backdrop-blur-sm border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-700/60 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-slate-700">
                                            {student.picture ? (
                                                <img src={student.picture} alt={student.name} className="w-full h-full object-cover" />
                                            ) : (
                                                student.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{student.name}</h3>
                                            <p className="text-sm text-blue-400 flex items-center gap-1">
                                                <BookOpen size={14} /> Studying: {student.topic}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                                            Zone: Focus
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MetaCampus;
