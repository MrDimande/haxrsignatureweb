import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  AlertCircle,
  FileText,
  Palette,
  CreditCard,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { formatDateTimePtMZ } from "@/lib/formatters";
import type {
  AdminClientDecisions,
  AdminClientDecisionItem,
  AdminClientDecisionKind,
} from "@/lib/admin/services/admin-client-decisions.service";

type ClientDecisionsPanelProps = {
  clientDecisions: AdminClientDecisions;
  maxVisiblePerColumn?: number;
};

const KIND_LABELS: Record<AdminClientDecisionKind, string> = {
  proforma_approval: "Proposta",
  proforma_changes: "Alterações · Proposta",
  proforma_conversion: "Conversão Factura",
  creative_approval: "Aprovação Criativa",
  creative_changes: "Alterações · Criativo",
  payment_proof: "Comprovativo",
  date_hold: "Reserva de Data",
};

function getKindIcon(kind: AdminClientDecisionKind) {
  switch (kind) {
    case "proforma_approval":
    case "proforma_changes":
    case "proforma_conversion":
      return <FileText className="w-3.5 h-3.5" />;
    case "creative_approval":
    case "creative_changes":
      return <Palette className="w-3.5 h-3.5" />;
    case "payment_proof":
      return <CreditCard className="w-3.5 h-3.5" />;
    case "date_hold":
      return <Calendar className="w-3.5 h-3.5" />;
  }
}

function DecisionCard({ item }: { item: AdminClientDecisionItem }) {
  const isClient = item.owner === "client";

  return (
    <Link
      href={item.href}
      className="group block p-3.5 rounded-lg border border-white/[0.06] bg-[#0c0a09]/50 hover:bg-[#14110f] hover:border-admin-gold/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-mono tracking-wider uppercase ${
              isClient
                ? "bg-admin-gold/15 text-admin-gold border border-admin-gold/30"
                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
            }`}
          >
            {getKindIcon(item.kind)}
            <span>{KIND_LABELS[item.kind]}</span>
          </span>
        </div>

        {item.dueAt ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400/90 shrink-0">
            <Clock className="w-3 h-3" />
            <span>Prazo: {formatDateTimePtMZ(item.dueAt)}</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-grey/50 shrink-0">
            {formatDateTimePtMZ(item.occurredAt)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium text-white/90 group-hover:text-admin-gold transition-colors line-clamp-1">
          {item.title}
        </h4>
        <ArrowUpRight className="w-3.5 h-3.5 text-grey/40 group-hover:text-admin-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
      </div>

      {item.detail && (
        <p className="mt-1 text-xs text-grey-medium line-clamp-2 leading-relaxed">
          {item.detail}
        </p>
      )}

      {(item.clientName || item.eventName) && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-grey/60 font-mono">
          <span className="truncate">
            {item.clientName || "Cliente"}
          </span>
          {item.eventName && (
            <span className="text-grey/40 truncate max-w-[50%]">
              · {item.eventName}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function ClientDecisionsPanel({
  clientDecisions,
  maxVisiblePerColumn = 5,
}: ClientDecisionsPanelProps) {
  const { awaitingClient, awaitingHaxr, summary, coverage } = clientDecisions;

  const visibleAwaitingClient = awaitingClient.slice(0, maxVisiblePerColumn);
  const visibleAwaitingHaxr = awaitingHaxr.slice(0, maxVisiblePerColumn);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8.5px] tracking-[0.4em] uppercase text-admin-gold">
              Client Decisions
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey/50">
              Handoff Queue
            </span>
            {!coverage.complete && (
              <>
                <span className="text-white/20">·</span>
                <span className="inline-flex items-center gap-1 font-mono text-[8px] tracking-[0.15em] uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Cobertura Parcial
                </span>
              </>
            )}
          </div>
          <h2 className="font-serif text-2xl font-light text-white mt-1">
            Decisões de Clientes
          </h2>
          <p className="mt-1 text-xs text-grey-medium leading-relaxed">
            Fila factual de dependências e decisões activas entre o cliente e a HAXR.
          </p>
        </div>

        {/* Summary Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg border border-admin-gold/20 bg-admin-gold/[0.06] text-center">
            <p className="text-[9px] font-mono uppercase tracking-wider text-admin-gold">
              Aguarda Cliente
            </p>
            <p className="text-lg font-serif text-white font-light mt-0.5">
              {summary.awaitingClient}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] text-center">
            <p className="text-[9px] font-mono uppercase tracking-wider text-amber-300">
              Aguarda HAXR
            </p>
            <p className="text-lg font-serif text-white font-light mt-0.5">
              {summary.awaitingHaxr}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: Aguarda Cliente */}
        <div className="admin-card p-4 border border-white/[0.06] bg-[#0c0a09]/30 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-admin-gold" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-admin-gold">
                  Aguarda Cliente
                </h3>
              </div>
              <span className="text-[11px] font-mono text-grey/50">
                {summary.awaitingClient} {summary.awaitingClient === 1 ? "item" : "itens"}
              </span>
            </div>

            {visibleAwaitingClient.length === 0 ? (
              <div className="py-8 text-center text-grey/50 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-grey/30 stroke-[1.5]" />
                <p className="text-xs font-mono">
                  {coverage.complete
                    ? "Sem decisões pendentes do cliente."
                    : "Sem itens registados nas fontes disponíveis."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleAwaitingClient.map((item) => (
                  <DecisionCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {awaitingClient.length > maxVisiblePerColumn && (
            <p className="mt-3 text-center text-[10px] font-mono text-grey/40">
              + {awaitingClient.length - maxVisiblePerColumn} outros itens aguardando cliente
            </p>
          )}
        </div>

        {/* Column 2: Aguarda HAXR */}
        <div className="admin-card p-4 border border-white/[0.06] bg-[#0c0a09]/30 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-amber-300">
                  Aguarda HAXR
                </h3>
              </div>
              <span className="text-[11px] font-mono text-grey/50">
                {summary.awaitingHaxr} {summary.awaitingHaxr === 1 ? "item" : "itens"}
              </span>
            </div>

            {visibleAwaitingHaxr.length === 0 ? (
              <div className="py-8 text-center text-grey/50 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-grey/30 stroke-[1.5]" />
                <p className="text-xs font-mono">
                  {coverage.complete
                    ? "Sem decisões pendentes da HAXR."
                    : "Sem itens registados nas fontes disponíveis."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {visibleAwaitingHaxr.map((item) => (
                  <DecisionCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {awaitingHaxr.length > maxVisiblePerColumn && (
            <p className="mt-3 text-center text-[10px] font-mono text-grey/40">
              + {awaitingHaxr.length - maxVisiblePerColumn} outros itens aguardando HAXR
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
