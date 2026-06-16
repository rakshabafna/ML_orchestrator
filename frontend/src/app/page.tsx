"use client";

import { useState, useEffect, useRef } from "react";

// Types for dynamic data
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

const PHASES = ["Idle", "Ingestion", "Cleaning", "Feature Eng.", "Training", "Deployment", "Completed"];

export default function HomePage() {
  const [goal, setGoal] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentPhase, setCurrentPhase] = useState("Idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardModel[]>([]);
  const [insights, setInsights] = useState<{label: string, width: string}[]>([]);
  
  // Data Integration States
  const [fileSessionId, setFileSessionId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{columns: string[], rows: any[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

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
          if (data.content === "Completed") {
            setIsExecuting(false);
            fetchLeaderboard(sessionId);
            fetchInsights(sessionId);
          }
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

  const fetchLeaderboard = async (sid: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/leaderboard/${sid}`);
      if (res.ok) {
        const data = await res.json();
        // Format the backend data to match our UI Model interface
        const formatted = data.map((d: any, i: number) => ({
          rank: i + 1,
          name: d.model_name || "Unknown Model",
          trial: `Trial 00${i+1}`,
          score: (d.score || 0).toFixed(3),
          top: i === 0
        }));
        setLeaderboard(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    }
  };

  const fetchInsights = async (sid: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/insights/${sid}`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (e) {
      console.error("Failed to fetch insights", e);
    }
  };

  const handleExecute = async () => {
    if (!goal.trim() || isExecuting) return;
    
    setIsExecuting(true);
    setLogs([{ time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: "INFO", msg: `Initializing execution for goal: "${goal}"` }]);
    setCurrentPhase("Ingestion");
    setLeaderboard([]);
    setInsights([]);
    
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
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString('en-US', { hour12: false }), type: "WARN", msg: "Failed to connect to orchestrator backend." }]);
      setIsExecuting(false);
      setCurrentPhase("Idle");
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

  return (
    <div className="flex flex-col h-full gap-3 md:gap-4 min-h-0">
      {/* ── Hero Input Section ── */}
      <section className="hero-bg rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-ambient relative overflow-hidden flex flex-col items-center justify-center text-center gap-2 md:gap-4 shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-container)] rounded-full mix-blend-multiply blur-3xl opacity-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--color-tertiary-container)] rounded-full mix-blend-multiply blur-3xl opacity-10 -translate-x-1/3 translate-y-1/3"></div>
        <div className="relative z-10 max-w-3xl w-full">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-on-background)] mb-2 font-[var(--font-inter)]" style={{ letterSpacing: "-0.02em" }}>
            Orchestrate Intelligence
          </h1>
          <p className="text-base text-[var(--color-on-surface-variant)] mb-8 leading-6">
            Define your objective. NeuralFlow handles the feature engineering, model selection, and deployment automatically.
          </p>
          <div className="w-full bg-[var(--color-surface-container-low)] rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 glow-focus transition-all duration-300">
            <div className="flex-grow flex items-center px-4 py-3 w-full">
              <span className="material-symbols-outlined text-[var(--color-outline)] mr-3">auto_awesome</span>
              <input
                autoFocus
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-xl font-semibold text-[var(--color-on-background)] placeholder-[var(--color-outline-variant)] h-12"
                placeholder="e.g., Predict customer churn based on the attached dataset..."
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
                className={`ml-2 w-12 h-12 rounded-full flex items-center justify-center transition-colors shrink-0 ${uploadedFileName ? "bg-[var(--color-primary-container)] text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"}`}
                title="Attach Dataset (.csv)"
              >
                {isUploading ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[24px]">attach_file</span>
                )}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button 
                onClick={handleExecute}
                disabled={isExecuting || !goal.trim()}
                className={`${isExecuting ? "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]" : "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-surface-tint)] hover:shadow-lg"} px-6 py-3 rounded-xl text-base font-semibold shadow-md transition-all duration-200 whitespace-nowrap flex items-center gap-2 w-full sm:w-auto justify-center`}
              >
                {isExecuting ? "Executing..." : "Execute Pipeline"}
                <span className="material-symbols-outlined icon-fill">{isExecuting ? "sync" : "play_arrow"}</span>
              </button>
              {isExecuting && (
                <button
                  onClick={handleStop}
                  className="bg-[var(--color-error)] text-[var(--color-on-error)] px-6 py-3 rounded-xl text-base font-semibold shadow-md transition-all duration-200 hover:bg-red-600 whitespace-nowrap flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Emergency Stop
                  <span className="material-symbols-outlined">stop_circle</span>
                </button>
              )}
            </div>
          </div>
          {uploadedFileName && (
            <div className="mt-4 flex items-center gap-2 justify-center">
              <div className="flex items-center gap-2 bg-[var(--color-surface-container)]/80 backdrop-blur-sm border border-[var(--color-outline-variant)]/30 px-4 py-2 rounded-full text-[14px] text-[var(--color-on-surface)] shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">description</span>
                <span className="font-medium truncate max-w-[200px]">{uploadedFileName}</span>
                <div className="w-px h-4 bg-[var(--color-outline-variant)]/50 mx-1"></div>
                <button onClick={() => handlePreviewData("raw")} className="text-[var(--color-primary)] hover:text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium transition-colors">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Pipeline Visualization ── */}
      <section className="flex flex-col gap-2 shrink-0 hidden md:flex">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--color-on-background)]">Active Synthesis</h2>
          <div className="flex items-center gap-2 bg-[var(--color-surface-container)] px-3 py-1.5 rounded-full text-[13px] tracking-[0.05em] text-[var(--color-primary)] font-medium">
            {isExecuting && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
              </span>
            )}
            {currentPhase === "Completed" ? "Completed" : isExecuting ? "Running" : "Idle"}
          </div>
        </div>
        {/* Pipeline Path Visualization */}
        <div className="relative w-full h-24 bg-[var(--color-surface-container-lowest)] rounded-xl shadow-ambient p-4 flex items-center justify-between overflow-hidden">
          <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-[var(--color-outline-variant)]/30 -translate-y-1/2 z-0"></div>
          
          {/* Progress Bar (Dynamic) */}
          <div 
            className="absolute top-1/2 left-12 h-0.5 bg-[var(--color-primary)] -translate-y-1/2 z-0 transition-all duration-1000"
            style={{ width: `${Math.max(0, (PHASES.indexOf(currentPhase) - 1) * 33.3)}%` }}
          ></div>
          
          {/* Nodes */}
          {[
            { icon: "database", label: "Ingestion" },
            { icon: "transform", label: "Cleaning" },
            { icon: "psychology", label: "Training" },
            { icon: "rocket_launch", label: "Deployment" },
          ].map((node, i) => {
            const phaseIndex = PHASES.indexOf(node.label === "Cleaning" ? "Cleaning" : node.label === "Ingestion" ? "Ingestion" : node.label === "Training" ? "Training" : "Deployment");
            const currentPhaseIndex = PHASES.indexOf(currentPhase);
            
            const isCompleted = currentPhaseIndex > phaseIndex || currentPhase === "Completed";
            const isActive = currentPhaseIndex === phaseIndex && currentPhase !== "Completed";
            const isPending = currentPhaseIndex < phaseIndex;

            return (
              <div key={i} className={`relative z-10 flex flex-col items-center gap-2 ${isPending ? "opacity-50" : ""}`}>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                    isCompleted
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : isActive
                      ? "bg-[var(--color-surface-container-high)] border-2 border-[var(--color-primary)] text-[var(--color-primary)] animate-pulse"
                      : "bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] text-[var(--color-outline)]"
                  }`}
                >
                  <span className="material-symbols-outlined">{node.icon}</span>
                </div>
                <span
                  className={`text-[13px] tracking-[0.05em] font-medium ${
                    isActive ? "text-[var(--color-primary)] font-bold" : isPending ? "text-[var(--color-outline)]" : "text-[var(--color-on-surface)]"
                  }`}
                >
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Asymmetric Content Grid: Logs & Insights ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1 min-h-0">
        {/* Live Execution Logs (Terminal) */}
        <div className="lg:col-span-7 bg-[var(--color-inverse-surface)] rounded-xl shadow-ambient overflow-hidden flex flex-col h-full min-h-[200px]">
          <div className="px-4 py-3 border-b border-[var(--color-outline-variant)]/10 flex justify-between items-center bg-[var(--color-on-background)]/5">
            <h3 className="text-[var(--color-inverse-primary)] text-base font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-inverse-primary)]/70">terminal</span>
              Live Execution Logs
            </h3>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-outline-variant)]/30"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-outline-variant)]/30"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-outline-variant)]/30"></div>
            </div>
          </div>
          <div className="p-6 flex-grow overflow-y-auto font-[var(--font-geist)] text-sm text-[var(--color-inverse-on-surface)]/80 leading-relaxed space-y-3">
            {logs.length === 0 && !isExecuting && (
              <div className="text-[var(--color-outline-variant)] text-center mt-10">Awaiting execution command...</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-4 ${log.running ? "animate-pulse" : ""}`}>
                <span className="text-[var(--color-outline)]">{log.time}</span>
                <span
                  className={
                    log.type === "WARN" || log.type === "ERROR"
                      ? "text-[var(--color-error-container)]"
                      : log.type === "RUN" || log.type === "INFO"
                      ? "text-[var(--color-inverse-primary)]"
                      : "text-[var(--color-on-primary)]"
                  }
                >
                  [{log.type}]
                </span>
                <span>
                  {log.msg}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Insights Column */}
        <div className="lg:col-span-5 flex flex-col gap-3 h-full min-h-0">
          {/* Leaderboard Card */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-ambient p-4 shrink-0 hidden sm:block">
            <h3 className="text-lg font-semibold text-[var(--color-on-background)] mb-2">Candidate Models</h3>
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-[13px] text-[var(--color-on-surface-variant)] p-4 text-center border border-dashed border-[var(--color-outline-variant)]/50 rounded-xl">
                  {isExecuting ? "Evaluating candidates..." : "No models evaluated yet."}
                </div>
              ) : (
                leaderboard.map((model) => (
                  <div
                    key={model.rank}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      model.top
                        ? "bg-[var(--color-primary-container)]/10 border border-[var(--color-primary)]/20"
                        : "hover:bg-[var(--color-surface-container)] transition-colors"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center text-[13px] tracking-[0.05em] font-bold ${
                          model.top
                            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                            : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"
                        }`}
                      >
                        {model.rank}
                      </div>
                      <div>
                        <div className={`text-base font-semibold text-[var(--color-on-background)]`}>
                          {model.name}
                        </div>
                        <div className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)]">{model.trial}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${model.top ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"}`}>
                        {model.score}
                      </div>
                      {model.top && <div className="text-[13px] tracking-[0.05em] text-[var(--color-outline)]">Score</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Feature Importance Mini-Chart */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-ambient p-4 flex-1 flex flex-col justify-between min-h-[120px]">
            <h3 className="text-sm font-semibold text-[var(--color-on-background)] mb-2">Key Drivers</h3>
            <div className="space-y-2 w-full mt-auto">
              {insights.length === 0 ? (
                <div className="text-[13px] text-[var(--color-on-surface-variant)] p-2 text-center">
                  Awaiting feature extraction...
                </div>
              ) : (
                insights.map((feature) => (
                  <div key={feature.label} className="flex items-center gap-2">
                    <span className="w-24 text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)] truncate font-[var(--font-geist)]">
                      {feature.label}
                    </span>
                    <div className="flex-grow h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000" style={{ width: feature.width }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Download Actions (Appears on Completion) ── */}
          {currentPhase === "Completed" && sessionId && (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-ambient p-4 shrink-0 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href={`http://localhost:8000/api/v1/download/model/${sessionId}`}
                  download
                  className="flex-1 bg-[var(--color-primary-container)] hover:bg-[var(--color-primary)] text-[var(--color-on-primary-container)] hover:text-[var(--color-on-primary)] px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Trained Model (.joblib)
                </a>
                <a 
                  href={`http://localhost:8000/api/v1/download/dataset/${sessionId}`}
                  download
                  className="flex-1 bg-[var(--color-tertiary-container)] hover:bg-[var(--color-tertiary)] text-[var(--color-on-tertiary-container)] hover:text-[var(--color-on-tertiary)] px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">table_chart</span>
                  Cleaned Data (.csv)
                </a>
              </div>
              <button 
                onClick={() => handlePreviewData("clean")}
                className="w-full bg-[var(--color-surface-container-high)] hover:bg-[var(--color-outline-variant)] text-[var(--color-on-surface)] px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Preview Cleaned Dataset
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ── Data Preview Modal ── */}
      {showDataPreview && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-container-low)]">
              <h3 className="text-lg font-semibold text-[var(--color-on-background)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">table_chart</span>
                Dataset Preview (Top 10 Rows)
              </h3>
              <button onClick={() => setShowDataPreview(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-[var(--color-surface)]">
              <table className="w-full text-sm text-left font-[var(--font-geist)]">
                <thead className="text-[12px] uppercase text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] sticky top-0 shadow-sm z-10">
                  <tr>
                    {previewData.columns.map((col, idx) => (
                      <th key={idx} className="px-4 py-3 font-semibold tracking-wider whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)]/20">
                  {previewData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors">
                      {previewData.columns.map((col, cIdx) => (
                        <td key={cIdx} className="px-4 py-3 text-[var(--color-on-surface)] truncate max-w-[200px]" title={String(row[col])}>
                          {row[col] !== null ? String(row[col]) : <span className="text-[var(--color-outline-variant)] italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
