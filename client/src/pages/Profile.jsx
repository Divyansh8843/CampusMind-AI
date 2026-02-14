import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User, Save, Book, Calendar, CreditCard, Building, CheckCircle, Camera, ShieldCheck, Github, Linkedin, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        enrollment: '',
        branch: '',
        year: '',
        semester: '',
        picture: '',
        profilePictureUpdated: false,
        role: 'student',
        github: '',
        linkedin: '',
        skills: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const fetchedUser = res.data.user;
                // Auto-fill enrollment logic if needed
                if (!fetchedUser.enrollment && fetchedUser.name) {
                    const parts = fetchedUser.name.trim().split(/\s+/);
                    if (parts.length > 1) {
                         const potentialId = parts[0];
                         if (potentialId.length > 5 && /\d/.test(potentialId)) {
                             fetchedUser.enrollment = potentialId;
                         }
                    }
                }
                setUserData(prev => ({ ...prev, ...fetchedUser }));
            }
        } catch (error) {
            console.error("Fetch Profile Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Camera access denied or unavailable.' });
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, 320, 240);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            
            setUserData(prev => ({ ...prev, picture: dataUrl, profilePictureUpdated: true }));
            stopCamera();
            setMessage({ type: 'success', text: 'Selfie captured! Click "Save Updates" to confirm.' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const payload = { ...userData };
            // Ensure skills is sent as an array
            if (typeof payload.skills === 'string') {
                payload.skills = payload.skills.split(',').map(s => s.trim()).filter(Boolean);
            }
            
            const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setUserData(res.data.user); 
                const lsUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...lsUser, ...res.data.user }));
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto py-12 px-4"
        >
            <div className="grid md:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Identity Card */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-xl text-center relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-purple-600"></div>
                         
                         <div className="relative mt-12 mb-4 inline-block">
                             <div className="w-40 h-40 rounded-2xl bg-white p-1.5 shadow-lg mx-auto overflow-hidden relative">
                                {userData.picture ? (
                                    <img src={userData.picture} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl">
                                        <User size={60} className="text-slate-300" />
                                    </div>
                                )}
                                
                                {/* Camera Upload Overlay */}
                                <div 
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer" 
                                    onClick={startCamera}
                                >
                                    <span className="text-white text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/50 flex items-center gap-1">
                                        <Camera size={14}/> Take Selfie
                                    </span>
                                </div>
                             </div>
                         </div>

                         <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{userData.name}</h2>
                         <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{userData.email}</p>

                         <div className="flex justify-center gap-2 mb-6">
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                                {userData.role}
                            </span>
                             {userData.enrollment && (
                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                                    {userData.enrollment}
                                </span>
                             )}
                         </div>

                         {/* Skills Tags */}
                         {userData.skills && (
                             <div className="flex flex-wrap justify-center gap-2 mb-6">
                                 {(Array.isArray(userData.skills) ? userData.skills : String(userData.skills).split(',')).map((skill, idx) => (
                                     skill.trim() && (
                                         <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs rounded border border-slate-200 dark:border-white/10">
                                             {skill.trim()}
                                         </span>
                                     )
                                 ))}
                             </div>
                         )}

                         <div className="flex justify-around pt-6 border-t border-slate-100 dark:border-white/10">
                             {userData.github && (
                                 <a href={userData.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-black dark:hover:text-white transition-colors"><Github/></a>
                             )}
                             {userData.linkedin && (
                                 <a href={userData.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin/></a>
                             )}
                         </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Edit Form */}
                <div className="md:col-span-2 relative">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden h-full flex flex-col">
                        
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Building className="text-blue-500" size={24} /> 
                                    {userData.role === 'admin' ? 'Admin Profile' : 'Complete Profile'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {userData.role === 'admin' ? 'Manage your administrator settings' : 'Manage your official and professional details'}
                                </p>
                            </div>
                            {message && (
                                <div className={`px-4 py-2 rounded-lg text-sm font-bold animate-pulse ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}
                        </div>

                        <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 content-start h-[calc(100vh-300px)] overflow-y-auto">
                            
                            {/* Academic Section - Student Only */}
                            {userData.role === 'student' && (
                                <div className="col-span-full md:col-span-1 space-y-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Academic Info</h3>
                                    <div className="group">
                                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <CreditCard size={18} className="text-blue-500" /> Enrollment Number
                                        </label>
                                        <input 
                                            type="text" 
                                            name="enrollment"
                                            value={userData.enrollment || ''}
                                            onChange={handleChange}
                                            placeholder="0901CS......"
                                            disabled={!!userData.enrollment} 
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-mono text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">
                                            {userData.enrollment ? "Locked mainly." : "Enter Official ID"}
                                        </p>
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Building size={18} className="text-purple-500" /> Branch
                                        </label>
                                        <select 
                                            name="branch"
                                            value={userData.branch || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white cursor-pointer"
                                        >
                                            <option value="">Select Branch</option>
                                            <option value="CSE">Computer Science (CSE)</option>
                                            <option value="IT">IT</option>
                                            <option value="ECE">ECE</option>
                                            <option value="EE">EE</option>
                                            <option value="ME">Mechanical</option>
                                            <option value="CE">Civil</option>
                                            <option value="AIML">AI & ML</option>
                                        </select>
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Calendar size={18} className="text-orange-500" /> Current Year
                                        </label>
                                        <select 
                                            name="year"
                                            value={userData.year || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white cursor-pointer"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Skills & Socials Section */}
                            <div className={`col-span-full ${userData.role === 'student' ? 'md:col-span-1' : ''} space-y-6`}>
                                <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Professional</h3>
                                <div className="group">
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Github size={18} className="text-slate-800 dark:text-white" /> GitHub URL
                                    </label>
                                    <input 
                                        type="text" 
                                        name="github"
                                        value={userData.github || ''}
                                        onChange={handleChange}
                                        placeholder="https://github.com/..."
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-slate-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Linkedin size={18} className="text-blue-600" /> LinkedIn URL
                                    </label>
                                    <input 
                                        type="text" 
                                        name="linkedin"
                                        value={userData.linkedin || ''}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/in/..."
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Code size={18} className="text-green-500" /> Skills (comma separated)
                                    </label>
                                    <textarea 
                                        name="skills"
                                        value={Array.isArray(userData.skills) ? userData.skills.join(', ') : (userData.skills || '')}
                                        onChange={handleChange}
                                        placeholder="React, Node.js, Python, Leadership..."
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 h-32 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 flex items-center justify-end">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                            >
                                {saving ? 'Saving...' : <><Save size={20} /> Save Updates</>}
                            </button>
                        </div>
                    </form>

                     {/* Camera Modal */}
                     <AnimatePresence>
                        {isCameraOpen && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center rounded-3xl"
                            >
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-2xl w-full max-w-sm mx-4 border border-slate-200 dark:border-white/10">
                                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] mb-4">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                                    </div>
                                    <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                                    <div className="flex items-center justify-between gap-4">
                                        <button 
                                            onClick={stopCamera}
                                            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={capturePhoto}
                                            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center gap-2"
                                        >
                                            <Camera size={18} /> Capture
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default Profile;
