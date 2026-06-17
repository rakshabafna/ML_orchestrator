"use client";

import { useState, useEffect } from "react";

interface Experiment {
  id: string;
  name: string;
  objective: string;
  metric: string;
  status: string;
  created_at: string;
}

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/v1/experiments")
      .then(res => res.json())
      .then(data => {
        setExperiments(data);
        setLoading(false);
      })
      .catch(e => {
        console.error("Failed to fetch experiments", e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this experiment?")) return;
    try {
      await fetch(`http://localhost:8000/api/v1/experiments/${id}`, { method: "DELETE" });
      fetchExperiments();
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-3 gap-2 shrink-0">
        <div>
          <h1
            className="text-4xl font-bold text-[var(--color-on-surface)] mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            Experiments
          </h1>
          <p className="text-base text-[var(--color-on-surface-variant)] max-w-2xl leading-6">
            Monitor, compare, and manage your machine learning training runs across all compute clusters.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchExperiments} className="bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-[13px] tracking-[0.05em] font-medium px-4 py-2 rounded-full flex items-center gap-2 hover:bg-[var(--color-outline-variant)] transition-all duration-300">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
          <button className="bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[13px] tracking-[0.05em] font-medium px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-[var(--color-surface-tint)] hover:shadow-lg transition-all duration-300">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Experiment
          </button>
        </div>
      </div>

      {/* ── Controls / Filters ── */}
      <div className="flex flex-wrap items-center gap-2 mb-3 shrink-0">
        <div className="flex items-center bg-[var(--color-surface-container-lowest)] rounded-full px-4 py-2 shadow-sm flex-1 min-w-[250px] max-w-md">
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] mr-2">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-[13px] tracking-[0.05em] placeholder-[var(--color-on-surface-variant)]/50 p-0 text-[var(--color-on-surface)] font-[var(--font-geist)]"
            placeholder="Search by ID, Goal, or Tags..."
            type="text"
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] text-[13px] tracking-[0.05em] font-medium px-4 py-2 rounded-full shadow-sm hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-1 border border-[var(--color-outline-variant)]/10">
            Status: All <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
          <button className="bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] text-[13px] tracking-[0.05em] font-medium px-4 py-2 rounded-full shadow-sm hover:bg-[var(--color-surface-container)] transition-colors flex items-center gap-1 border border-[var(--color-outline-variant)]/10">
            Date: Last 30 Days <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
          <button className="bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] p-2 rounded-full shadow-sm hover:bg-[var(--color-surface-container)] transition-colors border border-[var(--color-outline-variant)]/10">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* ── Experiment Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-y-auto pb-6">
        {loading && <div className="text-[var(--color-on-surface-variant)] p-4">Loading experiments...</div>}
        {!loading && experiments.length === 0 && (
          <div className="text-[var(--color-on-surface-variant)] p-4">No experiments found. Run a pipeline from the dashboard!</div>
        )}
        {experiments.map((exp) => {
          const isRunning = exp.status !== "completed" && exp.status !== "failed" && exp.status !== "stopped";
          const isFailed = exp.status === "failed" || exp.status === "stopped";
          const statusColor = isFailed ? "bg-[var(--color-error-container)]" : isRunning ? "bg-[var(--color-surface-container)]" : "bg-[var(--color-surface-container-low)]";
          const statusTextColor = isFailed ? "text-[var(--color-on-error-container)]" : isRunning ? "text-[var(--color-on-surface)]" : "text-[var(--color-secondary)]";
          
          return (
            <article
              key={exp.id}
              className={`bg-[var(--color-surface-container-lowest)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between min-h-[220px] relative overflow-hidden ${
                isFailed ? "border border-transparent hover:border-[var(--color-error-container)]/50" : ""
              }`}
            >
              {isRunning && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-surface-tint)]"></div>
              )}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${statusColor} ${statusTextColor} text-[11px] font-semibold tracking-wide uppercase`}
                  >
                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>}
                    {exp.status === "completed" && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]"></span>}
                    {isFailed && <span className="material-symbols-outlined text-[14px]">warning</span>}
                    {exp.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-on-surface-variant)] text-[13px] tracking-[0.05em] font-[var(--font-geist)]" title={exp.id}>
                      {exp.id.substring(0, 8)}...
                    </span>
                    <button onClick={() => handleDelete(exp.id)} className="text-[var(--color-error)] hover:bg-[var(--color-error-container)] p-1 rounded-full transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-on-surface)] mb-1" style={{ letterSpacing: "-0.01em" }}>
                  {exp.name || exp.objective}
                </h3>
                <p className="text-xs tracking-[0.05em] text-[var(--color-on-surface-variant)] line-clamp-2" title={exp.objective}>
                  {exp.objective}
                </p>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
                    Target Metric
                  </p>
                  <p className={`text-xl font-semibold tracking-tight text-[var(--color-on-surface)]`} style={{ lineHeight: "32px" }}>
                    {exp.metric?.toUpperCase() || "ACCURACY"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium text-[var(--color-on-surface-variant)]">Created</p>
                  <p className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface)] font-medium">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
