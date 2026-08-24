import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Send,
  User,
  Bot,
  Paperclip,
  Loader2,
  FileText,
  CheckCircle,
  X,
  Mic,
  Volume2,
  History,
  ArrowUp,
  PenTool,
  Users,
  Lightbulb,
  Video,
  Monitor,
  Calendar,
  Code,
  Play,
  ArrowLeft,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logActivity } from "../utils/logger";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your AI Study Companion. Ask academic questions about your uploaded documents, syllabus, assignments, and exam topics.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardMode, setWhiteboardMode] = useState("whiteboard"); // 'whiteboard' | 'code'
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeContent, setCodeContent] = useState("");
  const [codeOutput, setCodeOutput] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("AUTH_REQUIRED");
    }
    return { Authorization: `Bearer ${token}` };
  };
  const handleAuthFailure = (error, fallbackMessage) => {
    if (error?.message === "AUTH_REQUIRED" || error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Your session expired. Please sign in again.");
      navigate("/login", { replace: true });
      return true;
    }
    if (fallbackMessage) {
      toast.error(fallbackMessage);
    }
    return false;
  };

  // Peer Match State
  const [showPeerModal, setShowPeerModal] = useState(false);
  const [peers, setPeers] = useState([]);
  const [connectingPeer, setConnectingPeer] = useState(null);
  const [activeCall, setActiveCall] = useState(false); // Video Call State

  // Fetch Peers (Real Users - logged-in students from platform)
  const fetchPeers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/peers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = res.data;
      const list =
        raw.success && raw.data ? raw.data : Array.isArray(raw) ? raw : [];
      const realPeers = list.slice(0, 10).map((u) => ({
        id: u._id || u.id,
        name: u.name || "Student",
        uni: u.branch ? `${u.branch} • Year ${u.year || "-"}` : "CampusMind",
        status: "Online",
        topic:
          (u.skills && u.skills[0]) || u.currentStudyTopic || "General Study",
      }));
      setPeers(realPeers);
    } catch (err) {
      // Fallback: try community alumni
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/community/alumni`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const raw = res.data;
        const list =
          raw.success && raw.data ? raw.data : Array.isArray(raw) ? raw : [];
        setPeers(
          list.slice(0, 10).map((u) => ({
            id: u._id || u.id,
            name: u.name || "Student",
            uni: "CampusMind",
            status: "Online",
            topic: (u.skills && u.skills[0]) || u.role || "General Study",
          })),
        );
      } catch (e) {
        console.error("Failed to fetch peers", e);
        setPeers([]);
      }
    }
  };

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  const fetchPeerRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/peers/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setIncomingRequests(res.data.incoming || []);
        setOutgoingRequests(res.data.outgoing || []);
      }
    } catch (e) {
      console.error("Fetch peer requests", e);
    }
  };

  const connectToPeer = async (peer) => {
    setConnectingPeer(peer.id);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/peers/request`,
        {
          toUserId: peer.id,
          topic: peer.topic || "Concept explanation",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.dismiss();
      if (res.data.success) {
        toast.success(
          `Request sent to ${peer.name}! They can accept from their Peer Match.`,
        );
        fetchPeerRequests();
      } else {
        toast.error(res.data.message || "Failed to send request");
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setConnectingPeer(null);
    }
  };

  const acceptPeerRequest = async (req) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/peers/requests/${req._id}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data.success) {
        toast.success("Request accepted! Opening whiteboard & call.");
        setShowPeerModal(false);
        setShowWhiteboard(true);
        setActiveCall(true);
        setIncomingRequests((prev) => prev.filter((r) => r._id !== req._id));
      }
    } catch (e) {
      toast.error("Failed to accept");
    }
  };

  const rejectPeerRequest = async (req) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/peers/requests/${req._id}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setIncomingRequests((prev) => prev.filter((r) => r._id !== req._id));
    } catch (e) {}
  };

  const [showHistory, setShowHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load chat history specifically for study mode so it doesn't leak support chats
  const CHAT_HISTORY_TYPE = "study";

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    logActivity("Opened AI Chat", "User entered the chat interface");
    fetchHistory(1, true);
    fetchChatSessions();
  }, []);

  // Handle Video Call Stream
  useEffect(() => {
    let stream = null;
    if (activeCall) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((s) => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera Error:", err);
          toast.error("Camera access denied");
          setActiveCall(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCall]);

  const fetchHistory = async (pageNum = 1, initial = false) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/chat/history?type=${CHAT_HISTORY_TYPE}&page=${pageNum}`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (res.data.history) {
        if (initial && res.data.history.length > 0) {
          setMessages(res.data.history);
        } else {
          setMessages((prev) => [...res.data.history, ...prev]);
        }
        setHasMore(res.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      if (handleAuthFailure(error)) return;
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
      const res = await axios.get(
        `${API_BASE_URL}/api/chat/sessions?type=${CHAT_HISTORY_TYPE}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (res.data.sessions) setChatSessions(res.data.sessions);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      console.error("Failed to fetch sessions", error);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (page === 1) scrollToBottom();
  }, [messages, isListening, page]);

  const toggleListening = () => {
    if (isListening) {
      window.speechRecognition?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    logActivity("Used Voice Chat", "Started voice input");

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
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
    logActivity("Used Text-to-Speech", "Listened to AI response");
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
    formData.append("file", selectedFile);

    try {
      await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `✅ File "${selectedFile.name}" added to your knowledge base. I can now reference it along with your other documents.`,
        },
      ]);

      logActivity("Uploaded Document", `Uploaded: ${selectedFile.name}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success(`Indexed ${selectedFile.name} for study chat.`);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      console.error("Upload failed", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to upload file. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          message: input,
          type: "study",
          history: messages,
        },
        { headers: getAuthHeaders() },
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.response },
      ]);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --- Advanced Features Logic ---
  const startLectureMode = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript)
        setInput(
          "🎓 ANALYZING LECTURE: " +
            transcript +
            "\n\n(Instruction: Please structure this lecture transcript into Cornell Notes format with Key Points, Detailed Notes, and Summary)",
        );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const findPeer = () => {
    setShowPeerModal(true);
    fetchPeers();
    fetchPeerRequests();
  };

  const startStudyPlan = () => {
    setInput(
      "Create a robust 1-month study plan for my exams based on my uploaded notes.",
    );
  };

  const runCode = () => {
    if (!codeContent.trim()) return;
    try {
      if (codeLanguage === "javascript") {
        const func = new Function(codeContent);
        const result = func();
        setCodeOutput(String(result || "Code executed (no return value)"));
      } else {
        setCodeOutput(
          `Copy this code and run it in your ${codeLanguage} IDE or use replit.com/${codeLanguage}`,
        );
      }
    } catch (err) {
      setCodeOutput(`Error: ${err.message}`);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I am your AI Study Companion. Ask academic questions about your uploaded documents, syllabus, assignments, and exam topics.",
      },
    ]);
    setShowHistory(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#0B1120] overflow-hidden text-white font-sans relative">
      <Toaster position="top-center" />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "flex" : "hidden"} absolute md:relative inset-y-0 left-0 w-[280px] flex-shrink-0 flex-col bg-[#0f172a] border-r border-white/5 h-full z-30 shadow-2xl`}>
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <History size={20} className="text-blue-500" />
            Chat History
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400" title="Close Menu">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <span className="text-xl leading-none font-medium -mt-0.5">+</span> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar">
          {chatSessions.length > 0 ? (
            chatSessions.map((dayGroup, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {dayGroup.date}
                </div>
                {dayGroup.chats?.map((chatSession, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-white/5"
                    onClick={() => {
                      setMessages(chatSession.messages || []);
                      setHasMore(false);
                      setSidebarOpen(false); // Close sidebar automatically on mobile
                    }}
                  >
                     <div className="text-sm font-medium text-slate-200 truncate">
                       {chatSession.messages?.find(m => m.role === 'user')?.content?.slice(0, 30) || "New Conversation"}...
                     </div>
                     <div className="text-xs text-slate-500 mt-1 flex justify-between">
                       <span>{chatSession.messages?.length || 0} msgs</span>
                       <span>{new Date(chatSession.messages?.[0]?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500 text-center py-4">No previous chats</div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/5 space-y-2">
           <button onClick={() => fetchHistory(1, true)} className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors">
              <History size={14} /> Refresh History
           </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full bg-[#111827]">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/5 bg-[#0f172a] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400" title="Go Back">
               <ArrowLeft size={20} />
            </button>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400" title="Menu">
                 <Menu size={20} />
              </button>
            )}
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight flex items-center gap-2">
                CampusMind AI 
              </h2>
              <span className="text-xs text-green-400 flex items-center gap-1 font-medium mt-0.5">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>{" "}
                Always online • 24/7
              </span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="px-3 py-1.5 rounded-full border border-green-500/30 text-green-400 text-xs font-bold flex items-center gap-1 bg-green-500/10">
               <CheckCircle size={14} /> Protected
            </div>
          </div>
        </div>

      {/* Messages Area */}
      <div
        className="flex-1  min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50"
        ref={messagesContainerRef}
      >
        {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMoreMessages}
              disabled={loadingHistory}
              className="text-xs bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full hover:bg-slate-300 dark:hover:bg-white/20 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {loadingHistory ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ArrowUp size={12} />
              )}{" "}
              Load Older Messages
            </button>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={`flex gap-3 w-full ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {msg.role !== "system" && (
              <div className={`w-8 h-8 mt-1 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${msg.role === "user" ? "bg-blue-100" : "bg-blue-600 shadow-lg shadow-blue-500/20"}`}>
                {msg.role === "user" ? (
                  user?.picture ? (
                    <img src={user.picture} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-blue-600" />
                  )
                ) : (
                  <Bot size={18} className="text-white" />
                )}
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-2xl p-4 relative group ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-500/20" : msg.role === "system" ? "bg-white/5 border border-white/10 text-slate-300 w-full max-w-full text-center text-sm rounded-xl" : "bg-white/5 border border-white/5 text-slate-200 rounded-bl-none shadow-md"}`}
            >
              <div className="leading-relaxed text-sm">
                {(() => {
                  const parts = msg.content.split(/```/g);
                  return parts.map((part, index) => {
                    if (index % 2 === 1) {
                      return (
                        <pre
                          key={index}
                          className="bg-slate-900 text-slate-100 p-3 rounded-xl my-2 overflow-x-auto font-mono text-xs border border-white/10"
                        >
                          {part.trim()}
                        </pre>
                      );
                    } else {
                      return (
                        <span key={index} className="whitespace-pre-wrap">
                          {part
                            .split(/\*\*(.*?)\*\*/g)
                            .map((subPart, subIndex) =>
                              subIndex % 2 === 1 ? (
                                <strong
                                  key={subIndex}
                                  className="text-blue-600 dark:text-blue-400 font-semibold"
                                >
                                  {subPart}
                                </strong>
                              ) : (
                                subPart
                              ),
                            )}
                        </span>
                      );
                    }
                  });
                })()}
              </div>
              {msg.role === "assistant" && (
                <div className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                  <button
                    onClick={() => speakText(msg.content, idx)}
                    className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 text-slate-500 hover:text-blue-500 transition-colors ${isSpeaking === idx ? "text-blue-500 animate-pulse" : ""}`}
                    title="Read Aloud"
                  >
                    <Volume2 size={16} />
                  </button>
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
      <div className="sticky bottom-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-[#111827] via-[#111827] to-transparent pt-12 mt-auto">
        {/* Tools Bar */}
        <div className="flex flex-wrap gap-2 mb-4 justify-start max-w-4xl mx-auto">
          <button
            onClick={() => setShowWhiteboard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full hover:bg-blue-500/20 transition-colors whitespace-nowrap"
          >
            <PenTool size={14} /> Whiteboard
          </button>
          <button
            onClick={startLectureMode}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-bold rounded-full hover:bg-green-500/20 transition-colors whitespace-nowrap"
          >
            <Mic size={14} /> Lecture Weaver
          </button>
          <button
            onClick={findPeer}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-bold rounded-full hover:bg-pink-500/20 transition-colors whitespace-nowrap"
          >
            <Users size={14} /> Peer Match
          </button>
          <button
            onClick={startStudyPlan}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-full hover:bg-teal-500/20 transition-colors whitespace-nowrap"
          >
            <Calendar size={14} /> Study Plan
          </button>
          <button
            onClick={() =>
              setInput(
                "Generate a customized project idea for my resume skills.",
              )
            }
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full hover:bg-purple-500/20 transition-colors whitespace-nowrap"
          >
            <Lightbulb size={14} /> Project Genesis
          </button>
        </div>

        {/* PEER MATCH MODAL */}
        <AnimatePresence>
          {showPeerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
              >
                <button
                  onClick={() => setShowPeerModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl font-bold mb-1 pt-2">
                  Global Peer Match
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Connect with logged-in students. Send a request or accept one
                  below.
                </p>

                {incomingRequests.length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900/30">
                    <h4 className="text-xs font-bold text-green-800 dark:text-green-300 uppercase mb-2">
                      Requests to you
                    </h4>
                    {incomingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between gap-2 py-2 border-b border-green-100 dark:border-green-900/20 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-sm font-bold text-green-700 dark:text-green-300">
                            {req.fromUser?.name?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-white">
                            {req.fromUser?.name}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => acceptPeerRequest(req)}
                            className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-lg"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectPeerRequest(req)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm">
                          {peer.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                            {peer.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {peer.uni} •{" "}
                            <span className="text-green-500">
                              {peer.status}
                            </span>
                          </p>
                          <p className="text-xs font-medium text-blue-500 mt-0.5">
                            {peer.topic}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => connectToPeer(peer)}
                        disabled={connectingPeer === peer.id}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {connectingPeer === peer.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Connect"
                        )}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-white w-full h-full max-w-6xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
              >
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWhiteboardMode("whiteboard")}
                        className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${whiteboardMode === "whiteboard" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}
                      >
                        <PenTool size={14} className="inline mr-1" /> Whiteboard
                      </button>
                      <button
                        onClick={() => setWhiteboardMode("code")}
                        className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${whiteboardMode === "code" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}
                      >
                        <Code size={14} className="inline mr-1" /> Code-With-Me
                      </button>
                    </div>
                    {activeCall && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>{" "}
                        Call Active
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveCall(!activeCall)}
                      className={`p-2 rounded-full transition-colors ${activeCall ? "bg-red-100 text-red-600 hover:bg-red-200" : "hover:bg-blue-100 text-blue-600"}`}
                      title={activeCall ? "End Call" : "Start Video Call"}
                    >
                      <Video size={20} />
                    </button>
                    <button
                      className="p-2 hover:bg-purple-100 text-purple-600 rounded-full transition-colors"
                      title="Share Screen"
                    >
                      <Monitor size={20} />
                    </button>
                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                    <button
                      onClick={() => {
                        setShowWhiteboard(false);
                        setActiveCall(false);
                        setCodeOutput("");
                      }}
                      className="p-2 hover:bg-red-100 text-red-500 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="relative flex-1 flex flex-col">
                  {whiteboardMode === "whiteboard" ? (
                    <>
                      <iframe
                        src="https://excalidraw.com"
                        className="w-full h-full border-0"
                        title="Whiteboard"
                        allow="clipboard-read; clipboard-write"
                      ></iframe>
                      {activeCall && (
                        <motion.div
                          drag
                          dragConstraints={{
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                          }}
                          className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-white/20 z-10 cursor-move"
                        >
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white backdrop-blur-sm z-20">
                            You
                          </div>
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                          />
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col p-4 bg-slate-900">
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={codeLanguage}
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          className="px-3 py-1 bg-slate-800 text-white rounded-lg border border-slate-700 text-sm"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                          <option value="java">Java</option>
                        </select>
                        <button
                          onClick={runCode}
                          className="px-4 py-1 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700"
                        >
                          <Play size={14} /> Run
                        </button>
                      </div>
                      <textarea
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        placeholder={`Write ${codeLanguage} code here...`}
                        className="flex-1 w-full p-4 bg-slate-950 text-green-400 font-mono text-sm rounded-lg border border-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                        spellCheck={false}
                      />
                      {codeOutput && (
                        <div className="mt-2 p-3 bg-slate-800 text-white rounded-lg border border-slate-700 font-mono text-sm">
                          <div className="text-xs text-slate-400 mb-1">
                            Output:
                          </div>
                          {codeOutput}
                        </div>
                      )}
                      {activeCall && (
                        <motion.div
                          drag
                          dragConstraints={{
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                          }}
                          className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-xl shadow-2xl overflow-hidden border-2 border-white/20 z-10 cursor-move"
                        >
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full text-[10px] text-white backdrop-blur-sm z-20">
                            You
                          </div>
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover transform scale-x-[-1]"
                          />
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Preview */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/30 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <FileText size={16} />
                <span className="truncate max-w-[200px] font-medium">
                  {selectedFile.name}
                </span>
                <span className="text-xs opacity-70">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isUploading ? (
                  <span className="flex items-center gap-1 text-xs text-blue-600 animate-pulse">
                    <Loader2 size={12} className="animate-spin" /> Uploading...
                  </span>
                ) : (
                  <>
                    <button
                      onClick={uploadFile}
                      className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg text-blue-600 transition-colors"
                      title="Upload Now"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 bg-[#0f172a] p-2 rounded-2xl border border-white/10 focus-within:ring-2 ring-blue-500/50 transition-all relative max-w-4xl mx-auto shadow-2xl shadow-black/50">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
            accept=".pdf,.docx,.txt,.md,.csv,.json"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:text-blue-400 hover:bg-white/5 rounded-xl transition-all"
            title="Attach File"
          >
            <Paperclip size={20} />
          </button>
          <button
            onClick={startLectureMode}
            className={`p-3 rounded-xl transition-all ${isListening && input.startsWith("🎓 ANALYZING LECTURE: ") ? "bg-green-500 text-white animate-pulse shadow-lg shadow-green-500/30" : "text-slate-500 hover:text-green-400 hover:bg-white/5"}`}
            title="Lecture Weaver"
          >
            <Mic size={20} />
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 px-2 min-w-0"
            placeholder={isListening ? "Listening..." : "Ask your CampusMind AI..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-all ${isListening ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30" : "text-slate-500 hover:text-blue-400 hover:bg-white/5"}`}
            title="Voice Input"
          >
            <Mic size={20} />
          </button>
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && !selectedFile) || loading}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all shrink-0"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default Chat;
