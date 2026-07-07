import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Check, Shield, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SupportBot from '../components/SupportBot';

const Pricing = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    // Use env vars for price IDs if you want dynamic checks, but hardcoded plan names work for UI
    const handleSubscribe = async (plan) => {
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const { data } = await axios.post(
                `${API_BASE_URL}/api/payment/checkout`, 
                { plan },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Failed to initiate checkout. Please try again.");
        }
    };

    const features = [
        "Unlimited AI Resume Analysis",
        "Unlimited Mock Interviews",
        "Priority AI Response Time",
        "Exclusive 'Corporate' Aptitude Tests",
        "Verified Skill Badge"
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Navbar />
            <div className="py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4"
                >
                    Invest in Your Career
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-600 dark:text-slate-400 mb-16 max-w-2xl mx-auto"
                >
                    Choose the plan that fits your ambition. Unlock the full potential of CampusMind AI logic.
                </motion.p>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-lg relative flex flex-col"
                    >
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Student Starter</h3>
                        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Free</div>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">Perfect for exploring the platform features.</p>

                        <div className="space-y-4 mb-8 flex-1 text-left">
                            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span>3 AI Resume Scans</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span>3 Mock Interview Sessions</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span>Basic Dashboard Access</span>
                            </div>
                        </div>

                        <button 
                            className="w-full py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            disabled
                        >
                            Current Plan
                        </button>
                    </motion.div>

                    {/* Pro Plan (Monthly) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-900 dark:bg-white rounded-3xl p-8 border border-slate-900 shadow-2xl relative flex flex-col transform md:-translate-y-4"
                    >
                        <div className="absolute top-0 right-0 left-0 -mt-4 flex justify-center">
                            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
                        </div>
                        <h3 className="text-xl font-bold text-white dark:text-slate-900 mb-2">Professional</h3>
                        <div className="text-4xl font-bold text-white dark:text-slate-900 mb-1 flex items-baseline justify-center gap-1">
                            $9<span className="text-lg font-normal text-slate-400 dark:text-slate-500">/mo</span>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 mb-8">For serious students ready to get hired.</p>

                        <div className="space-y-4 mb-8 flex-1 text-left">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3 text-slate-300 dark:text-slate-700">
                                    <Check className="w-5 h-5 text-blue-400 dark:text-blue-600 flex-shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => handleSubscribe('monthly')}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={20} /> Upgrade Now
                        </button>
                    </motion.div>

                    {/* Yearly Plan */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-lg relative flex flex-col"
                    >
                         <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Career Master</h3>
                        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1 flex items-baseline justify-center gap-1">
                            $99<span className="text-lg font-normal text-slate-500 dark:text-slate-400">/yr</span>
                        </div>
                        <p className="text-green-500 font-medium mb-8">Save 15% with annual billing</p>

                        <div className="space-y-4 mb-8 flex-1 text-left">
                            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span>Everything in Professional</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span>1-on-1 Mentor Session</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <span>Lifetime Profile Hosting</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleSubscribe('yearly')}
                            className="w-full py-4 rounded-xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        >
                            Go Annual
                        </button>
                    </motion.div>
                </div>

                <div className="mt-16 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 text-left">
                        <Shield className="w-12 h-12 text-green-500" />
                        <div>
                            <h4 className="font-bold text-lg text-slate-800 dark:text-white">Secure Payments via Stripe</h4>
                            <p className="text-slate-500 dark:text-slate-400">Your financial data is encrypted and handled by a world-class payment processor.</p>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            <Footer />
            <SupportBot />
        </div>
    );
};

export default Pricing;
