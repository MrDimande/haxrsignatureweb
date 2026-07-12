"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  FileSpreadsheet,
  MessageCircle,
  UserCheck,
  Users,
} from "lucide-react";
import {
  buildEditionOpenRsvpReminderMessage,
  buildEditionWhatsAppUrl,
  buildEditionInviteUrl,
} from "@/lib/events/edition-links";
import type { EventGuest, EventStats, ManagedEvent } from "@/lib/events/types";

type EditionRsvpOpsPanelProps = {
  event: ManagedEvent;
  guests: EventGuest[];
  stats: EventStats;
  giftReservationCount?: number;
  onOpenReport?: () => void;
};

const FAREWELL_RSVP_DEADLINE = "20 de Julho de 2026";

export default function EditionRsvpOpsPanel({
  event,
  guests,
  stats,
  giftReservationCount = 0,
  onOpenReport,
}: EditionRsvpOpsPanelProps) {
  const registryKey = event.editionRegistryKey;
  const inviteUrl = registryKey ? buildEditionInviteUrl(registryKey) : null;

  const pendingGuests = useMemo(
    () => guests.filter((g) => g.status === "invited"),
    [guests]
  );

  const pendingWithPhone = useMemo(
    () => pendingGuests.filter((g) => g.phone.trim()),
    [pendingGuests]
  );

  const pendingWithoutEmail = useMemo(
    () => pendingGuests.filter((g) => !g.email.trim()),
    [pendingGuests]
  );

  const editionRsvpGuests = useMemo(
    () => guests.filter((g) => g.guestSource === "edition_rsvp"),
    [guests]
  );

  if (!registryKey) return null;

  function openWhatsAppBatch(targets: EventGuest[]) {
    for (const guest of targets) {
      const message = buildEditionOpenRsvpReminderMessage(
        event,
        guest,
        registryKey,
        { deadlineLabel: FAREWELL_RSVP_DEADLINE }
      );
      if (!message) continue;
      const url = buildEditionWhatsAppUrl(guest.phone, message);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section className="admin-card p-6 md:p-8 space-y-6 mb-8 border border-admin-gold/15">
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-admin-gold mt-0.5 shrink-0" />
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Edition · Operações RSVP
          </p>
          <h3 className="font-serif text-xl font-light text-white/90">
            Monitorização da despedida
          </h3>
          <p className="text-sm text-grey/55 mt-2 leading-relaxed max-w-2xl">
            Acompanhe confirmações do convite digital, lembrete manual por
            WhatsApp (sem email) e exportação final para a Jessica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Pendentes", value: stats.invited, warn: stats.invited > 0 },
          {
            label: "Confirmados",
            value: stats.confirmed + stats.checkedIn,
            accent: true,
          },
          { label: "Recusados", value: stats.declined },
          { label: "Via convite digital", value: editionRsvpGuests.length },
        ].map((item) => (
          <div key={item.label} className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              {item.label}
            </p>
            <p
              className={`font-serif text-2xl font-light ${
                item.warn
                  ? "text-amber-300"
                  : item.accent
                    ? "text-admin-gold"
                    : "text-white"
              }`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {inviteUrl ? (
        <p className="text-xs text-grey/50">
          Convite:{" "}
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-admin-gold/80 hover:text-admin-gold underline-offset-2 hover:underline"
          >
            {inviteUrl}
          </a>
        </p>
      ) : null}

      {pendingWithoutEmail.length > 0 ? (
        <div className="rounded-sm border border-amber-500/25 bg-amber-500/5 px-4 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-100/90 font-light">
                {pendingWithoutEmail.length} pendente(s) sem email — o cron de
                lembrete não as alcança.
              </p>
              <p className="text-xs text-grey/50 mt-1">
                Use WhatsApp para relembrar manualmente (prazo RSVP:{" "}
                {FAREWELL_RSVP_DEADLINE}).
              </p>
            </div>
          </div>
          {pendingWithPhone.length > 0 ? (
            <button
              type="button"
              onClick={() => openWhatsAppBatch(pendingWithPhone)}
              className="admin-btn-secondary text-[10px]"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp — pendentes com telefone ({pendingWithPhone.length})
            </button>
          ) : (
            <p className="text-xs text-grey/45">
              Nenhuma pendente com telefone registado.
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-grey/50">
          <UserCheck className="w-4 h-4 text-admin-gold/70" />
          Todas as pendentes têm email — lembrete automático cobre-as no cron.
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2 border-t border-grey-dark/60">
        <p className="w-full text-xs text-grey/50 mb-1">
          Presentes reservados: {giftReservationCount} · Exporte no separador
          Relatório antes do evento.
        </p>
        <button
          type="button"
          onClick={onOpenReport}
          className="admin-btn-primary"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar CSV (RSVP + presentes)
        </button>
      </div>
    </section>
  );
}
