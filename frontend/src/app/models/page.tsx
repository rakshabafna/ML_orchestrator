"use client";

export default function ModelsPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] text-[13px] tracking-[0.05em] font-medium px-2 py-1 rounded-md">
              Image Classification
            </span>
            <span className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] text-[13px] tracking-[0.05em] font-medium px-2 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] icon-fill">check_circle</span>
              Deployed
            </span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--color-on-surface)]" style={{ letterSpacing: "-0.02em" }}>
            ResNet-50 v2.4
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1 max-w-2xl leading-5 hidden sm:block">
            High-resolution defect detection model optimized for edge inference on the assembly line.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-3 bg-[var(--color-surface)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/30 rounded-xl hover:bg-[var(--color-surface-container)] transition-colors shadow-ambient text-[13px] tracking-[0.05em] font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">history</span> Rollback
          </button>
          <button className="flex-1 md:flex-none px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl hover:bg-[var(--color-surface-tint)] transition-colors shadow-ambient text-[13px] tracking-[0.05em] font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">download</span> Export Model
          </button>
        </div>
      </div>

      {/* ── Bento Grid Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Performance Metrics Card */}
        <div className="col-span-1 md:col-span-8 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-ambient flex flex-col h-full min-h-0">
          <h3 className="text-xl font-semibold text-[var(--color-on-surface)] mb-4" style={{ letterSpacing: "-0.01em" }}>
            Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Accuracy", value: "98.4%", change: "+0.2%", up: true, highlight: true },
              { label: "Precision", value: "97.1%", change: "+0.5%", up: true },
              { label: "Recall", value: "96.8%", change: "-0.1%", up: false },
              { label: "F1 Score", value: "96.9%", change: "+0.3%", up: true },
            ].map((metric) => (
              <div key={metric.label} className="p-3 bg-[var(--color-surface-container)] rounded-xl border border-[var(--color-outline-variant)]/10">
                <p className="text-[11px] tracking-[0.05em] text-[var(--color-on-surface-variant)] mb-1 uppercase font-medium">{metric.label}</p>
                <p className={`text-2xl font-semibold ${metric.highlight ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"}`} style={{ lineHeight: "32px" }}>
                  {metric.value}
                </p>
                <p className="text-[13px] tracking-[0.05em] text-[var(--color-tertiary)] mt-1 flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[14px] ${metric.up ? "text-green-600" : "text-red-600"}`}>
                    {metric.up ? "trending_up" : "trending_down"}
                  </span>
                  {metric.change}
                </p>
              </div>
            ))}
          </div>
          {/* Training vs Validation Loss Chart Placeholder */}
          <div className="mt-auto h-24 bg-[var(--color-surface-container)] rounded-xl border border-[var(--color-outline-variant)]/10 flex items-end p-2 gap-2 relative min-h-[60px] hidden sm:flex">
            <div className="absolute top-2 left-3 text-[11px] tracking-[0.05em] text-[var(--color-on-surface-variant)] font-medium">
              Training vs Validation Loss
            </div>
            <div className="w-full flex items-end justify-between gap-1 h-16 px-3">
              {[80, 60, 45, 35, 25, 20, 15, 12, 10, 8].map((h, i) => (
                <div
                  key={i}
                  className="w-[8.3%] rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: `color-mix(in srgb, var(--color-primary) ${20 + i * 9}%, transparent)`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="col-span-1 md:col-span-4 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-ambient flex flex-col h-full min-h-0 hidden md:flex">
          <h3 className="text-lg font-semibold text-[var(--color-on-surface)] mb-2" style={{ letterSpacing: "-0.01em" }}>
            Configuration
          </h3>
          <div className="space-y-0 flex-1 overflow-hidden">
            {[
              { label: "Framework", value: "PyTorch 2.1" },
              { label: "Architecture", value: "ResNet-50" },
              { label: "Parameters", value: "25.6M" },
              { label: "Input Shape", value: "[3, 224, 224]", mono: true },
              { label: "Created By", value: "J. Smith", avatar: true },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-3 border-b border-[var(--color-outline-variant)]/10">
                <span className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)] font-medium">{item.label}</span>
                {item.mono ? (
                  <span className="font-[var(--font-geist)] text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container)] px-2 py-1 rounded">
                    {item.value}
                  </span>
                ) : item.avatar ? (
                  <span className="text-base text-[var(--color-on-surface)] font-medium flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-[9px] text-[var(--color-on-primary-container)] font-bold">
                      JS
                    </div>
                    {item.value}
                  </span>
                ) : (
                  <span className="text-base text-[var(--color-on-surface)] font-medium">{item.value}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <h4 className="text-[13px] tracking-[0.05em] text-[var(--color-on-surface-variant)] mb-2 uppercase font-medium">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {["production", "vision", "edge-optimized"].map((tag) => (
                <span key={tag} className="bg-[var(--color-surface-container)] px-3 py-1 rounded-full text-[13px] tracking-[0.05em] text-[var(--color-on-surface)] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Drivers */}
        <div className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-ambient h-full min-h-0 flex flex-col">
          <h3 className="text-lg font-semibold text-[var(--color-on-surface)] mb-2 flex justify-between items-center" style={{ letterSpacing: "-0.01em" }}>
            Key Drivers
            <span className="material-symbols-outlined text-[var(--color-outline)] text-base">info</span>
          </h3>
          <div className="space-y-3 flex-1 overflow-hidden">
            {[
              { label: "Texture Variance", value: "0.42", width: "85%" },
              { label: "Edge Sharpness", value: "0.28", width: "60%" },
              { label: "Color Contrast", value: "0.15", width: "35%" },
              { label: "Shape Symmetry", value: "0.08", width: "20%" },
            ].map((driver) => (
              <div key={driver.label}>
                <div className="flex justify-between text-[13px] tracking-[0.05em] font-medium mb-1">
                  <span className="text-[var(--color-on-surface)]">{driver.label}</span>
                  <span className="text-[var(--color-on-surface-variant)]">{driver.value}</span>
                </div>
                <div className="w-full bg-[var(--color-surface-container)] rounded-full h-2">
                  <div
                    className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-500"
                    style={{ width: driver.width }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version History */}
        <div className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-ambient h-full min-h-0 flex flex-col hidden sm:flex">
          <h3 className="text-lg font-semibold text-[var(--color-on-surface)] mb-3" style={{ letterSpacing: "-0.01em" }}>
            Version History
          </h3>
          <div className="relative border-l border-[var(--color-outline-variant)]/30 ml-2 space-y-3 flex-1 overflow-hidden">
            {[
              {
                version: "v2.4 (Current)",
                date: "Today, 09:41 AM",
                desc: "Retrained with augmented dataset for low-light conditions. Accuracy improved by 0.2%.",
                current: true,
              },
              {
                version: "v2.3",
                date: "Oct 12, 2023",
                desc: "Pruned network to reduce latency for edge devices.",
              },
              {
                version: "v2.2",
                date: "Sep 28, 2023",
                desc: "Initial production release for Line B assembly.",
              },
            ].map((v) => (
              <div key={v.version} className="relative pl-6">
                <div
                  className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ring-4 ring-[var(--color-surface-container-lowest)] ${
                    v.current ? "bg-[var(--color-primary)]" : "bg-[var(--color-outline-variant)]"
                  }`}
                ></div>
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-base ${v.current ? "font-semibold" : "font-medium"} text-[var(--color-on-surface)]`}>
                    {v.version}
                  </h4>
                  <span className="text-xs tracking-[0.05em] text-[var(--color-on-surface-variant)]">{v.date}</span>
                </div>
                <p className="text-sm text-[var(--color-on-surface-variant)] leading-5">{v.desc}</p>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full py-1.5 text-[var(--color-primary)] font-medium text-[13px] tracking-[0.05em] hover:bg-[var(--color-surface-container)] rounded-lg transition-colors">
            View All Versions
          </button>
        </div>
      </div>
    </div>
  );
}
