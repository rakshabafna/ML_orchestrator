"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopAppBar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 shadow-sm bg-[var(--color-surface)]/80 backdrop-blur-xl flex justify-between items-center px-6 md:px-12 h-16 border-b border-[var(--color-outline-variant)]/10">
      {/* ── Logo (Left) ── */}
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity z-10">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-container)] flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[var(--color-on-primary-container)] icon-fill text-lg">
            hub
          </span>
        </div>
        <span className="text-xl font-bold tracking-tight text-[var(--color-primary)] font-[var(--font-inter)]">
          NeuralFlow
        </span>
      </Link>

      {/* ── Navigation (Center) ── */}
      <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex gap-6 items-center">
          {[
            { href: "/", label: "Overview", icon: "dashboard" },
            { href: "/experiments", label: "Experiments", icon: "science" },
            { href: "/models", label: "Model Registry", icon: "inventory_2" },
            { href: "/infrastructure", label: "Infrastructure", icon: "account_tree" },
          ].map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-2 text-[13px] tracking-[0.05em] font-medium transition-all duration-200 px-3 py-2 rounded-xl ${
                  isActive
                    ? "bg-[var(--color-surface-container)] text-[var(--color-primary)] font-bold shadow-sm"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-primary)]"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
      </nav>

      {/* ── Profile & Actions (Right) ── */}
      <div className="flex items-center gap-2 z-10">
        <button className="p-2.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors rounded-full hover:bg-[var(--color-surface-container)] flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">terminal</span>
        </button>
        <button className="p-2.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors rounded-full hover:bg-[var(--color-surface-container)] relative flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-primary)] rounded-full border border-[var(--color-surface)]"></span>
        </button>
        <div className="w-px h-6 bg-[var(--color-outline-variant)]/30 mx-2"></div>
        <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-4 rounded-full hover:bg-[var(--color-surface-container)] transition-colors border border-transparent hover:border-[var(--color-outline-variant)]/20">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] overflow-hidden flex items-center justify-center shadow-sm">
            <span className="text-[var(--color-on-primary)] text-xs font-bold tracking-wider">JS</span>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-[12px] font-bold text-[var(--color-on-surface)] leading-none">John Smith</span>
            <span className="text-[10px] text-[var(--color-on-surface-variant)] leading-none mt-1">Project Alpha</span>
          </div>
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-lg">expand_more</span>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="fixed bottom-0 right-0 left-0 h-10 bg-[var(--color-surface-container-high)] border-t border-[var(--color-outline-variant)]/20 flex justify-between items-center px-6 md:px-12 z-40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="text-[11px] tracking-[0.05em] font-bold text-[var(--color-on-surface)]">
          NeuralFlow v2.4.1-stable
        </div>
        <div className="w-1 h-1 rounded-full bg-[var(--color-outline-variant)]"></div>
        <div className="text-[11px] tracking-[0.05em] font-medium text-[var(--color-on-surface-variant)] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">cloud</span>
          us-east-4
        </div>
      </div>
      <div className="flex gap-6 items-center">
        <button className="text-[var(--color-error)] font-bold uppercase text-[11px] tracking-[0.05em] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">stop_circle</span>
          Emergency Stop
        </button>
        <button className="text-[var(--color-on-surface-variant)] text-[12px] tracking-[0.05em] font-medium hover:text-[var(--color-primary)] transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">pause</span>
          Pause Pipeline
        </button>
      </div>
    </footer>
  );
}
