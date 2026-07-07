import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Resources from './pages/Resources';
import Resume from './pages/Resume';
import Interview from './pages/Interview';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminDocuments from './pages/AdminDocuments';
import SystemAudit from './pages/SystemAudit';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SupportBot from './components/SupportBot';
import Planner from './pages/Planner';
import Jobs from './pages/Jobs';
import Hackathons from './pages/Hackathons';
import Community from './pages/Community';
import Syllabus from './pages/Syllabus';
import Alumni from './pages/Alumni';
import MetaCampus from './pages/MetaCampus';
import { isAlumniFullyVerified, hasCompleteStudentProfile } from './utils/accessControl';
const PrivateRoutes = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
};

const StudentRoute = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const location = useLocation();

    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    if (user.role === 'alumni') {
        return <Navigate to={isAlumniFullyVerified(user) ? "/alumni" : "/profile"} replace />;
    }
    if (user.role === 'student' && !hasCompleteStudentProfile(user) && location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
    }
    return <Outlet />;
};

const NonAdminRoute = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const location = useLocation();
    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    if (user.role === 'alumni' && !isAlumniFullyVerified(user)) {
        return <Navigate to="/profile" replace />;
    }
    if (user.role === 'student' && !hasCompleteStudentProfile(user) && location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
    }
    return <Outlet />;
};

const VerifiedAlumniOrNonAlumniRoute = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const location = useLocation();
    if (user.role === 'alumni' && !isAlumniFullyVerified(user)) {
        return <Navigate to="/profile" replace />;
    }
    if (user.role === 'student' && !hasCompleteStudentProfile(user) && location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
    }
    return <Outlet />;
};

export default function App() {
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    fetch(`${API_BASE_URL}/api/chat/wakeup`).catch(() => {});
  }, []);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoutes />}>
            <Route element={<Layout />}>
            
            {/* Student Only Routes - Admins redirected to /admin */}
            <Route element={<StudentRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/resume" element={<Resume />} />
                <Route path="/interview" element={<Interview />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/hackathons" element={<Hackathons />} />
                <Route path="/syllabus" element={<Syllabus />} />
                <Route path="/meta-campus" element={<MetaCampus />} />
            </Route>

            {/* Non-Admin Routes (Students & Alumni) */}
            <Route element={<NonAdminRoute />}>
                <Route path="/alumni" element={<Alumni />} />
            </Route>

            {/* Shared Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route element={<VerifiedAlumniOrNonAlumniRoute />}>
                <Route path="/community" element={<Community />} />
            </Route>
            
            {/* Admin Only */}
            <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/documents" element={<AdminDocuments />} />
                    <Route path="/admin/audit" element={<SystemAudit />} />
            </Route>

            </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SupportBot />
    </>
  );
}
