"use client";

import { useState } from "react";

export default function HomePage() {
  const [goal, setGoal] = useState("");

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
                placeholder="e.g., Predict customer churn based on Q3 telemetry data..."
                type="text"
              />
            </div>
            <button className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-6 py-3 rounded-xl text-base font-semibold shadow-md hover:bg-[var(--color-surface-tint)] hover:shadow-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2 w-full md:w-auto justify-center">
              Execute Pipeline
              <span className="material-symbols-outlined icon-fill">play_arrow</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pipeline Visualization ── */}
      <section className="flex flex-col gap-2 shrink-0 hidden md:flex">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--color-on-background)]">Active Synthesis</h2>
          <div className="flex items-center gap-2 bg-[var(--color-surface-container)] px-3 py-1.5 rounded-full text-[13px] tracking-[0.05em] text-[var(--color-primary)] font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]"></span>
            </span>
            Running
          </div>
        </div>
        {/* Pipeline Path Visualization */}
        <div className="relative w-full h-24 bg-[var(--color-surface-container-lowest)] rounded-xl shadow-ambient p-4 flex items-center justify-between overflow-hidden">
          <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-[var(--color-outline-variant)]/30 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-12 w-1/2 h-0.5 bg-[var(--color-primary)] -translate-y-1/2 z-0"></div>
          {/* Nodes */}
          {[
            { icon: "database", label: "Ingestion", completed: true },
            { icon: "transform", label: "Feature Eng.", completed: true },
            { icon: "model_training", label: "Training (45%)", active: true },
            { icon: "rocket_launch", label: "Deployment", pending: true },
          ].map((node, i) => (
            <div key={i} className={`relative z-10 flex flex-col items-center gap-2 ${node.pending ? "opacity-50" : ""}`}>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                  node.completed
                    ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                    : node.active
                    ? "bg-[var(--color-surface-container-high)] border-2 border-[var(--color-primary)] text-[var(--color-primary)] animate-pulse"
                    : "bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] text-[var(--color-outline)]"
                }`}
              >
                <span className="material-symbols-outlined">{node.icon}</span>
              </div>
              <span
                className={`text-[13px] tracking-[0.05em] font-medium ${
                  node.active ? "text-[var(--color-primary)] font-bold" : node.pending ? "text-[var(--color-outline)]" : "text-[var(--color-on-surface)]"
                }`}
              >
                {node.label}
              </span>
            </div>
          ))}
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
            {[
              { time: "14:02:11", type: "INFO", msg: "Initialized Hyperparameter search space." },
              { time: "14:02:15", type: "INFO", msg: "Spawning 8 worker nodes for parallel evaluation." },
              { time: "14:02:45", type: "EVAL", msg: "Trial 001 completed. Validation Loss: 0.241" },
              { time: "14:03:10", type: "EVAL", msg: "Trial 002 completed. Validation Loss: 0.228", best: true },
              { time: "14:04:05", type: "WARN", msg: "Trial 003 early stopping triggered. Gradient vanishing detected." },
              { time: "14:05:12", type: "EVAL", msg: "Trial 004 completed. Validation Loss: 0.195", best: true },
              { time: "14:06:...", type: "RUN", msg: "Evaluating Trial 005...", running: true },
            ].map((log, i) => (
              <div key={i} className={`flex gap-4 ${log.running ? "animate-pulse" : ""}`}>
                <span className="text-[var(--color-outline)]">{log.time}</span>
                <span
                  className={
                    log.type === "WARN"
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
                  {log.best && <span className="text-[var(--color-primary-fixed)] ml-2">↑ Best</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Column */}
        <div className="lg:col-span-5 flex flex-col gap-3 h-full min-h-0">
          {/* Leaderboard Card */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-ambient p-4 shrink-0 hidden sm:block">
            <h3 className="text-lg font-semibold text-[var(--color-on-background)] mb-2">Candidate Models</h3>
            <div className="space-y-2">
              {[
                { rank: 1, name: "XGBoost Ensemble", trial: "Trial 004", score: "0.942", top: true },
                { rank: 2, name: "LightGBM", trial: "Trial 002", score: "0.915" },
                { rank: 3, name: "Random Forest", trial: "Trial 001", score: "0.890" },
              ].map((model) => (
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
                      <div className={`text-base font-semibold ${model.top ? "text-[var(--color-on-background)]" : "text-[var(--color-on-background)]"}`}>
                        {model.name}
                      </div>
                      <div className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)]">{model.trial}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${model.top ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"}`}>
                      {model.score}
                    </div>
                    {model.top && <div className="text-[13px] tracking-[0.05em] text-[var(--color-outline)]">F1 Score</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Feature Importance Mini-Chart */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl shadow-ambient p-4 flex-1 flex flex-col justify-between min-h-[120px]">
            <h3 className="text-sm font-semibold text-[var(--color-on-background)] mb-2">Key Drivers</h3>
            <div className="space-y-2 w-full mt-auto">
              {[
                { label: "usage_freq", width: "85%" },
                { label: "account_age", width: "62%" },
                { label: "last_login", width: "45%" },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-2">
                  <span className="w-24 text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)] truncate font-[var(--font-geist)]">
                    {feature.label}
                  </span>
                  <div className="flex-grow h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: feature.width }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
