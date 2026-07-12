"use client";

import { useState } from "react";
import type { DashboardChecklistTemplate } from "@/lib/dashboard/types";
import { Check, ClipboardList } from "lucide-react";

type ChecklistTemplatesProps = {
  templates: DashboardChecklistTemplate[];
  eventName: string;
  defaultTemplateId?: string;
};

export default function ChecklistTemplates({
  templates,
  eventName,
  defaultTemplateId,
}: ChecklistTemplatesProps) {
  const [activeTemplate, setActiveTemplate] = useState(
    defaultTemplateId ?? templates[0]?.id ?? ""
  );

  if (templates.length === 0) return null;

  return (
    <div className="space-y-6 rounded-3xl border border-brand-champagne/10 bg-white/5 p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2 text-brand-gold">
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
              Templates de Checklist
            </span>
          </div>
          <h3 className="font-serif text-lg font-light text-white">
            Modelos de Checklist Recomendados
          </h3>
          <p className="font-sans text-xs font-light text-zinc-400">
            Selecione e ative o cronograma operacional ideal para o local e escala do vosso
            casamento.
          </p>
        </div>

        <span className="hidden items-center rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold sm:inline-flex">
          Sugeridos para {eventName}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {templates.map((tmpl) => {
          const isCurrent = activeTemplate === tmpl.id;
          return (
            <div
              key={tmpl.id}
              className={`relative flex flex-col justify-between space-y-4 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 ${
                isCurrent
                  ? "border-brand-gold/55 bg-brand-gold/10 shadow-lg shadow-brand-gold/5"
                  : "border-white/5 bg-black/25 hover:border-brand-champagne/30"
              }`}
            >
              <div className="relative z-10 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4
                    className={`font-serif text-base font-light ${
                      isCurrent ? "text-brand-gold" : "text-white"
                    }`}
                  >
                    {tmpl.title}
                  </h4>
                  {isCurrent ? (
                    <span className="flex h-5 w-5 shrink-0 animate-scaleIn items-center justify-center rounded-full bg-brand-gold text-white shadow-sm">
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </span>
                  ) : null}
                </div>

                <span className="inline-block rounded border border-white/5 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-zinc-400">
                  {tmpl.badge}
                </span>

                <p className="pt-1 font-sans text-xs font-light leading-relaxed text-zinc-400">
                  {tmpl.description}
                </p>
              </div>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`w-full cursor-pointer rounded-xl border px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest transition-all ${
                  isCurrent
                    ? "cursor-default border-brand-gold/30 bg-transparent text-brand-gold/80"
                    : "border-white/10 bg-white/5 text-zinc-300 hover:border-white hover:text-white"
                }`}
              >
                {isCurrent ? "Template Ativo" : "Aplicar Template"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
