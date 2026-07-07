import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { User, Users, Activity, Save, Book, Calendar, CreditCard, Building, CheckCircle, Camera, ShieldCheck, Github, Linkedin, Code, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAlumniFullyVerified, getAlumniVerificationStatus, hasCompleteAlumniProfile, getAlumniVerificationChecks, isAlumniVerificationPending, hasCompleteStudentProfile, getAlumniTrustScore, getAlumniTrustBreakdown } from '../utils/accessControl';
import CollegeSelect from '../components/CollegeSelect';
import CourseBranchSelect from '../components/CourseBranchSelect';
import { COMPANIES, JOB_ROLES } from '../data/academicOptions';

const Profile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        enrollment: '',
        branch: '',
        year: '',
        semester: '',
        picture: '',
        profilePictureUpdated: false,
        skills: '',
        company: '',
        collegeName: '',
        course: '',
        graduationYear: '',
        contactNo: '',
        passoutYear: '',
        jobRole: '',
        messageForStudents: '',
        portfolioUrl: '',
        resumeUrl: '',
        resumeDocumentId: '',
        cgpa: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [message, setMessage] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const isAlumni = userData.role === 'alumni';
    const alumniVerified = isAlumniFullyVerified(userData);
    const alumniPending = isAlumniVerificationPending(userData);
    const alumniVerificationStatus = getAlumniVerificationStatus(userData);
    const alumniChecks = getAlumniVerificationChecks(userData);
    const alumniProfileComplete = hasCompleteAlumniProfile(userData);
    const alumniFieldsLocked = alumniVerified || (alumniPending && userData?.alumniVerification?.decision !== 'additional_proof_required');
    const alumniTrustScore = getAlumniTrustScore(userData);
    const alumniTrustBreakdown = getAlumniTrustBreakdown(userData);

    // Track whether user has actively selected "Other" for company/jobRole
    const [companyOther, setCompanyOther] = useState(false);
    const [jobRoleOther, setJobRoleOther] = useState(false);

    // Computed select display values
    const companySelectValue = companyOther ? 'Other' : (COMPANIES.includes(userData.company) ? userData.company : (userData.company ? 'Other' : ''));
    const roleSelectValue = jobRoleOther ? 'Other' : (JOB_ROLES.includes(userData.jobRole) ? userData.jobRole : (userData.jobRole ? 'Other' : ''));
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
                if (fetchedUser.role === 'student' && !fetchedUser.enrollment && fetchedUser.name) {
                    const parts = fetchedUser.name.trim().split(/\s+/);
                    if (parts.length > 1) {
                        const potentialId = parts[0];
                        if (potentialId.length > 5 && /\d/.test(potentialId)) {
                            fetchedUser.enrollment = potentialId;
                        }
                    }
                }
                setUserData(prev => ({ ...prev, ...fetchedUser }));
                // Initialise Other-mode if saved company/role is not in the list
                if (fetchedUser.company && !COMPANIES.includes(fetchedUser.company)) {
                    setCompanyOther(true);
                }
                if (fetchedUser.jobRole && !JOB_ROLES.includes(fetchedUser.jobRole)) {
                    setJobRoleOther(true);
                }
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
            // If user selected "Other" but left company/jobRole blank, remove them
            if (companyOther && !payload.company?.trim()) payload.company = '';
            if (jobRoleOther && !payload.jobRole?.trim()) payload.jobRole = '';
            // Never send the literal string 'Other' as a value
            if (payload.company?.trim().toLowerCase() === 'other') payload.company = '';
            if (payload.jobRole?.trim().toLowerCase() === 'other') payload.jobRole = '';
            // Ensure CGPA is a number
            if (payload.cgpa !== '' && payload.cgpa !== null && payload.cgpa !== undefined) {
                payload.cgpa = parseFloat(payload.cgpa);
                if (isNaN(payload.cgpa)) payload.cgpa = undefined;
            } else {
                payload.cgpa = undefined;
            }
            // Ensure skills is sent as an array
            if (typeof payload.skills === 'string') {
                payload.skills = payload.skills.split(',').map(s => s.trim()).filter(Boolean);
            }

            const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                const updatedUser = res.data.user;
                setUserData(prev => ({ ...prev, ...updatedUser }));
                // Re-sync Other-mode states
                if (updatedUser.company && !COMPANIES.includes(updatedUser.company)) {
                    setCompanyOther(true);
                } else {
                    setCompanyOther(false);
                }
                if (updatedUser.jobRole && !JOB_ROLES.includes(updatedUser.jobRole)) {
                    setJobRoleOther(true);
                } else {
                    setJobRoleOther(false);
                }
                const lsUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({ ...lsUser, ...updatedUser }));
                window.dispatchEvent(new Event('user-updated'));
                if (updatedUser.role === 'student' && hasCompleteStudentProfile(updatedUser)) {
                    setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
                } else if (updatedUser.role === 'alumni' && isAlumniFullyVerified(updatedUser)) {
                    setTimeout(() => navigate('/alumni', { replace: true }), 1000);
                }
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitVerification = async () => {
        setVerifying(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/auth/alumni/submit-verification`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedUser = res.data.user;
            setUserData(prev => ({ ...prev, ...updatedUser }));
            const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...lsUser, ...updatedUser }));
            window.dispatchEvent(new Event('user-updated'));

            if (res.data.verified) {
                setMessage({ type: 'success', text: res.data.message || `AI verification passed. Trust Score: ${res.data.trustScore}/100` });
                setTimeout(() => navigate('/alumni', { replace: true }), 1200);
            } else if (res.data.pending) {
                setMessage({
                    type: 'info',
                    text: res.data.message || `Trust Score: ${res.data.trustScore}/100. Additional proof may be required.`
                });
            } else {
                setMessage({
                    type: 'error',
                    text: updatedUser?.alumniVerification?.rejectionReason || 'Verification failed. Please correct your details and retry.'
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Verification submission failed.'
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'resume');

        try {
            setMessage({ type: 'info', text: 'Uploading resume...' });
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.success) {
                const updated = {
                    ...userData,
                    resumeUrl: res.data.document.url || res.data.document.viewUrl,
                    resumeDocumentId: res.data.document._id
                };
                setUserData(updated);
                try {
                    const token = localStorage.getItem('token');
                    const saveRes = await axios.put(`${API_BASE_URL}/api/auth/profile`, {
                        resumeUrl: updated.resumeUrl,
                        resumeDocumentId: updated.resumeDocumentId
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (saveRes.data.success) {
                        const lsUser = JSON.parse(localStorage.getItem('user') || '{}');
                        localStorage.setItem('user', JSON.stringify({ ...lsUser, ...saveRes.data.user }));
                        window.dispatchEvent(new Event('user-updated'));
                        setUserData((prev) => ({ ...prev, ...saveRes.data.user }));
                    }
                } catch (saveError) {
                    console.error('Resume profile sync error:', saveError);
                }
                setMessage({ type: 'success', text: 'Resume uploaded and saved. Run AI Verification when your profile is complete.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload resume. Please try again.' });
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
                                {/* Camera Upload Overlay - Only if not updated before */}
                                {!userData.profilePictureUpdated ? (
                                    <div
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer"
                                        onClick={startCamera}
                                    >
                                        <span className="text-white text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/50 flex items-center gap-1">
                                            <Camera size={14} /> Take Selfie
                                        </span>
                                    </div>
                                ) : (
                                    <div className="absolute top-2 right-2 z-10">
                                        <ShieldCheck className="text-green-500 bg-white dark:bg-slate-900 rounded-full" size={20} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{userData.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{userData.email}</p>

                        <div className="flex justify-center gap-2 mb-6 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                                {userData.role === 'admin' ? '🛡️ System Administrator' : userData.role === 'alumni' ? 'Verified Alumni Network' : userData.role}
                            </span>
                            {userData.role === 'student' && userData.enrollment && (
                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
                                    {userData.enrollment}
                                </span>
                            )}
                            {userData.role === 'alumni' && userData.graduationYear && (
                                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">
                                    Class of {userData.graduationYear}
                                </span>
                            )}
                        </div>

                        {/* Student Academic Summary */}
                        {userData.role === 'student' && (
                            <div className="mt-2 mb-4 space-y-2 text-left px-2">
                                {userData.collegeName && (
                                    <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Building size={13} className="text-indigo-400 mt-0.5 shrink-0" />
                                        <span className="leading-tight">{userData.collegeName}</span>
                                    </div>
                                )}
                                {(userData.course || userData.branch) && (
                                    <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Book size={13} className="text-teal-400 mt-0.5 shrink-0" />
                                        <span className="leading-tight">
                                            {[userData.course, userData.branch].filter(Boolean).join(' — ')}
                                        </span>
                                    </div>
                                )}
                                {userData.year && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Calendar size={13} className="text-orange-400 shrink-0" />
                                        <span>Year {userData.year}</span>
                                    </div>
                                )}
                                {userData.cgpa && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <CheckCircle size={13} className="text-green-400 shrink-0" />
                                        <span>CGPA: {userData.cgpa}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {userData.role === 'alumni' && userData.collegeName && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">{userData.collegeName}</p>
                        )}

                        {/* Alumni Role and Company */}
                        {userData.role === 'alumni' && (userData.jobRole || userData.company) && (
                            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <Briefcase size={16} className="text-purple-500" />
                                {userData.jobRole || 'Alumni'} {userData.company ? `@ ${userData.company}` : ''}
                            </div>
                        )}

                        <div className="flex justify-around pt-6 border-t border-slate-100 dark:border-white/10">
                            {userData.role === 'student' && userData.github && (
                                <a href={userData.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-black dark:hover:text-white transition-colors"><Github /></a>
                            )}
                            {userData.linkedin && (
                                <a href={userData.linkedin.startsWith('http') ? userData.linkedin : `https://${userData.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin /></a>
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
                                    {userData.role === 'admin' ? 'Admin Profile' : userData.role === 'alumni' ? 'Alumni Profile' : 'Student Profile'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {userData.role === 'admin'
                                        ? 'Manage your administrator settings'
                                        : userData.role === 'alumni'
                                            ? 'Manage your verified alumni identity and professional network details'
                                            : 'Manage your academic and professional student details'}
                                </p>
                                {userData.role === 'student' && (
                                    <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                        {hasCompleteStudentProfile(userData)
                                            ? 'Academic profile complete. Full student dashboard access unlocked.'
                                            : 'Complete college, course & branch, year, and enrollment to access the dashboard.'}
                                    </p>
                                )}
                                {isAlumni && (
                                    <p className={`mt-2 text-xs font-semibold ${alumniVerified
                                            ? 'text-green-600 dark:text-green-400'
                                            : alumniPending
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : alumniVerificationStatus === 'rejected'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-amber-600 dark:text-amber-400'
                                        }`}>
                                        {alumniVerified
                                            ? `Verified Alumni badge active. AI Trust Score: ${alumniTrustScore}/100.`
                                            : alumniPending
                                                ? `AI review in progress. Trust Score: ${alumniTrustScore}/100.`
                                                : alumniVerificationStatus === 'rejected'
                                                    ? 'AI verification failed. Update your profile/resume and retry.'
                                                    : 'Complete onboarding and run AI verification to unlock alumni access.'}
                                    </p>
                                )}
                            </div>
                            {message && (
                                <div className={`px-4 py-2 rounded-lg text-sm font-bold animate-pulse ${message.type === 'success' ? 'bg-green-100 text-green-700'
                                        : message.type === 'info' ? 'bg-blue-100 text-blue-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
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
                                            disabled={true}
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-mono text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                        <p className="text-xs text-slate-400 mt-2">
                                            Official ID is locked for security.
                                        </p>
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Building size={18} className="text-indigo-500" /> College / University Name
                                        </label>
                                        <CollegeSelect
                                            value={userData.collegeName || ''}
                                            onChange={handleChange}
                                            placeholder="Search or select your college / university"
                                            required
                                        />
                                    </div>
                                    <CourseBranchSelect
                                        course={userData.course || ''}
                                        branch={userData.branch || ''}
                                        onChange={({ course, branch }) => setUserData({ ...userData, course, branch })}
                                        required
                                    />
                                    <div className="group">
                                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Calendar size={18} className="text-orange-500" /> Current Year
                                        </label>
                                        <select
                                            name="year"
                                            value={userData.year || ''}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white cursor-pointer"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                    <div className="group">
                                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <CheckCircle size={18} className="text-teal-500" /> CGPA
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="cgpa"
                                            value={userData.cgpa || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. 8.5"
                                            className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Student Professional Section */}
                            {userData.role === 'student' && (
                                <div className="col-span-full md:col-span-1 space-y-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Professional Details</h3>
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
                                            <Briefcase size={18} className="text-amber-500" /> Resume (Link or Upload)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="resumeUrl"
                                                value={userData.resumeUrl || ''}
                                                onChange={handleChange}
                                                placeholder="https://drive.google.com/..."
                                                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                            />
                                            <label className="cursor-pointer bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold px-4 py-3.5 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center">
                                                <span>Upload</span>
                                                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                                            </label>
                                        </div>
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
                            )}

                            {/* Alumni Specific Sections */}
                            {userData.role === 'alumni' && (
                                <>
                                    {/* Alumni Identity Verification */}
                                    <div className="col-span-full rounded-2xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-500/20 dark:bg-purple-500/10">
                                        <h3 className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                            <ShieldCheck className="text-purple-600" size={18} />
                                            AI Alumni Verification
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                            Google OAuth → Profile Completion → Resume Intelligence → Trust Score Engine → Verified Alumni Badge. Upload a resume (mandatory) and run AI verification.
                                        </p>
                                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div className="group">
                                                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={userData.name || ''}
                                                    onChange={handleChange}
                                                    disabled={alumniFieldsLocked}
                                                    className="w-full rounded-xl border-2 border-transparent bg-white px-4 py-3.5 outline-none transition-all focus:border-purple-500 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="group md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                                    College Name <span className="text-red-500">*</span>
                                                </label>
                                                <CollegeSelect
                                                    value={userData.collegeName || ''}
                                                    onChange={handleChange}
                                                    disabled={alumniFieldsLocked}
                                                    placeholder="Search or select your college / university"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <CourseBranchSelect
                                                    course={userData.course || ''}
                                                    branch={userData.branch || ''}
                                                    onChange={({ course, branch }) => setUserData({ ...userData, course, branch })}
                                                    disabled={alumniFieldsLocked}
                                                    required
                                                />
                                            </div>
                                            <div className="group md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    <Calendar size={18} className="text-teal-500" /> Graduation Year <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="graduationYear"
                                                    value={userData.graduationYear || ''}
                                                    onChange={handleChange}
                                                    placeholder="2023, 2024, ..."
                                                    disabled={alumniFieldsLocked}
                                                    className="w-full px-4 py-3.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-transparent focus:border-teal-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-60"
                                                />
                                            </div>
                                        </div>
                                        {!alumniVerified && alumniTrustScore > 0 && (
                                            <div className="mt-4 rounded-xl border border-purple-200 bg-white/80 p-4 dark:border-purple-500/20 dark:bg-slate-900/50">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">AI Trust Score Details</p>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${alumniTrustScore >= 90
                                                            ? 'bg-green-100 text-green-700'
                                                            : alumniTrustScore >= 70
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {alumniTrustScore}/100
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {Object.entries(alumniTrustBreakdown).map(([key, item]) => (
                                                        <div key={key}>
                                                            <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                                <span className="capitalize">{key}</span>
                                                                <span>{item.score}/{item.max}</span>
                                                            </div>
                                                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                                                                <div
                                                                    className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                    style={{ width: `${Math.min(100, (item.score / item.max) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {alumniVerified && alumniTrustScore > 0 && (
                                            <div className="mt-4 rounded-xl border border-purple-200 bg-white/80 p-4 dark:border-purple-500/20 dark:bg-slate-900/50">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white">AI Trust Score</p>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${alumniTrustScore >= 90
                                                            ? 'bg-green-100 text-green-700'
                                                            : alumniTrustScore >= 70
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {alumniTrustScore}/100
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {!alumniVerified && alumniChecks.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {alumniChecks.map((check) => (
                                                    <div key={check.key} className={`rounded-lg px-3 py-2 text-xs ${check.passed ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                                                        {check.message}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    </div>

                                    {/* Column 1: Professional Background */}
                                    <div className="col-span-full md:col-span-1 space-y-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Professional Background</h3>
                                        <div className="group">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                                Company <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="company"
                                                value={companySelectValue}
                                                disabled={alumniFieldsLocked}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === 'Other') {
                                                        setCompanyOther(true);
                                                        setUserData({ ...userData, company: '' });
                                                    } else {
                                                        setCompanyOther(false);
                                                        setUserData({ ...userData, company: value });
                                                    }
                                                }}
                                                className="w-full cursor-pointer rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-amber-500 focus:bg-white dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                                            >
                                                <option value="">Select Company</option>
                                                {COMPANIES.map((company) => (
                                                    <option key={company} value={company}>{company}</option>
                                                ))}
                                            </select>
                                            {(companySelectValue === 'Other' || companyOther) && (
                                                <input
                                                    type="text"
                                                    name="company"
                                                    value={userData.company || ''}
                                                    onChange={handleChange}
                                                    disabled={alumniFieldsLocked}
                                                    placeholder="Enter your company name"
                                                    className="mt-2 w-full rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-amber-500 dark:bg-slate-800 dark:text-white"
                                                />
                                            )}
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                                                Current Role <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="jobRole"
                                                value={roleSelectValue}
                                                disabled={alumniFieldsLocked}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === 'Other') {
                                                        setJobRoleOther(true);
                                                        setUserData({ ...userData, jobRole: '' });
                                                    } else {
                                                        setJobRoleOther(false);
                                                        setUserData({ ...userData, jobRole: value });
                                                    }
                                                }}
                                                className="w-full cursor-pointer rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-purple-500 focus:bg-white dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                                            >
                                                <option value="">Select Role</option>
                                                {JOB_ROLES.map((role) => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                            {(roleSelectValue === 'Other' || jobRoleOther) && (
                                                <input
                                                    type="text"
                                                    name="jobRole"
                                                    value={userData.jobRole || ''}
                                                    onChange={handleChange}
                                                    disabled={alumniFieldsLocked}
                                                    placeholder="Enter your professional role"
                                                    className="mt-2 w-full rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-purple-500 dark:bg-slate-800 dark:text-white"
                                                />
                                            )}
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Activity size={18} className="text-red-500" /> Contact Number
                                            </label>
                                            <input
                                                type="text"
                                                name="contactNo"
                                                value={userData.contactNo || ''}
                                                onChange={handleChange}
                                                placeholder="+91 9876543210"
                                                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-full md:col-span-1 space-y-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2">Professional Network</h3>

                                        <div className="group">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Briefcase size={18} className="text-amber-500" /> Resume Upload <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="resumeUrl"
                                                    value={userData.resumeUrl || ''}
                                                    onChange={handleChange}
                                                    disabled={alumniFieldsLocked}
                                                    placeholder="Resume file URL (auto-filled after upload)"
                                                    className="flex-1 rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3.5 outline-none transition-all focus:border-amber-500 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                                                />
                                                <label className={`flex cursor-pointer items-center justify-center rounded-xl bg-amber-100 px-4 py-3.5 font-bold text-amber-600 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 ${alumniFieldsLocked ? 'pointer-events-none opacity-50' : ''}`}>
                                                    <span>Upload PDF</span>
                                                    <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleResumeUpload} disabled={alumniFieldsLocked} />
                                                </label>
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                Mandatory for AI resume intelligence and trust score verification.
                                            </p>
                                        </div>

                                        <div className="group">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Linkedin size={18} className="text-blue-600" /> LinkedIn URL <span className="text-slate-400">(Recommended)</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="linkedin"
                                                value={userData.linkedin || ''}
                                                onChange={handleChange}
                                                disabled={alumniFieldsLocked}
                                                placeholder="https://linkedin.com/in/..."
                                                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <User size={18} className="text-blue-400" /> Profile / Portfolio Link
                                            </label>
                                            <input
                                                type="text"
                                                name="portfolioUrl"
                                                value={userData.portfolioUrl || ''}
                                                onChange={handleChange}
                                                placeholder="https://yourportfolio.com"
                                                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Book size={18} className="text-orange-500" /> Message for Students
                                            </label>
                                            <textarea
                                                name="messageForStudents"
                                                value={userData.messageForStudents || ''}
                                                onChange={handleChange}
                                                placeholder="What advice do you have for juniors?"
                                                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 h-28 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Privacy & Permissions (Alumni only) */}
                                    <div className="col-span-full space-y-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-2 flex items-center gap-2">
                                            <ShieldCheck className="text-purple-600" size={20} /> Privacy & Permissions
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name="allowDirectMessages"
                                                    checked={userData.allowDirectMessages !== false}
                                                    onChange={(e) => setUserData({ ...userData, allowDirectMessages: e.target.checked })}
                                                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                                                />
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Enable Direct Messages</span>
                                                    <span className="block text-xs text-slate-500 dark:text-slate-400">Allow verified students to draft and send direct messages to your email.</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name="showProfileDetails"
                                                    checked={userData.showProfileDetails !== false}
                                                    onChange={(e) => setUserData({ ...userData, showProfileDetails: e.target.checked })}
                                                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                                                />
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-900 dark:text-white">Show Contact Details</span>
                                                    <span className="block text-xs text-slate-500 dark:text-slate-400">Allow connected students to see your email, phone, LinkedIn, and resume links.</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Admin Specialized Section */}
                            {userData.role === 'admin' && (
                                <div className="col-span-full space-y-8">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                                            <ShieldCheck className="text-red-500" size={24} /> Admin Privileges & System Control
                                        </h3>
                                        <span className="px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-widest border border-red-200 dark:border-red-500/20">
                                            Verified Operator
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                                            <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 w-fit mb-4"><ShieldCheck size={28} /></div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Access Level</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white">Super Admin</div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 w-fit mb-4"><CheckCircle size={28} /></div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">System Health</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white">100% Stable</div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                                            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400 w-fit mb-4"><Users size={28} /></div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Global Scope</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white">All Branches</div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                                            <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 w-fit mb-4"><Building size={28} /></div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">HQ Location</div>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white">Main Office</div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                <Calendar size={18} className="text-blue-500" /> Security Log
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5">
                                                    <span className="text-slate-600 dark:text-slate-300">Last Password Change</span>
                                                    <span className="font-mono text-xs text-slate-500">12 days ago</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5">
                                                    <span className="text-slate-600 dark:text-slate-300">2FA Status</span>
                                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded">Enabled</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-white/5">
                                                    <span className="text-slate-600 dark:text-slate-300">Authorized IP</span>
                                                    <span className="font-mono text-xs text-slate-500">Static (Campus LAN)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                <Activity size={18} className="text-purple-500" /> Admin Fast Actions
                                            </h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button type="button" onClick={() => navigate('/admin')} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20">
                                                    Admin Dashboard
                                                </button>
                                                <button type="button" onClick={() => navigate('/admin/documents')} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-slate-800/20">
                                                    Review All Docs
                                                </button>
                                                <button type="button" onClick={() => navigate('/admin/audit')} className="p-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                                                    System Audit
                                                </button>
                                                <button type="button" onClick={() => navigate('/admin')} className="p-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                                                    Student Overview
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                            {/* Additional Proof Required Banner */}
                            {isAlumni && userData?.alumniVerification?.decision === 'additional_proof_required' && !alumniVerified && (
                                <div className="w-full sm:w-auto flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                                    <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Additional Proof Required</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-500 truncate">Update your resume or LinkedIn, then re-submit for verification.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSubmitVerification}
                                        disabled={verifying}
                                        className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg transition-all text-xs flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        {verifying ? 'Verifying...' : <><ShieldCheck size={14} /> Re-Submit</>}
                                    </button>
                                </div>
                            )}
                            {isAlumni && !alumniVerified && userData?.alumniVerification?.decision !== 'additional_proof_required' && (
                                <button
                                    type="button"
                                    onClick={handleSubmitVerification}
                                    disabled={verifying || !alumniProfileComplete}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {verifying ? 'Running AI Verification...' : <><ShieldCheck size={20} /> Run AI Verification</>}
                                </button>
                            )}
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
