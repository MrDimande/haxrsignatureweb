"use client";

import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  Mail,
  MessageCircle,
  PencilLine,
  Receipt,
  Crown,
  UserPlus,
} from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import type { ClientTimelineEntry } from "@/lib/admin/services/client-timeline.service";

type ClientTimelinePanelProps = {
  entries: ClientTimelineEntry[];
};

const ICONS: Record<ClientTimelineEntry["kind"], typeof FileText> = {
  client_created: UserPlus,
  event_created: Calendar,
  document_created: FileText,
  document_status: Receipt,
  email_sent: Mail,
  whatsapp_shared: MessageCircle,
  payment_received: CreditCard,
  proforma_converted: Crown,
  portal_proposal_approved: CheckCircle2,
  portal_proposal_changes: PencilLine,
};

function formatWhen(value: string): string {
  return new Date(value).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Maputo",
  });
}

export default function ClientTimelinePanel({
  entries,
}: ClientTimelinePanelProps) {
  if (entries.length === 0) {
    return (
      <section className="admin-card p-6 mb-8">
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-2">
          Vista 360º
        </p>
        <p className="text-sm text-grey/55">
          Ainda não há actividade registada para este cliente.
        </p>
      </section>
    );
  }

  return (
    <section className="admin-card p-6 md:p-8 mb-8 space-y-6">
      <div>
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-2">
          Vista 360º
        </p>
        <h2 className="font-serif text-2xl font-light text-white/90">
          Timeline de actividade
        </h2>
        <p className="text-sm text-grey/55 mt-2">
          Eventos, documentos, envios e pagamentos num só lugar.
        </p>
      </div>

      <ol className="relative border-l border-white/10 ml-3 space-y-6">
        {entries.map((entry) => {
          const Icon = ICONS[entry.kind];
          const content = (
            <>
              <span className="absolute -left-[1.35rem] flex h-7 w-7 items-center justify-center rounded-full border border-admin-gold/30 bg-black-soft text-admin-gold">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <div className="pl-4">
                <p className="text-sm text-white/90">{entry.title}</p>
                {entry.description ? (
                  <p className="text-xs text-grey/50 mt-1">{entry.description}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-grey/40">
                    {formatWhen(entry.occurredAt)}
                  </p>
                  {entry.amount != null && entry.currency ? (
                    <p className="text-xs text-admin-gold/90 font-serif">
                      {formatCurrency(entry.amount, entry.currency)}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          );

          return (
            <li key={entry.id} className="relative pl-2">
              {entry.href ? (
                <Link
                  href={entry.href}
                  className="block rounded-sm -ml-2 p-2 hover:bg-white/[0.03] transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <div className="-ml-2 p-2">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
