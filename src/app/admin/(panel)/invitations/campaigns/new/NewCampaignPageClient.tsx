"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCampaignAction,
  createSenderAction,
} from "@/lib/campaigns/actions/campaigns.actions";
import type { SenderKind, SenderProfile } from "@/lib/campaigns/types";
import { SENDER_KIND_LABELS } from "@/lib/campaigns/sender-profiles";

type EventOption = {
  id: string;
  name: string;
  date: string | null;
  location: string;
  editionRegistryKey: string;
  clientName: string | null;
};

type GuestOption = {
  id: string;
  name: string;
  phone: string;
};

type InviteOption = {
  registryKey: string;
  label: string;
  inviteSlug: string;
};

type SendModeStatus = {
  mode: string;
  manualAllowed: boolean;
  automaticBlocked: true;
  automaticBlockReason: string;
};

const DEFAULT_TEMPLATE = `Olá {{guest_name}}!

Com carinho, {{couple_names}} convidam-no(a) para {{event_name}}.

📅 {{event_date}}
📍 {{event_location}}

Confirme até {{rsvp_deadline}}:
{{invitation_url}}

— {{sender_name}}`;

type Props = {
  events: EventOption[];
  selectedEventId: string;
  guests: GuestOption[];
  senders: SenderProfile[];
  invites: InviteOption[];
  sendMode: SendModeStatus;
  defaultRegistryKey: string;
};

export default function NewCampaignPageClient({
  events,
  selectedEventId,
  guests,
  senders: initialSenders,
  invites,
  sendMode,
  defaultRegistryKey,
}: Props) {
  const router = useRouter();
  const [eventId, setEventId] = useState(selectedEventId);
  const [name, setName] = useState("Convites — lote 1");
  const [registryKey, setRegistryKey] = useState(defaultRegistryKey);
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE);
  const [senderProfileId, setSenderProfileId] = useState(
    initialSenders.find((s) => s.isDefault)?.id ?? initialSenders[0]?.id ?? ""
  );
  const [senders, setSenders] = useState(initialSenders);
  const [coupleNames, setCoupleNames] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [batchKey, setBatchKey] = useState("lote-1");
  const [previewLimit, setPreviewLimit] = useState(25);
  const [testMode, setTestMode] = useState(true);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>(
    guests.map((g) => g.id)
  );
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newSenderKind, setNewSenderKind] =
    useState<SenderKind>("manual_authenticated_whatsapp");
  const [newSenderName, setNewSenderName] = useState("");
  const [newSenderPhone, setNewSenderPhone] = useState("");

  const event = useMemo(
    () => events.find((e) => e.id === eventId) ?? null,
    [events, eventId]
  );

  async function handleCreateSender() {
    if (!eventId) {
      setError("Seleccione um evento antes de criar sender.");
      return;
    }
    setError(null);
    const result = await createSenderAction({
      eventId,
      senderKind: newSenderKind,
      publicName: newSenderName,
      phone: newSenderPhone,
      isDefault: senders.length === 0,
    });
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSenders((prev) => [...prev, result.data]);
    setSenderProfileId(result.data.id);
    setNewSenderName("");
    setNewSenderPhone("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) {
      setError("Evento obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);

    const selectedGuests = guests.filter((g) =>
      selectedGuestIds.includes(g.id)
    );
    if (!selectedGuests.length) {
      setError("Seleccione pelo menos um destinatário.");
      setSaving(false);
      return;
    }

    const result = await createCampaignAction({
      eventId: event.id,
      name,
      invitationRegistryKey: registryKey,
      messageTemplate,
      senderProfileId: senderProfileId || null,
      scheduledAt: scheduledAt || null,
      rsvpDeadline,
      coupleNames: coupleNames || event.clientName || "",
      idempotencyKey: idempotencyKey || null,
      batchKey,
      recipientsSelection: {
        mode: "selected_guests",
        selectedGuestIds,
      },
      previewLimit,
      testMode,
      eventName: event.name,
      eventDate: event.date
        ? new Date(event.date).toLocaleDateString("pt-MZ", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone: "Africa/Maputo",
          })
        : "",
      eventLocation: event.location,
      guests: selectedGuests.map((g) => ({
        guestId: g.id,
        guestName: g.name,
        phone: g.phone,
      })),
    });

    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(
      `/admin/invitations/campaigns/${result.data.id}?eventId=${event.id}`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="admin-card p-4 text-sm text-grey/70">
        Modo actual:{" "}
        <span className="font-mono text-admin-gold">{sendMode.mode}</span>
        {" — "}
        {sendMode.manualAllowed
          ? "após criar, use operações manuais wa.me."
          : sendMode.automaticBlockReason}
      </div>

      {error ? (
        <div className="admin-card p-4 border border-red-500/30 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-card p-6 space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Evento · Convite · Destinatários
        </h2>

        <label className="block space-y-1.5">
          <span className="admin-label">Evento</span>
          <select
            className="admin-input"
            value={eventId}
            onChange={(e) => {
              const id = e.target.value;
              setEventId(id);
              router.push(
                id
                  ? `/admin/invitations/campaigns/new?eventId=${id}`
                  : "/admin/invitations/campaigns/new"
              );
            }}
            required
          >
            <option value="">Seleccionar…</option>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="admin-label">Nome da campanha</span>
          <input
            className="admin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="admin-label">Convite Edition</span>
          <select
            className="admin-input"
            value={registryKey}
            onChange={(e) => setRegistryKey(e.target.value)}
            required
          >
            <option value="">Seleccionar…</option>
            {invites.map((invite) => (
              <option key={invite.registryKey} value={invite.registryKey}>
                {invite.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="admin-label">Destinatários / lote</span>
            <button
              type="button"
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-admin-gold"
              onClick={() =>
                setSelectedGuestIds(
                  selectedGuestIds.length === guests.length
                    ? []
                    : guests.map((g) => g.id)
                )
              }
            >
              {selectedGuestIds.length === guests.length
                ? "Limpar"
                : "Seleccionar todos"}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 border border-white/5 rounded-lg p-3">
            {guests.length === 0 ? (
              <p className="text-sm text-grey/50">
                Sem convidados neste evento.
              </p>
            ) : (
              guests.map((guest) => (
                <label
                  key={guest.id}
                  className="flex items-center gap-2 text-sm text-grey/80"
                >
                  <input
                    type="checkbox"
                    checked={selectedGuestIds.includes(guest.id)}
                    onChange={(e) => {
                      setSelectedGuestIds((prev) =>
                        e.target.checked
                          ? [...prev, guest.id]
                          : prev.filter((id) => id !== guest.id)
                      );
                    }}
                  />
                  <span>{guest.name}</span>
                  <span className="text-[10px] font-mono text-grey/40">
                    {guest.phone || "sem telefone"}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="admin-card p-6 space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Sender
        </h2>
        <label className="block space-y-1.5">
          <span className="admin-label">Sender profile</span>
          <select
            className="admin-input"
            value={senderProfileId}
            onChange={(e) => setSenderProfileId(e.target.value)}
          >
            <option value="">— nenhum —</option>
            {senders.map((sender) => (
              <option key={sender.id} value={sender.id}>
                {sender.publicName} · {SENDER_KIND_LABELS[sender.senderKind]} ·{" "}
                {sender.maskedNumber}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-3 pt-2 border-t border-white/5">
          <label className="block space-y-1.5">
            <span className="admin-label">Novo tipo</span>
            <select
              className="admin-input"
              value={newSenderKind}
              onChange={(e) =>
                setNewSenderKind(e.target.value as SenderKind)
              }
            >
              {(Object.keys(SENDER_KIND_LABELS) as SenderKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {SENDER_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Nome público</span>
            <input
              className="admin-input"
              value={newSenderName}
              onChange={(e) => setNewSenderName(e.target.value)}
              placeholder="Ex.: HAXR Signature"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Número (mascarado ao guardar)</span>
            <input
              className="admin-input"
              value={newSenderPhone}
              onChange={(e) => setNewSenderPhone(e.target.value)}
              placeholder="+258..."
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleCreateSender}
          className="admin-btn-secondary"
        >
          Adicionar sender
        </button>
      </section>

      <section className="admin-card p-6 space-y-4">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Mensagem · Template · Agendamento
        </h2>
        <p className="text-[11px] text-grey/45 font-mono">
          Variáveis: guest_name, couple_names, event_name, event_date,
          event_location, invitation_url, rsvp_deadline, sender_name
        </p>
        <label className="block space-y-1.5">
          <span className="admin-label">Template</span>
          <textarea
            className="admin-input min-h-[180px] font-mono text-xs"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            required
          />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="admin-label">Casal / anfitriões</span>
            <input
              className="admin-input"
              value={coupleNames}
              onChange={(e) => setCoupleNames(e.target.value)}
              placeholder="Ex.: Ana & João"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Batch</span>
            <input
              className="admin-input"
              value={batchKey}
              onChange={(e) => setBatchKey(e.target.value)}
              placeholder="lote-1"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Preview</span>
            <input
              type="number"
              min={1}
              max={500}
              className="admin-input"
              value={previewLimit}
              onChange={(e) => setPreviewLimit(Number(e.target.value) || 25)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Prazo RSVP</span>
            <input
              className="admin-input"
              value={rsvpDeadline}
              onChange={(e) => setRsvpDeadline(e.target.value)}
              placeholder="Ex.: 1 de Agosto"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-grey/70 md:col-span-3">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
            />
            Criar em modo teste/operacional. Não activa envio automático.
          </label>
          <label className="block space-y-1.5">
            <span className="admin-label">Agendamento (opcional)</span>
            <input
              type="datetime-local"
              className="admin-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="admin-label">Idempotency key (opcional)</span>
          <input
            className="admin-input font-mono text-xs"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            placeholder="campanha-evento-lote-1"
          />
        </label>
      </section>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="admin-btn-primary" disabled={saving}>
          {saving ? "A criar…" : "Criar campanha"}
        </button>
        <button
          type="button"
          className="admin-btn-secondary"
          onClick={() => router.push("/admin/invitations/campaigns")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
