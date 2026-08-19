"use client";

import { useState } from "react";
import { Calendar, Layers, RotateCcw, Check } from "lucide-react";
import { WeddingJourney, JOURNEY_OPTIONS } from "@/lib/marketing/wedding-checklist-data";

interface WeddingChecklistSetupProps {
  weddingDate: string | null;
  selectedJourneys: WeddingJourney[];
  onDateChange: (date: string | null) => void;
  onJourneyToggle: (journey: WeddingJourney) => void;
  onReset: () => void;
}

export default function WeddingChecklistSetup({
  weddingDate,
  selectedJourneys,
  onDateChange,
  onJourneyToggle,
  onReset,
}: WeddingChecklistSetupProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Compute countdown metrics if date is set
  const getCountdownLabel = () => {
    if (!weddingDate) return null;
    const target = new Date(weddingDate);
    if (isNaN(target.getTime())) return null;

    const now = new Date();
    // Reset time for fair day calculation
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffMs = eventDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: "Celebração Realizada",
        sub: "Fase VII · Pós-Celebração",
        days: Math.abs(diffDays),
        isPast: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: "Hoje é o Grande Dia",
        sub: "Fase VI · Celebração & Viver o Momento",
        days: 0,
        isToday: true,
      };
    }
    if (diffDays <= 28) {
      return {
        label: `Faltam ${diffDays} dias`,
        sub: "Fase V · Fecho & Contagem Regressiva",
        days: diffDays,
      };
    }
    const months = Math.round(diffDays / 30);
    return {
      label: `Faltam ${diffDays} dias (~${months} meses)`,
      sub: diffDays > 270 ? "Fase I · Fundação (12–9 meses)" : diffDays > 180 ? "Fase II · Estrutura (8–6 meses)" : diffDays > 90 ? "Fase III · Definição (5–3 meses)" : "Fase IV · Consolidação (2–1 meses)",
      days: diffDays,
    };
  };

  const countdown = getCountdownLabel();

  return (
    <div className="bg-white border border-brand-champagne/45 rounded-sm p-6 md:p-8 shadow-sm space-y-8 mb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-champagne/25 pb-4">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-gold font-bold">
            CONFIGURAÇÃO DA JORNADA
          </span>
          <h2 className="font-serif text-lg md:text-xl text-brand-text-dark font-light">
            Personalize a vossa timeline
          </h2>
        </div>

        {/* Inline Reset Control */}
        <div className="relative">
          {showResetConfirm ? (
            <div className="flex items-center gap-2 bg-brand-ivory border border-red-200 px-3 py-1.5 rounded-sm animate-fade-in">
              <span className="font-sans text-[11px] text-red-700">Repor tudo?</span>
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setShowResetConfirm(false);
                }}
                className="font-mono text-[9px] uppercase tracking-wider font-bold bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-xs transition-colors cursor-pointer"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 hover:text-brand-text-dark px-2 py-1 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/45 hover:text-brand-gold transition-colors cursor-pointer"
              title="Restaurar tarefas padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repor Checklist</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* A. Data da Celebração */}
        <div className="lg:col-span-5 space-y-3">
          <label
            htmlFor="wedding-date-input"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-brand-text-dark/70 font-semibold"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-gold" />
            <span>Quando será a celebração?</span>
          </label>
          <div className="relative">
            <input
              id="wedding-date-input"
              type="date"
              value={weddingDate || ""}
              onChange={(e) => onDateChange(e.target.value || null)}
              className="w-full bg-brand-ivory/40 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3.5 rounded-sm outline-none font-mono text-brand-text-dark transition-colors"
            />
          </div>

          {countdown ? (
            <div className="bg-brand-gold/10 border border-brand-gold/25 p-3 rounded-sm flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-brand-gold shrink-0 mt-1" />
              <div className="space-y-0.5">
                <p className="font-mono text-[11px] font-bold text-brand-text-dark">
                  {countdown.label}
                </p>
                <p className="font-sans text-[10px] text-brand-text-dark/60">
                  {countdown.sub}
                </p>
              </div>
            </div>
          ) : (
            <p className="font-sans text-[11px] text-brand-text-dark/50 font-light leading-relaxed">
              Indicar a data ajuda a orientar em que fase cronológica o vosso planeamento se encontra.
            </p>
          )}
        </div>

        {/* B. Jornada do Casamento */}
        <div className="lg:col-span-7 space-y-3">
          <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-brand-text-dark/70 font-semibold">
            <Layers className="w-3.5 h-3.5 text-brand-gold" />
            <span>Que celebrações fazem parte da vossa jornada?</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {JOURNEY_OPTIONS.map((opt) => {
              const isSelected = selectedJourneys.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onJourneyToggle(opt.id)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-sm border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-brand-ivory border-brand-gold text-brand-text-dark shadow-xs"
                      : "bg-brand-champagne/10 border-brand-champagne/30 text-brand-text-dark/50 hover:bg-brand-champagne/20"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-sans text-xs font-medium leading-tight">
                      {opt.label}
                    </p>
                    <p className="font-mono text-[9px] text-brand-text-dark/50 uppercase tracking-wider">
                      {opt.sub}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-brand-gold border-brand-gold text-white"
                        : "border-brand-champagne/60 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="font-sans text-[11px] text-brand-text-dark/50 font-light pt-1">
            Podem seleccionar múltiplas opções. As tarefas serão adaptadas instantaneamente ao vosso formato.
          </p>
        </div>
      </div>
    </div>
  );
}
