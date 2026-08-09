"use client";

import { useState } from "react";
import Link from "next/link";
import type { ConciergeModuleData } from "@/lib/event-modules/types";
import {
  CONCIERGE_STATUS_LABELS,
  CONCIERGE_STATUS_STYLES,
} from "@/lib/event-modules/presentation";
import { FileSearch, Upload, ArrowLeft, Loader2, Check } from "lucide-react";
import {
  ModuleHeader,
  ModulePanel,
  ModuleShell,
  ModuleStatGrid,
} from "@/components/app/modules/ModuleShell";

export default function ConciergeModuleView({ data }: { data: ConciergeModuleData }) {
  const [activeId, setActiveId] = useState(data.inbox[0]?.id ?? "");
  const [processing, setProcessing] = useState(false);

  const activeItem = data.inbox.find((item) => item.id === activeId);

  const handleValidate = () => {
    setProcessing(true);
    window.setTimeout(() => setProcessing(false), 1000);
  };

  return (
    <ModuleShell>
      <ModuleHeader
        label="HAXR Concierge™"
        title="Assistente Operacional"
        description="Classificação assistida — integração IA futura. Receba, classifique e organize documentos antes de enviar para os módulos do evento."
        primaryAction={{ label: "Carregar ficheiro", onClick: () => {} }}
        secondaryAction={{ label: "Ver itens por validar", onClick: () => {} }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-3">
        <p className="font-sans text-xs text-zinc-300">
          Preparado para análise inteligente de documentos. A equipa HAXR valida antes de
          actualizar o painel.
        </p>
        <Link
          href={data.dashboardHref}
          className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar ao Dashboard
        </Link>
      </div>

      <ModuleStatGrid
        stats={[
          { label: "Inbox", value: data.summary.inboxTotal },
          { label: "Por classificar", value: data.summary.pendingClassification },
          { label: "Aguardam validação", value: data.summary.awaitingValidation },
          { label: "Organizados hoje", value: data.summary.organizedToday },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <ModulePanel title="Caixa de Entrada">
            <div className="space-y-3">
              {data.inbox.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                      isActive
                        ? "border-brand-gold/50 bg-brand-gold/10"
                        : "border-brand-champagne/10 bg-[#120e0d] hover:border-brand-champagne/30"
                    }`}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate font-serif text-sm ${isActive ? "text-brand-gold" : "text-white"}`}>
                          {item.title}
                        </p>
                        <p className="mt-1 font-mono text-[10px] text-zinc-500">
                          {item.type} · {item.receivedLabel}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase ${CONCIERGE_STATUS_STYLES[item.status]}`}
                      >
                        {CONCIERGE_STATUS_LABELS[item.status]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ModulePanel>

          <div className="rounded-2xl border border-dashed border-brand-champagne/25 bg-white/5 p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-brand-gold" />
            <p className="mt-3 font-serif text-sm text-white">Área de Intake</p>
            <p className="mt-1 text-xs text-zinc-500">
              Arraste ficheiros ou envie por email/WhatsApp
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          {activeItem ? (
            <ModulePanel title="Fila de Classificação">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-brand-gold">
                  <FileSearch className="h-4 w-4" aria-hidden />
                  <span className="font-mono text-[9px] uppercase tracking-widest">
                    Classificação assistida
                  </span>
                </div>
                <p className="text-sm text-white">{activeItem.title}</p>
                <p className="font-mono text-[10px] text-zinc-500">{activeItem.fileHint}</p>

                {activeItem.classification ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeItem.classification.extractedFields.map((field) => (
                      <div
                        key={field.label}
                        className={`rounded-xl border p-3 ${
                          field.highlight
                            ? "border-brand-gold/20 bg-brand-gold/5"
                            : "border-white/5 bg-black/30"
                        }`}
                      >
                        <p className="font-mono text-[9px] uppercase text-zinc-500">{field.label}</p>
                        <p className={`mt-1 text-sm ${field.highlight ? "text-brand-gold" : "text-white"}`}>
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Aguarda classificação manual ou assistida.</p>
                )}

                <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
                  {data.availableActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.type === "marcar_validado" ? handleValidate : undefined}
                      className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 font-mono text-[8px] uppercase tracking-wider text-zinc-300 hover:border-brand-gold hover:text-brand-gold"
                    >
                      {action.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={processing}
                    onClick={handleValidate}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-gold px-4 py-2 font-mono text-[9px] font-bold uppercase text-white"
                  >
                    {processing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Marcar como validado
                  </button>
                </div>
              </div>
            </ModulePanel>
          ) : null}

          <ModulePanel title="Sugestões">
            <div className="space-y-3">
              {data.suggestions.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
                  <p className="font-medium text-white">{s.label}</p>
                  <p className="mt-1 text-zinc-500">{s.description}</p>
                </div>
              ))}
            </div>
          </ModulePanel>

          <ModulePanel title="Itens Organizados Recentemente">
            <div className="space-y-2">
              {data.recentOrganized.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-zinc-300">
                  <span>{item.title}</span>
                  <span className="font-mono text-[9px] text-zinc-500">{item.label}</span>
                </div>
              ))}
            </div>
          </ModulePanel>
        </div>
      </div>
    </ModuleShell>
  );
}
