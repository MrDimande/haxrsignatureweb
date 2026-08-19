"use client";

import { ListTodo } from "lucide-react";
import { CHECKLIST_PHASES, ChecklistPhase } from "@/lib/marketing/wedding-checklist-data";

interface WeddingChecklistProgressProps {
  totalCount: number;
  completedCount: number;
}

export default function WeddingChecklistProgress({
  totalCount,
  completedCount,
}: WeddingChecklistProgressProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const scrollToPhase = (phaseId: ChecklistPhase) => {
    const el = document.getElementById(`phase-${phaseId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="bg-white border border-brand-champagne/45 rounded-sm p-6 md:p-8 shadow-sm space-y-6 mb-10">
      {/* Header Stat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-gold">
            <ListTodo className="w-4 h-4" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold">
              PROGRESSO GLOBAL DA CELEBRAÇÃO
            </span>
          </div>
          <p className="font-serif text-2xl md:text-3xl text-brand-text-dark font-light">
            {completedCount} de {totalCount} tarefas concluídas
          </p>
        </div>

        <div className="text-right sm:border-l sm:border-brand-champagne/30 sm:pl-6">
          <span className="font-mono text-3xl md:text-4xl font-bold text-brand-gold">
            {percentage}%
          </span>
          <p className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50">
            Concluído
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-2.5 bg-brand-champagne/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-gold via-brand-gold-light to-brand-gold transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="font-sans text-[11px] text-brand-text-dark/50 font-light">
          Considera exclusivamente as tarefas aplicáveis às celebrações seleccionadas na vossa jornada.
        </p>
      </div>

      {/* Quick Phase Jump Chips */}
      <div className="pt-4 border-t border-brand-champagne/20">
        <p className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 mb-2.5">
          Navegar directamente por fase:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CHECKLIST_PHASES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => scrollToPhase(p.id)}
              className="px-2.5 py-1 rounded-xs bg-brand-ivory hover:bg-brand-champagne/20 border border-brand-champagne/40 font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/70 hover:text-brand-text-dark transition-colors cursor-pointer"
            >
              {p.roman} · {p.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
