"use client";

import { useState } from "react";
import { ArrowRight, Copy, Mail, Sparkles } from "lucide-react";
import {
  homeConciergeSection,
  type ConciergeScenarioId,
} from "@/lib/marketing/home-content";

type HomeConciergeInboxProps = {
  activeId: ConciergeScenarioId;
  onSelect: (id: ConciergeScenarioId) => void;
};

const statusStyles: Record<string, string> = {
  "Por rever": "text-brand-gold-light border-brand-gold/40 bg-brand-gold/10",
  Classificado: "text-brand-champagne border-brand-champagne/40 bg-brand-champagne/10",
  Aprovado: "text-emerald-300/90 border-emerald-400/30 bg-emerald-400/10",
  "Sugestão IA": "text-brand-ivory/70 border-white/20 bg-white/5",
};

export default function HomeConciergeInbox({
  activeId,
  onSelect,
}: HomeConciergeInboxProps) {
  const { inbox } = homeConciergeSection;
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(inbox.emailPromo.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-sm border border-white/12 bg-[#0f0d0b] shadow-[0_32px_80px_rgba(0,0,0,0.55)] overflow-hidden">
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-white/10 bg-brand-black">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-gold-light" strokeWidth={1.5} />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-brand-ivory/80">
            {inbox.panelTitle}
          </span>
        </div>
        <span className="font-sans text-[10px] px-2 py-0.5 border border-brand-gold/40 text-brand-gold-light">
          3 por rever
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-white/8 bg-brand-black/60 p-3 md:p-4">
          <p className="font-sans text-[10px] uppercase tracking-wider text-brand-ivory/45 mb-3 px-2">
            {inbox.subtitle}
          </p>
          <nav className="space-y-1" aria-label="Navegação Concierge">
            {inbox.tabs.map((tab) => {
              const isActive = tab === inbox.activeTab;
              return (
                <div
                  key={tab}
                  className={[
                    "px-3 py-2.5 font-sans text-sm flex items-center justify-between",
                    isActive
                      ? "bg-brand-gold/12 text-brand-ivory border-l-2 border-brand-gold"
                      : "text-brand-ivory/55",
                  ].join(" ")}
                >
                  {tab}
                  {isActive && (
                    <span className="w-5 h-5 rounded-full bg-brand-gold/20 text-[10px] font-semibold flex items-center justify-center text-brand-gold-light">
                      3
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="lg:col-span-9 flex flex-col">
          <div className="px-4 md:px-6 py-4 border-b border-white/8 flex items-center justify-between gap-4">
            <h3 className="font-serif text-lg md:text-xl text-brand-ivory">
              {inbox.title}
            </h3>
            <button
              type="button"
              className="font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-gold-light flex items-center gap-1.5 shrink-0"
            >
              {inbox.viewAllLabel}
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          <ul className="flex-1 divide-y divide-white/6 overflow-hidden">
            {inbox.items.map((item) => {
              const isActive = item.scenarioId === activeId;
              const statusClass =
                statusStyles[item.status] ?? statusStyles["Por rever"];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.scenarioId)}
                    className={[
                      "w-full text-left px-4 md:px-6 py-4 flex items-start gap-4 transition-colors",
                      isActive
                        ? "bg-brand-gold/8 border-l-2 border-brand-gold"
                        : "hover:bg-white/[0.03] border-l-2 border-transparent",
                    ].join(" ")}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-brand-gold/80">
                          {item.type}
                        </span>
                        <span className="font-sans text-[10px] text-brand-ivory/40">
                          {item.time}
                        </span>
                      </div>
                      <p className="font-sans text-sm text-brand-ivory/90 truncate">
                        {item.title}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-sans text-[9px] font-semibold uppercase tracking-wider px-2 py-1 border ${statusClass}`}
                    >
                      {item.status}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="p-4 md:p-5 border-t border-white/8 bg-brand-gold/[0.06]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="inline-flex items-center justify-center w-10 h-10 border border-brand-gold/40 text-brand-gold-light shrink-0">
                <Mail className="w-4 h-4" strokeWidth={1.5} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-base text-brand-ivory mb-1">
                  {inbox.emailPromo.title}
                </p>
                <p className="font-sans text-xs text-brand-ivory/55 leading-relaxed">
                  {inbox.emailPromo.text}
                </p>
              </div>
              <button
                type="button"
                onClick={copyEmail}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border border-brand-gold/40 bg-brand-black font-sans text-[11px] font-semibold uppercase tracking-wider text-brand-gold-light hover:bg-brand-gold/10 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                {copied ? "Copiado" : inbox.emailPromo.ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
