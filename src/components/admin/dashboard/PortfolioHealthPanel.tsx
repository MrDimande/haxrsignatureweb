import Link from "next/link";
import { ArrowUpRight, Calendar, Users, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type {
  EventPortfolioHealthItem,
  EventPortfolioHealthSummary,
} from "@/lib/admin/services/event-portfolio.service";

type PortfolioHealthPanelProps = {
  items: EventPortfolioHealthItem[];
  summary: EventPortfolioHealthSummary;
  businessMap: Map<string, string>;
  maxVisible?: number;
};

function formatEventDate(date: string | null): string {
  if (!date) return "Data por definir";
  return new Date(date).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function PortfolioHealthPanel({
  items,
  summary,
  businessMap,
  maxVisible = 8,
}: PortfolioHealthPanelProps) {
  const visibleItems = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <section className="space-y-4">
      {/* Header & Summary KPIs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8.5px] tracking-[0.4em] uppercase text-admin-gold">
              Portfolio Operations
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey/50">
              Saúde Operacional
            </span>
          </div>
          <h2 className="font-serif text-2xl font-light text-white mt-1">
            Projectos &amp; Intervenção
          </h2>
          <p className="mt-1 text-xs text-grey-medium leading-relaxed">
            Visão consolidada e explicável das pendências operacionais em eventos activos.
          </p>
        </div>

        {/* Factual Summary Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {summary.priority > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-[9px] font-medium tracking-wider uppercase text-amber-300">
                {summary.priority} {summary.priority === 1 ? "Prioridade" : "Prioridades"}
              </span>
            </div>
          )}

          {summary.attention > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <span className="font-mono text-[9px] font-medium tracking-wider uppercase text-yellow-300">
                {summary.attention} Atenção
              </span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[9px] font-medium tracking-wider uppercase text-emerald-300">
              {summary.clearComplete} Sem Pendências
            </span>
          </div>

          {summary.partialCoverage > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 flex items-center gap-2">
              <span className="font-mono text-[9px] font-medium tracking-wider uppercase text-neutral-400">
                {summary.partialCoverage} Cobertura Parcial
              </span>
            </div>
          )}

          <Link
            href="/admin/events"
            className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80 ml-2 shrink-0 inline-flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="admin-card overflow-hidden border border-admin-gold/15 bg-gradient-to-b from-[#12100e] to-[#080706] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {visibleItems.length > 0 ? (
          <>
            {/* ── Desktop Table (md+) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                    <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                      Projecto / Cliente
                    </th>
                    <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                      Data &amp; Tipo
                    </th>
                    <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                      Estado Operacional
                    </th>
                    <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                      Motivos &amp; Pendências
                    </th>
                    <th className="px-6 py-4 text-left font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                      Operação &amp; Convidados
                    </th>
                    <th className="px-6 py-4 text-right font-mono text-[8.5px] font-semibold tracking-[0.25em] uppercase text-grey-medium">
                      Acção
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {visibleItems.map((item) => {
                    const { operational, status, coverage, reasons } = item;
                    const { event, guests, documents } = operational;
                    const businessName = businessMap.get(event.businessId);

                    return (
                      <tr
                        key={event.id}
                        className="group transition-all duration-300 hover:bg-white/[0.02]"
                      >
                        {/* Projecto & Cliente */}
                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="text-[13.5px] font-serif font-light text-white group-hover:text-admin-gold transition-colors duration-300 block"
                          >
                            {event.name}
                          </Link>
                          <p className="text-[10px] font-mono tracking-[0.05em] text-grey-medium mt-1">
                            {event.clientName ? event.clientName : "Cliente não atribuído"}
                            {businessName ? ` · ${businessName}` : ""}
                          </p>
                        </td>

                        {/* Data & Tipo */}
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-grey-dark/90">
                            <Calendar className="w-3.5 h-3.5 text-admin-gold/70" strokeWidth={1.5} />
                            {formatEventDate(event.date)}
                          </span>
                          <p className="text-[10px] font-mono text-grey/50 mt-1">
                            {EVENT_TYPE_LABELS[event.type] || event.type}
                          </p>
                        </td>

                        {/* Estado Operacional */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-1">
                            {status === "priority" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                PRIORIDADE
                              </span>
                            )}

                            {status === "attention" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-yellow-500/10 text-yellow-300 border border-yellow-500/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                REQUER ATENÇÃO
                              </span>
                            )}

                            {status === "clear" && coverage === "complete" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                SEM PENDÊNCIAS DETECTADAS
                              </span>
                            )}

                            {status === "clear" && coverage === "partial" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-neutral-900 text-neutral-400 border border-neutral-700">
                                <Clock className="w-3 h-3 text-neutral-400" />
                                COBERTURA PARCIAL
                              </span>
                            )}

                            {coverage === "partial" && status !== "clear" && (
                              <span className="text-[8px] font-mono text-neutral-500 tracking-wide">
                                Cobertura parcial
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Motivos & Pendências */}
                        <td className="px-6 py-5">
                          {reasons.length > 0 ? (
                            <div className="space-y-1">
                              {reasons.map((reason, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 text-xs font-mono"
                                >
                                  <span
                                    className={`w-1 h-1 rounded-full ${
                                      reason.priority === "high"
                                        ? "bg-amber-400"
                                        : "bg-yellow-400"
                                    }`}
                                  />
                                  <span
                                    className={
                                      reason.priority === "high"
                                        ? "text-amber-200/90"
                                        : "text-yellow-200/80"
                                    }
                                  >
                                    {reason.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : coverage === "partial" ? (
                            <span className="text-xs text-grey/40 font-mono italic">
                              Áreas adicionais não avaliadas
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-400/80 font-mono">
                              Sem pendências nos fluxos avaliados
                            </span>
                          )}
                        </td>

                        {/* Operação & Convidados */}
                        <td className="px-6 py-5">
                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex items-center gap-1.5 text-grey-dark/80">
                              <Users className="w-3.5 h-3.5 text-grey-medium" />
                              <span>
                                {guests.confirmed} / {guests.totalGuests} confirmados
                              </span>
                            </div>
                            {guests.unassigned > 0 && (
                              <p className="text-[10.5px] text-amber-400/80">
                                ⚠ {guests.unassigned} sem lugar
                              </p>
                            )}
                            {documents.openCount > 0 && (
                              <p className="text-[10.5px] text-grey/50">
                                {documents.openCount}{" "}
                                {documents.openCount === 1 ? "documento aberto" : "documentos abertos"}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Acção */}
                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase text-admin-gold border border-admin-gold/20 bg-admin-gold/5 hover:bg-admin-gold/15 hover:border-admin-gold/40 transition-all duration-200"
                          >
                            <span>Abrir projecto</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card List (<md) ── */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {visibleItems.map((item) => {
                const { operational, status, coverage, reasons } = item;
                const { event, guests, documents } = operational;
                const businessName = businessMap.get(event.businessId);

                return (
                  <div key={event.id} className="p-4 space-y-3">
                    {/* Row 1: Status Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {status === "priority" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          PRIORIDADE
                        </span>
                      )}
                      {status === "attention" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-yellow-500/10 text-yellow-300 border border-yellow-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          REQUER ATENÇÃO
                        </span>
                      )}
                      {status === "clear" && coverage === "complete" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          SEM PENDÊNCIAS
                        </span>
                      )}
                      {status === "clear" && coverage === "partial" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-medium tracking-wider uppercase bg-neutral-900 text-neutral-400 border border-neutral-700">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          COBERTURA PARCIAL
                        </span>
                      )}
                      {coverage === "partial" && status !== "clear" && (
                        <span className="text-[8px] font-mono text-neutral-500 tracking-wide">
                          Cobertura parcial
                        </span>
                      )}
                    </div>

                    {/* Row 2: Event Name & Client/Business */}
                    <div>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-sm font-serif font-light text-white hover:text-admin-gold transition-colors break-words block"
                      >
                        {event.name}
                      </Link>
                      <p className="text-[10px] font-mono tracking-[0.05em] text-grey-medium mt-0.5 break-words">
                        {event.clientName ? event.clientName : "Cliente não atribuído"}
                        {businessName ? ` · ${businessName}` : ""}
                      </p>
                    </div>

                    {/* Row 3: Date & Type */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-grey-dark/90">
                        <Calendar className="w-3.5 h-3.5 text-admin-gold/70 shrink-0" strokeWidth={1.5} />
                        {formatEventDate(event.date)}
                      </span>
                      <span className="text-[10px] font-mono text-grey/50">
                        {EVENT_TYPE_LABELS[event.type] || event.type}
                      </span>
                    </div>

                    {/* Row 4: Reasons */}
                    {reasons.length > 0 && (
                      <div className="space-y-1">
                        {reasons.map((reason, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs font-mono">
                            <span
                              className={`w-1 h-1 rounded-full shrink-0 ${
                                reason.priority === "high" ? "bg-amber-400" : "bg-yellow-400"
                              }`}
                            />
                            <span
                              className={
                                reason.priority === "high"
                                  ? "text-amber-200/90 break-words"
                                  : "text-yellow-200/80 break-words"
                              }
                            >
                              {reason.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {reasons.length === 0 && coverage === "partial" && (
                      <p className="text-xs text-grey/40 font-mono italic">
                        Áreas adicionais não avaliadas
                      </p>
                    )}
                    {reasons.length === 0 && coverage !== "partial" && status === "clear" && (
                      <p className="text-xs text-emerald-400/80 font-mono">
                        Sem pendências nos fluxos avaliados
                      </p>
                    )}

                    {/* Row 5: Guests & Docs */}
                    <div className="flex items-center gap-3 flex-wrap text-xs font-mono text-grey-dark/80">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-grey-medium" />
                        {guests.confirmed} / {guests.totalGuests} confirmados
                      </span>
                      {guests.unassigned > 0 && (
                        <span className="text-amber-400/80">
                          ⚠ {guests.unassigned} sem lugar
                        </span>
                      )}
                      {documents.openCount > 0 && (
                        <span className="text-grey/50">
                          {documents.openCount}{" "}
                          {documents.openCount === 1 ? "doc. aberto" : "docs. abertos"}
                        </span>
                      )}
                    </div>

                    {/* Footer: Action */}
                    <div className="pt-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider uppercase text-admin-gold border border-admin-gold/20 bg-admin-gold/5 hover:bg-admin-gold/15 transition-all"
                      >
                        <span>Abrir projecto</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-6">
            <AlertCircle className="w-8 h-8 text-grey/30 mx-auto mb-3" />
            <h3 className="font-serif text-lg text-white font-light">
              Nenhum projecto operacional activo neste momento.
            </h3>
            <p className="text-xs text-grey-medium mt-1 font-mono">
              Os eventos concluídos permanecem disponíveis no arquivo.
            </p>
          </div>
        )}

        {/* Footer info if items exceed visible limit */}
        {hasMore && (
          <div className="border-t border-white/[0.04] px-6 py-3.5 bg-white/[0.01] flex items-center justify-between">
            <span className="text-[10px] font-mono text-grey/50">
              A mostrar {visibleItems.length} de {items.length} projectos operacionais
            </span>
            <Link
              href="/admin/events"
              className="text-[10px] font-mono text-admin-gold hover:underline inline-flex items-center gap-1"
            >
              <span>Ver todos os eventos</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
