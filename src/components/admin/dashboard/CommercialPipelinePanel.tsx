import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";
import { projectTypeLabels } from "@/lib/site-config";
import { formatDateTimePtMZ } from "@/lib/formatters";
import type { AdminCommercialPipeline } from "@/lib/admin/services/admin-commercial-pipeline.service";

type CommercialPipelinePanelProps = {
  commercial: AdminCommercialPipeline;
  maxVisible?: number;
};

export default function CommercialPipelinePanel({
  commercial,
  maxVisible = 6,
}: CommercialPipelinePanelProps) {
  const { summary, items } = commercial;
  const visibleItems = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8.5px] tracking-[0.4em] uppercase text-admin-gold">
              Commercial
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey/50">
              Inbound Lifecycle
            </span>
          </div>
          <h2 className="font-serif text-2xl font-light text-white mt-1">
            Pipeline de Leads
          </h2>
          <p className="mt-1 text-xs text-grey-medium leading-relaxed">
            Estado actual dos pedidos comerciais recebidos pela HAXR.
          </p>
        </div>

        <Link
          href="/admin/leads"
          className="font-mono text-[9px] tracking-[0.3em] uppercase text-admin-gold hover:opacity-80 inline-flex items-center gap-1 shrink-0"
        >
          <span>Ver todos os leads</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Activos */}
        <div className="admin-card p-3.5 border border-admin-gold/20 bg-admin-gold/[0.04]">
          <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-admin-gold">
            Activos
          </p>
          <p className="font-serif text-2xl font-light text-white mt-1">
            {summary.active}
          </p>
          <p className="text-[10px] text-admin-gold/70 font-mono mt-0.5">
            Novos + contactados
          </p>
        </div>

        {/* Novos */}
        <div className="admin-card p-3.5 border border-white/[0.06] bg-[#0c0a09]/50">
          <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium">
            Novos
          </p>
          <p className="font-serif text-2xl font-light text-amber-400 mt-1">
            {summary.new}
          </p>
          <p className="text-[10px] text-grey/50 font-mono mt-0.5">
            Aguardam resposta
          </p>
        </div>

        {/* Contactados */}
        <div className="admin-card p-3.5 border border-white/[0.06] bg-[#0c0a09]/50">
          <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium">
            Contactados
          </p>
          <p className="font-serif text-2xl font-light text-white/90 mt-1">
            {summary.contacted}
          </p>
          <p className="text-[10px] text-grey/50 font-mono mt-0.5">
            Contacto registado
          </p>
        </div>

        {/* Convertidos */}
        <div className="admin-card p-3.5 border border-white/[0.06] bg-[#0c0a09]/50">
          <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium">
            Convertidos
          </p>
          <p className="font-serif text-2xl font-light text-emerald-400/90 mt-1">
            {summary.converted}
          </p>
          <p className="text-[10px] text-grey/50 font-mono mt-0.5">
            Conversão registada
          </p>
        </div>

        {/* Arquivados */}
        <div className="admin-card p-3.5 border border-white/[0.06] bg-[#0c0a09]/50 col-span-2 sm:col-span-1">
          <p className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-grey-medium">
            Arquivados
          </p>
          <p className="font-serif text-2xl font-light text-grey/60 mt-1">
            {summary.archived}
          </p>
          <p className="text-[10px] text-grey/40 font-mono mt-0.5">
            Fora do pipeline activo
          </p>
        </div>
      </div>

      {/* Active Leads Cards / Empty States */}
      {summary.total === 0 ? (
        /* Empty Case A: No leads at all */
        <div className="admin-card text-center py-12 px-6 border border-white/5 bg-[#0c0a09]/40 rounded-xl">
          <Inbox className="w-8 h-8 text-grey/30 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-white font-light">
            Nenhum lead registado.
          </h3>
          <p className="text-xs text-grey-medium mt-1 font-mono">
            Os pedidos enviados pelo website aparecerão aqui.
          </p>
        </div>
      ) : summary.active === 0 ? (
        /* Empty Case B: Inquiries exist, but none are active */
        <div className="admin-card text-center py-12 px-6 border border-white/5 bg-[#0c0a09]/40 rounded-xl">
          <Inbox className="w-8 h-8 text-grey/30 mx-auto mb-3" />
          <h3 className="font-serif text-lg text-white font-light">
            Sem leads activos neste momento.
          </h3>
          <p className="text-xs text-grey-medium mt-1 font-mono">
            Os convertidos e arquivados permanecem reflectidos no resumo comercial.
          </p>
        </div>
      ) : (
        /* Populated Active Leads Grid */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map((inquiry) => {
              const isNew = inquiry.status === "new";
              const typeLabel =
                projectTypeLabels[inquiry.projectType] ?? inquiry.projectType;

              return (
                <div
                  key={inquiry.id}
                  className="admin-card p-5 border border-white/[0.04] bg-[#0c0a09]/60 hover:border-admin-gold/25 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                >
                  <div>
                    {/* Top Row: Project Type & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="font-mono text-[9px] text-admin-gold font-medium uppercase tracking-wider truncate">
                          {typeLabel || "Geral"}
                        </span>
                        {inquiry.packageLabel && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase bg-white/[0.04] text-grey-medium border border-white/[0.08]">
                            {inquiry.packageLabel}
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[8px] font-mono tracking-wider uppercase shrink-0 ${
                          isNew
                            ? "bg-admin-gold/15 text-admin-gold border border-admin-gold/30"
                            : "bg-white/[0.06] text-white/80 border border-white/10"
                        }`}
                      >
                        {isNew ? "NOVO" : "CONTACTADO"}
                      </span>
                    </div>

                    {/* Name & Email */}
                    <h3 className="font-serif text-base font-light text-white group-hover:text-admin-gold transition-colors break-words">
                      {inquiry.name}
                    </h3>
                    <p className="text-[10px] text-grey/60 font-mono break-words mt-0.5">
                      {inquiry.email}
                    </p>

                    {/* Intent Excerpt */}
                    <p className="text-xs text-grey-dark/85 italic line-clamp-2 mt-3 leading-relaxed break-words">
                      &ldquo;{inquiry.intent || "Sem mensagem complementar."}&rdquo;
                    </p>
                  </div>

                  {/* Bottom Row: Date & Action */}
                  <div className="border-t border-white/[0.04] pt-4 mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-grey/40">
                      Actualizado · {formatDateTimePtMZ(inquiry.updatedAt)}
                    </span>

                    <Link
                      href="/admin/leads"
                      className="font-mono text-[9px] tracking-wider uppercase text-admin-gold hover:text-white inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Gerir lead</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer when items exceed display limit */}
          {hasMore && (
            <div className="border border-white/[0.04] px-6 py-3.5 bg-white/[0.01] rounded-xl flex items-center justify-between">
              <span className="text-[10px] font-mono text-grey/50">
                A mostrar {visibleItems.length} de {items.length} leads activos
              </span>
              <Link
                href="/admin/leads"
                className="text-[10px] font-mono text-admin-gold hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todos os leads</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
