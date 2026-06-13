import Link from "next/link";
import { Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import type { CashAnalytics } from "@/lib/finance/types";

type EventRevenuePanelProps = {
  analytics: CashAnalytics;
};

export default function EventRevenuePanel({
  analytics,
}: EventRevenuePanelProps) {
  if (analytics.eventRevenue.length === 0) {
    return (
      <section className="admin-card p-6 md:p-8">
        <p className="font-serif text-lg font-light text-white/80">
          Receita por evento
        </p>
        <p className="text-sm text-grey/55 mt-2">
          Associe pagamentos ou documentos a eventos para ver a rentabilidade por
          projecto.
        </p>
      </section>
    );
  }

  return (
    <section className="admin-card p-6 md:p-8 space-y-6">
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-admin-gold/70 shrink-0 mt-0.5" />
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Receita por evento
          </p>
          <h3 className="font-serif text-xl font-light text-white/90">
            Rentabilidade por projecto
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {analytics.eventRevenue.slice(0, 10).map((row) => (
          <div
            key={`${row.eventId ?? row.eventName}`}
            className="border border-grey-dark/60 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                {row.eventId ? (
                  <Link
                    href={`/admin/events/${row.eventId}`}
                    className="font-serif text-lg text-white/90 hover:text-admin-gold transition-colors line-clamp-1"
                  >
                    {row.eventName}
                  </Link>
                ) : (
                  <p className="font-serif text-lg text-white/90 line-clamp-1">
                    {row.eventName}
                  </p>
                )}
                {row.eventDate ? (
                  <p className="text-[10px] font-mono text-grey/45 mt-1">
                    {new Date(row.eventDate).toLocaleDateString("pt-MZ", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "Africa/Maputo",
                    })}
                  </p>
                ) : null}
              </div>
              <p
                className={`font-serif text-xl font-light ${
                  row.netMargin >= 0
                    ? "text-emerald-300/90"
                    : "text-red-300/80"
                }`}
              >
                {formatCurrency(row.netMargin)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div>
                <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
                  Recebido
                </p>
                <p className="text-sm text-white/80">
                  {formatCurrency(row.received)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
                  Pendente
                </p>
                <p className="text-sm text-amber-300/80">
                  {formatCurrency(row.pending)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase text-grey/45 mb-1">
                  Despesas
                </p>
                <p className="text-sm text-red-200/70">
                  {formatCurrency(row.expenses)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
