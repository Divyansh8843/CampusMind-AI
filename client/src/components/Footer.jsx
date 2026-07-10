import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, Heart, Globe, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Footer = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, []);

    const authPath = (protectedPath) => (isLoggedIn ? protectedPath : '/login');

    return (
        <React.Fragment>
            <section id="Developer" className="py-10 sm:py-16 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="bg-white dark:bg-white/5 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/10 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                         
                         <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
                             <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-slate-50 dark:ring-white/10 shadow-lg relative group">
                                 <img 
                                    src="Divyansh.jpg" 
                                    alt="Divyansh Agrawal" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                     <span className="text-white text-xs font-bold">Divyansh Agrawal</span>
                                 </div>
                             </div>
                         </div>

                         <div className="flex-1 min-w-0 w-full text-center md:text-left space-y-3 sm:space-y-4">
                             <div>
                                 <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                                    <Globe size={12} /> Developer
                                 </div>
                                 <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-words">
                                     Divyansh Agrawal
                                 </h2>
                                 <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
                                     Final Year Computer Science Engineering
                                 </p>
                             </div>
                             
                             <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm max-w-lg mx-auto md:mx-0">
                                 Crafted with passion to revolutionize the academic experience using Agentic AI. 
                                 Built for the future of education.
                             </p>

                             <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 pt-1 sm:pt-2 flex-wrap">
                                 <a href="https://github.com/Divyansh8843" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all hover:-translate-y-1" aria-label="GitHub">
                                     <Github size={20} />
                                 </a>
                                 <a href="https://www.linkedin.com/in/divyansh-agrawal-4556a0299" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-[#0077b5] hover:text-white transition-all hover:-translate-y-1" aria-label="LinkedIn">
                                     <Linkedin size={20} />
                                 </a>
                                 <a href="mailto:divyanshagrawal8843@gmail.com" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-red-500 hover:text-white transition-all hover:-translate-y-1" aria-label="Email">
                                     <Mail size={20} />
                                 </a>
                             </div>
                         </div>
                     </div>
                 </div>
            </section>

            <footer className="pt-16 pb-8 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors duration-300 font-sans overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
                        <div className="lg:col-span-4 space-y-6 min-w-0 md:pr-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                    <img src="/logo.png" alt="CampusMind Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                    CampusMind AI
                                </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-w-sm">
                                India-wide intelligent academic copilot designed for students and verified alumni to bridge the gap between academia and industry.
                            </p>
                            <div className="flex items-center gap-4 pt-2">
                                <a href="https://github.com/Divyansh8843" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="GitHub">
                                    <Github size={20} />
                                </a>
                                <a href="https://www.linkedin.com/in/divyansh-agrawal-4556a0299" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0077b5] dark:hover:text-[#0077b5] transition-colors" aria-label="LinkedIn">
                                    <Linkedin size={20} />
                                </a>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Platform</h3>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <li><Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Home</Link></li>
                                <li><Link to="/pricing" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Pricing</Link></li>
                                <li><Link to={authPath('/dashboard')} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Dashboard</Link></li>
                                <li><Link to={authPath('/chat')} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">AI Study Chat</Link></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-2 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Support</h3>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <li><a href="/#faq" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Help Center</a></li>
                                <li><a href="/#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Features</a></li>
                                <li><Link to="/login" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{isLoggedIn ? 'Account' : 'Sign In'}</Link></li>
                                <li><a href="mailto:campusmindofficial@gmail.com" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors break-words">Contact Us</a></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-2 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Legal</h3>
                            <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                <li><Link to="/privacy" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-2 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Reach Us</h3>
                            <ul className="space-y-5 text-sm text-slate-600 dark:text-slate-300">
                                <li className="flex items-start gap-3">
                                    <Mail size={18} className="mt-0.5 shrink-0 text-blue-500" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">Email Support</p>
                                        <a href="mailto:campusmindofficial@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words text-xs mt-1 block">
                                            campusmindofficial@gmail.com
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Clock size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">Working Hours</p>
                                        <span className="break-words text-xs mt-1 block">Mon–Sat, 10 AM – 7 PM</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            &copy; {new Date().getFullYear()} CampusMind AI. All rights reserved.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                            Built with <Heart size={16} className="text-red-500 fill-red-500 animate-pulse mx-1" /> by <span className="text-slate-900 dark:text-white font-bold">Divyansh</span>
                        </p>
                    </div>
                </div>
            </footer>
            <BackToTopButton />
        </React.Fragment>
    );
};

const BackToTopButton = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setVisible(window.pageYOffset > 300);
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={scrollToTop}
                    className="fixed bottom-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto p-3 sm:p-4 rounded-full bg-slate-800 dark:bg-slate-700 text-white shadow-xl z-50 hover:scale-110 transition-transform"
                    title="Back to Top"
                    aria-label="Back to Top"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 15-6-6-6 6"/>
                    </svg>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

export default Footer;
