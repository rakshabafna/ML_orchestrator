"use client";

const pipelineStages = [
  {
    icon: "cloud_download",
    stage: "STAGE 1",
    title: "Data Ingestion",
    desc: "Extracting raw streams from external APIs and databases.",
    lat: "12ms",
    pct: "99.9%",
  },
  {
    icon: "cleaning_services",
    stage: "STAGE 2",
    title: "Cleaning",
    desc: "Removing anomalies, handling missing values, standardizing.",
    lat: "45ms",
    pct: "100%",
  },
  {
    icon: "model_training",
    stage: "STAGE 3",
    title: "Feature Eng",
    desc: "Transforming raw data into predictive model inputs.",
    active: true,
    progress: 66,
    lat: "Est: 2m",
    pct: "Processing...",
  },
  {
    icon: "psychology",
    stage: "STAGE 4",
    title: "Training",
    desc: "Fitting models against engineered feature sets.",
    pending: true,
    lat: "Pending",
    pct: "--",
  },
  {
    icon: "rocket_launch",
    stage: "STAGE 5",
    title: "Deployment",
    desc: "Pushing validated models to production endpoints.",
    pending: true,
    lat: "Pending",
    pct: "--",
  },
];

export default function InfrastructurePage() {
  return (
    <div className="flex flex-col h-full min-h-0 pt-2 md:pt-4">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-3 gap-2 shrink-0">
        <div>
          <h1
            className="text-4xl font-bold text-[var(--color-on-surface)] mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            Pipeline Infrastructure
          </h1>
          <p className="text-base text-[var(--color-on-surface-variant)] max-w-2xl leading-6">
            Real-time telemetry and resource allocation for NeuralFlow orchestrator nodes.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[var(--color-surface-container)] px-4 py-2 rounded-xl">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-primary)]"></span>
          </span>
          <span className="text-[13px] tracking-[0.05em] font-medium text-[var(--color-on-surface)]">
            Cluster Healthy
          </span>
        </div>
      </div>

      {/* ── High-Level Node Stages ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 shrink-0 hidden sm:grid">
        {[
          { icon: "database", title: "Data Ingestion", status: "Idle", color: "var(--color-outline)" },
          { icon: "transform", title: "Feature Eng", status: "Active", color: "var(--color-primary)" },
          { icon: "model_training", title: "Model Training", status: "High Load", color: "var(--color-error)" },
          { icon: "rocket_launch", title: "Deployment", status: "Idle", color: "var(--color-outline)" },
        ].map((stage, idx) => (
          <div key={idx} className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-sm border border-[var(--color-outline-variant)]/10 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-container)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-xl">
                  {stage.icon}
                </span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: stage.color }}>
                {stage.status}
              </span>
            </div>
            <h3 className="text-base font-semibold text-[var(--color-on-surface)]" style={{ letterSpacing: "-0.01em" }}>
              {stage.title}
            </h3>
          </div>
        ))}
      </div>

      {/* ── System Resources ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* ── Node Telemetry Details ── */}
        <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-xl shadow-sm border border-[var(--color-outline-variant)]/10 flex flex-col h-full min-h-0">
          <div className="px-4 py-3 border-b border-[var(--color-outline-variant)]/10 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-semibold text-[var(--color-on-surface)]" style={{ letterSpacing: "-0.01em" }}>
              Active Compute Nodes
            </h2>
            <button className="text-[var(--color-primary)] text-[13px] tracking-[0.05em] font-medium hover:underline">
              View Detail Metrics
            </button>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col justify-center">
            {[
              { label: "CPU Cluster (us-east-4)", value: "78%", width: "78%", color: "bg-[var(--color-tertiary)]" },
              { label: "Memory Allocation", value: "42% (64GB / 128GB)", width: "42%", color: "bg-[var(--color-primary-container)]" },
              { label: "GPU Accelerators (A100)", value: "94%", width: "94%", color: "bg-[var(--color-primary)]" },
            ].map((resource) => (
              <div key={resource.label}>
                <div className="flex justify-between text-[13px] tracking-[0.05em] font-medium mb-2">
                  <span className="text-[var(--color-on-surface-variant)] font-[var(--font-geist)]">{resource.label}</span>
                  <span className="text-[var(--color-on-surface)] font-[var(--font-geist)]">{resource.value}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-container)] rounded-full h-2 overflow-hidden">
                  <div className={`${resource.color} h-2 rounded-full transition-all duration-700`} style={{ width: resource.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-sm border border-[var(--color-outline-variant)]/10 flex flex-col justify-center items-center text-center h-full min-h-0">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-[var(--color-primary)] mb-3">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h4 className="text-xl font-semibold text-[var(--color-on-surface)] mb-2" style={{ letterSpacing: "-0.01em" }}>
            System Healthy
          </h4>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-5 leading-5">
            All orchestrator services are responding optimally.
          </p>
          <div className="bg-[#F9FAFB] dark:bg-[var(--color-surface-container)] rounded-lg p-3 w-full mt-auto">
            <p className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)] font-[var(--font-geist)]">Uptime: 99.998%</p>
            <p className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)] font-[var(--font-geist)] mt-1">Last Deploy: 2h ago</p>
          </div>
        </div>
      </section>
    </div>
  );
}
