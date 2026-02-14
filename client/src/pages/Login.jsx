import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Brain, Sparkles, BookOpen, GraduationCap, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Background particle animation variants
  const backgroundVariants = {
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: { duration: 15, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setError('');
    
    try {
      if (!response.credential) throw new Error('No credential received');

      const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
        token: response.credential
      });

      if (res.data.success) {
        const user = res.data.data.user;
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Intelligent Redirect based on Role
        if (user.role === 'admin') {
             navigate('/admin', { replace: true });
        } else {
             const from = location.state?.from?.pathname || '/dashboard';
             navigate(from, { replace: true });
        }
      }
    } catch (err) {
      console.error('Login Failed:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please verify your college domain access.');
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 relative w-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center p-4 pt-20 transition-colors duration-300">
          {/* Background Ambience */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div 
              variants={backgroundVariants}
              animate="animate"
              className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-blue-200/40 dark:bg-blue-600/20 rounded-full blur-[120px]" 
            />
            <motion.div 
              variants={backgroundVariants}
              animate="animate"
              className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-purple-200/40 dark:bg-purple-600/20 rounded-full blur-[120px]" 
            />
          </div>

          {/* Main Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md p-8 relative z-10 text-center bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-none"
          >
            
            <div className="mb-8 flex justify-center">
                <div className="bg-gradient-to-tr from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-600 p-4 rounded-2xl shadow-lg shadow-purple-500/20 animate-float">
                    <Brain className="w-12 h-12 text-white" />
                </div>
            </div>

            <h1 className="text-4xl font-bold mb-2 tracking-tight">
              <span className="text-slate-800 dark:text-white">Campus</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Mind AI</span>
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
              Your Intelligent Academic Copilot using GenAI & RAG.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Smart Study</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">Exam Prep</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">AI Tutor</span>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">RAG Search</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-200 text-sm flex items-center gap-3 text-left"
                >
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </motion.div>
            )}

            {/* Login Button */}
            <div className="flex justify-center flex-col gap-3">
                  <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                            console.log('Login Failed');
                            setError("Google Sign-In was unsuccessful.");
                        }}
                        theme="filled_black" 
                        shape="pill"
                        text="continue_with"
                        size="large"
                        width="100%"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Restricted to authorized college domains.
                  </p>
            </div>

          </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
