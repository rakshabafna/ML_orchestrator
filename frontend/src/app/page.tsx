"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from "shaders/react";

interface LogEntry {
  time: string;
  type: string;
  msg: string;
  running?: boolean;
}

interface LeaderboardModel {
  rank: number;
  name: string;
  trial: string;
  score: string;
  top?: boolean;
}

const PHASES = ["Idle", "Ingestion", "Cleaning", "Feature Eng.", "Training", "Tuning", "Evaluation", "Deployment", "Completed"];

export default function HomePage() {
  const [goal, setGoal] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("Idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Data Integration States
  const [fileSessionId, setFileSessionId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{columns: string[], rows: any[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("neuralflow_sessionId");
    const savedPhase = localStorage.getItem("neuralflow_currentPhase");
    if (savedSession) setSessionId(savedSession);
    if (savedPhase) setCurrentPhase(savedPhase);
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (sessionId) localStorage.setItem("neuralflow_sessionId", sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (currentPhase) localStorage.setItem("neuralflow_currentPhase", currentPhase);
  }, [currentPhase]);

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // WebSocket connection for real-time telemetry
  useEffect(() => {
    if (!sessionId) return;
    
    const ws = new WebSocket(`ws://localhost:8000/api/v1/stream/${sessionId}`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "phase") {
          setCurrentPhase(data.content);
          if (data.content === "Completed" || data.content === "Failed") {
            setIsExecuting(false);
          }
        } else if (data.type === "node_event") {
            setLogs(prev => [...prev, {
              time: new Date(data.timestamp).toLocaleTimeString('en-US', { hour12: false }),
              type: data.status,
              msg: `[${data.node}] ${data.message}`
            }]);
        } else if (data.type === "token") {
          setLogs(prev => [...prev, {
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            type: "RUN",
            msg: data.content
          }]);
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  // React Query for Leaderboard
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await fetch(`http://localhost:8000/api/v1/leaderboard/${sessionId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((d: any, i: number) => ({
        rank: i + 1,
        name: d.model_name || "Unknown Model",
        trial: `Trial 00${i+1}`,
        score: (d.score || 0).toFixed(4),
        rawScore: d.score || 0,
        top: i === 0
      }));
    },
    enabled: currentPhase === "Completed" && !!sessionId,
  });

  // React Query for Insights
  const { data: insights = [] } = useQuery({
    queryKey: ['insights', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const res = await fetch(`http://localhost:8000/api/v1/insights/${sessionId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((d: any) => ({
        name: d.label,
        value: parseFloat(d.width.replace('%', ''))
      }));
    },
    enabled: currentPhase === "Completed" && !!sessionId,
  });

  // React Query for Recommendation
  const { data: recommendation } = useQuery({
    queryKey: ['recommendation', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await fetch(`http://localhost:8000/api/v1/recommendation/${sessionId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.markdown;
    },
    enabled: currentPhase === "Completed" && !!sessionId,
  });

  const handleExecute = async () => {
    if (!goal.trim() || isExecuting) return;
    
    setIsExecuting(true);
    setLogs([{ time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: "INFO", msg: `Initializing execution for goal: "${goal}"` }]);
    setCurrentPhase("Ingestion");
    
    try {
      const res = await fetch("http://localhost:8000/api/v1/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: goal, 
          target_metric: "accuracy",
          session_id: fileSessionId || undefined
        })
      });
      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }
    } catch (error) {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: "FAILED", msg: "Failed to connect to orchestrator backend." }]);
      setIsExecuting(false);
      setCurrentPhase("Failed");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const newSessionId = crypto.randomUUID();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/upload/${newSessionId}`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setFileSessionId(newSessionId);
        setUploadedFileName(file.name);
      } else {
        alert("Failed to upload dataset");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading dataset");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewData = async (stage: "raw" | "clean") => {
    const sid = sessionId || fileSessionId;
    if (!sid) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/dataset/preview/${sid}?stage=${stage}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setShowDataPreview(true);
      } else {
        alert(`Failed to fetch ${stage} data preview. Data might not be ready yet.`);
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching data preview");
    }
  };

  const handleStop = async () => {
    if (!sessionId || !isExecuting) return;
    try {
      await fetch(`http://localhost:8000/api/v1/stop/${sessionId}`, { method: "POST" });
      setIsExecuting(false);
      setCurrentPhase("Failed");
    } catch (e) {
      console.error("Failed to stop execution", e);
    }
  };

  // Determine the overall state of the page
  const isIdle = !isExecuting && !sessionId;
  const isCompleted = currentPhase === "Completed";

  return (
    <div className="flex flex-col h-full gap-4 md:gap-6 min-h-0 relative">
      <AnimatePresence mode="wait">
        {isIdle ? (
          <motion.section 
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full flex flex-col items-center justify-center text-center gap-4 md:gap-8 relative overflow-hidden px-4"
          >
            <div className="relative z-30 max-w-4xl w-full flex flex-col items-center px-4 sm:px-8 -translate-y-6 md:-translate-y-10">
              <h1 className="font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--color-on-background)] mb-5 text-[clamp(2.5rem,5vw,4.2rem)] max-w-3xl">
                Orchestrate Intelligence <br className="hidden sm:block" />
                <span className="text-[var(--color-primary)]">for maximum impact.</span>
              </h1>
              
              <p className="text-[15px] sm:text-[17px] leading-[1.6] text-[var(--color-on-surface-variant)] mb-10 max-w-2xl font-medium tracking-tight">
                Define your objective. NeuralFlow autonomously handles feature engineering, model selection, tuning, and deployment so you can dominate your domain.
              </p>
              
              <div className="w-full glass-panel rounded-full p-2 flex flex-col md:flex-row items-center gap-2 glow-focus transition-all duration-300 shadow-[0_8px_32px_rgba(212,175,55,0.1)] mt-2">
                <div className="flex-grow flex items-center px-4 py-1 w-full">
                  <span className="material-symbols-outlined text-[var(--color-primary)] mr-3 text-2xl opacity-80">search</span>
                  <input
                    autoFocus
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] sm:text-[17px] font-medium text-[var(--color-on-background)] placeholder-[var(--color-outline)]/80 h-12"
                    placeholder="Predict customer churn based on the attached dataset..."
                    type="text"
                  />
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isExecuting}
                    className={`ml-2 w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm ${uploadedFileName ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-fixed-dim)] text-[var(--color-on-primary)]" : "bg-[var(--color-surface)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] border border-[var(--color-outline-variant)]/40 hover:border-[var(--color-primary)]"}`}
                    title="Attach Dataset (.csv)"
                  >
                    {isUploading ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">attach_file</span>
                    )}
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto px-2 md:px-0 pb-2 md:pb-0">
                  <button 
                    onClick={handleExecute}
                    disabled={isExecuting || !goal.trim()}
                    className={`group overflow-hidden relative ${isExecuting ? "bg-[var(--color-surface-container-highest)] text-[var(--color-outline)]" : "bg-[var(--color-on-background)] text-white hover:bg-[var(--color-inverse-surface)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"} px-6 rounded-full text-[13px] font-medium transition-all duration-500 flex items-center gap-2 w-full sm:w-auto justify-center h-12`}
                  >
                    <div className="relative h-[20px] overflow-hidden flex items-center">
                      <div className={`flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isExecuting ? '' : 'group-hover:-translate-y-1/2'}`}>
                        <span className="h-[20px] flex items-center whitespace-nowrap">{isExecuting ? "Synthesizing..." : "Start synthesis"}</span>
                        <span className="h-[20px] flex items-center whitespace-nowrap">{isExecuting ? "Synthesizing..." : "Start synthesis"}</span>
                      </div>
                    </div>
                    
                    {!isExecuting && (
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center ml-1">
                        <span className="material-symbols-outlined text-[var(--color-on-background)] text-[16px] transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">arrow_forward</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
              
              {uploadedFileName && (
                <div className="mt-6 flex items-center gap-2 justify-center">
                  <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-[var(--color-outline-variant)]/50 px-4 py-1.5 rounded-full text-[13px] font-medium text-[var(--color-on-surface)] shadow-sm">
                    <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)]">description</span>
                    <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                    <div className="w-px h-3 bg-[var(--color-outline-variant)] mx-1"></div>
                    <button 
                      onClick={() => handlePreviewData("raw")} 
                      className="text-[var(--color-on-background)] hover:text-[var(--color-primary)] flex items-center gap-1 font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Preview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 100, damping: 20 }}
            className="flex flex-col gap-6 flex-1 min-h-0 max-w-[1440px] mx-auto w-full px-4 md:px-8 py-2 md:py-6 overflow-y-auto custom-scrollbar"
          >
             {/* Header */}
             <div className="flex items-center justify-between bg-white/40 backdrop-blur-xl border border-[var(--color-outline-variant)]/30 rounded-[24px] p-5 px-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] shrink-0">
               <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-fixed-dim)] flex items-center justify-center text-[var(--color-on-primary)] shadow-[0_4px_16px_rgba(212,175,55,0.4)]">
                    <span className="material-symbols-outlined text-[28px] animate-pulse">model_training</span>
                 </div>
                 <div>
                   <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--color-outline)] font-bold mb-1">Active Objective</h2>
                   <p className="text-[18px] font-semibold text-[var(--color-on-background)] leading-tight">{goal || "Predict customer churn based on the attached dataset"}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                 {isExecuting && (
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: "var(--color-error)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStop}
                    className="bg-[var(--color-error)]/90 backdrop-blur text-white px-6 h-12 rounded-full text-[14px] font-bold shadow-[0_4px_12px_rgba(186,26,26,0.3)] transition-all duration-300 flex items-center gap-2"
                  >
                    Stop Execution
                    <span className="material-symbols-outlined icon-fill text-[20px]">stop_circle</span>
                  </motion.button>
                 )}
               </div>
             </div>

             {/* TOP SPLIT: Pipeline and Terminal */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[420px] shrink-0">
               {/* Vertical Pipeline Tracker */}
               <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 h-full bg-white/30 backdrop-blur-xl border border-[var(--color-outline-variant)]/40 rounded-[32px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between px-1 mb-2 z-10">
                    <h2 className="text-[16px] font-bold text-[var(--color-on-background)] tracking-tight">Synthesis Pipeline</h2>
                    <div className="flex items-center gap-2 bg-white/60 shadow-sm border border-[var(--color-outline-variant)]/30 px-3 py-1.5 rounded-full text-[11px] tracking-[0.08em] text-[var(--color-primary)] font-extrabold uppercase">
                      {isExecuting && (
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
                        </span>
                      )}
                      {currentPhase === "Completed" ? "Completed" : currentPhase === "Failed" ? "Failed" : isExecuting ? "Running" : "Idle"}
                    </div>
                  </div>

                  <div className="relative flex-1 flex flex-col items-start py-4 pl-4 pr-2 overflow-y-auto custom-scrollbar z-10">
                    {/* Glowing Vertical Line Background */}
                    <div className="absolute left-[38px] top-8 bottom-8 w-[2px] bg-[var(--color-outline-variant)]/20 -translate-x-1/2 z-0 rounded-full"></div>
                    
                    {/* Glowing Vertical Line Progress */}
                    <motion.div 
                      className="absolute left-[38px] top-8 w-[3px] bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-fixed-dim)] -translate-x-1/2 z-0 rounded-full shadow-[0_0_12px_rgba(212,175,55,0.6)] origin-top"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(0, (PHASES.indexOf(currentPhase) - 1) * (100 / 6))}%` }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />

                    {/* Nodes */}
                    <div className="flex flex-col justify-between h-full w-full relative z-10 gap-8">
                      {[
                        { icon: "database", label: "Ingestion", desc: "Loading & parsing" },
                        { icon: "transform", label: "Cleaning", desc: "Imputing & filtering" },
                        { icon: "analytics", label: "Feature Eng.", desc: "Creating new signals" },
                        { icon: "psychology", label: "Training", desc: "Fitting candidate models" },
                        { icon: "tune", label: "Tuning", desc: "Optimizing hyperparameters" },
                        { icon: "insights", label: "Evaluation", desc: "Calculating metrics" },
                        { icon: "rocket_launch", label: "Deployment", desc: "Exporting final pipeline" },
                      ].map((node, i) => {
                        const phaseIndex = PHASES.indexOf(node.label);
                        const currentPhaseIndex = PHASES.indexOf(currentPhase);
                        const isCompleted = currentPhaseIndex > phaseIndex || currentPhase === "Completed";
                        const isActive = currentPhaseIndex === phaseIndex && currentPhase !== "Completed" && currentPhase !== "Failed";
                        const isPending = currentPhaseIndex < phaseIndex;
                        const isFailed = currentPhase === "Failed" && currentPhaseIndex === phaseIndex;

                        return (
                          <div key={i} className={`flex items-center gap-5 ${isPending ? "opacity-40 grayscale" : "opacity-100"} transition-all duration-500`}>
                            <motion.div
                              animate={isActive ? { scale: [1, 1.15, 1], boxShadow: ["0 0 0 0 rgba(212,175,55,0)", "0 0 0 12px rgba(212,175,55,0.15)", "0 0 0 0 rgba(212,175,55,0)"] } : {}}
                              transition={{ repeat: isActive ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                              className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 ${
                                isFailed
                                  ? "bg-[var(--color-error)] text-white shadow-[0_4px_16px_rgba(186,26,26,0.4)]"
                                  : isCompleted
                                  ? "bg-gradient-to-br from-[var(--color-primary)] to-[#eed282] text-white shadow-[0_4px_20px_rgba(212,175,55,0.5)] border border-white/20"
                                  : isActive
                                  ? "bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)] shadow-[0_4px_24px_rgba(212,175,55,0.3)]"
                                  : "bg-white/80 backdrop-blur border border-[var(--color-outline-variant)] text-[var(--color-outline)]"
                              }`}
                            >
                              <span className="material-symbols-outlined icon-fill text-[24px]">{isFailed ? "error" : node.icon}</span>
                            </motion.div>
                            <div className="flex flex-col pt-1">
                              <span
                                className={`text-[15px] tracking-wide transition-colors duration-300 ${
                                  isActive ? "text-[var(--color-primary)] font-extrabold" : isFailed ? "text-[var(--color-error)] font-bold" : isPending ? "text-[var(--color-outline)] font-medium" : "text-[var(--color-on-background)] font-bold"
                                }`}
                              >
                                {node.label}
                              </span>
                              <span className="text-[12px] text-[var(--color-outline)] font-medium mt-0.5">{node.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
               </div>

               {/* Telemetry Terminal */}
               <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full min-h-0">
                  <motion.div 
                    className="glass-terminal rounded-[32px] shadow-[0_16px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col h-full min-h-[420px] w-full border border-white/10 relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c23]/90 to-[#0d0e12]/90 -z-10"></div>
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md shrink-0">
                      <h3 className="text-[var(--color-inverse-on-surface)] text-[14px] font-bold flex items-center gap-3 tracking-widest uppercase">
                        <span className="material-symbols-outlined text-[var(--color-primary)] text-[18px]">terminal</span>
                        Neural Core Telemetry
                      </h3>
                      <div className="flex gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_#27c93f]"></div>
                      </div>
                    </div>
                    <div className="p-6 flex-grow overflow-y-auto font-mono text-[14px] text-white/80 leading-relaxed space-y-2.5 custom-scrollbar relative">
                      {logs.length === 0 && !isExecuting && (
                        <div className="text-white/20 text-center mt-24 flex flex-col items-center gap-4">
                          <span className="material-symbols-outlined text-5xl opacity-50">memory</span>
                          <span className="tracking-widest uppercase text-xs font-bold">Awaiting neural sequence initiation...</span>
                        </div>
                      )}
                      <AnimatePresence initial={false}>
                        {logs.map((log, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10, y: 5 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            key={i} 
                            className="flex gap-4 hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                          >
                            <span className="text-white/30 shrink-0 select-none text-[12px] mt-0.5">[{log.time}]</span>
                            <span
                              className={`shrink-0 font-bold text-[12px] mt-0.5 ${
                                log.type === "FAILED" || log.type === "ERROR"
                                  ? "text-[#ff5f56]"
                                  : log.type === "RUNNING" || log.type === "STARTED" || log.type === "INFO"
                                  ? "text-[#4dabf7]"
                                  : "text-[#27c93f]"
                              }`}
                            >
                              {log.type.padEnd(8)}
                            </span>
                            <span className="break-words text-white/90">
                              {log.msg}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={logsEndRef} />
                    </div>
                  </motion.div>
               </div>
             </div>

             {/* BOTTOM SPLIT: Completed Insights (Horizontal) */}
             <AnimatePresence>
               {isCompleted && (
                 <motion.div 
                   initial={{ opacity: 0, y: 40, scale: 0.98 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   transition={{ duration: 0.8, delay: 0.2, type: "spring", damping: 25 }}
                   className="flex flex-col gap-6 mt-4 pb-12 shrink-0"
                 >
                    {/* Hero-Level Architect Recommendation */}
                    {recommendation && (
                      <div className="bg-white/50 backdrop-blur-2xl rounded-[32px] shadow-[0_16px_40px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-tertiary)]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"></div>
                        <h3 className="text-[20px] font-bold text-[var(--color-on-background)] mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-fixed-dim)] flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-white icon-fill text-[20px]">psychology</span>
                          </div>
                          Architect Synthesis & Recommendation
                        </h3>
                        <div className="prose prose-base max-w-none text-[var(--color-on-surface-variant)] leading-[1.8] font-medium">
                          <ReactMarkdown>{recommendation}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Data Grids Side-by-Side */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 shrink-0">
                      {/* Leaderboard */}
                      <div className="bg-white/50 backdrop-blur-xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-8 border border-white min-h-[380px] flex flex-col relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-secondary)]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
                        <h3 className="text-[17px] font-bold text-[var(--color-on-background)] mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-secondary-container)] flex items-center justify-center text-[var(--color-secondary)]">
                            <span className="material-symbols-outlined text-[20px]">emoji_events</span>
                          </div>
                          Candidate Models Leaderboard
                        </h3>
                        <div className="flex-grow z-10">
                          {leaderboard.length === 0 ? (
                            <div className="text-[14px] text-[var(--color-outline)] font-medium h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-outline-variant)]/50 rounded-2xl gap-3">
                              <span className="material-symbols-outlined text-4xl opacity-50">query_stats</span>
                              Evaluating candidates...
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={leaderboard.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                                <XAxis type="number" domain={[0, 1]} tick={{ fill: 'var(--color-outline)', fontWeight: 600, fontSize: 12 }} axisLine={{ stroke: 'var(--color-outline-variant)' }} tickLine={false} />
                                <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'var(--color-on-surface)', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} contentStyle={{ backgroundColor: 'var(--color-inverse-surface)', border: 'none', borderRadius: '16px', color: 'var(--color-inverse-on-surface)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontWeight: 600 }} itemStyle={{ color: 'var(--color-primary)' }} />
                                <Bar dataKey="rawScore" radius={[0, 6, 6, 0]} barSize={24}>
                                  {
                                    leaderboard.slice(0, 5).map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-primary)' : 'var(--color-secondary-container)'} />
                                    ))
                                  }
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Feature Importance */}
                      <div className="bg-white/50 backdrop-blur-xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-8 border border-white min-h-[380px] flex flex-col relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[var(--color-tertiary)]/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
                        <h3 className="text-[17px] font-bold text-[var(--color-on-background)] mb-6 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#e3f2fd] flex items-center justify-center text-[var(--color-tertiary)]">
                            <span className="material-symbols-outlined text-[20px]">waterfall_chart</span>
                          </div>
                          Key Drivers (SHAP Values)
                        </h3>
                        <div className="flex-grow z-10 w-full mt-auto">
                          {insights.length === 0 ? (
                            <div className="text-[14px] text-[var(--color-outline)] font-medium h-full w-full flex items-center justify-center">
                              Awaiting feature extraction...
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={insights} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--color-on-surface)', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} contentStyle={{ backgroundColor: 'var(--color-inverse-surface)', border: 'none', borderRadius: '16px', color: 'var(--color-inverse-on-surface)', fontWeight: 600 }} itemStyle={{ color: 'var(--color-tertiary)' }} />
                                <Bar dataKey="value" fill="var(--color-tertiary)" radius={[0, 6, 6, 0]} barSize={18} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Download Actions Horizontal Bar */}
                    {sessionId && (
                      <div className="bg-gradient-to-r from-[var(--color-surface-container)]/80 to-[var(--color-surface-container-low)]/90 backdrop-blur-xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-6 border border-white shrink-0 flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 pl-4">
                           <div className="w-12 h-12 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-on-primary-fixed)]">
                              <span className="material-symbols-outlined text-[24px]">verified</span>
                           </div>
                           <div>
                             <h4 className="text-[15px] font-bold text-[var(--color-on-background)]">Synthesis Complete</h4>
                             <p className="text-[13px] text-[var(--color-outline)] font-medium">Export the final models and dataset.</p>
                           </div>
                        </div>
                        <div className="flex gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePreviewData("clean")}
                            className="bg-white hover:bg-gray-50 border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] px-6 py-3.5 rounded-full text-[14px] font-bold transition-colors shadow-sm flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">visibility</span>
                            Preview Dataset
                          </motion.button>
                          <motion.a 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href={`http://localhost:8000/api/v1/download/dataset/${sessionId}`}
                            download
                            className="bg-white hover:bg-gray-50 border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] px-6 py-3.5 rounded-full text-[14px] font-bold transition-colors shadow-sm flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">table_chart</span>
                            Download Data
                          </motion.a>
                          <motion.a 
                            whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
                            whileTap={{ scale: 0.95 }}
                            href={`http://localhost:8000/api/v1/download/model/${sessionId}`}
                            download
                            className="bg-black text-white hover:bg-gray-900 px-8 py-3.5 rounded-full text-[14px] font-bold transition-all shadow-md flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Download Model
                          </motion.a>
                        </div>
                      </div>
                    )}
                 </motion.div>
               )}
             </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Data Preview Modal ── */}
      <AnimatePresence>
        {showDataPreview && previewData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[var(--color-on-background)]/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white border border-[var(--color-outline-variant)]/30 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-dim)]">
                <h3 className="text-[17px] font-bold text-[var(--color-on-background)] flex items-center gap-2 tracking-tight">
                  <span className="material-symbols-outlined text-[var(--color-primary)] icon-fill">table_chart</span>
                  Dataset Preview <span className="text-[var(--color-outline)] font-medium text-[13px] ml-2">(Top 10 Rows)</span>
                </h3>
                <button onClick={() => setShowDataPreview(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] p-2 rounded-full hover:bg-[var(--color-surface-container)] transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-white">
                <table className="w-full text-sm text-left font-[var(--font-geist)]">
                  <thead className="text-[11px] uppercase text-[var(--color-outline)] font-bold bg-[var(--color-surface-container-low)] sticky top-0 shadow-sm z-10">
                    <tr>
                      {previewData.columns.map((col, idx) => (
                        <th key={idx} className="px-5 py-3 tracking-wider whitespace-nowrap border-b border-[var(--color-outline-variant)]/20">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline-variant)]/10">
                    {previewData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[var(--color-primary)]/5 transition-colors group">
                        {previewData.columns.map((col, cIdx) => (
                          <td key={cIdx} className="px-5 py-3 text-[13px] text-[var(--color-on-surface)] font-medium truncate max-w-[200px] group-hover:text-[var(--color-on-background)]" title={String(row[col])}>
                            {row[col] !== null ? String(row[col]) : <span className="text-[var(--color-outline)] italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
