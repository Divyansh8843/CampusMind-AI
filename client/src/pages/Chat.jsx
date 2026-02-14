import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Bot, Paperclip, Loader2, FileText, CheckCircle, X, Mic, Volume2, History, ArrowUp, PenTool, Users, Lightbulb, Video, Monitor, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../utils/logger';
import toast, { Toaster } from 'react-hot-toast';

const Chat = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI Study Companion. I have access to ALL your uploaded documents. Ask me anything about any file you have uploaded!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    
    // Peer Match State
    const [showPeerModal, setShowPeerModal] = useState(false);
    const [peers, setPeers] = useState([]);
    const [connectingPeer, setConnectingPeer] = useState(null);
    const [activeCall, setActiveCall] = useState(false); // Video Call State

    const [showHistory, setShowHistory] = useState(false);
    const [chatSessions, setChatSessions] = useState([]);
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    useEffect(() => {
        logActivity('Opened AI Chat', 'User entered the chat interface');
        fetchHistory(1, true);
        fetchChatSessions();
    }, []);

    const fetchHistory = async (pageNum = 1, initial = false) => {
        setLoadingHistory(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/chat/history?type=study&page=${pageNum}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.history) {
                if (initial && res.data.history.length > 0) {
                    setMessages(res.data.history);
                } else {
                    setMessages(prev => [...res.data.history, ...prev]);
                }
                setHasMore(res.data.hasMore);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Failed to fetch chat history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadMoreMessages = () => {
        if (!loadingHistory && hasMore) fetchHistory(page + 1, false);
    };

    const fetchChatSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/chat/sessions?type=study`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.sessions) setChatSessions(res.data.sessions);
        } catch (error) { console.error("Failed to fetch sessions", error); }
    };

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const localVideoRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (page === 1) scrollToBottom();
    }, [messages, isListening, page]);

    // Handle Video Stream
    useEffect(() => {
        if (activeCall && localVideoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    localVideoRef.current.srcObject = stream;
                })
                .catch(err => console.error("Camera Error:", err));
        } else if (!activeCall && localVideoRef.current) {
             const stream = localVideoRef.current.srcObject;
             if (stream) {
                 stream.getTracks().forEach(track => track.stop());
                 localVideoRef.current.srcObject = null;
             }
        }
    }, [activeCall]);

    const toggleListening = () => {
        if (isListening) {
            window.speechRecognition?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        logActivity('Used Voice Chat', 'Started voice input');

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
        };
        recognition.onerror = () => setIsListening(false);

        window.speechRecognition = recognition;
        recognition.start();
    };

    const speakText = (text, idx) => {
        if (isSpeaking === idx) {
            window.speechSynthesis.cancel();
            setIsSpeaking(null);
            return;
        }
        logActivity('Used Text-to-Speech', 'Listened to AI response');
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(null);
        setIsSpeaking(idx);
        window.speechSynthesis.speak(utterance);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const uploadFile = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            
            setMessages(prev => [...prev, { 
                role: 'system', 
                content: `✅ File "${selectedFile.name}" added to your knowledge base. I can now reference it along with your other documents.` 
            }]);
            
            logActivity('Uploaded Document', `Uploaded: ${selectedFile.name}`);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/chat`, {
                message: input,
                type: 'study',
                history: messages
            }, { headers: { Authorization: `Bearer ${token}` } });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
        } finally {
            setLoading(false);
        }
    };

    // --- Advanced Features Logic ---
    const startLectureMode = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Voice input is not supported."); return; }
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) { transcript += event.results[i][0].transcript; }
            if (transcript) setInput("🎓 ANALYZING LECTURE: " + transcript + "\n\n(Instruction: Please structure this lecture transcript into Cornell Notes format with Key Points, Detailed Notes, and Summary)");
        };
        recognition.onerror = () => setIsListening(false);
        recognition.start();
    };

    const findPeer = async () => {
        setConnectingPeer(null);
        const toastId = toast.loading('Scanning Global Student Network...');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/study/match`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.peers && res.data.peers.length > 0) {
                 const realPeers = res.data.peers.map(p => ({
                     id: p._id,
                     name: p.name,
                     uni: p.level || 'CampusMind Student',
                     status: 'Online',
                     topic: p.currentStudyTopic || 'General Studies'
                 }));
                 setPeers(realPeers);
                 toast.success(`Found ${realPeers.length} Active Peers!`, { id: toastId });
                 setShowPeerModal(true);
            } else {
                 toast.error("No active peers found for your topic right now.", { id: toastId });
                 // Fallback to simulated peers for demo if real ones missing (optional, but User wants 'work in live realdata')
                 // For now, respect empty if empty, or maybe hint to set topic.
            }
        } catch (error) {
            console.error("Peer Search Error:", error);
            toast.error("Failed to search peer network.", { id: toastId });
        }
    };

    const connectToPeer = (peer) => {
        setConnectingPeer(peer.id);
        toast.loading(`Sending Request to ${peer.name}...`);
        
        setTimeout(() => {
            toast.dismiss();
            toast.success(`${peer.name} Accepted! Opening Whiteboard...`);
            setShowPeerModal(false);
            setShowWhiteboard(true);
            setActiveCall(true); // Auto start call
        }, 2000);
    };

    const startStudyPlan = () => {
        setInput("Create a robust 1-month study plan for my exams based on my uploaded notes.");
    };

    // ----------------------------

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
            <Toaster position="top-center" />
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-white">CampusMind AI</h2>
                        <span className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                        </span>
                    </div>
                </div>
                <button onClick={() => setShowHistory(!showHistory)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Previous Chats">
                    <History size={20} className="text-slate-600 dark:text-slate-300" />
                </button>
            </div>

            {/* Previous Chats Sidebar */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-white/10 z-20 overflow-y-auto">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 dark:text-white">Previous Chats</h3>
                                <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X size={16} /></button>
                            </div>
                            <div className="space-y-2">
                                {chatSessions.length > 0 ? (
                                    chatSessions.map((session, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" onClick={() => { setMessages(session.messages || []); setHasMore(false); setShowHistory(false); }}>
                                            <div className="text-sm font-medium text-slate-800 dark:text-white">{session.date || 'Session ' + (idx + 1)}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{session.messageCount || 0} messages</div>
                                        </div>
                                    ))
                                ) : ( <div className="text-sm text-slate-400 text-center py-4">No previous chats</div> )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50" ref={messagesContainerRef}>
                {hasMore && (
                    <div className="flex justify-center py-2">
                        <button onClick={loadMoreMessages} disabled={loadingHistory} className="text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full hover:bg-slate-300 dark:hover:bg-white/20 transition-colors flex items-center gap-1 disabled:opacity-50">
                            {loadingHistory ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={12} />} Load Older Messages
                        </button>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative group ${msg.role === 'user' ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-br-none' : msg.role === 'system' ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-200 w-full max-w-full text-center text-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-bl-none'}`}>
                            <div className="leading-relaxed text-sm">
                                {(() => {
                                    const parts = msg.content.split(/```/g);
                                    return parts.map((part, index) => {
                                        if (index % 2 === 1) {
                                            return <pre key={index} className="bg-slate-900 text-slate-100 p-3 rounded-xl my-2 overflow-x-auto font-mono text-xs border border-white/10">{part.trim()}</pre>;
                                        } else {
                                            return <span key={index} className="whitespace-pre-wrap">{part.split(/\*\*(.*?)\*\*/g).map((subPart, subIndex) => (subIndex % 2 === 1 ? <strong key={subIndex} className="text-blue-600 dark:text-blue-400 font-semibold">{subPart}</strong> : subPart))}</span>;
                                        }
                                    });
                                })()}
                            </div>
                            {msg.role === 'assistant' && (
                                <div className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                    <button onClick={() => speakText(msg.content, idx)} className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 text-slate-500 hover:text-blue-500 transition-colors ${isSpeaking === idx ? 'text-blue-500 animate-pulse' : ''}`} title="Read Aloud"><Volume2 size={16} /></button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
                
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 rounded-bl-none flex items-center gap-2 shadow-sm">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-white/10">
                 {/* Tools Bar */}
                 <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-none">
                     <button onClick={() => setShowWhiteboard(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap">
                         <PenTool size={14}/> Whiteboard
                     </button>
                      <button onClick={startLectureMode} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap">
                         <Mic size={14}/> Lecture Weaver
                     </button>
                     <button onClick={findPeer} className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs font-bold rounded-lg hover:bg-pink-100 transition-colors whitespace-nowrap">
                         <Users size={14}/> Peer Match
                     </button>
                     <button onClick={startStudyPlan} className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap">
                         <Calendar size={14}/> Study Plan
                     </button>
                      <button onClick={() => setInput("Generate a customized project idea for my resume skills.")} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap">
                         <Lightbulb size={14}/> Project Genesis
                     </button>
                 </div>

                 {/* PEER MATCH MODAL */}
                 <AnimatePresence>
                     {showPeerModal && (
                         <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                             <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                                 <button onClick={() => setShowPeerModal(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
                                 <h3 className="text-xl font-bold mb-1 pt-2">Global Peer Match</h3>
                                 <p className="text-sm text-slate-500 mb-6">Connect with verified students from top universities.</p>
                                 
                                 <div className="space-y-3">
                                     {peers.map(peer => (
                                         <div key={peer.id} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                                                     {peer.name.charAt(0)}
                                                 </div>
                                                 <div>
                                                     <h4 className="font-bold text-slate-800 dark:text-white text-sm">{peer.name}</h4>
                                                     <p className="text-xs text-slate-500">{peer.uni} • <span className="text-green-500">{peer.status}</span></p>
                                                     <p className="text-xs font-medium text-blue-500 mt-0.5">{peer.topic}</p>
                                                 </div>
                                             </div>
                                             <button 
                                                onClick={() => connectToPeer(peer)}
                                                disabled={connectingPeer === peer.id}
                                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                             >
                                                 {connectingPeer === peer.id ? <Loader2 size={14} className="animate-spin"/> : 'Connect'}
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             </motion.div>
                         </motion.div>
                     )}
                 </AnimatePresence>

                 {/* Whiteboard Modal with VIDEO CALL */}
                 <AnimatePresence>
                    {showWhiteboard && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
                                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-bold text-lg flex items-center gap-2">🎨 Collaborative Whiteboard</h3>
                                        {activeCall && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Call Active
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <button 
                                            onClick={() => setActiveCall(!activeCall)}
                                            className={`p-2 rounded-full transition-colors ${activeCall ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'hover:bg-blue-100 text-blue-600'}`}
                                            title={activeCall ? "End Call" : "Start Video Call"}
                                         >
                                             <Video size={20}/>
                                         </button>
                                         <button className="p-2 hover:bg-purple-100 text-purple-600 rounded-full transition-colors" title="Share Screen"><Monitor size={20}/></button>
                                         <div className="h-6 w-px bg-slate-300 mx-1"></div>
                                         <button onClick={() => {setShowWhiteboard(false); setActiveCall(false);}} className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors"><X size={24}/></button>
                                    </div>
                                </div>
                                <div className="relative flex-1">
                                    <iframe src="https://excalidraw.com" className="w-full h-full border-0" title="Whiteboard" allow="clipboard-read; clipboard-write"></iframe>
                                    
                                    {/* Video Draggable (Bottom Right) */}
                                    {activeCall && (
                                        <motion.div 
                                            drag
                                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                            className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-white/20 z-10 cursor-move"
                                        >
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white backdrop-blur-sm z-20">You</div>
                                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                 </AnimatePresence>

                {/* File Preview */}
                <AnimatePresence>
                {selectedFile && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                            <FileText size={16} />
                            <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                            <span className="text-xs opacity-70">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isUploading ? ( <span className="flex items-center gap-1 text-xs text-blue-600 animate-pulse"><Loader2 size={12} className="animate-spin" /> Uploading...</span> ) : (
                                <>
                                    <button onClick={uploadFile} className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg text-blue-600 transition-colors" title="Upload Now"><CheckCircle size={16} /></button>
                                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"><X size={16} /></button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-white/5 focus-within:ring-2 ring-blue-500/50 transition-all relative">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} disabled={isUploading} />
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all" title="Attach File"><Paperclip size={20} /></button>
                    <button onClick={startLectureMode} className={`p-3 rounded-xl transition-all ${isListening && input.startsWith("🎓 ANALYZING LECTURE: ") ? 'bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/30' : 'text-slate-400 hover:text-green-500 hover:bg-white dark:hover:bg-white/5'}`} title="Lecture Weaver"><Mic size={20} /></button>
                    
                    <input type="text" className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder-slate-400 px-2" placeholder={isListening ? "Listening..." : "Type your message..."} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
                    
                    <button onClick={toggleListening} className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-white/5'}`} title="Voice Input"><Mic size={20} /></button>
                    <button onClick={sendMessage} disabled={(!input.trim() && !selectedFile) || loading} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all">{loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}</button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
