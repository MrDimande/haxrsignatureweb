"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  FileSpreadsheet,
  MailCheck,
  MessageCircle,
  Mail,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import {
  bulkAssignTableAction,
  bulkCheckInGuestsAction,
  bulkConfirmGuestsAction,
  bulkSendGuestInviteEmailsAction,
  checkInGuestAction,
  confirmGuestAction,
  deleteGuestAction,
  sendGuestInviteEmailAction,
} from "@/lib/events/actions/guests.actions";
import {
  bulkArchiveGuestsAction,
  bulkMarkIncorrectGuestsAction,
  bulkMoveGuestsToGroupAction,
  bulkRestoreGuestsAction,
  bulkSoftRemoveGuestsAction,
  previewBulkImpactAction,
  removeImportBatchAction,
  undoBulkGuestAction,
} from "@/lib/events/actions/guest-bulk.actions";
import { isPossibleDuplicate } from "@/lib/events/deduplication";
import { normalizeSearchQuery, rankNameMatch } from "@/lib/events/normalize";
import GuestGroupPanel from "@/components/events/GuestGroupPanel";
import GuestMergePanel from "@/components/events/GuestMergePanel";
import GuestImportPanel from "@/components/events/GuestImportPanel";
import { GUEST_LABEL_LABELS, GUEST_LABEL_STYLES, GUEST_STATUS_LABELS, GUEST_STATUS_STYLES } from "@/lib/events/constants";
import { GUEST_SOURCE_LABELS } from "@/lib/events/sheets/detect-mode";
import { downloadCsvFile } from "@/lib/finance/export/csv";
import { buildSelectedGuestsCsv } from "@/lib/events/sheets/export-csv";
import { buildCheckinUrl, buildRsvpUrl } from "@/lib/events/tokens";
import { buildWhatsAppLinksForGuests } from "@/lib/events/whatsapp";
import { formatDateTimePtMZ } from "@/lib/formatters";
import type { IncorrectFilter, InviteSentFilter } from "@/lib/events/bulk-selection";
import GuestForm from "@/components/events/GuestForm";
import type {
  EventGuest,
  EventSeat,
  GuestGroup,
  GuestImportBatch,
  ManagedEvent,
} from "@/lib/events/types";

const PAGE_SIZE = 50;
const TABLE_CONTROL_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-gold/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
const TABLE_CHECKBOX_STYLES = `h-4 w-4 cursor-pointer rounded-sm border border-grey-medium/40 bg-black-soft accent-admin-gold ${TABLE_CONTROL_FOCUS}`;
const TOOLBAR_CONTROL_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-gold/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

type GuestManagementProps = {
  event: ManagedEvent;
  guests: EventGuest[];
  groups: GuestGroup[];
  seats: EventSeat[];
  importBatches?: GuestImportBatch[];
  onChanged: () => void;
};

export default function GuestManagement({
  event,
  guests,
  groups,
  seats,
  importBatches = [],
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
  const [moveGroupId, setMoveGroupId] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [lastAuditId, setLastAuditId] = useState<string | null>(null);
  const [whatsappMode, setWhatsappMode] = useState<"rsvp" | "seat" | null>(null);
  const [listFilter, setListFilter] = useState<
    | "all"
    | "pending"
    | "confirmed"
    | "declined"
    | "with_contact"
    | "rsvp"
    | "duplicates"
    | "unassigned"
    | "archived"
  >("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [incorrectFilter, setIncorrectFilter] = useState<IncorrectFilter>("all");
  const [inviteSentFilter, setInviteSentFilter] = useState<InviteSentFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const duplicateCount = useMemo(
    () => guests.filter((guest) => isPossibleDuplicate(guest, guests)).length,
    [guests]
  );

  const filteredGuests = useMemo(() => {
    let rows = guests;

    if (listFilter === "pending") {
      rows = rows.filter((guest) => guest.status === "invited" && !guest.archivedAt);
    } else if (listFilter === "confirmed") {
      rows = rows.filter((guest) => guest.status === "confirmed" && !guest.archivedAt);
    } else if (listFilter === "declined") {
      rows = rows.filter((guest) => guest.status === "declined" && !guest.archivedAt);
    } else if (listFilter === "with_contact") {
      rows = rows.filter(
        (guest) => Boolean(guest.email.trim() || guest.phone.trim()) && !guest.archivedAt
      );
    } else if (listFilter === "rsvp") {
      rows = rows.filter(
        (guest) =>
          guest.guestSource === "sheet_rsvp" ||
          guest.guestSource === "edition_rsvp"
      );
    } else if (listFilter === "duplicates") {
      rows = rows.filter((guest) => isPossibleDuplicate(guest, guests));
    } else if (listFilter === "unassigned") {
      rows = rows.filter((guest) => !guest.seatId && !guest.archivedAt);
    } else if (listFilter === "archived") {
      rows = rows.filter((guest) => Boolean(guest.archivedAt));
    } else {
      rows = rows.filter((guest) => !guest.archivedAt);
    }

    if (batchFilter === "none") {
      rows = rows.filter((guest) => !guest.importBatchId);
    } else if (batchFilter !== "all") {
      rows = rows.filter((guest) => guest.importBatchId === batchFilter);
    }

    if (sourceFilter !== "all") {
      rows = rows.filter((guest) => guest.guestSource === sourceFilter);
    }

    if (statusFilter !== "all") {
      rows = rows.filter((guest) => guest.status === statusFilter);
    }

    if (incorrectFilter === "incorrect_only") {
      rows = rows.filter((guest) => guest.isIncorrect);
    }

    if (inviteSentFilter === "sent") {
      rows = rows.filter((guest) => Boolean(guest.inviteSentAt));
    } else if (inviteSentFilter === "not_sent") {
      rows = rows.filter((guest) => !guest.inviteSentAt);
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
  }, [guests, listFilter, search, batchFilter, sourceFilter, statusFilter, incorrectFilter, inviteSentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleGuests = filteredGuests.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const pendingCount = guests.filter((g) => g.status === "invited" && !g.archivedAt).length;
  const confirmedCount = guests.filter((g) => g.status === "confirmed" && !g.archivedAt).length;
  const declinedCount = guests.filter((g) => g.status === "declined" && !g.archivedAt).length;
  const withContactCount = guests.filter(
    (g) => (g.email.trim() || g.phone.trim()) && !g.archivedAt
  ).length;
  const withEmailCount = guests.filter((g) => g.email.trim()).length;
  const rsvpCount = guests.filter(
    (g) => g.guestSource === "sheet_rsvp" || g.guestSource === "edition_rsvp"
  ).length;
  const archivedCount = guests.filter((g) => Boolean(g.archivedAt)).length;
  const activeGuestCount = guests.filter((g) => !g.archivedAt).length;
  const unassignedCount = guests.filter((g) => !g.seatId && !g.archivedAt).length;
  const secondaryListFilterActive = [
    "with_contact",
    "rsvp",
    "duplicates",
    "unassigned",
    "archived",
  ].includes(listFilter);

  const tables = useMemo(
    () => [...new Set(seats.map((seat) => seat.tableName))].sort(),
    [seats]
  );

  const selectedGuests = filteredGuests.filter((guest) => selected.has(guest.id));
  const allPageSelected =
    visibleGuests.length > 0 && visibleGuests.every((g) => selected.has(g.id));
  const allResultsSelected =
    filteredGuests.length > 0 &&
    filteredGuests.every((g) => selected.has(g.id));

  function togglePage() {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleGuests.forEach((guest) => next.delete(guest.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleGuests.forEach((guest) => next.add(guest.id));
        return next;
      });
    }
  }

  function toggleAllResults() {
    if (allResultsSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredGuests.map((guest) => guest.id)));
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
    if (!confirm("Remover este convidado (soft delete)?")) return;
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

  async function confirmImpact(actionLabel: string): Promise<boolean> {
    const preview = await previewBulkImpactAction(eventId, [...selected]);
    if (!preview.success) {
      setBulkMessage(preview.error);
      return false;
    }
    return confirm(
      `${actionLabel}\n\n${preview.data.message}\n\nProtegidos não serão hard-deleted — usa-se arquivo/remoção suave.`
    );
  }

  async function handleBulkArchive() {
    if (!(await confirmImpact("Arquivar seleccionados?"))) return;
    setBulkBusy(true);
    const result = await bulkArchiveGuestsAction(eventId, [...selected]);
    setBulkBusy(false);
    if (result.success) {
      setBulkMessage(result.data.message);
      setLastAuditId(result.data.auditId);
      setSelected(new Set());
      onChanged();
    } else {
      setBulkMessage(result.error);
    }
  }

  async function handleBulkRestore() {
    if (!confirm("Restaurar seleccionados?")) return;
    setBulkBusy(true);
    const result = await bulkRestoreGuestsAction(eventId, [...selected]);
    setBulkBusy(false);
    if (result.success) {
      setBulkMessage(`${result.data.affected} restaurado(s)`);
      setLastAuditId(result.data.auditId);
      setSelected(new Set());
      onChanged();
    } else {
      setBulkMessage(result.error);
    }
  }

  async function handleBulkIncorrect() {
    if (!(await confirmImpact("Marcar como incorrectos?"))) return;
    setBulkBusy(true);
    const result = await bulkMarkIncorrectGuestsAction(eventId, [...selected]);
    setBulkBusy(false);
    if (result.success) {
      setBulkMessage(`${result.data.affected} marcado(s) como incorrecto(s)`);
      setLastAuditId(result.data.auditId);
      onChanged();
    } else {
      setBulkMessage(result.error);
    }
  }

  async function handleBulkSoftRemove() {
    if (!(await confirmImpact("Remover seleccionados (soft)?"))) return;
    setBulkBusy(true);
    let result = await bulkSoftRemoveGuestsAction(eventId, [...selected]);
    if (!result.success && result.error.includes("Confirme arquivo suave")) {
      const force = confirm(
        `${result.error}\n\nConfirmar arquivo/remoção suave dos protegidos?`
      );
      if (force) {
        result = await bulkSoftRemoveGuestsAction(eventId, [...selected], {
          forceSoftArchiveProtected: true,
        });
      }
    }
    setBulkBusy(false);
    if (result.success) {
      setBulkMessage(result.data.message);
      setLastAuditId(result.data.auditId);
      setSelected(new Set());
      onChanged();
    } else {
      setBulkMessage(result.error);
    }
  }

  async function handleBulkMoveGroup() {
    setBulkBusy(true);
    const result = await bulkMoveGuestsToGroupAction(
      eventId,
      [...selected],
      moveGroupId || null
    );
    setBulkBusy(false);
    if (result.success) {
      setBulkMessage(`${result.data.affected} movido(s) de grupo`);
      onChanged();
    } else {
      setBulkMessage(result.error);
    }
  }

  async function handleRemoveBatch(batchId: string) {
    if (
      !confirm(
        "Remover lote completo (soft archive dos convidados do lote)?"
      )
    ) {
      return;
    }
    setBulkBusy(true);
    let result = await removeImportBatchAction(eventId, batchId);
    if (!result.success && result.error.includes("Confirme arquivo suave")) {
      const force = confirm(
        `${result.error}\n\nConfirmar arquivo suave dos protegidos?`
      );
      if (force) {
        result = await removeImportBatchAction(eventId, batchId, {
          forceSoftArchiveProtected: true,
        });
      }
    }
    setBulkBusy(false);
    if (result.success) {
      setBulkMessage(result.data.message);
      setLastAuditId(result.data.auditId);
      onChanged();
    } else {
      setBulkMessage(result.error);
    }
  }

  async function handleUndo() {
    if (!lastAuditId) return;
    setBulkBusy(true);
    const result = await undoBulkGuestAction(eventId, lastAuditId);
    setBulkBusy(false);
    if (result.success) {
      setBulkMessage(`Undo: ${result.data.restored} convidado(s)`);
      setLastAuditId(null);
      onChanged();
    } else {
      setBulkMessage(result.error);
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
    if (guest.isIncorrect) parts.push("incorrecto");
    if (guest.archivedAt) parts.push("arquivado");
    return parts.filter(Boolean).join(" · ") || "—";
  }

  const whatsappLinks = whatsappMode
    ? buildWhatsAppLinksForGuests(event, selectedGuests, whatsappMode)
    : [];

  const listFilterLabels: Partial<Record<typeof listFilter, string>> = {
    pending: "Por confirmar",
    confirmed: "Confirmados",
    declined: "Recusados",
    with_contact: "Com contacto",
    rsvp: "RSVP Sheets",
    duplicates: "Possíveis duplicados",
    unassigned: "Sem mesa",
    archived: "Arquivados",
  };
  const activeSecondaryFilterCount =
    Number(secondaryListFilterActive) +
    Number(batchFilter !== "all") +
    Number(sourceFilter !== "all") +
    Number(statusFilter !== "all") +
    Number(incorrectFilter !== "all") +
    Number(inviteSentFilter !== "all");
  const hasActiveFilters =
    listFilter !== "all" ||
    batchFilter !== "all" ||
    sourceFilter !== "all" ||
    statusFilter !== "all" ||
    incorrectFilter !== "all" ||
    inviteSentFilter !== "all";

  const selectedBatch = importBatches.find((batch) => batch.id === batchFilter);
  const activeFilterLabels = [
    listFilter !== "all" ? listFilterLabels[listFilter] : null,
    batchFilter === "none"
      ? "Sem lote"
      : batchFilter !== "all"
        ? `Lote: ${selectedBatch?.filename || batchFilter.slice(0, 8)}`
        : null,
    sourceFilter !== "all"
      ? `Origem: ${
          GUEST_SOURCE_LABELS[sourceFilter as keyof typeof GUEST_SOURCE_LABELS] || sourceFilter
        }`
      : null,
    statusFilter !== "all"
      ? `Estado: ${
          GUEST_STATUS_LABELS[statusFilter as keyof typeof GUEST_STATUS_LABELS] || statusFilter
        }`
      : null,
    incorrectFilter === "incorrect_only" ? "Dados incorrectos" : null,
    inviteSentFilter === "sent"
      ? "Convite enviado"
      : inviteSentFilter === "not_sent"
        ? "Convite não enviado"
        : null,
  ].filter((label): label is string => Boolean(label));

  function clearFilters() {
    setListFilter("all");
    setBatchFilter("all");
    setSourceFilter("all");
    setStatusFilter("all");
    setIncorrectFilter("all");
    setInviteSentFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <section
        className="admin-card overflow-hidden border-brand-champagne/15 bg-black-soft/80"
        aria-label="Ferramentas da lista de convidados"
      >
        <div className="space-y-5 p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="shrink-0">
                <p className="font-mono text-[8px] uppercase tracking-[0.35em] text-admin-gold">
                  Lista activa
                </p>
                <p className="mt-1 text-sm text-grey-medium/70">
                  Pesquisa, filtra e gere os convidados deste evento.
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
                {[
                  { label: "Total", value: activeGuestCount },
                  { label: "Confirmados", value: confirmedCount },
                  { label: "Por confirmar", value: pendingCount },
                  { label: "Recusados", value: declinedCount },
                ].map((item) => (
                  <div key={item.label} className="min-w-[90px]">
                    <dt className="font-mono text-[8px] uppercase tracking-[0.22em] text-grey-medium/60">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 font-serif text-xl leading-none text-brand-ivory">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center xl:shrink-0">
              <button
                type="button"
                onClick={() => {
                  setImportOpen((open) => !open);
                  setCreating(false);
                  setEditing(null);
                }}
                aria-expanded={importOpen}
                aria-controls="guest-import-panel"
                className={`admin-btn-secondary min-h-11 justify-center text-xs ${TOOLBAR_CONTROL_FOCUS}`}
              >
                <Upload className="h-4 w-4" />
                Importar lista/CSV
                {importOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setEditing(null);
                  setImportOpen(false);
                }}
                className={`admin-btn-primary min-h-11 justify-center ${TOOLBAR_CONTROL_FOCUS}`}
              >
                <Plus className="h-4 w-4" />
                Novo convidado
              </button>
            </div>
          </div>

          <div className="border-t border-brand-champagne/10 pt-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <label className="block min-w-0 flex-1 xl:max-w-md">
                <span className="sr-only">
                  Pesquisar convidados por nome, email ou telefone
                </span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-medium/55"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Pesquisar nome, email ou telefone"
                    className={`admin-input admin-input-icon w-full !pr-10 text-brand-ivory placeholder:text-grey-medium/45 ${TOOLBAR_CONTROL_FOCUS}`}
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setPage(1);
                      }}
                      aria-label="Limpar pesquisa"
                      className={`absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-grey-medium/65 transition-colors hover:bg-white/[0.04] hover:text-brand-ivory ${TOOLBAR_CONTROL_FOCUS}`}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </label>

              <div
                className="flex min-w-0 flex-1 flex-wrap gap-2"
                aria-label="Filtros principais de convidados"
              >
                {(
                  [
                    { id: "all", label: "Todos", count: activeGuestCount },
                    { id: "pending", label: "Por confirmar", count: pendingCount },
                    { id: "confirmed", label: "Confirmados", count: confirmedCount },
                    { id: "declined", label: "Recusados", count: declinedCount },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setListFilter(item.id);
                      setPage(1);
                    }}
                    aria-pressed={listFilter === item.id}
                    className={`min-h-10 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.17em] transition-colors ${
                      listFilter === item.id
                        ? "border-admin-gold/35 bg-admin-gold/10 text-brand-gold-light"
                        : "border-grey-dark/80 text-grey-medium/70 hover:border-grey-medium/30 hover:text-brand-ivory"
                    } ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    {item.label}
                    <span className="ml-1.5 text-current opacity-70">{item.count}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setMoreFiltersOpen((open) => !open)}
                  aria-expanded={moreFiltersOpen}
                  aria-controls="guest-secondary-filters"
                  className={`inline-flex min-h-10 items-center gap-2 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.17em] transition-colors ${
                    moreFiltersOpen || activeSecondaryFilterCount > 0
                      ? "border-brand-champagne/30 bg-brand-champagne/[0.06] text-brand-champagne"
                      : "border-grey-dark/80 text-grey-medium/70 hover:border-grey-medium/30 hover:text-brand-ivory"
                  } ${TOOLBAR_CONTROL_FOCUS}`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
                  Mais filtros
                  {activeSecondaryFilterCount > 0 ? (
                    <span className="inline-flex min-w-5 justify-center rounded-full bg-admin-gold/15 px-1.5 py-0.5 text-[8px] text-brand-gold-light">
                      {activeSecondaryFilterCount}
                    </span>
                  ) : null}
                  {moreFiltersOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`min-h-10 rounded-sm px-2.5 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-grey-medium/65 transition-colors hover:text-brand-ivory ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    Limpar filtros
                  </button>
                ) : null}
              </div>
            </div>

            <div
              id="guest-secondary-filters"
              hidden={!moreFiltersOpen}
              className="mt-4 space-y-4 border-t border-brand-champagne/10 pt-4"
            >
              <div className="flex flex-wrap gap-2" aria-label="Filtros rápidos adicionais">
                {(
                  [
                    { id: "with_contact", label: "Com contacto", count: withContactCount },
                    { id: "rsvp", label: "RSVP Sheets", count: rsvpCount },
                    { id: "duplicates", label: "Possíveis duplicados", count: duplicateCount },
                    { id: "unassigned", label: "Sem mesa", count: unassignedCount },
                    { id: "archived", label: "Arquivados", count: archivedCount },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setListFilter(item.id);
                      setPage(1);
                    }}
                    aria-pressed={listFilter === item.id}
                    className={`min-h-10 rounded-sm border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                      listFilter === item.id
                        ? "border-admin-gold/35 bg-admin-gold/10 text-brand-gold-light"
                        : "border-grey-dark/80 text-grey-medium/70 hover:border-grey-medium/30 hover:text-brand-ivory"
                    } ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    {item.label}
                    <span className="ml-1.5 opacity-70">{item.count}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60">
                    Lote
                  </span>
                  <select
                    value={batchFilter}
                    onChange={(event) => {
                      setBatchFilter(event.target.value);
                      setPage(1);
                    }}
                    className={`admin-input w-full ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    <option value="all">Todos os lotes</option>
                    <option value="none">Sem lote</option>
                    {importBatches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.filename || batch.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60">
                    Origem
                  </span>
                  <select
                    value={sourceFilter}
                    onChange={(event) => {
                      setSourceFilter(event.target.value);
                      setPage(1);
                    }}
                    className={`admin-input w-full ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    <option value="all">Todas as origens</option>
                    {Object.entries(GUEST_SOURCE_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60">
                    Estado
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                    className={`admin-input w-full ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    <option value="all">Todos os estados</option>
                    {Object.entries(GUEST_STATUS_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60">
                    Informação
                  </span>
                  <select
                    value={incorrectFilter}
                    onChange={(event) => {
                      setIncorrectFilter(event.target.value as IncorrectFilter);
                      setPage(1);
                    }}
                    className={`admin-input w-full ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    <option value="all">Todos</option>
                    <option value="incorrect_only">Dados incorrectos</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[8px] uppercase tracking-[0.25em] text-grey-medium/60">
                    Convite
                  </span>
                  <select
                    value={inviteSentFilter}
                    onChange={(event) => {
                      setInviteSentFilter(event.target.value as InviteSentFilter);
                      setPage(1);
                    }}
                    className={`admin-input w-full ${TOOLBAR_CONTROL_FOCUS}`}
                  >
                    <option value="all">Todos</option>
                    <option value="sent">Convite enviado</option>
                    <option value="not_sent">Convite não enviado</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-brand-champagne/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0" aria-live="polite">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-grey-medium/70">
                  {filteredGuests.length} de {guests.length} convidado
                  {guests.length === 1 ? "" : "s"}
                  {selected.size
                    ? ` · ${selected.size} seleccionado${selected.size === 1 ? "" : "s"}`
                    : ""}
                </p>
                {activeFilterLabels.length > 0 ? (
                  <p className="mt-1 truncate text-xs text-brand-champagne/70">
                    Filtros activos: {activeFilterLabels.join(" · ")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={toggleAllResults}
                disabled={filteredGuests.length === 0}
                aria-pressed={allResultsSelected}
                className={`admin-btn-secondary min-h-10 shrink-0 justify-center text-xs disabled:cursor-not-allowed disabled:opacity-40 ${TOOLBAR_CONTROL_FOCUS}`}
              >
                {allResultsSelected ? "Limpar selecção" : "Seleccionar resultados"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div id="guest-import-panel" hidden={!importOpen}>
        <GuestImportPanel
          eventId={eventId}
          importBatches={importBatches}
          onImported={onChanged}
          onRemoveBatch={(batchId) => void handleRemoveBatch(batchId)}
        />
      </div>

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

      {selected.size > 0 ? (
        <section className="admin-card p-4 md:p-5 space-y-4 border-admin-gold/20">
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-admin-gold">
            Acções em massa · {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
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
              onClick={() => void handleBulkArchive()}
              disabled={bulkBusy}
              className="admin-btn-secondary text-xs"
            >
              <Archive className="w-3.5 h-3.5" />
              Arquivar
            </button>
            <button
              type="button"
              onClick={() => void handleBulkRestore()}
              disabled={bulkBusy}
              className="admin-btn-secondary text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar
            </button>
            <button
              type="button"
              onClick={() => void handleBulkIncorrect()}
              disabled={bulkBusy}
              className="admin-btn-secondary text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Incorrecto
            </button>
            <button
              type="button"
              onClick={() => void handleBulkSoftRemove()}
              disabled={bulkBusy}
              className="admin-btn-secondary text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover
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
            {lastAuditId ? (
              <button
                type="button"
                onClick={() => void handleUndo()}
                disabled={bulkBusy}
                className="admin-btn-secondary text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Desfazer última
              </button>
            ) : null}
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
            <label className="block min-w-[180px]">
              <span className="block font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
                Mover para grupo
              </span>
              <select
                value={moveGroupId}
                onChange={(e) => setMoveGroupId(e.target.value)}
                className="admin-input w-full"
              >
                <option value="">Sem grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void handleBulkMoveGroup()}
              disabled={bulkBusy}
              className="admin-btn-primary h-[46px]"
            >
              Mover grupo
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
          {bulkMessage ? (
            <p className="text-xs text-grey/55 italic whitespace-pre-line max-w-2xl border-t border-grey-dark/60 pt-3">
              {bulkMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto bg-black-soft/80">
          <table className="w-full min-w-[900px] bg-black/30">
            <thead>
              <tr className="border-b border-brand-champagne/15 bg-black-soft">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={togglePage}
                    aria-label="Seleccionar página"
                    className={TABLE_CHECKBOX_STYLES}
                  />
                </th>
                {["Convidado", "Lugar", "Estado", "Acções"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-[8px] font-medium tracking-[0.3em] uppercase text-grey-medium/70"
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
                  className={`border-b border-brand-champagne/10 transition-colors duration-200 focus-within:bg-brand-ivory/[0.045] ${
                    selected.has(guest.id)
                      ? "bg-admin-gold/[0.08] hover:bg-admin-gold/[0.11]"
                      : "hover:bg-brand-ivory/[0.035]"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(guest.id)}
                      onChange={() => toggleOne(guest.id)}
                      aria-label={`Seleccionar ${guest.name}`}
                      className={TABLE_CHECKBOX_STYLES}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-brand-ivory">{guest.name}</p>
                      {isPossibleDuplicate(guest, guests) ? (
                        <span
                          className="inline-flex items-center gap-1 text-[8px] font-mono font-medium tracking-[0.12em] uppercase px-2 py-0.5 border rounded-sm bg-amber-500/10 text-amber-300 border-amber-500/25"
                          title="Possível duplicado detectado"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Duplicado?
                        </span>
                      ) : null}
                      {guest.label !== "none" ? (
                        <span
                          className={`text-[8px] font-mono font-medium tracking-[0.12em] uppercase px-2 py-0.5 border rounded-sm ${GUEST_LABEL_STYLES[guest.label]}`}
                        >
                          {GUEST_LABEL_LABELS[guest.label]}
                        </span>
                      ) : null}
                      {guest.guestSource !== "manual" ? (
                        <span
                          className={`text-[8px] font-mono font-medium tracking-[0.12em] uppercase px-2 py-0.5 border rounded-sm ${
                            guest.guestSource === "sheet_rsvp"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/25"
                              : guest.guestSource === "edition_rsvp"
                                ? "bg-gold/10 text-gold border-gold/25"
                                : "bg-grey-medium/10 text-grey-medium/75 border-grey-medium/25"
                          }`}
                        >
                          {GUEST_SOURCE_LABELS[guest.guestSource]}
                        </span>
                      ) : null}
                      {guest.importBatchId ? (
                        <span className="text-[9px] font-mono text-grey-medium/55">
                          lote {guest.importBatchId.slice(0, 8)}
                        </span>
                      ) : null}
                      {guest.isIncorrect ? (
                        <span
                          className="inline-flex items-center gap-1 text-[8px] font-mono font-medium tracking-[0.1em] uppercase px-2 py-0.5 border rounded-sm bg-amber-500/10 text-amber-300 border-amber-500/30"
                          title="Dados assinalados como incorrectos"
                          aria-label="Dados incorrectos"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                          <span>Dados incorrectos</span>
                        </span>
                      ) : null}
                      {guest.inviteSentAt ? (
                        <span
                          className="inline-flex items-center gap-1 text-[8px] font-mono font-medium tracking-[0.1em] uppercase px-2 py-0.5 border rounded-sm bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          title={`Convite enviado em ${formatDateTimePtMZ(guest.inviteSentAt)}`}
                          aria-label={`Convite enviado: ${formatDateTimePtMZ(guest.inviteSentAt)}`}
                        >
                          <MailCheck className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
                          <span>Convite enviado ({formatDateTimePtMZ(guest.inviteSentAt)})</span>
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-grey-medium/75">
                      {guestMeta(guest)}
                      {guest.groupName ? ` · Grupo: ${guest.groupName}` : ""}
                    </p>
                    {guest.email ? (
                      <p className="text-[10px] text-grey-medium/60 mt-0.5">{guest.email}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-grey-medium/80">
                    {guest.seat
                      ? `${guest.seat.tableName} · ${guest.seat.seatNumber}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[9px] font-mono font-medium tracking-[0.15em] uppercase px-2 py-1 border rounded-sm ${
                        guest.status === "invited"
                          ? "bg-grey-medium/10 text-grey-medium/80 border-grey-medium/25"
                          : GUEST_STATUS_STYLES[guest.status]
                      }`}
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
                          className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-blue-300/90 hover:text-blue-200 border border-blue-500/30 bg-blue-500/[0.04] px-2 py-1 rounded-sm transition-colors ${TABLE_CONTROL_FOCUS}`}
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
                          className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-emerald-300/90 hover:text-emerald-200 border border-emerald-500/30 bg-emerald-500/[0.04] px-2 py-1 rounded-sm transition-colors ${TABLE_CONTROL_FOCUS}`}
                        >
                          <UserCheck className="w-3 h-3" />
                          Check-in
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest, "rsvp")}
                        className={`inline-flex items-center gap-1 rounded-sm text-[10px] font-mono tracking-[0.12em] uppercase text-grey-medium/75 hover:text-brand-gold-light transition-colors ${TABLE_CONTROL_FOCUS}`}
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === `${guest.id}-rsvp` ? "Copiado" : "Link"}
                      </button>
                      {guest.email ? (
                        <button
                          type="button"
                          onClick={() => handleSendInviteEmail(guest.id)}
                          disabled={busyId === guest.id}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.12em] uppercase text-brand-gold-light/80 hover:text-brand-gold-light border border-admin-gold/30 bg-admin-gold/[0.04] px-2 py-1 rounded-sm transition-colors ${TABLE_CONTROL_FOCUS}`}
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(guest, "checkin")}
                        className={`inline-flex items-center gap-1 rounded-sm text-[10px] font-mono tracking-[0.12em] uppercase text-grey-medium/75 hover:text-brand-gold-light transition-colors ${TABLE_CONTROL_FOCUS}`}
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
                        className={`rounded-sm text-xs text-grey-medium/80 hover:text-brand-gold-light transition-colors ${TABLE_CONTROL_FOCUS}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(guest.id)}
                        className={`rounded-sm text-xs text-grey-medium/80 hover:text-red-300 transition-colors ${TABLE_CONTROL_FOCUS}`}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-champagne/10 bg-black-soft/70">
            <p className="text-xs text-grey-medium/70 font-mono tracking-[0.15em] uppercase">
              Página {safePage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`admin-btn-secondary text-xs px-3 py-2 disabled:opacity-40 ${TABLE_CONTROL_FOCUS}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`admin-btn-secondary text-xs px-3 py-2 disabled:opacity-40 ${TABLE_CONTROL_FOCUS}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

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
    </div>
  );
}
