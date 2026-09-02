"use client";

import { CheckCircle2, FolderOpen, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ConciergeScenario } from "@/lib/marketing/home-content";
import { homeConciergeSection } from "@/lib/marketing/home-content";

type HomeConciergeMockupProps = {
  scenario: ConciergeScenario;
  isProcessing?: boolean;
};

export default function HomeConciergeMockup({
  scenario,
  isProcessing = false,
}: HomeConciergeMockupProps) {
  const hasExtra = scenario.extra && scenario.extra.length > 0;
  const isVisual = scenario.id === "visual_reference";

  return (
    <div className="relative w-full max-w-[540px] mx-auto lg:mx-0 pb-10 md:pb-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={scenario.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.25, 0, 0.1, 1] }}
          className="rounded-sm border border-white/12 bg-[#f7f1e8] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="px-6 md:px-8 py-5 border-b border-brand-champagne/60 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-sans text-[10px] font-semibold tracking-[0.28em] uppercase text-brand-gold">
                  {scenario.documentTypeLabel}
                </p>
                <p className="font-serif text-xl font-medium text-brand-text-dark mt-1.5">
                  {scenario.title}
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-1 border border-brand-gold/40 bg-brand-gold/10 font-sans text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
                {scenario.status}
              </span>
            </div>
          </div>

          <div className="px-6 md:px-8 py-6 md:py-8 bg-[#f7f1e8]">
            {isVisual && (
              <div className="grid grid-cols-3 gap-2 mb-5" aria-hidden>
                {["#EAD8B8", "#F7F1E8", "#B88A2A"].map((color, i) => (
                  <div
                    key={color}
                    className="aspect-[4/3] border border-brand-champagne/60"
                    style={{
                      background:
                        i === 2
                          ? `linear-gradient(135deg, ${color}88, ${color})`
                          : color,
                    }}
                  />
                ))}
              </div>
            )}

            <div
              className={
                hasExtra && scenario.id !== "visual_reference"
                  ? "space-y-4"
                  : "grid grid-cols-1 sm:grid-cols-2 gap-4"
              }
            >
              {scenario.fields.map((field) => (
                <div
                  key={field.label}
                  className={
                    field.highlight && !hasExtra ? "sm:col-span-2" : undefined
                  }
                >
                  <p className="font-sans text-[10px] uppercase tracking-wider text-brand-text-dark/45 mb-1">
                    {field.label}
                  </p>
                  <p
                    className={
                      field.highlight
                        ? "font-serif text-2xl font-medium text-brand-gold"
                        : "font-sans text-sm text-brand-text-dark/80"
                    }
                  >
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

            {hasExtra && (
              <div className="mt-5 pt-4 border-t border-brand-champagne/50 space-y-2.5">
                {scenario.extra!.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-3 py-2 px-3 bg-white/60 border border-brand-champagne/40"
                  >
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-brand-text-dark truncate">
                        {row.name}
                      </p>
                      <p className="font-sans text-xs text-brand-text-dark/55">
                        {row.detail}
                      </p>
                    </div>
                    {row.meta && (
                      <span className="shrink-0 font-sans text-[10px] font-semibold uppercase tracking-wider text-brand-gold px-2 py-0.5 border border-brand-gold/30">
                        {row.meta}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute -right-1 md:-right-4 top-[28%] z-20 w-[min(100%,230px)] rounded-sm border border-brand-gold/45 bg-brand-black/96 backdrop-blur-md shadow-[0_20px_56px_rgba(0,0,0,0.55)] p-4"
        aria-hidden
        initial={false}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-9 h-9 border border-brand-gold/50 text-brand-gold-light bg-brand-gold/10">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
            )}
          </span>
          <div>
            <p className="font-sans text-[11px] font-semibold text-brand-ivory leading-tight">
              {isProcessing
                ? scenario.processingLabel
                : homeConciergeSection.sentCardTitle}
            </p>
            <p className="font-sans text-[10px] text-brand-ivory/55 mt-0.5">
              {scenario.fileHint}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute left-0 md:-left-4 bottom-2 md:bottom-6 z-20 w-[min(100%,270px)] rounded-sm border border-white/12 bg-brand-black/92 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.45)] p-4"
        aria-hidden
        initial={false}
        animate={{ opacity: isProcessing ? 0.7 : 1 }}
      >
        <div className="flex items-start gap-2.5">
          <span className="inline-flex items-center justify-center w-8 h-8 border border-brand-gold/35 text-brand-gold-light shrink-0">
            <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-brand-gold-light mb-1">
              {homeConciergeSection.organizedCardTitle}
            </p>
            <p className="font-sans text-xs text-brand-ivory/88 leading-relaxed">
              {scenario.organizedModules}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-brand-gold/70" strokeWidth={1.5} />
          <p className="font-sans text-[10px] text-brand-ivory/50">
            {homeConciergeSection.validationNote}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
