import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, RotateCcw, Mic, MicOff, Volume2, Brain, Trophy, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Clock, Monitor, EyeOff, Video, VideoOff, Bot, Maximize, ShieldAlert, Sparkles, Cpu, Wifi, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logActivity } from '../utils/logger';

const Interview = () => {
    const [step, setStep] = useState('intro');
    const [mode, setMode] = useState(null);
    const [jobRole, setJobRole] = useState('Software Engineer');
    const [loading, setLoading] = useState(false);
    const [voiceMode, setVoiceMode] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    
    // Proctoring & Status
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [warningModal, setWarningModal] = useState({ show: false, title: '', message: '' });

    // Media State
    const [hasVideo, setHasVideo] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    
    // AI Facial Analysis State (Simulated)
    const [facialStats, setFacialStats] = useState({ confidence: 85, eyeContact: true, smile: false });

    // Interview State
    const [messages, setMessages] = useState([]);
    const [lastAiText, setLastAiText] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [timer, setTimer] = useState(0); // Answer timer
    const [interviewDuration, setInterviewDuration] = useState(600); // 10 mins
    const timerRef = useRef(null);

    // Aptitude State
    const [aptitudeQuestions, setAptitudeQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [aptitudeScore, setAptitudeScore] = useState(null);
    const [aptitudeTimer, setAptitudeTimer] = useState(120);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const INTERVIEWER_IMAGE = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1600&q=90";

    useEffect(() => {
        logActivity('Opened Interview Center', 'User initialized session');
        return () => {
             stopTimer();
             stopCamera();
        };
    }, []);

    // Simulated Facial Analysis Loop
    useEffect(() => {
        if (!hasVideo || isVideoOff) return;
        const interval = setInterval(() => {
            setFacialStats({
                confidence: 80 + Math.floor(Math.random() * 20),
                eyeContact: Math.random() > 0.2, // 80% chance good
                smile: Math.random() > 0.8 // 20% chance smile
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [hasVideo, isVideoOff]);

    // Strict Proctoring
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && (step === 'mock' || step === 'aptitude') && !isDisqualified) {
                const newCount = tabSwitchCount + 1;
                setTabSwitchCount(newCount);
                
                if (newCount > 2) {
                    setIsDisqualified(true);
                    setWarningModal({
                        show: true,
                        title: 'SESSION TERMINATED',
                        message: 'Maximum proctoring violations reached (3/3). Your session has been disqualified.'
                    });
                    logActivity('Proctoring Disqualification', 'User exceeded tab switch limit');
                    if (step === 'mock') finishMockInterview(true);
                    else submitAptitude(true);
                } else {
                    setWarningModal({
                        show: true,
                        title: 'PROCTORING WARNING',
                        message: `Tab switching is detected and logged. Violation ${newCount}/3.\nPlease stay on this screen.`
                    });
                    logActivity('Proctoring Warning', `User switched tabs: ${newCount}`);
                }
            }
        };
        
        // Prevent Context Menu
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [step, mode, tabSwitchCount, isDisqualified]);

    // Timers
    useEffect(() => {
        let interval;
        if (step === 'aptitude' && !isDisqualified && !warningModal.show) {
            setAptitudeTimer(120); 
            interval = setInterval(() => {
                setAptitudeTimer((prev) => {
                    if (prev <= 1) {
                         if (currentQuestionIndex < aptitudeQuestions.length - 1) {
                             setCurrentQuestionIndex(p => p + 1);
                             return 120;
                         } else {
                             submitAptitude();
                             return 0;
                         }
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        if (step === 'mock' && !isDisqualified && !warningModal.show) {
            interval = setInterval(() => {
                setInterviewDuration(prev => {
                    if (prev <= 1) {
                        finishMockInterview();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [currentQuestionIndex, step, isDisqualified, warningModal.show]);

    // Camera Management
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => setHasVideo(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setHasVideo(false);
    };

    const toggleMic = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Voice & Timer Helpers
    const startTimer = () => {
        setTimer(0);
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    };
    const stopTimer = () => {
        clearInterval(timerRef.current);
        setTimer(0);
    };
    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s < 10 ? '0' : ''}${s}`;
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = () => { setIsListening(true); setLiveTranscript(''); startTimer(); };
        recognition.onresult = (e) => {
            let final = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
                else setLiveTranscript(final + e.results[i][0].transcript);
            }
            if (final) {
                setLiveTranscript(final.trim());
                if (voiceMode) {
                    setUserTranscript(prev => prev + ' ' + final.trim());
                }
            }
        };
        window.recognition = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (window.recognition) window.recognition.stop();
        setIsListening(false);
        stopTimer();
        if (liveTranscript.trim()) {
            if (voiceMode) {
                setUserTranscript(prev => prev + ' ' + liveTranscript.trim());
            }
            handleUserResponse(liveTranscript);
        }
    };

    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Core Logic
    const enterFullscreen = () => {
        try { if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch(e){}
    };

    const startSession = async () => {
        enterFullscreen();
        setLoading(true);
        setTabSwitchCount(0);
        setIsDisqualified(false);
        try {
            const token = localStorage.getItem('token');
            if (mode === 'mock' || mode === 'salary') {
                setHasVideo(false);
                setInterviewDuration(600);
                const topic = mode === 'salary' ? 'Salary Negotiation - HR Roleplay' : jobRole;
                logActivity(mode === 'salary' ? 'Salary Negotiation Start' : 'Mock Interview Start', topic);
                const res = await axios.post(`${API_BASE_URL}/api/interview/chat`, {
                    history: [], user_response: "", topic: topic
                }, { headers: { Authorization: `Bearer ${token}` } });
                
                const aiResponse = res.data.response;
                setMessages([{ role: 'assistant', content: aiResponse }]);
                setLastAiText(aiResponse);
                setStep('mock');
                speakText(aiResponse);
                startCamera();
            } else {
                logActivity('Aptitude Test Start', jobRole);
                const res = await axios.post(`${API_BASE_URL}/api/interview/aptitude`, { topic: jobRole }, 
                { headers: { Authorization: `Bearer ${token}` } });
                
                if (res.data.questions?.length > 0) {
                    setAptitudeQuestions(res.data.questions);
                    setStep('aptitude');
                } else {
                    alert('Service Busy. Please try again.');
                }
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) alert("Authentication Failed. Check API Key.");
            else alert("Connection Error. Ensure Backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleUserResponse = async (text) => {
        const newHistory = [...messages, { role: 'user', content: text }];
        setMessages(newHistory);
        setLiveTranscript('');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/interview/chat`, {
                history: newHistory, user_response: text, topic: jobRole
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            const aiResponse = res.data.response;
            setMessages([...newHistory, { role: 'assistant', content: aiResponse }]);
            setLastAiText(aiResponse);
            speakText(aiResponse);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const finishMockInterview = async (disqualified = false) => {
        stopCamera();
        window.speechSynthesis.cancel();
        if (!disqualified && interviewDuration > 0 && !window.confirm("End session?")) return;
        
        setLoading(true);
        try {
            if (disqualified) {
                setFeedback({ score: 0, feedback: "Session Disqualified.", strengths: [], improvements: ["Adhere to integrity rules."]});
            } else {
                const token = localStorage.getItem('token');
                const topic = mode === 'salary' ? 'Salary Negotiation - HR Roleplay' : jobRole;
                const res = await axios.post(`${API_BASE_URL}/api/interview/feedback`, {
                    history: messages,
                    topic: topic,
                    user_transcript: userTranscript || messages.filter(m => m.role === 'user').map(m => m.content).join(' ')
                }, { headers: { Authorization: `Bearer ${token}` } });
                setFeedback(res.data);
            }
            setStep('result');
            setStep('result');
        } catch (err) {
             if (err.response && err.response.status === 403 && err.response.data.upgradeRequired) {
                 setWarningModal({
                     show: true,
                     title: 'LIMITS REACHED',
                     message: "You've used your free sessions.\nUpgrade to continue accessing AI Interviews."
                 });
                 setFeedback({ 
                     score: 0, 
                     feedback: "Free Limit Reached. Upgrade to Premium.", 
                     strengths: [], 
                     improvements: ["Upgrade to Unlimited Plan"]
                 });
             } else {
                 setFeedback({ score: 0, feedback: "Feedback generation failed." });
             }
             setStep('result');
        } finally {
            setLoading(false);
            if(document.exitFullscreen) document.exitFullscreen().catch(()=>({}));
        }
    };

    const submitAptitude = async (disqualified = false) => {
        let score = 0;
        aptitudeQuestions.forEach(q => { if (userAnswers[q.id] === q.correct_answer) score++; });
        setAptitudeScore(disqualified ? 0 : score);
        setStep('result');
        if(document.exitFullscreen) document.exitFullscreen().catch(()=>({}));
    };

    const renderWarningModal = () => (
        <AnimatePresence>
            {warningModal.show && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
                    className="fixed inset-0 z-[100] bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} 
                        className="bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl">
                        <AlertTriangle size={64} className="mx-auto text-red-500 mb-6"/>
                        <h2 className="text-2xl font-black text-red-600 mb-4">{warningModal.title}</h2>
                        <p className="text-slate-600 dark:text-slate-300 font-medium whitespace-pre-line mb-8">{warningModal.message}</p>
                        
                        {!isDisqualified ? (
                            <button onClick={() => { enterFullscreen(); setWarningModal({...warningModal, show: false}); }}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">
                                I UNDERSTAND
                            </button>
                        ) : (
                            <button onClick={() => { setWarningModal({...warningModal, show: false}); }}
                                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl transition-all">
                                CLOSE SESSION
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const renderIntro = () => (
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-10">
            <div onClick={() => { setMode('aptitude'); setStep('setup'); }} 
                className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-blue-500 cursor-pointer transition-all shadow-xl hover:shadow-2xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 bg-blue-500 rounded-bl-full w-32 h-32"></div>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"><Brain size={32} /></div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">FAANG MNC Aptitude Test</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">100% rigorous global-standard MNC assessment powered by AI.</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 font-mono"><span className="flex items-center gap-1"><Clock size={14}/> 2 M/Q</span><span className="flex items-center gap-1"><ShieldAlert size={14}/> Strict</span></div>
                <span className="text-blue-600 font-bold flex items-center gap-2">Start Assessment <ArrowRight size={16}/></span>
            </div>
            <div onClick={() => { setMode('mock'); setStep('setup'); }} 
                className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-purple-500 cursor-pointer transition-all shadow-xl hover:shadow-2xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 bg-purple-500 rounded-bl-full w-32 h-32"></div>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"><Mic size={32} /></div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">MNC Technical Interview</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Interactive FAANG-level AI video interview testing deep domain concepts.</p>
                 <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 font-mono"><span className="flex items-center gap-1"><Video size={14}/> Camera</span><span className="flex items-center gap-1"><ShieldAlert size={14}/> Strict</span></div>
                <span className="text-purple-600 font-bold flex items-center gap-2">Start Interview <ArrowRight size={16}/></span>
            </div>
            <div onClick={() => { setMode('salary'); setStep('setup'); }} 
                className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 hover:border-amber-500 cursor-pointer transition-all shadow-xl hover:shadow-2xl group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 bg-amber-500 rounded-bl-full w-32 h-32"></div>
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform"><Trophy size={32} /></div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Salary Negotiator Bot</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Roleplay HR rounds. AI plays "Tough HR" for salary negotiation practice.</p>
                 <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 font-mono"><span className="flex items-center gap-1"><Mic size={14}/> Voice</span><span className="flex items-center gap-1"><Trophy size={14}/> Practice</span></div>
                <span className="text-amber-600 font-bold flex items-center gap-2">Start Negotiation <ArrowRight size={16}/></span>
            </div>
        </div>
    );

    const renderMock = () => (
        <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col gap-4">
            {renderWarningModal()}
            {/* Top Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                 <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
                     <span className={`w-3 h-3 rounded-full ${isDisqualified ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                     AGENTIC AI LIVE
                 </div>
                 <div className="font-mono font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                     <Clock size={20} className="text-blue-500"/> {formatTime(interviewDuration)}
                 </div>
                 <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                     {tabSwitchCount > 0 && <span className="animate-pulse">⚠️ Violation {tabSwitchCount}/3</span>}
                     <Wifi size={14} className="text-green-500"/>
                 </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 relative p-4">
                {/* AI Interviewer - RECTANGULAR BOX */}
                <div className="w-full max-w-2xl aspect-video bg-slate-900 rounded-3xl relative overflow-hidden border border-slate-700 shadow-2xl group flex items-center justify-center">
                    <img src={INTERVIEWER_IMAGE} alt="AI" className={`w-full h-full object-cover transition-transform duration-1000 ${isSpeaking ? 'scale-105 saturate-110' : 'scale-100 grayscale-[10%]'}`}/>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/10"></div>
                    
                    <div className="absolute top-4 right-4 text-white/30 text-xs font-mono flex items-center gap-1">
                        <Sparkles size={10}/> Powered by Agentic AI
                    </div>
                    <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-2 border border-white/10 z-10">
                        <Cpu size={12}/> AI INTERVIEWER
                    </div>
                    {isSpeaking && <div className="absolute inset-0 border-4 border-purple-500/50 animate-pulse rounded-3xl pointer-events-none"></div>}

                    <div className="absolute bottom-8 inset-x-0 text-center z-10">
                        <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full backdrop-blur-xl border border-white/10 transition-all ${isSpeaking ? 'bg-purple-600/90 text-white scale-110' : 'bg-black/60 text-slate-300'}`}>
                             {isSpeaking ? <Volume2 size={18} className="animate-bounce"/> : <Mic size={18}/>}
                             <span className="font-bold tracking-wide">{isSpeaking ? "AI SPEAKING" : "LISTENING"}</span>
                        </div>
                    </div>
                </div>

                {/* User Video - RECTANGULAR BOX */}
                <div className="w-full max-w-2xl aspect-video bg-black rounded-3xl relative overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center group">
                     {!hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-2 flex-col">
                            <Video size={48} className="animate-pulse opacity-50"/>
                            <span className="text-sm font-medium">Initializing Camera...</span>
                        </div>
                     )}
                     <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-700 ${hasVideo && !isVideoOff ? 'opacity-100' : 'opacity-0'}`} />
                     {isVideoOff && <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-600"><VideoOff size={48}/></div>}
                     
                     {/* AI Vision Overlay */}
                     {hasVideo && !isVideoOff && (
                          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs font-mono text-cyan-400 space-y-1 z-20">
                              <div className="flex items-center gap-2 font-bold text-cyan-300 border-b border-white/10 pb-1 mb-1">
                                  <Monitor size={12}/> AI VISION LOG
                              </div>
                              <div className="flex justify-between gap-4"><span>CONFIDENCE:</span> <span className={facialStats.confidence > 90 ? 'text-green-400' : 'text-yellow-400'}>{facialStats.confidence}%</span></div>
                              <div className="flex justify-between gap-4"><span>EYE CONTACT:</span> <span className={facialStats.eyeContact ? 'text-green-400' : 'text-red-400'}>{facialStats.eyeContact ? 'MATCH' : 'LOST'}</span></div>
                              <div className="flex justify-between gap-4"><span>EXPRESSION:</span> <span className={facialStats.smile ? 'text-green-400' : 'text-slate-400'}>{facialStats.smile ? 'POSITIVE' : 'NEUTRAL'}</span></div>
                          </div>
                      )}

                      {/* Face Tracking Box Animation */}
                      {hasVideo && !isVideoOff && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-48 h-64 border-2 border-cyan-500/30 rounded-[3rem] animate-pulse relative">
                                  <div className="absolute top-0 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-500"></div>
                                  <div className="absolute top-0 -right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-500"></div>
                                  <div className="absolute bottom-0 -left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-500"></div>
                                  <div className="absolute bottom-0 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-500"></div>
                              </div>
                          </div>
                      )}

                     {/* Media Controls */}
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={toggleMic} className={`p-2 rounded-lg ${isMicMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                             {isMicMuted ? <MicOff size={16}/> : <Mic size={16}/>}
                         </button>
                         <button onClick={toggleVideo} className={`p-2 rounded-lg ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                             {isVideoOff ? <VideoOff size={16}/> : <Video size={16}/>}
                         </button>
                     </div>

                     <div className="absolute top-4 left-4 bg-green-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-2 border border-white/20">
                         <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> YOU
                     </div>
                     {timer > 120 && (
                         <div className="absolute inset-x-0 bottom-20 text-center">
                             <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold animate-bounce shadow-lg">⚠️ 2:00 Limit</span>
                         </div>
                     )}
                </div>
            </div>

            {/* Captions & Controls - UPDATED: No Scrollbar, Clean text */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-center gap-6">
                 <div className="flex-1 w-full bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5 h-24 flex items-center justify-center text-center overflow-hidden">
                     <p className="text-slate-700 dark:text-slate-300 text-lg font-medium animate-pulse line-clamp-2">
                         "{liveTranscript || lastAiText || "AI is listening..."}"
                     </p>
                 </div>
                 <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => setVoiceMode(!voiceMode)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${voiceMode ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                        title="Voice Interviewer Mode (detects fillers)"
                    >
                        🗣️ Voice
                    </button>
                    {!isListening ? (
                        <button onClick={startListening} disabled={loading || isSpeaking || isDisqualified}
                            className="w-16 h-16 rounded-full bg-blue-600 text-white hover:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all scale-100 hover:scale-105 disabled:opacity-50">
                            <Mic size={28} />
                        </button>
                    ) : (
                        <button onClick={stopListening} 
                            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                            <div className="w-6 h-6 bg-white rounded-sm" />
                        </button>
                    )}
                    <button onClick={() => finishMockInterview(false)} className="px-6 py-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all">End</button>
                 </div>
            </div>
        </div>
    );

    const renderResult = () => (
        <div className="max-w-4xl mx-auto mt-10 space-y-8 pb-10">
            <div className="text-center">
                <div className={`inline-block p-4 rounded-full mb-4 ${isDisqualified ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {isDisqualified ? <ShieldAlert size={60}/> : <Trophy size={40}/>}
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{isDisqualified ? "Disqualified" : "Completed"}</h2>
                <div className={`text-6xl font-black mt-4 ${isDisqualified ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                    {mode === 'aptitude' ? `${Math.round(aptitudeScore)}/${aptitudeQuestions.length}` : `${feedback?.score || 0}/100`}
                </div>
            </div>
            {!isDisqualified && (mode === 'mock' || mode === 'salary') && feedback && (
                <div className="space-y-6">
                    {feedback.voice_analysis && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-900/30">
                            <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2"><Mic size={20}/> Voice Analysis (AI Voice Interviewer)</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-300">Filler Words Detected:</span>
                                    <span className="font-bold text-purple-600">{feedback.voice_analysis.filler_count || 0}</span>
                                </div>
                                {feedback.voice_analysis.fillers && feedback.voice_analysis.fillers.length > 0 && (
                                    <div className="mt-2">
                                        <span className="text-slate-600 dark:text-slate-300">Breakdown: </span>
                                        {feedback.voice_analysis.fillers.map((f, i) => (
                                            <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs mr-1">
                                                "{f.word}" ({f.count}x)
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {feedback.voice_analysis.note && (
                                    <p className="mt-3 text-purple-700 dark:text-purple-300 font-medium">{feedback.voice_analysis.note}</p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                             <h3 className="font-bold text-green-600 mb-4 flex items-center gap-2"><CheckCircle size={20}/> Strengths</h3>
                             <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">{feedback.strengths?.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                             <h3 className="font-bold text-red-500 mb-4 flex items-center gap-2"><AlertCircle size={20}/> Improvements</h3>
                             <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">{feedback.improvements?.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                        </div>
                    </div>
                </div>
            )}
             {mode === 'aptitude' && !isDisqualified && (
               <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10">
                   <h3 className="text-lg font-bold mb-6">Review Answers</h3>
                   <div className="space-y-4">
                        {aptitudeQuestions.map((q, i) => (
                            <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <p className="font-bold text-slate-800 dark:text-white mb-2">{i+1}. {q.question}</p>
                                <div className="flex justify-between text-sm">
                                    <span className={`${userAnswers[q.id] === q.correct_answer ? 'text-green-600' : 'text-red-500'}`}>You: {userAnswers[q.id]}</span>
                                    <span className="font-bold text-slate-600 dark:text-slate-400">Correct: {q.correct_answer}</span>
                                </div>
                            </div>
                        ))}
                   </div>
               </div>
            )}
            <div className="flex justify-center">
                <button onClick={() => { setStep('intro'); setMessages([]); setAptitudeQuestions([]); setFeedback(null); setTabSwitchCount(0); setIsDisqualified(false); }} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold">Return to Dashboard</button>
            </div>
        </div>
    );
    
    const renderSetup = () => (
        <div className="max-w-md mx-auto mt-20 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl text-center relative">
            <button onClick={() => setStep('intro')} className="absolute top-4 left-4 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"><ArrowLeft size={20}/></button>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${mode === 'mock' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{mode === 'mock' ? <Mic size={40}/> : <Brain size={40}/>}</div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Select Role</h2>
            <div className="space-y-4 text-left mt-6">
                <select value={jobRole} onChange={e => setJobRole(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-4 outline-none font-medium text-slate-800 dark:text-white">
                    <option>Software Engineer</option><option>Data Scientist</option><option>Product Manager</option><option>Full Stack Developer</option><option>DevOps Engineer</option><option>Cloud Engineer</option><option>Business Analyst</option><option>Cyber Security</option><option>AI Engineer</option>
                </select>
            </div>
            <button onClick={startSession} disabled={loading} className={`w-full mt-8 py-4 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${mode === 'mock' ? 'bg-purple-600' : 'bg-blue-600'}`}>{loading ? 'Initializing Agent...' : 'Begin Session'} <ArrowRight size={20}/></button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto min-h-[calc(100vh-100px)] p-4 relative font-sans select-none" onContextMenu={(e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    {step === 'intro' && renderIntro()}
                    {step === 'setup' && renderSetup()}
                    {step === 'mock' && renderMock()}
                    {step === 'result' && renderResult()}
                     {step === 'aptitude' && (
                         <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative">
                             {renderWarningModal()}
                             <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-white/5 pb-4">
                                 <div><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Brain size={24} className="text-blue-500"/> Aptitude: {jobRole}</h2><p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Question {currentQuestionIndex + 1} of {aptitudeQuestions.length}</p></div>
                                 <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-mono font-bold text-xl shadow-inner ${aptitudeTimer < 30 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-black/30 text-slate-700 dark:text-slate-300'}`}><Clock size={20}/> {formatTime(aptitudeTimer)}</div>
                             </div>
                             <div className="mb-8 min-h-[300px]">
                                 <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-8 leading-relaxed">{aptitudeQuestions[currentQuestionIndex]?.question}</h3>
                                 <div className="grid gap-4">{aptitudeQuestions[currentQuestionIndex]?.options.map((opt, idx) => (
                                         <button key={idx} onClick={() => setUserAnswers({...userAnswers, [aptitudeQuestions[currentQuestionIndex].id]: opt})} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group hover:shadow-md ${userAnswers[aptitudeQuestions[currentQuestionIndex].id] === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30'}`}><span className="font-medium text-slate-700 dark:text-slate-300 text-lg">{opt}</span>{userAnswers[aptitudeQuestions[currentQuestionIndex].id] === opt && <CheckCircle size={24} className="text-blue-500"/>}</button>
                                     ))}</div>
                             </div>
                             <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                 <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(p => p - 1)} className="px-6 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 transition-colors font-bold flex items-center gap-2"><ArrowLeft size={16}/> Previous</button>
                                 {currentQuestionIndex < aptitudeQuestions.length - 1 ? <button onClick={() => setCurrentQuestionIndex(p => p + 1)} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:transform hover:-translate-y-1 transition-all flex items-center gap-2 shadow-lg">Next <ArrowRight size={16}/></button> : <button onClick={() => submitAptitude(false)} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:transform hover:-translate-y-1 transition-all shadow-lg shadow-green-500/30 flex items-center gap-2">Submit <CheckCircle size={16}/></button>}
                             </div>
                         </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Interview;
