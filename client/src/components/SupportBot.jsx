import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, History } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const GUEST_STORAGE_KEY = 'campusmind_guest_support_sessions';
const ROBOT_IMAGE = 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png';

const loadGuestSessions = () => {
    try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveGuestSessions = (sessions) => {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(sessions));
};

const createGuestSession = () => ({
    id: `guest-${Date.now()}`,
    date: new Date().toLocaleDateString(),
    messages: [],
    messageCount: 0
});

const SupportBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const [showHistory, setShowHistory] = useState(false);
    const [chatSessions, setChatSessions] = useState([]);
    const [guestSessionId, setGuestSessionId] = useState(null);
    const hasFetchedHistoryForTokenRef = useRef(null);
    const lastTokenRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const isAuthenticated = Boolean(token);

    const persistGuestSession = useCallback((nextMessages, sessionId) => {
        if (isAuthenticated || !sessionId) return;
        const sessions = loadGuestSessions();
        const idx = sessions.findIndex((s) => s.id === sessionId);
        const payload = {
            id: sessionId,
            date: new Date().toLocaleDateString(),
            messages: nextMessages,
            messageCount: nextMessages.length
        };
        if (idx >= 0) sessions[idx] = payload;
        else sessions.unshift(payload);
        saveGuestSessions(sessions.slice(0, 20));
        setChatSessions(sessions.slice(0, 20));
    }, [isAuthenticated]);

    const fetchHistory = async () => {
        try {
            if (!token) {
                const sessions = loadGuestSessions();
                setChatSessions(sessions);
                if (sessions[0]?.messages?.length) {
                    setMessages(sessions[0].messages);
                    setGuestSessionId(sessions[0].id);
                } else {
                    const session = createGuestSession();
                    setGuestSessionId(session.id);
                    saveGuestSessions([session]);
                    setChatSessions([session]);
                }
                return true;
            }

            if (hasFetchedHistoryForTokenRef.current === token) return true;

            const res = await axios.get(`${API_BASE_URL}/api/chat/history?type=support`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const supportHistory = res.data?.history || [];
            if (supportHistory.length > 0) {
                setMessages(supportHistory);
            } else {
                const resAll = await axios.get(`${API_BASE_URL}/api/chat/history?type=all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(resAll.data?.history || []);
            }

            hasFetchedHistoryForTokenRef.current = token;
            return true;
        } catch (err) {
            console.error('Failed to load chat history', err);
            return false;
        }
    };

    const fetchChatSessions = async () => {
        try {
            if (!token) {
                setChatSessions(loadGuestSessions());
                return;
            }

            let res = await axios.get(`${API_BASE_URL}/api/chat/sessions?type=support`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let sessions = res.data?.sessions || [];

            if (sessions.length === 0) {
                res = await axios.get(`${API_BASE_URL}/api/chat/sessions?type=all`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                sessions = res.data?.sessions || [];
            }
            setChatSessions(sessions);
        } catch (err) {
            console.error('Failed to load chat sessions', err);
        }
    };

    useEffect(() => {
        if (!isOpen) return undefined;

        let cancelled = false;
        const maxAttempts = 10;

        const run = async (attempt) => {
            if (cancelled) return;

            const currentToken = localStorage.getItem('token');
            if (lastTokenRef.current !== currentToken) {
                lastTokenRef.current = currentToken;
                hasFetchedHistoryForTokenRef.current = null;
            }

            // Proactively wake up the AI service
            axios.get(`${API_BASE_URL}/api/chat/wakeup`).catch(() => {});

            const ok = await fetchHistory();
            await fetchChatSessions();
            if (!cancelled && !ok && attempt < maxAttempts) {
                setTimeout(() => run(attempt + 1), 1000);
            }
        };

        run(0);
        return () => { cancelled = true; };
    }, [isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, showHistory]);

    const handleNewChat = () => {
        setMessages([]);
        setShowHistory(false);
        if (!isAuthenticated) {
            const session = createGuestSession();
            setGuestSessionId(session.id);
            const sessions = [session, ...loadGuestSessions()].slice(0, 20);
            saveGuestSessions(sessions);
            setChatSessions(sessions);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input.trim() };
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);
        setInput('');
        setLoading(true);

        let activeGuestSessionId = guestSessionId;
        try {
            const authToken = localStorage.getItem('token');
            let responseText = '';

            if (!authToken && !activeGuestSessionId) {
                activeGuestSessionId = createGuestSession().id;
                setGuestSessionId(activeGuestSessionId);
            }

            if (authToken) {
                const res = await axios.post(
                    `${API_BASE_URL}/api/chat`,
                    { message: userMsg.content, type: 'support' },
                    { headers: { Authorization: `Bearer ${authToken}` } }
                );
                responseText = res.data.response;
            } else {
                const res = await axios.post(`${API_BASE_URL}/api/chat/guest`, {
                    message: userMsg.content,
                    type: 'support'
                });
                responseText = res.data.response;
            }

            const aiMsg = { role: 'assistant', content: responseText };
            const finalMessages = [...nextMessages, aiMsg];
            setMessages(finalMessages);

            if (!authToken) {
                persistGuestSession(finalMessages, activeGuestSessionId);
            } else {
                fetchChatSessions();
            }
        } catch (err) {
            console.error(err);
            const apiMessage = err.response?.data?.message;
            const fallback = {
                role: 'assistant',
                content: apiMessage || "Sorry, I'm having trouble connecting right now. Please try again in a moment."
            };
            const finalMessages = [...nextMessages, fallback];
            setMessages(finalMessages);
            if (!isAuthenticated) persistGuestSession(finalMessages, activeGuestSessionId);
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

    const loadSession = (session) => {
        setMessages(session.messages || []);
        if (!isAuthenticated && session.id) setGuestSessionId(session.id);
        setShowHistory(false);
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999] flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="pointer-events-auto relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-[min(100vw-24px,380px)] sm:w-[360px] h-[min(560px,calc(100vh-80px))] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 sm:mb-4"
                    >
                        <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md shrink-0">
                                    <img src={ROBOT_IMAGE} alt="Robot" className="w-5 h-5 object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-xs truncate">CampusMind AI</h3>
                                    <p className="text-[10px] text-blue-100 flex items-center gap-1">
                                        <Sparkles size={8} /> Support {!isAuthenticated && '• Guest'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={handleNewChat} className="p-1.5 hover:bg-white/10 rounded-full transition-colors" title="New Chat">
                                    <span className="text-lg leading-none">+</span>
                                </button>
                                <button
                                    onClick={() => { if (!showHistory) fetchChatSessions(); setShowHistory(!showHistory); }}
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                                    title="Previous Chats"
                                >
                                    <History size={14} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="absolute inset-y-0 left-0 z-20 w-[min(72%,220px)] bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-white/10 overflow-y-auto shadow-lg"
                                >
                                    <div className="p-3">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Previous Chats</h4>
                                        <div className="space-y-1.5">
                                            {chatSessions.length > 0 ? chatSessions.map((session, idx) => (
                                                <button
                                                    key={session.id || idx}
                                                    type="button"
                                                    className="w-full text-left p-2.5 bg-white dark:bg-slate-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    onClick={() => loadSession(session)}
                                                >
                                                    <div className="text-xs font-medium text-slate-800 dark:text-white truncate">
                                                        {session.date || `Session ${idx + 1}`}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {session.messageCount || session.messages?.length || 0} msgs
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="text-xs text-slate-400 p-2">No chats yet</div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-950/50 scroll-smooth">
                            {messages.length === 0 && !loading && (
                                <div className="text-center text-slate-500 text-xs mt-8 space-y-2 px-2">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                                        <img src={ROBOT_IMAGE} alt="AI" className="w-12 h-12 object-contain" />
                                    </div>
                                    <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">How can I help you today?</p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Platform support only — login, pricing, alumni verification, privacy policy, terms of service, and features.
                                        {!isAuthenticated && ' Guest mode works without login; chats are saved on this device.'}
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                                        {['How do I login?', 'What is alumni verification?', 'Privacy policy summary'].map((hint) => (
                                            <button
                                                key={hint}
                                                type="button"
                                                onClick={() => setInput(hint)}
                                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                                            >
                                                {hint}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                        {msg.role === 'user' ? (
                                            <User size={12} className="text-blue-600" />
                                        ) : (
                                            <img src={ROBOT_IMAGE} className="w-5 h-5 object-contain" alt="" />
                                        )}
                                    </div>
                                    <div className={`p-2.5 rounded-xl max-w-[82%] text-xs leading-relaxed break-words ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-bl-none shadow-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                        <Loader2 size={12} className="animate-spin text-purple-600" />
                                    </div>
                                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl rounded-bl-none border border-slate-200 dark:border-white/10 shadow-sm">
                                        <span className="text-[10px] text-slate-500">Thinking...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-white/5 focus-within:border-blue-500 transition-colors">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Ask about CampusMind platform..."
                                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                >
                                    <Send size={14} />
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
                        aria-label="Open support chat"
                    >
                        <div className="relative w-24 h-32 sm:w-28 sm:h-36 rounded-2xl p-[3px] bg-gradient-to-br from-blue-500 via-red-500 to-purple-500 shadow-2xl">
                            <div className="w-full h-full bg-slate-900 rounded-[13px] flex flex-col items-center justify-between p-3 sm:p-4 relative overflow-hidden">
                                <div className="flex-1 flex items-center justify-center mt-2">
                                    <img src={ROBOT_IMAGE} alt="Support bot" className="w-14 h-14 sm:w-16 sm:h-16 object-contain animate-float" />
                                </div>
                                <div className="w-full bg-white text-slate-900 font-bold text-[11px] sm:text-xs py-2 px-2 rounded-lg text-center shadow-lg">
                                    Start chat
                                </div>
                            </div>
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupportBot;
