import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import SupportBot from './components/SupportBot';
import { isAlumniFullyVerified, hasCompleteStudentProfile } from './utils/accessControl';
import GlobalBanners from './components/GlobalBanners';

// Lazy load all non-critical pages for massive performance boost
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const Resources = lazy(() => import('./pages/Resources'));
const Resume = lazy(() => import('./pages/Resume'));
const Interview = lazy(() => import('./pages/Interview'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDocuments = lazy(() => import('./pages/AdminDocuments'));
const SystemAudit = lazy(() => import('./pages/SystemAudit'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Pricing = lazy(() => import('./pages/Pricing'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Planner = lazy(() => import('./pages/Planner'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Hackathons = lazy(() => import('./pages/Hackathons'));
const Community = lazy(() => import('./pages/Community'));
const Syllabus = lazy(() => import('./pages/Syllabus'));
const Alumni = lazy(() => import('./pages/Alumni'));
const MetaCampus = lazy(() => import('./pages/MetaCampus'));
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
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      }>
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
      </Suspense>
      <SupportBot />
      <GlobalBanners />
    </>
  );
}
