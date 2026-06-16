"use client";

import { useState, useEffect } from "react";

interface Model {
  id: string;
  name: string;
  version: string;
  score: number;
  metric: string;
  status: string;
  created_at: string;
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/models")
      .then(res => res.json())
      .then(data => {
        setModels(data);
        setLoading(false);
      })
      .catch(e => {
        console.error("Failed to fetch models", e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 mb-3 shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-[var(--color-on-surface)] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Model Registry
          </h1>
          <p className="text-base text-[var(--color-on-surface-variant)] max-w-2xl leading-6">
            Centralized repository of all dynamically synthesized and trained models from your pipelines.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl hover:bg-[var(--color-surface-tint)] transition-colors shadow-ambient text-[13px] tracking-[0.05em] font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">add</span> Import Model
          </button>
        </div>
      </div>

      {/* ── Models Grid Layout ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-y-auto pb-6">
        {loading && <div className="text-[var(--color-on-surface-variant)] p-4">Loading models...</div>}
        {!loading && models.length === 0 && (
          <div className="text-[var(--color-on-surface-variant)] p-4">No models found in the registry.</div>
        )}
        
        {models.map(model => (
          <div key={model.id} className="bg-[var(--color-surface-container-lowest)] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between min-h-[220px] relative">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] text-[11px] font-semibold tracking-wide uppercase px-2 py-1 rounded-md">
                  {model.status}
                </span>
                <span className="font-[var(--font-geist)] text-[12px] text-[var(--color-on-surface-variant)]">
                  {model.version}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-on-surface)] mb-1">
                {model.name}
              </h3>
              <p className="font-[var(--font-geist)] text-xs text-[var(--color-on-surface-variant)]">
                {model.id}
              </p>
            </div>
            
            <div className="mt-4 bg-[var(--color-surface-container)] rounded-xl p-3 border border-[var(--color-outline-variant)]/10">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[11px] tracking-[0.05em] text-[var(--color-on-surface-variant)] uppercase font-medium">{model.metric}</span>
                 <span className="text-[11px] tracking-[0.05em] text-[var(--color-outline)]">Test Set</span>
               </div>
               <p className="text-2xl font-semibold text-[var(--color-primary)]">
                 {(model.score * 100).toFixed(1)}%
               </p>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-[11px] text-[var(--color-on-surface-variant)]">
                Trained on {new Date(model.created_at).toLocaleDateString()}
              </span>
              <button className="text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/30 p-1.5 rounded-full transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
