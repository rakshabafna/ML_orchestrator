"use client";

const experiments = [
  {
    id: "EXP-8042",
    title: "Predict Churn",
    desc: "Training deep sequence model on Q3 telemetry data to identify high-risk accounts.",
    status: "Running",
    statusColor: "bg-[var(--color-surface-container)]",
    statusTextColor: "text-[var(--color-on-surface)]",
    metricLabel: "Epoch 42/100 • Val Loss",
    metricValue: "0.241",
    metricSuffix: "↓",
    metricColor: "text-[var(--color-primary)]",
    timeLabel: "Started",
    timeValue: "2 hrs ago",
    isRunning: true,
    hasGradient: true,
  },
  {
    id: "EXP-8041",
    title: "Recommendation V2",
    desc: "Two-tower retrieval model baseline fine-tuning with updated interaction weights.",
    status: "Completed",
    statusColor: "bg-[var(--color-surface-container-low)]",
    statusTextColor: "text-[var(--color-secondary)]",
    metricLabel: "Primary Metric • Recall@10",
    metricValue: "84.2",
    metricSuffix: "%",
    metricColor: "text-[var(--color-on-surface)]",
    timeLabel: "Duration",
    timeValue: "14h 20m",
  },
  {
    id: "EXP-8039",
    title: "NLP Sentiment Base",
    desc: "OOM Error during backward pass on node cluster gpu-east-04. Batch size configuration issue.",
    status: "Failed",
    statusColor: "bg-[var(--color-error-container)]",
    statusTextColor: "text-[var(--color-on-error-container)]",
    isFailed: true,
    metricLabel: "Exit Code",
    metricValue: "SIGKILL (137)",
    metricColor: "text-[var(--color-on-surface)]",
    timeLabel: "Date",
    timeValue: "Oct 24",
  },
  {
    id: "EXP-8038",
    title: "Fraud Detection Ensem...",
    desc: "Gradient boosting trees with newly engineered transaction velocity features.",
    status: "Completed",
    statusColor: "bg-[var(--color-surface-container-low)]",
    statusTextColor: "text-[var(--color-secondary)]",
    metricLabel: "Primary Metric • F1 Score",
    metricValue: "0.912",
    metricColor: "text-[var(--color-on-surface)]",
    timeLabel: "Duration",
    timeValue: "4h 12m",
  },
  {
    id: "EXP-8043",
    title: "Vision Transformer",
    desc: "Awaiting dataset validation and cluster allocation approval before automated launch.",
    status: "Draft",
    statusColor: "bg-[var(--color-surface-container-highest)]",
    statusTextColor: "text-[var(--color-tertiary)]",
    isDraft: true,
    metricLabel: "Target Metric",
    metricValue: "mAP > 65%",
    metricColor: "text-[var(--color-on-surface-variant)]",
    timeLabel: "Last Edited",
    timeValue: "Just now",
  },
];

export default function ExperimentsPage() {
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
        <button className="bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[13px] tracking-[0.05em] font-medium px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-[var(--color-surface-tint)] hover:shadow-lg transition-all duration-300 w-fit">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Experiment
        </button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-hidden">
        {experiments.map((exp) => (
          <article
            key={exp.id}
            className={`bg-[var(--color-surface-container-lowest)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between min-h-[220px] relative overflow-hidden ${
              exp.isDraft ? "opacity-80" : ""
            } ${exp.isFailed ? "border border-transparent hover:border-[var(--color-error-container)]/50" : ""}`}
          >
            {exp.hasGradient && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-surface-tint)]"></div>
            )}
            <div>
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${exp.statusColor} ${exp.statusTextColor} text-[11px] font-semibold tracking-wide uppercase`}
                >
                  {exp.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>}
                  {exp.status === "Completed" && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)]"></span>}
                  {exp.isFailed && <span className="material-symbols-outlined text-[14px]">warning</span>}
                  {exp.status}
                </span>
                <span className="text-[var(--color-on-surface-variant)] text-[13px] tracking-[0.05em] font-[var(--font-geist)]">
                  {exp.id}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-on-surface)] mb-1" style={{ letterSpacing: "-0.01em" }}>
                {exp.title}
              </h3>
              <p className="text-xs tracking-[0.05em] text-[var(--color-on-surface-variant)] line-clamp-2">{exp.desc}</p>
            </div>
            <div className="mt-4 flex justify-between items-end">
              <div>
                <p className="text-[11px] font-medium text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-1">
                  {exp.isFailed && <span className="text-[var(--color-error)]">{exp.metricLabel}</span>}
                  {!exp.isFailed && exp.metricLabel}
                </p>
                <p className={`text-2xl font-semibold tracking-tight ${exp.metricColor}`} style={{ lineHeight: "32px" }}>
                  {exp.metricValue}
                  {exp.metricSuffix && (
                    <span className="text-base text-[var(--color-on-surface-variant)] font-normal ml-1">{exp.metricSuffix}</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium text-[var(--color-on-surface-variant)]">{exp.timeLabel}</p>
                <p className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface)] font-medium">{exp.timeValue}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ── Load More ── */}
      <div className="mt-2 flex justify-center shrink-0 hidden sm:flex">
        <button className="text-[var(--color-primary)] font-medium text-[13px] tracking-[0.05em] px-4 py-1.5 rounded-full hover:bg-[var(--color-primary-container)]/30 transition-colors flex items-center gap-1">
          Load More Experiments <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
        </button>
      </div>
    </div>
  );
}
