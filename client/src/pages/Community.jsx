import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, ThumbsUp, Award, Search, Plus, User, Star, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Community = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAskModal, setShowAskModal] = useState(false);
    
    // Reply State
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // Question ID
    const [replyContent, setReplyContent] = useState('');

    const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/community`);
            setQuestions(res.data);
        } catch (error) {
            console.error("Failed to fetch community posts", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostQuestion = async () => {
        if (!newQuestion.title.trim() || !newQuestion.content.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/community`, newQuestion, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setShowAskModal(false);
            setNewQuestion({ title: '', content: '' });
            fetchPosts(); // Refresh list
            
            // Show toast
            const toast = document.createElement('div');
            toast.className = "fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl animate-bounce z-50";
            toast.textContent = "Question Posted! (+5 XP)";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);

        } catch (error) {
            console.error("Failed to post question", error);
            alert("Failed to post question. Please try again.");
        }
    };

    const openReplyModal = (qId) => {
        setReplyingTo(qId);
        setReplyContent('');
        setShowReplyModal(true);
    };

    const handlePostReply = async () => {
        if (!replyContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            // Assuming route is /api/community/:id/answer based on community.routes.js
            await axios.post(`${API_BASE_URL}/api/community/${replyingTo}/answer`, {
                content: replyContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowReplyModal(false);
            setReplyContent('');
            fetchPosts();

            const toast = document.createElement('div');
            toast.className = "fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl animate-bounce z-50";
            toast.textContent = "Answer Posted! (+10 XP)";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);

        } catch (error) {
            console.error("Failed to post reply", error);
            alert("Failed to post answer");
        }
    };

    const handleRate = async (qId, aId = null) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/community/${qId}/rate`, { answerId: aId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistic update or fetch again
            fetchPosts();

            const toast = document.createElement('div');
            toast.className = "fixed bottom-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-2 animate-bounce z-50";
            toast.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg> Rated!`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);

        } catch (error) {
            console.error("Failed to rate", error);
        }
    };

    const filteredQuestions = questions.filter(q => 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <MessageSquare className="text-indigo-600" size={40} /> Global Community
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Ask questions, rate answers, and earn reputation.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                         <input 
                            type="text" 
                            placeholder="Search discussions..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-900 dark:text-white"
                         />
                    </div>
                    <button onClick={() => setShowAskModal(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1">
                        <Plus size={20}/> Ask Question
                    </button>
                </div>
            </div>

            {/* Questions List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-indigo-500"/></div>
            ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-20 text-slate-400">No discussions found. Be the first to ask!</div>
            ) : (
                <div className="grid gap-6">
                    {filteredQuestions.map(q => (
                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} key={q._id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <img src={q.authorAvatar} alt={q.authorName} className="w-12 h-12 rounded-full bg-slate-100 object-cover border border-slate-200 dark:border-white/10" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1 hover:text-indigo-500 cursor-pointer">{q.title}</h2>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{q.authorName}</span>
                                                {q.authorRole && <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs">{q.authorRole}</span>}
                                                <span>•</span>
                                                <span className="text-xs">{new Date(q.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-xl text-slate-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5" onClick={() => handleRate(q._id)}>
                                             <ThumbsUp size={18} />
                                             <span className="font-bold text-lg">{q.upvotes || 0}</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed whitespace-pre-wrap">{q.content}</p>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex gap-2">
                                            {q.tags.map(tag => ( <span key={tag} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-900/30">#{tag}</span> ))}
                                        </div>
                                        <button 
                                            onClick={() => openReplyModal(q._id)}
                                            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <MessageCircle size={16}/> Reply
                                        </button>
                                    </div>

                                    {/* Top Answers (Show Top 3) */}
                                    {q.answers && q.answers.length > 0 && (
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-4 border border-slate-200 dark:border-white/5">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><Award size={14} className="text-yellow-500"/> Top Perspectives</h3>
                                            {q.answers.sort((a,b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 3).map((ans) => (
                                                <div key={ans._id} className={`flex gap-3 p-3 rounded-xl border ${ans.isTop ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5'}`}>
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">{ans.authorName ? ans.authorName[0] : 'U'}</div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-bold text-sm text-slate-800 dark:text-white">{ans.authorName}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-400">{ans.upvotes || 0}</span>
                                                                <button onClick={() => handleRate(q._id, ans._id)} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-green-500 transition-colors">
                                                                    <Star size={12} /> Rate
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">{ans.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Ask Modal */}
            <AnimatePresence>
                {showAskModal && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10">
                             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Ask the Community</h2>
                             <input 
                                type="text" 
                                placeholder="Title (e.g., How to solve X?)" 
                                value={newQuestion.title}
                                onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                                className="w-full mb-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                             />
                             <textarea 
                                rows={4} 
                                placeholder="Your question details..." 
                                value={newQuestion.content}
                                onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                                className="w-full mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                             ></textarea>
                             <div className="flex gap-4">
                                 <button onClick={() => setShowAskModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                 <button onClick={handlePostQuestion} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 shadow-lg transition-colors">Post Question</button>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Reply Modal */}
            <AnimatePresence>
                {showReplyModal && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10">
                             <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Contribute an Answer</h2>
                             <p className="text-sm text-slate-500 mb-4">Help your peer and earn XP!</p>
                             <textarea 
                                rows={4} 
                                placeholder="Your answer..." 
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="w-full mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600"
                             ></textarea>
                             <div className="flex gap-4">
                                 <button onClick={() => setShowReplyModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                 <button onClick={handlePostReply} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 shadow-lg transition-colors">Post Answer</button>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Community;
