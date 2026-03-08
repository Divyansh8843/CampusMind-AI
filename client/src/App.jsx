import React from 'react';
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
import SupportBot from './components/SupportBot';
import Planner from './pages/Planner';
import Jobs from './pages/Jobs';
import Hackathons from './pages/Hackathons';
import Community from './pages/Community';
import AdvancedLab from './pages/AdvancedLab';
import Syllabus from './pages/Syllabus';
import Alumni from './pages/Alumni';
import MetaCampus from './pages/MetaCampus';
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
    if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }
    return <Outlet />;
};

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />

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
                <Route path="/advanced" element={<AdvancedLab />} />
                <Route path="/syllabus" element={<Syllabus />} />
                <Route path="/alumni" element={<Alumni />} />
                <Route path="/meta-campus" element={<MetaCampus />} />
            </Route>

            {/* Shared Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/community" element={<Community />} />
            
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
