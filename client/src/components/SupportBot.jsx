import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, History } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const SupportBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const [hasFetchedHistory, setHasFetchedHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setHasFetchedHistory(true);
                return;
            }
            
            const res = await axios.get(`${API_BASE_URL}/api/chat/history?type=support`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.history) {
                 // Format: { role, content }
                 setMessages(res.data.history);
            }
            setHasFetchedHistory(true);
        } catch (err) {
            console.error("Failed to load chat history", err);
            setHasFetchedHistory(true);
        }
    };

    useEffect(() => {
        if (isOpen && !hasFetchedHistory) {
            fetchHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: "Welcome! I'm CampusMind AI Support Bot. You can ask me about the platform features, pricing, or how to get started. To save your chat history, please login first." 
                }]);
                setLoading(false);
                return;
            }
            
            const res = await axios.post(`${API_BASE_URL}/api/chat`, 
                { message: userMsg.content, type: 'support' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Add Assistant Response
            const aiMsg = { role: 'assistant', content: res.data.response };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 3D Robot Image - Animated
    const ROBOT_IMAGE = "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"; 

    return (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-[320px] h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4"
                    >
                        {/* Header */}
                        <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-2">
                                <motion.div 
                                    className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                    <img src={ROBOT_IMAGE} alt="Robot" className="w-5 h-5 object-contain" />
                                </motion.div>
                                <div>
                                    <h3 className="font-bold text-xs">CampusMind AI</h3>
                                    <p className="text-[10px] text-blue-100 flex items-center gap-1">
                                        <Sparkles size={8} /> Support
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                    title="Previous Chats"
                                >
                                    <History size={14} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Previous Chats Sidebar */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 120, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="absolute left-0 top-0 bottom-0 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-white/10 overflow-y-auto z-10"
                                >
                                    <div className="p-2">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Previous Chats</h4>
                                        <div className="space-y-1">
                                            {messages.length > 0 ? (
                                                <div className="text-xs text-slate-600 dark:text-slate-400 p-2 bg-white dark:bg-slate-900 rounded cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                                    Current Session
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 p-2">No chats yet</div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950/50 scroll-smooth">
                            {messages.length === 0 && !loading && (
                                <div className="text-center text-slate-500 text-xs mt-8 space-y-2">
                                    <motion.div 
                                        className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <motion.img 
                                            src={ROBOT_IMAGE} 
                                            alt="AI" 
                                            className="w-12 h-12 object-contain"
                                            animate={{ y: [0, -3, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    </motion.div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300 text-xs">How can I help you today?</p>
                                    <p className="text-[10px] text-slate-400">Ask me anything about CampusMind AI</p>
                                </div>
                            )}
                            
                            {messages.map((msg, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                        {msg.role === 'user' ? (
                                            <User size={12} className="text-blue-600"/>
                                        ) : (
                                            <motion.img 
                                                src={ROBOT_IMAGE} 
                                                className="w-5 h-5 object-contain"
                                                animate={{ rotate: [0, 5, -5, 0] }}
                                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                                            />
                                        )}
                                    </div>
                                    <div className={`p-2 rounded-xl max-w-[75%] text-xs leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex gap-2">
                                     <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                         <motion.img 
                                             src={ROBOT_IMAGE} 
                                             className="w-5 h-5 object-contain"
                                             animate={{ rotate: 360 }}
                                             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                         />
                                     </div>
                                     <div className="p-2 bg-white dark:bg-slate-800 rounded-xl rounded-bl-none border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-2">
                                         <Loader2 size={12} className="animate-spin text-purple-600"/>
                                         <span className="text-[10px] text-slate-500">Thinking...</span>
                                     </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-white/5 focus-within:border-blue-500 transition-colors">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Ask anything..."
                                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-white placeholder:text-slate-400 pl-1"
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={12} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="trigger-button"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="pointer-events-auto cursor-pointer"
                        onClick={() => setIsOpen(true)}
                    >
                        {/* Chatbot Card Design - Matching Image */}
                        <div className="relative w-28 h-36 rounded-2xl p-[3px] bg-gradient-to-br from-blue-500 via-red-500 to-purple-500 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300">
                            {/* Dark Background */}
                            <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[13px] flex flex-col items-center justify-between p-4 relative overflow-hidden">
                                {/* Subtle Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none"></div>
                                
                                {/* Animated Robot - Top Center */}
                                <div className="flex-1 flex items-center justify-center relative z-10 mt-2">
                                    <motion.div
                                        animate={{ 
                                            y: [0, -6, 0],
                                        }}
                                        transition={{ 
                                            duration: 2.5, 
                                            repeat: Infinity, 
                                            ease: "easeInOut" 
                                        }}
                                        className="relative"
                                    >
                                        {/* Robot with Antenna */}
                                        <div className="relative">
                                            {/* Antenna */}
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-2 bg-white/80 rounded-full"
                                            />
                                            
                                            {/* Robot Head & Body */}
                                            <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                {/* Blue Eyes */}
                                                <div className="flex items-center gap-2">
                                                    <motion.div 
                                                        className="w-3 h-3 bg-blue-500 rounded-full relative"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    >
                                                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm"></div>
                                                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full"></div>
                                                    </motion.div>
                                                    <motion.div 
                                                        className="w-3 h-3 bg-blue-500 rounded-full relative"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                                                    >
                                                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-sm"></div>
                                                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full"></div>
                                                    </motion.div>
                                                </div>
                                                
                                                {/* Smile */}
                                                <motion.svg
                                                    className="absolute bottom-3 left-1/2 -translate-x-1/2"
                                                    width="20"
                                                    height="10"
                                                    viewBox="0 0 20 10"
                                                    animate={{ scaleX: [1, 1.1, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                >
                                                    <path
                                                        d="M 2 6 Q 10 10 18 6"
                                                        stroke="white"
                                                        strokeWidth="2"
                                                        fill="none"
                                                        strokeLinecap="round"
                                                    />
                                                </motion.svg>
                                            </div>
                                            
                                            {/* Waving Hand/Arm */}
                                            <motion.div
                                                animate={{ 
                                                    rotate: [0, 15, -15, 0],
                                                }}
                                                transition={{ 
                                                    duration: 2, 
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                                className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-8 bg-white rounded-full"
                                            />
                                            
                                            {/* Glow under robot */}
                                            <motion.div
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-blue-400/30 blur-md rounded-full"
                                            />
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Start Chat Button - Bottom */}
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full bg-white text-slate-900 font-bold text-xs py-2.5 px-3 rounded-lg text-center shadow-lg transform transition-transform z-10 relative"
                                >
                                    Start chat
                                </motion.div>
                            </div>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupportBot;
