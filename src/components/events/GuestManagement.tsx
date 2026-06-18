"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileSpreadsheet,
  MessageCircle,
  Mail,
  Plus,
  Search,
  Upload,
  UserCheck,
} from "lucide-react";
import {
  bulkAssignTableAction,
  bulkCheckInGuestsAction,
  bulkConfirmGuestsAction,
  bulkSendGuestInviteEmailsAction,
  checkInGuestAction,
  confirmGuestAction,
  deleteGuestAction,
  importGuestsCsvAction,
  sendGuestInviteEmailAction,
} from "@/lib/events/actions/guests.actions";
import { isPossibleDuplicate } from "@/lib/events/deduplication";
import { normalizeSearchQuery, rankNameMatch } from "@/lib/events/normalize";
import GuestGroupPanel from "@/components/events/GuestGroupPanel";
import GuestMergePanel from "@/components/events/GuestMergePanel";
import { GUEST_LABEL_LABELS, GUEST_LABEL_STYLES, GUEST_STATUS_LABELS, GUEST_STATUS_STYLES } from "@/lib/events/constants";
import { GUEST_SOURCE_LABELS } from "@/lib/events/sheets/detect-mode";
import { downloadCsvFile } from "@/lib/finance/export/csv";
import { buildSelectedGuestsCsv } from "@/lib/events/sheets/export-csv";
import { buildCheckinUrl, buildRsvpUrl } from "@/lib/events/tokens";
import { buildWhatsAppLinksForGuests } from "@/lib/events/whatsapp";
import GuestForm from "@/components/events/GuestForm";
import type { EventGuest, EventSeat, GuestGroup, ManagedEvent } from "@/lib/events/types";

const PAGE_SIZE = 50;

type GuestManagementProps = {
  event: ManagedEvent;
  guests: EventGuest[];
  groups: GuestGroup[];
  seats: EventSeat[];
  onChanged: () => void;
};

export default function GuestManagement({
  event,
  guests,
  groups,
  seats,
  onChanged,
}: GuestManagementProps) {
  const eventId = event.id;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [assignTable, setAssignTable] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMode, setWhatsappMode] = useState<"rsvp" | "seat" | null>(null);
  const [listFilter, setListFilter] = useState<
    "all" | "pending" | "confirmed" | "with_contact" | "rsvp" | "duplicates" | "unassigned"
  >("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const duplicateCount = useMemo(
    () => guests.filter((guest) => isPossibleDuplicate(guest, guests)).length,
    [guests]
  );

  const filteredGuests = useMemo(() => {
    let rows = guests;

    if (listFilter === "pending") {
      rows = rows.filter((guest) => guest.status === "invited");
    } else if (listFilter === "confirmed") {
      rows = rows.filter((guest) => guest.status === "confirmed");
    } else if (listFilter === "with_contact") {
      rows = rows.filter(
        (guest) => Boolean(guest.email.trim() || guest.phone.trim())
      );
    } else if (listFilter === "rsvp") {
      rows = rows.filter((guest) => guest.guestSource === "sheet_rsvp");
    } else if (listFilter === "duplicates") {
      rows = rows.filter((guest) => isPossibleDuplicate(guest, guests));
    } else if (listFilter === "unassigned") {
      rows = rows.filter((guest) => !guest.seatId);
    }

    const trimmed = search.trim();
    if (trimmed) {
      rows = rows.filter((guest) => {
        const rank = rankNameMatch(guest.name, trimmed);
        return (
          rank !== null ||
          guest.email.toLowerCase().includes(normalizeSearchQuery(trimmed)) ||
          guest.phone.includes(trimmed)
        );
      });
    }

    return rows;
  }, [guests, listFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleGuests = filteredGuests.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const pendingCount = guests.filter((g) => g.status === "invited").length;
  const confirmedCount = guests.filter((g) => g.status === "confirmed").length;
  const withContactCount = guests.filter(
    (g) => g.email.trim() || g.phone.trim()
  ).length;
  const withEmailCount = guests.filter((g) => g.email.trim()).length;
  const rsvpCount = guests.filter((g) => g.guestSource === "sheet_rsvp").length;

  const tables = useMemo(
    () => [...new Set(seats.map((seat) => seat.tableName))].sort(),
    [seats]
  );

  const selectedGuests = visibleGuests.filter((guest) => selected.has(guest.id));
  const allSelected =
    visibleGuests.length > 0 && visibleGuests.every((g) => selected.has(g.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleGuests.map((guest) => guest.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(guestId: string) {
    if (!confirm("Eliminar este convidado?")) return;
    await deleteGuestAction(eventId, guestId);
    onChanged();
  }

  async function handleConfirm(guestId: string) {
    setBusyId(guestId);
    await confirmGuestAction(eventId, guestId);
    setBusyId(null);
    onChanged();
  }

  async function handleCheckIn(guestId: string) {
    setBusyId(guestId);
    await checkInGuestAction(eventId, guestId);
    setBusyId(null);
    onChanged();
  }

  async function handleBulkConfirm() {
    setBulkBusy(true);
    await bulkConfirmGuestsAction(eventId, [...selected]);
    setBulkBusy(false);
    onChanged();
  }

  async function handleBulkCheckIn() {
    setBulkBusy(true);
    await bulkCheckInGuestsAction(eventId, [...selected]);
    setBulkBusy(false);
    onChanged();
  }

  async function handleBulkAssign() {
    if (!assignTable) return;
    setBulkBusy(true);
    await bulkAssignTableAction(eventId, [...selected], assignTable);
    setBulkBusy(false);
    onChanged();
  }

  function handleExportSelected() {
    const csv = buildSelectedGuestsCsv(selectedGuests);
    downloadCsvFile(csv, `haxr-convidados-seleccionados.csv`);
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const result = await importGuestsCsvAction(eventId, text);
    if (result.success) {
      const base = `${result.data.created} novos · ${result.data.updated} actualizados`;
      const errorLines = result.data.errors.slice(0, 5).join("\n");
      setImportMessage(
        result.data.errors.length
          ? `${base}\n${errorLines}${result.data.errors.length > 5 ? "\n…" : ""}`
          : base
      );
      onChanged();
    } else {
      setImportMessage(result.error);
    }
  }

  async function handleCopyLink(guest: EventGuest, type: "rsvp" | "checkin") {
    const url =
      type === "rsvp"
        ? buildRsvpUrl(eventId, guest.qrToken)
        : buildCheckinUrl(eventId, guest.qrToken);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(`${guest.id}-${type}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  async function handleBulkSendInviteEmails() {
    setBulkBusy(true);
    setEmailMessage("");
    const result = await bulkSendGuestInviteEmailsAction(eventId, [...selected]);
    setBulkBusy(false);
    if (result.success) {
      const { sent, skipped, failed, errors } = result.data;
      setEmailMessage(
        `${sent} enviado${sent === 1 ? "" : "s"} · ${skipped} sem email · ${failed} falha${failed === 1 ? "" : "s"}${
          errors.length ? `\n${errors.join("\n")}` : ""
        }`
      );
      onChanged();
    } else {
      setEmailMessage(result.error);
    }
  }

  async function handleSendInviteEmail(guestId: string) {
    setBusyId(guestId);
    setEmailMessage("");
    const result = await sendGuestInviteEmailAction(eventId, guestId);
    setBusyId(null);
    if (result.success) {
      setEmailMessage("Convite enviado por email.");
      onChanged();
    } else {
      setEmailMessage(result.error);
    }
  }

  function guestMeta(guest: EventGuest): string {
    const parts = [guest.email || guest.phone || ""];
    if (guest.plusOnes > 0) parts.push(`+${guest.plusOnes}`);
    if (guest.dietaryNotes) parts.push(guest.dietaryNotes);
    return parts.filter(Boolean).join(" · ") || "—";
  }

  const whatsappLinks = whatsappMode
    ? buildWhatsAppLinksForGuests(event, selectedGuests, whatsappMode)
    : [];

  return (
    <div className="space-y-8">
      <GuestGroupPanel
        eventId={eventId}
        groups={groups}
        guests={guests}
        onChanged={onChanged}
      />

      {duplicateCount > 0 ? (
        <GuestMergePanel
          eventId={eventId}
          guests={guests}
          onMerged={onChanged}
        />
      ) : null}

      <section className="admin-card p-6 space-y-4">
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Importação CSV
          </p>
          <p className="text-sm text-grey/55 leading-relaxed">
            Importe listas Excel/CSV com colunas Nome, Email, Telefone, Estado,
            Etiqueta, Grupo, Acompanhantes, Restrições e Notas. Os contactos
            ficam guardados para reenvio de convites por email ou WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="admin-btn-secondary"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          {importMessage ? (
            <p className="text-xs text-grey/50 italic whitespace-pre-line max-w-2xl">
              {importMessage}
            </p>
          ) : null}
        </div>
      </section>

      {(creating || editing) && (
        <section className="admin-card p-6">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold mb-6">
            {editing ? "Editar convidado" : "Novo convidado"}
          </h2>
          <GuestForm
            eventId={eventId}
            guest={editing ?? undefined}
            guests={guests}
            groups={groups}
            seats={seats}
            onSaved={() => {
              setCreating(false);
              setEditing(null);
              onChanged();
            }}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "all", label: `Todos (${guests.length})` },
            { id: "pending", label: `Por confirmar (${pendingCount})` },
            { id: "confirmed", label: `Confirmados (${confirmedCount})` },
            { id: "with_contact", label: `Com contacto (${withContactCount})` },
            { id: "rsvp", label: `RSVP Sheets (${rsvpCount})` },
            {
              id: "duplicates",
              label: `Possíveis duplicados (${duplicateCount})`,
            },
            {
              id: "unassigned",
              label: `Sem mesa (${guests.filter((g) => !g.seatId).length})`,
            },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setListFilter(item.id);
              setPage(1);
            }}
            className={`px-4 py-2 font-mono text-[9px] tracking-[0.25em] uppercase border rounded-sm transition-colors ${
              listFilter === item.id
                ? "bg-admin-gold/10 text-admin-gold border-admin-gold/25"
                : "text-grey/60 border-grey-dark/80 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
        </div>

        <label className="block w-full lg:max-w-xs">
          <span className="sr-only">Pesquisar convidados</span>
          <div className="relative">
            <Search
              className="w-4 h-4 text-grey/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar nome, email ou telefone"
              className="admin-input admin-input-icon w-full"
            />
          </div>
        </label>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4">
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50">
          {filteredGuests.length} de {guests.length} convidado
          {guests.length === 1 ? "" : "s"}
          {selected.size ? ` · ${selected.size} seleccionado${selected.size === 1 ? "" : "s"}` : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="admin-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo convidado
        </button>
      </div>

      {selected.size > 0 ? (
        <section className="admin-card p-4 md:p-5 space-y-4 border-admin-gold/20">
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-admin-gold">
            Acções em massa
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBulkConfirm}
              disabled={bulkBusy}
              className="admin-btn-secondary text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Confirmar
            </button>
            <button
              type="button"
              onClick={handleBulkCheckIn}
              disabled={bulkBusy}
              className="admin-btn-secondary text-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Check-in
            </button>
            <button
              type="button"
              onClick={handleExportSelected}
              className="admin-btn-secondary text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={handleBulkSendInviteEmails}
              disabled={bulkBusy || !withEmailCount}
              className="admin-btn-secondary text-xs"
              title={
                withEmailCount
                  ? "Enviar convite por email aos seleccionados com email"
                  : "Nenhum convidado com email registado"
              }
            >
              <Mail className="w-3.5 h-3.5" />
              Email convite
            </button>
            <button
              type="button"
              onClick={() => setWhatsappMode(whatsappMode === "rsvp" ? null : "rsvp")}
              className="admin-btn-secondary text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp RSVP
            </button>
            <button
              type="button"
              onClick={() => setWhatsappMode(whatsappMode === "seat" ? null : "seat")}
              className="admin-btn-secondary text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp lugar
            </button>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="block min-w-[180px]">
              <span className="block font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
                Atribuir mesa em lote
              </span>
              <select
                value={assignTable}
                onChange={(e) => setAssignTable(e.target.value)}
                className="admin-input w-full"
              >
                <option value="">Seleccionar mesa</option>
                {tables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={bulkBusy || !assignTable}
              className="admin-btn-primary h-[46px]"
            >
              Atribuir lugares
            </button>
          </div>
          {whatsappMode && whatsappLinks.length ? (
            <div className="space-y-2 pt-2 border-t border-grey-dark/60">
              <p className="text-xs text-grey/50">
                Clique para abrir WhatsApp (convidados com telefone):
              </p>
              <div className="flex flex-wrap gap-2">
                {whatsappLinks.map((link) =>
                  link.url ? (
                    <a
                      key={link.guestId}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono tracking-[0.12em] uppercase px-3 py-2 border border-emerald-500/25 text-emerald-300/80 hover:bg-emerald-500/10 rounded-sm"
                    >
                      {link.name}
                    </a>
                  ) : null
                )}
              </div>
            </div>
          ) : null}
          {emailMessage ? (
            <p className="text-xs text-grey/55 italic whitespace-pre-line max-w-2xl border-t border-grey-dark/60 pt-3">
              {emailMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-grey-dark/80 bg-black-soft">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
                {["Convidado", "Lugar", "Estado", "Acções"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleGuests.map((guest) => (
                <tr
                  key={guest.id}
                  className="border-b border-grey-dark/50 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(guest.id)}
                      onChange={() => toggleOne(guest.id)}
                      aria-label={`Seleccionar ${guest.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p>{guest.name}</p>
                      {isPossibleDuplicate(guest, guests) ? (
                        <span
                          className="inline-flex items-center gap-1 text-[8px] font-mono tracking-[0.12em] uppercase px-2 py-0.5 border rounded-sm bg-amber-500/10 text-amber-300 border-amber-500/25"
                          title="Possível duplicado detectado"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Duplicado?
                        </span>
                      ) : null}
                      {guest.label !== "none" ? (
                        <span
                          className={`text-[8px] font-mono tracking-[0.12em] uppercase px-2 py-0.5 border rounded-sm ${GUEST_LABEL_STYLES[guest.label]}`}
                        >
                          {GUEST_LABEL_LABELS[guest.label]}
                        </span>
                      ) : null}
                      {guest.guestSource !== "manual" ? (
                        <span
                          className={`text-[8px] font-mono tracking-[0.12em] uppercase px-2 py-0.5 border rounded-sm ${
                            guest.guestSource === "sheet_rsvp"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/25"
                              : "bg-grey/10 text-grey/60 border-grey/25"
                          }`}
                        >
                          {GUEST_SOURCE_LABELS[guest.guestSource]}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-grey/50">
                      {guestMeta(guest)}
                      {guest.groupName ? ` · Grupo: ${guest.groupName}` : ""}
                    </p>
                    {guest.email ? (
                      <p className="text-[10px] text-grey/40 mt-0.5">{guest.email}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-grey">
                    {guest.seat
                      ? `${guest.seat.tableName} · ${guest.seat.seatNumber}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[9px] font-mono tracking-[0.15em] uppercase px-2 py-1 border rounded-sm ${GUEST_STATUS_STYLES[guest.status]}`}
                    >
                      {GUEST_STATUS_LABELS[guest.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {guest.status === "invited" ? (
                        <button
                          type="button"
                          onClick={() => handleConfirm(guest.id)}
                          disabled={busyId === guest.id}
                          className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-blue-300/80 hover:text-blue-200 border border-blue-500/20 px-2 py-1 rounded-sm"
                        >
                          <Check className="w-3 h-3" />
                          Confirmar
                        </button>
                      ) : null}
                      {guest.status !== "checked_in" ? (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(guest.id)}
                          disabled={busyId === guest.id}
                          className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-emerald-300/80 hover:text-emerald-200 border border-emerald-500/20 px-2 py-1 rounded-sm"
                        >
                          <UserCheck className="w-3 h-3" />
                          Check-in
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest, "rsvp")}
                        className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-grey/55 hover:text-admin-gold"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === `${guest.id}-rsvp` ? "Copiado" : "Link"}
                      </button>
                      {guest.email ? (
                        <button
                          type="button"
                          onClick={() => handleSendInviteEmail(guest.id)}
                          disabled={busyId === guest.id}
                          className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-gold/70 hover:text-admin-gold border border-gold/20 px-2 py-1 rounded-sm"
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest, "checkin")}
                        className="inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-grey/55 hover:text-admin-gold"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === `${guest.id}-checkin` ? "Copiado" : "QR"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(guest);
                          setCreating(false);
                        }}
                        className="text-xs text-grey hover:text-admin-gold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(guest.id)}
                        className="text-xs text-grey hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGuests.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-grey-dark/60">
            <p className="text-xs text-grey/50 font-mono tracking-[0.15em] uppercase">
              Página {safePage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="admin-btn-secondary text-xs px-3 py-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="admin-btn-secondary text-xs px-3 py-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
