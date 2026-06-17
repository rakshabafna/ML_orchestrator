"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function SideNavBar() {
  const pathname = usePathname();
  const [config, setConfig] = useState({ user: "Loading...", project: "Loading..." });

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/system/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(e => console.error("Failed to fetch system config"));
  }, []);

  return (
    <motion.nav 
      initial={{ x: -100, y: "-50%" }}
      animate={{ x: 0, y: "-50%" }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed left-4 top-1/2 z-50 flex flex-col items-center gap-4 bg-[var(--color-surface-container-low)]/80 p-3 rounded-[32px] border border-[var(--color-outline-variant)]/30 backdrop-blur-xl shadow-glass"
    >
      {/* ── Logo ── */}
      <Link href="/" className="mb-4 hover:opacity-80 transition-opacity z-10 group relative">
        <motion.div 
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.4 }}
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-fixed-dim)] flex items-center justify-center shadow-md"
        >
          <span className="material-symbols-outlined text-[var(--color-on-primary)] icon-fill text-xl">
            hub
          </span>
        </motion.div>
      </Link>

      {/* ── Navigation Links ── */}
      <div className="flex flex-col gap-3 items-center">
          {[
            { href: "/", label: "Overview", icon: "dashboard" },
            { href: "/experiments", label: "Experiments", icon: "science" },
            { href: "/models", label: "Registry", icon: "inventory_2" },
            { href: "/infrastructure", label: "Infra", icon: "account_tree" },
          ].map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl group ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-[var(--color-surface-bright)] shadow-md rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="material-symbols-outlined text-xl relative z-10">{link.icon}</span>
                
                {/* Tooltip */}
                <div className="absolute left-[calc(100%+16px)] px-3 py-1.5 bg-[var(--color-on-surface)] text-white text-[12px] font-bold rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl z-50">
                  {link.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[var(--color-on-surface)] rotate-45"></div>
                </div>
              </Link>
            );
          })}
      </div>

      <div className="w-6 h-px bg-[var(--color-outline-variant)]/30 my-2"></div>

      {/* ── Profile & Actions ── */}
      <div className="flex flex-col items-center gap-3 z-10">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-10 h-10 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors rounded-full hover:bg-[var(--color-surface-container)] flex items-center justify-center relative group">
          <span className="material-symbols-outlined text-xl">terminal</span>
          <div className="absolute left-[calc(100%+16px)] px-3 py-1.5 bg-[var(--color-on-surface)] text-white text-[12px] font-bold rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl z-50">
            Terminal
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[var(--color-on-surface)] rotate-45"></div>
          </div>
        </motion.button>
        <motion.div whileHover={{ scale: 1.05 }} className="relative group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] overflow-hidden flex items-center justify-center shadow-inner">
            <span className="text-[var(--color-on-primary)] text-sm font-bold tracking-wider">{config.user.substring(0, 2).toUpperCase()}</span>
          </div>
          <div className="absolute left-[calc(100%+16px)] px-3 py-1.5 bg-[var(--color-on-surface)] text-white text-[12px] rounded-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl z-50 flex flex-col items-start">
            <span className="font-bold">{config.user}</span>
            <span className="text-[10px] text-white/80">{config.project}</span>
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[var(--color-on-surface)] rotate-45"></div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}

export function Footer() {
  const [config, setConfig] = useState({ version: "v...", region: "..." });

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/system/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(e => console.error("Failed to fetch config"));
  }, []);

  return (
    <motion.footer 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="fixed bottom-0 right-0 left-0 h-10 bg-white/10 border-t border-[var(--color-outline-variant)]/30 flex justify-between items-center px-6 md:px-12 z-40 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.02)]"
    >
      <div className="flex items-center gap-4">
        <div className="text-[11px] tracking-[0.05em] font-bold text-[var(--color-on-surface)]">
          NeuralFlow <span className="text-[var(--color-primary)]">{config.version}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-[var(--color-outline-variant)]"></div>
        <div className="text-[11px] tracking-[0.05em] font-medium text-[var(--color-on-surface-variant)] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-[var(--color-tertiary)]">cloud</span>
          {config.region}
        </div>
      </div>
      <div className="flex gap-6 items-center">
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          onClick={() => {
            localStorage.removeItem("neuralflow_sessionId");
            localStorage.removeItem("neuralflow_currentPhase");
            window.location.href = '/';
          }}
          className="text-[var(--color-primary)] text-[12px] tracking-[0.05em] font-bold hover:brightness-110 transition-all flex items-center gap-1.5 bg-[var(--color-primary)]/10 px-3 py-1 rounded-full border border-[var(--color-primary)]/20"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          New Project
        </motion.button>
        <div className="w-px h-4 bg-[var(--color-outline-variant)]/50 hidden md:block"></div>
        <motion.button whileHover={{ scale: 1.05 }} className="text-[var(--color-error)] font-bold uppercase text-[11px] tracking-[0.05em] hover:text-[#ff4d4d] transition-colors flex items-center gap-1 group">
          <span className="material-symbols-outlined text-[14px] group-hover:animate-pulse">stop_circle</span>
          Emergency Stop
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} className="text-[var(--color-on-surface-variant)] text-[12px] tracking-[0.05em] font-medium hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">pause</span>
          Pause Pipeline
        </motion.button>
      </div>
    </motion.footer>
  );
}

