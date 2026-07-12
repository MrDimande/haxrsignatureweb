"use client";

import { useMemo } from "react";
import { Mail, Phone, User } from "lucide-react";
import type { EventContactProfileRow } from "@/lib/events/repositories/event-contact-profiles.repository";
import type { EventGuest } from "@/lib/events/types";

type EventContactProfilesPanelProps = {
  contacts: EventContactProfileRow[];
  guests: EventGuest[];
};

const SOURCE_LABELS: Record<EventContactProfileRow["source"], string> = {
  rsvp: "RSVP",
  google_sheet: "Google Sheets",
  csv_upload: "CSV",
  admin: "Admin",
  edition_rsvp: "Edition RSVP",
  checkin: "Check-in",
  unknown: "Desconhecida",
};

const CONSENT_LABELS: Record<EventContactProfileRow["consent_status"], string> =
  {
    operational_only: "Apenas operacional",
    marketing_granted: "Marketing autorizado",
    marketing_denied: "Marketing recusado",
    unknown: "Consentimento desconhecido",
  };

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Maputo",
  });
}

export default function EventContactProfilesPanel({
  contacts,
  guests,
}: EventContactProfilesPanelProps) {
  const guestById = useMemo(
    () => new Map(guests.map((guest) => [guest.id, guest])),
    [guests]
  );

  return (
    <section className="admin-card p-6">
      <header className="mb-6">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-2">
          Contactos do evento
        </h2>
        <p className="text-sm text-grey/55 max-w-2xl">
          Base operacional de emails e telefones recolhidos via RSVP, import e
          admin. Não é utilizada para marketing sem consentimento explícito.
        </p>
      </header>

      {contacts.length === 0 ? (
        <p className="text-sm text-grey/50 py-8 text-center border border-dashed border-grey-dark/60 rounded-sm">
          Ainda não há contactos com email ou telefone registados para este
          evento.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-grey-dark/80 text-grey/50 font-mono text-[8px] tracking-[0.2em] uppercase">
                <th className="py-3 pr-4">Nome</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Telefone</th>
                <th className="py-3 pr-4">Origem</th>
                <th className="py-3 pr-4">Convidado associado</th>
                <th className="py-3 pr-4">Consentimento</th>
                <th className="py-3">Última actualização</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const linkedGuest = contact.guest_id
                  ? guestById.get(contact.guest_id)
                  : undefined;
                const displayName = contact.full_name?.trim() || "—";
                const email = contact.email?.trim() || null;
                const phone = contact.phone?.trim() || null;

                return (
                  <tr
                    key={contact.id}
                    className="border-b border-grey-dark/40 hover:bg-white/[0.02]"
                  >
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-2 text-white/90">
                        <User className="w-3.5 h-3.5 text-grey/40 shrink-0" />
                        {displayName}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-grey/70">
                      {email ? (
                        <span className="inline-flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-grey/40 shrink-0" />
                          {email}
                        </span>
                      ) : (
                        <span className="text-grey/40">Sem contacto</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-grey/70">
                      {phone ? (
                        <span className="inline-flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-grey/40 shrink-0" />
                          {phone}
                        </span>
                      ) : (
                        <span className="text-grey/40">Sem contacto</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-grey/60">
                      {SOURCE_LABELS[contact.source]}
                    </td>
                    <td className="py-3 pr-4 text-grey/70">
                      {linkedGuest?.name ?? (
                        <span className="text-grey/40 italic">
                          {contact.guest_id ? "Convidado removido" : "—"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-sm px-2 py-1 text-[10px] font-mono tracking-wide ${
                          contact.consent_status === "marketing_granted"
                            ? "bg-emerald-500/10 text-emerald-200"
                            : "bg-slate-500/10 text-slate-300"
                        }`}
                      >
                        {CONSENT_LABELS[contact.consent_status]}
                      </span>
                    </td>
                    <td className="py-3 text-grey/50 text-xs whitespace-nowrap">
                      {formatDateTime(contact.last_seen_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
