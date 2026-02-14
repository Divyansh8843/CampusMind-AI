import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Code,
  Layers,
  CheckCircle,
  ChevronDown,
  FileText,
  Globe,
  Share2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Landing = () => {
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem('token');

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 transition-colors duration-300 relative">
            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                     <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]" />
                     <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
                            Your Intelligent <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Academic Copilot</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                            World-class AI platform for students worldwide. Smart study, resume analysis, mock interviews & career prep. Trusted by colleges globally.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {isLoggedIn ? (
                                <NavLink 
                                    to="/dashboard" 
                                    className="px-8 py-4 rounded-full text-lg font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                                >
                                    Go to Dashboard <ArrowRight size={20} />
                                </NavLink>
                            ) : (
                                <NavLink 
                                    to="/login" 
                                    className="px-8 py-4 rounded-full text-lg font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                                >
                                    Student Login <ArrowRight size={20} />
                                </NavLink>
                            )}
                            <NavLink 
                                to="/pricing" 
                                className="px-8 py-4 rounded-full text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                            >
                                <Sparkles size={20} className="fill-white"/> View Plans
                            </NavLink>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">How It Works</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Transforming your study materials into an intelligent knowledge base in three simple steps.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20" />

                         {[
                             { title: "Upload", icon: FileText, desc: "Upload your PDFs, lecture notes, or syllabus directly to the portal." },
                             { title: "Index", icon: Layers, desc: "Our AI automatically analyzes, chunks, and indexes your content." },
                             { title: "Learn", icon: Brain, desc: "Ask questions and get instant, accurate answers from your own data." }
                         ].map((step, idx) => (
                             <div key={idx} className="relative flex flex-col items-center text-center z-10">
                                 <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center mb-6 shadow-xl relative group">
                                     <div className="absolute inset-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                     <step.icon size={32} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                                     <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                                         {idx + 1}
                                     </div>
                                 </div>
                                 <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                                 <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs">{step.desc}</p>
                             </div>
                         ))}
                    </div>
                </div>
            </section>

          

            {/* Features (Expanded) */}
            <section id="features" className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Advanced AI Features</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                           Built with cutting-edge technology including RAG, Vector Databases, and Agentic AI.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                             {
                                icon: BookOpen,
                                title: "Document Analysis",
                                desc: "Supports PDF, DOCX, and TXT. Extracts text and understands context."
                            },
                            {
                                icon: ShieldCheck,
                                title: "Hallucination Free",
                                desc: "RAG technology ensures the AI only answers using facts from your uploaded documents."
                            },
                            {
                                icon: Users,
                                title: "Agentic Workflow",
                                desc: "Powered by LangGraph to make intelligent decisions on how to answer queries."
                            },
                             {
                                icon: Zap,
                                title: "Instant Retrieval",
                                desc: "Vector embeddings allow for millisecond-latency search across thousands of pages."
                            },
                             {
                                icon: Code,
                                title: "Modern Stack",
                                desc: "Built using MERN Stack + Python Microservice for maximum scalability."
                            },
                             {
                                icon: CheckCircle,
                                title: "Mock Interviewer",
                                desc: "Practice technical interviews with an AI bot that gives real-time feedback."
                            },
                             {
                                icon: FileText,
                                title: "Resume Analyzer",
                                desc: "Get instant scores and improvement tips for your resume against any JD."
                            }
                        ].map((feature, idx) => (
                             <div key={idx} className="p-8 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-xl dark:hover:shadow-none">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                                    <feature.icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                 </div>
            </section>
            
            <section className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/50">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                        <p className="text-slate-600 dark:text-slate-400">Common questions about CampusMind AI.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { q: "Is this tool free for students?", a: "Yes. Free tier includes 3 AI resume scans and 3 mock interviews. Premium plans unlock unlimited access." },
                            { q: "How accurate is the AI?", a: "We use RAG (Retrieval Augmented Generation) to ensure the AI answers ONLY from your uploaded documents, minimizing hallucinations." },
                            { q: "Can I upload handwritten notes?", a: "Currently we support PDF and DOCX text. OCR for handwriting is coming in v3.0." },
                            { q: "Is my data secure?", a: "Absolutely. Your documents are stored in a private vector database and are not shared." }
                        ].map((faq, i) => (
                            <details key={i} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                                <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors list-none select-none">
                                    {faq.q}
                                    <ChevronDown className="transition-transform duration-300 group-open:rotate-180 text-slate-500" />
                                </summary>
                                <div className="px-6 pb-6 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-4">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Global Trust / Social Proof */}
            <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center justify-center gap-2">
                        <Globe size={24} className="text-blue-500" /> Trusted by Students Worldwide
                    </h2>
                    <div className="flex flex-wrap justify-center gap-8 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Secure Payments</span>
                        <span className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Real-time AI</span>
                        <span className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> No Hidden Fees</span>
                        <span className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /> Easy Sign-up</span>
                    </div>
                </div>
            </section>

            <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Transform Your Academic Journey?</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                        Join students worldwide. Pay once, unlock unlimited AI. Experience the power of AI-driven education today.
                    </p>
                    {isLoggedIn ? (
                        <NavLink 
                            to="/dashboard" 
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-blue-900 font-bold hover:bg-blue-50 transition-all shadow-xl hover:scale-105"
                        >
                            Go to Dashboard <ArrowRight size={20} />
                        </NavLink>
                    ) : (
                        <NavLink 
                            to="/login" 
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-blue-900 font-bold hover:bg-blue-50 transition-all shadow-xl hover:scale-105"
                        >
                            Get Started Now <ArrowRight size={20} />
                        </NavLink>
                    )}
                </div>
            </section>
            

            <Footer />
        </div>
    );
};

export default Landing;
