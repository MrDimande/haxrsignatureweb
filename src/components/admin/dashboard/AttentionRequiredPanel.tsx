import Link from "next/link";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import type {
  AdminAttentionItem,
  AdminAttentionSource,
} from "@/lib/admin/services/admin-dashboard.service";

const SOURCE_LABELS: Record<AdminAttentionSource, string> = {
  commercial: "Comercial",
  portal: "Portal",
  finance: "Financeiro",
  operations: "Operações",
};

interface AttentionRequiredPanelProps {
  items: AdminAttentionItem[];
}

export default function AttentionRequiredPanel({
  items,
}: AttentionRequiredPanelProps) {
  return (
    <section className="admin-card p-6 md:p-7 relative overflow-hidden bg-gradient-to-br from-[#12100e]/80 to-[#080706] border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Panel Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-admin-gold">
            Atenção Operacional
          </span>
          <h2 className="font-serif text-xl md:text-2xl font-light text-white mt-1">
            Requer intervenção
          </h2>
          <p className="text-xs text-grey-medium mt-1 leading-relaxed">
            Pendências que requerem intervenção nos módulos operacionais.
          </p>
        </div>

        {items.length > 0 && (
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-admin-gold/10 border border-admin-gold/20 text-admin-gold font-mono text-[10px]">
            <AlertCircle className="w-3 h-3 text-admin-gold" />
            <span>{items.length}</span>
          </div>
        )}
      </div>

      {/* Items List or Empty State */}
      {items.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
          <p className="text-xs text-grey/45 font-mono">
            Sem pendências prioritárias detectadas neste momento.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04] -mx-2 sm:-mx-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-2 sm:px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase font-medium ${
                      item.priority === "high"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-white/5 text-grey-medium border border-white/10"
                    }`}
                  >
                    {item.priority === "high" ? "Alta" : "Normal"}
                  </span>
                  <span className="font-mono text-[8px] tracking-wider uppercase px-2 py-0.5 rounded bg-admin-gold/5 text-admin-gold/90 border border-admin-gold/15">
                    {SOURCE_LABELS[item.source]}
                  </span>
                </div>
                <p className="text-xs text-white/90 group-hover:text-admin-gold transition-colors truncate">
                  {item.label}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-6 sm:pl-0">
                <span className="text-[10px] font-mono text-grey/50">
                  {item.context}
                </span>
                <span className="text-[11px] font-mono text-admin-gold opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  Abrir <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
