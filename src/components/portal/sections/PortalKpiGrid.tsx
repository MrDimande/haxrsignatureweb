import Link from "next/link";
import { formatCurrency } from "@/lib/calculations";
import type { PortalDashboardData } from "@/lib/portal/services/portal-dashboard.service";
import { portalHref } from "@/lib/portal/portal-routes";
import DateHoldBadge from "@/components/shared/DateHoldBadge";

type PortalKpiGridProps = {
  data: PortalDashboardData;
};

export default function PortalKpiGrid({ data }: PortalKpiGridProps) {
  const items = [
    { label: "Eventos", value: String(data.financial.eventCount) },
    {
      label: "Valor contratado",
      value: formatCurrency(data.financial.invoicedTotal, data.financial.currency),
    },
    {
      label: "Valor pago",
      value: formatCurrency(data.financial.receivedTotal, data.financial.currency),
    },
    {
      label: "Saldo pendente",
      value: formatCurrency(data.financial.pendingBalance, data.financial.currency),
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="border border-white/10 rounded-sm p-4 bg-white/[0.02]"
        >
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45">
            {item.label}
          </p>
          <p className="font-serif text-xl md:text-2xl mt-2">{item.value}</p>
        </div>
      ))}
    </section>
  );
}

type PortalProgressOverviewProps = {
  data: PortalDashboardData;
  token: string;
  showLink?: boolean;
};

export function PortalProgressOverview({
  data,
  token,
  showLink = false,
}: PortalProgressOverviewProps) {
  return (
    <section className="border border-white/10 rounded-sm p-5 bg-white/[0.02] space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Progresso do projecto
        </p>
        {showLink ? (
          <Link
            href={portalHref(token, "cronograma")}
            className="text-[10px] font-mono uppercase tracking-wider text-admin-gold hover:underline"
          >
            Ver cronograma
          </Link>
        ) : null}
      </div>
      <DateHoldBadge holdUntil={data.activeDateHoldUntil} variant="portal" />
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-admin-gold transition-all"
          style={{ width: `${data.overallProgressPercent}%` }}
        />
      </div>
      <p className="text-sm text-grey/55">
        {data.overallProgressPercent}% concluído
        {data.nextDecision ? ` · Próximo: ${data.nextDecision.title}` : ""}
      </p>
    </section>
  );
}
