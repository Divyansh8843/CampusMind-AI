import React from 'react';
import { Github, Linkedin, Mail, Send, Heart, Globe } from 'lucide-react';

const Footer = () => {
    return (
        <React.Fragment>
            {/* Developer Section */}
            <section id="Developer" className="py-16 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                 <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="bg-white dark:bg-white/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/10 relative overflow-hidden">
                         {/* Background Decoration */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                         
                         {/* Developer Image (Left) */}
                         <div className="flex-shrink-0">
                             <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-slate-50 dark:ring-white/10 shadow-lg relative group">
                                 {/* User can replace src with their actual image path */}
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

                         {/* Content (Right) */}
                         <div className="flex-1 text-center md:text-left space-y-4">
                             <div>
                                 <div className="inline-flex items-center  text-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                                    <Globe size={12} /> Developer
                                 </div>
                                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                                     Divyansh Agrawal
                                 </h2>
                                 <p className="text-slate-500 dark:text-slate-400 font-medium">
                                     Final Year Computer Science Engineering
                                 </p>
                             </div>
                             
                             <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm max-w-lg mx-auto md:mx-0">
                                 Crafted with passion to revolutionize the academic experience using Agentic AI. 
                                 Built for the future of education.
                             </p>

                             <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                                 <a href="https://github.com/Divyansh8843" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all hover:-translate-y-1">
                                     <Github size={20} />
                                 </a>
                                 <a href="https://www.linkedin.com/in/divyansh-agrawal-4556a0299" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-[#0077b5] hover:text-white transition-all hover:-translate-y-1">
                                     <Linkedin size={20} />
                                 </a>
                                 <a href="mailto:divyanshagrawal8843@gmail.com" className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-red-500 hover:text-white transition-all hover:-translate-y-1">
                                     <Mail size={20} />
                                 </a>
                             </div>
                         </div>
                     </div>
                 </div>
            </section>

             {/* Footer Links */}
            <footer className="pt-16 pb-8 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 transition-colors duration-300 font-sans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="space-y-4">
                            <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                CampusMind AI
                            </span>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                The official intelligent academic copilot for students. Empowering your learning journey with cutting-edge Agentic AI.
                            </p>
                        </div>
                        
                        {/* Links Columns */}
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6">Platform</h4>
                            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">Dashboard</a></li>
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">My Documents</a></li>
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">AI Chat Tutor</a></li>
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">Resume Analyzer</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6">Support</h4>
                            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">Help Center</a></li>
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">API Documentation</a></li>
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">System Status</a></li>
                                <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:translate-x-1 inline-block">Contact Admin</a></li>
                            </ul>
                        </div>

                        {/* Newsletter Column */}
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6">Stay Updated</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Subscribe to get the latest feature updates and academic tips.
                            </p>
                            <form className="relative" onSubmit={(e) => e.preventDefault()}>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button className="absolute right-2 top-2 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                            <p className="text-sm text-slate-400">
                                &copy; {new Date().getFullYear()} CampusMind AI.
                            </p>
                            <div className="flex gap-6 text-sm text-slate-400">
                                <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Privacy</a>
                                <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Terms</a>
                                <a href="#" className="hover:text-slate-800 dark:hover:text-white transition-colors">Cookies</a>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-1.5">
                            Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> by <span className="text-slate-700 dark:text-slate-200 font-medium">Divyansh</span>
                        </p>
                    </div>
                </div>
            </footer>
            <BackToTopButton />
        </React.Fragment>
    );
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BackToTopButton = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={scrollToTop}
                    className="fixed bottom-6 left-6 p-4 rounded-full bg-slate-800 dark:bg-slate-700 text-white shadow-xl z-50 hover:scale-110 transition-transform"
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
