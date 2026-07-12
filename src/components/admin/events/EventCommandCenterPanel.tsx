import Link from "next/link";
import {
  ClipboardList,
  Activity,
  AlertTriangle,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/admin/constants";
import {
  buildEventHealthSignals,
  type CommandCenterCriticalTask,
  type EventCommandCenterData,
} from "@/lib/admin/services/event-command-center.service";
import type { EventStats, ManagedEvent } from "@/lib/events/types";
import DateHoldBadge from "@/components/shared/DateHoldBadge";

type EventCommandCenterPanelProps = {
  event: ManagedEvent;
  guestStats: EventStats;
  command: EventCommandCenterData;
  clientPortalUrl?: string | null;
  onOpenTab?: (tab: "review" | "concierge" | "portal") => void;
};

const toneClasses = {
  neutral: "text-white/80",
  good: "text-emerald-300",
  warn: "text-amber-300",
  gold: "text-admin-gold",
} as const;

export default function EventCommandCenterPanel({
  event,
  guestStats,
  command,
  clientPortalUrl = null,
  onOpenTab,
}: EventCommandCenterPanelProps) {
  const health = buildEventHealthSignals(event, guestStats, command);

  function renderTaskAction(task: CommandCenterCriticalTask) {
    if (!task.tab || !onOpenTab) return null;
    return (
      <button
        type="button"
        onClick={() => onOpenTab(task.tab!)}
        className="text-[10px] font-mono uppercase tracking-wider text-admin-gold hover:underline"
      >
        Abrir
      </button>
    );
  }

  return (
    <section className="admin-card p-6 md:p-8 mb-8 border-admin-gold/15 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
            Command Center
          </p>
          <h3 className="font-serif text-2xl font-light text-white/90">
            Centro de comando do evento
          </h3>
          <p className="text-sm text-grey/55 mt-2 max-w-2xl">
            Operação, convidados, comercial e Concierge num painel único.
          </p>
          <div className="mt-3">
            <DateHoldBadge holdUntil={event.dateHoldUntil} variant="admin" />
          </div>
        </div>
        {clientPortalUrl ? (
          <a
            href={clientPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-secondary"
          >
            Pré-visualizar portal
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="admin-stat-card">
          <Users className="w-4 h-4 text-admin-gold/70 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Confirmados
          </p>
          <p className="font-serif text-2xl text-admin-gold">
            {guestStats.confirmed + guestStats.checkedIn}
          </p>
        </div>
        <div className="admin-stat-card">
          <Activity className="w-4 h-4 text-admin-gold/70 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Taxa RSVP
          </p>
          <p className="font-serif text-2xl">{guestStats.confirmationRate}%</p>
        </div>
        <div className="admin-stat-card">
          <Wallet className="w-4 h-4 text-admin-gold/70 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Recebido
          </p>
          <p className="font-serif text-xl">
            {formatCurrency(command.financial.received, command.financial.currency)}
          </p>
        </div>
        <div className="admin-stat-card">
          <AlertTriangle className="w-4 h-4 text-amber-300/80 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Pendente
          </p>
          <p className="font-serif text-xl text-amber-200/90">
            {formatCurrency(command.financial.pending, command.financial.currency)}
          </p>
        </div>
        <div className="admin-stat-card">
          <Sparkles className="w-4 h-4 text-admin-gold/70 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Concierge
          </p>
          <p className="font-serif text-2xl">{command.conciergePending}</p>
        </div>
        <div className="admin-stat-card">
          <ClipboardList className="w-4 h-4 text-amber-300/80 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Fila convidados
          </p>
          <p className="font-serif text-2xl text-amber-200/90">{command.reviewOpen}</p>
        </div>
        <div className="admin-stat-card">
          <Users className="w-4 h-4 text-admin-gold/70 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Pendentes RSVP
          </p>
          <p className="font-serif text-2xl">{guestStats.invited}</p>
        </div>
        <div className="admin-stat-card">
          <Activity className="w-4 h-4 text-admin-gold/70 mb-2" />
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
            Lugares
          </p>
          <p className="font-serif text-xl">
            {guestStats.assignedSeats}/{guestStats.totalSeats}
          </p>
        </div>
      </div>

      {command.criticalTasks.length > 0 ? (
        <div className="border-t border-white/5 pt-5 space-y-3">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45">
            Tarefas críticas
          </p>
          <ul className="space-y-2">
            {command.criticalTasks.map((task) => (
              <li
                key={task.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-3 border ${
                  task.priority === "high"
                    ? "border-amber-400/25 bg-amber-500/5"
                    : "border-white/5"
                }`}
              >
                <div>
                  <p className="text-sm text-white/90">{task.label}</p>
                  {task.detail ? (
                    <p className="text-xs text-grey/50 mt-1">{task.detail}</p>
                  ) : null}
                </div>
                {renderTaskAction(task)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {command.payments.length > 0 ? (
        <div className="border-t border-white/5 pt-5 space-y-3">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45">
            Pagamentos
          </p>
          <ul className="space-y-2">
            {command.payments.slice(0, 5).map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 border border-white/5"
              >
                <p className="text-sm text-white/85">
                  {payment.reference || payment.sourceDocumentNumber || "Pagamento"}
                </p>
                <p className="font-serif text-base">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {health.map((signal) => (
          <span
            key={signal.label}
            className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] tracking-[0.2em] uppercase"
          >
            <span className="text-grey/45">{signal.label}</span>
            <span className={toneClasses[signal.tone]}>{signal.value}</span>
          </span>
        ))}
      </div>

      {command.documents.length > 0 ? (
        <div className="border-t border-white/5 pt-5 space-y-3">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45">
            Documentos comerciais
          </p>
          <ul className="space-y-2">
            {command.documents.slice(0, 5).map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/admin/documents/${doc.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 border border-white/5 hover:border-admin-gold/20 transition-colors"
                >
                  <div>
                    <p className="text-sm font-mono text-white/85">
                      {doc.documentNumber}
                    </p>
                    <p className="text-xs text-grey/50 mt-1">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]} ·{" "}
                      {DOCUMENT_STATUS_LABELS[doc.status]}
                      {doc.clientApprovalStatus
                        ? ` · ${doc.clientApprovalStatus}`
                        : ""}
                    </p>
                  </div>
                  <p className="font-serif text-base">
                    {formatCurrency(doc.totals.grandTotal, doc.totals.currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
