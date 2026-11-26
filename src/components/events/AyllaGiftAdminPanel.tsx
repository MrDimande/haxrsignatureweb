"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Feather,
  Filter,
  Gift,
  Lock,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Unlock,
  X,
} from "lucide-react";
import type { AyllaGiftReconciledItem } from "@/lib/edition/gifts/aylla/catalog-items";
import type {
  AyllaAdminReservationView,
  AyllaGiftAdminSnapshot,
} from "@/lib/edition/gifts/aylla/admin-store";
import {
  AYLLA_REVIEW_FLAG_LABELS,
  AYLLA_STATE_FILTER_OPTIONS,
  computeAyllaGlobalSummary,
  countAyllaItemsByFilter,
  evaluateAyllaDraftRequirements,
  groupAyllaItemsByCategory,
  isAyllaDraftDirty,
  mergeAyllaInventoryDraft,
  stepAyllaDraftQuantity,
  toAyllaInventoryDraft,
  type AyllaCurationStateFilter,
  type AyllaInventoryDraft,
} from "@/lib/edition/gifts/aylla/curation-view";
import type { AyllaGiftReservationStatus } from "@/lib/edition/gifts/aylla/types";
import {
  transitionAyllaGiftReservationAction,
  updateAyllaGiftInventoryAction,
} from "@/lib/events/actions/aylla-gifts.actions";

type AyllaGiftAdminPanelProps = {
  snapshot: AyllaGiftAdminSnapshot;
};

const STATUS_LABELS: Record<AyllaGiftReservationStatus, string> = {
  reserved: "Reservado",
  purchased: "Adquirido",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function formatDateTime(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

export default function AyllaGiftAdminPanel({ snapshot }: AyllaGiftAdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [section, setSection] = useState<"inventory" | "reservations" | "audit">("inventory");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<AyllaCurationStateFilter>("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AyllaInventoryDraft>>({});
  const [transitionReasons, setTransitionReasons] = useState<Record<string, string>>({});

  const titleById = useMemo(
    () => new Map(snapshot.items.map((item) => [item.definition.id, item.definition.name])),
    [snapshot.items]
  );

  const summary = useMemo(
    () => computeAyllaGlobalSummary(snapshot.items, snapshot.reservations),
    [snapshot.items, snapshot.reservations]
  );

  const filterCounts = useMemo(
    () => countAyllaItemsByFilter(snapshot.items),
    [snapshot.items]
  );

  const categoryGroups = useMemo(
    () => groupAyllaItemsByCategory(snapshot.categories, snapshot.items, search, stateFilter),
    [snapshot.categories, snapshot.items, search, stateFilter]
  );

  const isFiltered = search.trim().length > 0 || stateFilter !== "all";

  const visibleGroups = useMemo(
    () =>
      isFiltered
        ? categoryGroups.filter((group) => group.matchingItems.length > 0)
        : categoryGroups,
    [categoryGroups, isFiltered]
  );

  const matchedItemTotal = useMemo(
    () => categoryGroups.reduce((acc, group) => acc + group.matchingItems.length, 0),
    [categoryGroups]
  );

  const allExpanded =
    visibleGroups.length > 0 &&
    visibleGroups.every((group) =>
      expandedCategories[group.category.id] !== undefined
        ? expandedCategories[group.category.id]
        : isFiltered
    );

  function isCategoryOpen(categoryId: string): boolean {
    if (expandedCategories[categoryId] !== undefined) {
      return expandedCategories[categoryId];
    }
    return isFiltered;
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const current = prev[categoryId] !== undefined ? prev[categoryId] : isFiltered;
      return { ...prev, [categoryId]: !current };
    });
  }

  function toggleAllCategories() {
    const nextOpen = !allExpanded;
    const nextMap: Record<string, boolean> = {};
    for (const cat of snapshot.categories) {
      nextMap[cat.id] = nextOpen;
    }
    setExpandedCategories(nextMap);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (value.trim().length > 0) {
      // Clear manual collapse overrides so matching categories open naturally
      setExpandedCategories({});
    }
  }

  function handleFilterChange(nextFilter: AyllaCurationStateFilter) {
    setStateFilter(nextFilter);
    setExpandedCategories({});
  }

  function clearFilters() {
    setSearch("");
    setStateFilter("all");
    setExpandedCategories({});
  }

  function getDraft(item: AyllaGiftReconciledItem): AyllaInventoryDraft {
    return drafts[item.definition.id] ?? toAyllaInventoryDraft(item);
  }

  function updateDraft(item: AyllaGiftReconciledItem, patch: Partial<AyllaInventoryDraft>) {
    const current = getDraft(item);
    setDrafts((prev) => ({
      ...prev,
      [item.definition.id]: mergeAyllaInventoryDraft(current, patch, item.reservedQuantity),
    }));
  }

  function resetDraft(itemId: string) {
    setDrafts((prev) => {
      if (!(itemId in prev)) return prev;
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }

  function handleSaveInventory(item: AyllaGiftReconciledItem) {
    const draft = getDraft(item);
    const trimmedQty = draft.approvedQuantity.trim();
    const parsedQty = trimmedQty ? Number.parseInt(trimmedQty, 10) : null;

    if (
      parsedQty !== null &&
      (!/^\d+$/.test(trimmedQty) || !Number.isSafeInteger(parsedQty) || parsedQty <= 0)
    ) {
      setFeedback({ kind: "err", text: "Quantidade autorizada deve ser um inteiro positivo." });
      return;
    }

    if (parsedQty !== null && parsedQty < item.reservedQuantity) {
      setFeedback({
        kind: "err",
        text: `Quantidade autorizada não pode ser inferior às ${item.reservedQuantity} unidades já reservadas.`,
      });
      return;
    }

    const reqState = evaluateAyllaDraftRequirements(draft, item.reservedQuantity);
    if (draft.enabled && !reqState.prerequisitesMet) {
      setFeedback({
        kind: "err",
        text: "Conclua aprovação familiar, especificações, segurança e quantidade positiva antes de activar.",
      });
      return;
    }

    setFeedback(null);
    setSavingItemId(item.definition.id);
    startTransition(async () => {
      const result = await updateAyllaGiftInventoryAction({
        eventId: snapshot.eventId,
        itemId: item.definition.id,
        familyApproved: draft.familyApproved,
        enabled: draft.enabled,
        approvedQuantity: parsedQty,
        specificationsComplete: draft.specificationsComplete,
        childSafetyValidated: draft.childSafetyValidated,
      });

      setSavingItemId(null);

      if (!result.success) {
        setFeedback({ kind: "err", text: result.error });
        return;
      }

      resetDraft(item.definition.id);
      setFeedback({
        kind: "ok",
        text: `Artigo «${item.definition.name}» actualizado com segurança.`,
      });
      router.refresh();
    });
  }

  function handleTransition(
    reservation: AyllaAdminReservationView,
    nextStatus: AyllaGiftReservationStatus
  ) {
    setFeedback(null);
    const reason = transitionReasons[reservation.id] ?? "";
    startTransition(async () => {
      const result = await transitionAyllaGiftReservationAction({
        eventId: snapshot.eventId,
        reservationId: reservation.id,
        nextStatus,
        reason,
      });
      if (!result.success) {
        setFeedback({ kind: "err", text: result.error });
        return;
      }

      setFeedback({
        kind: "ok",
        text: `Reserva de ${reservation.guestName} actualizada para ${STATUS_LABELS[nextStatus]}.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Global Curation Overview Card */}
      <section className="admin-card p-5 md:p-7 space-y-5 border-admin-gold/25">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg border border-admin-gold/30 bg-admin-gold/10 flex items-center justify-center shrink-0 mt-0.5">
              <Gift className="w-5 h-5 text-[#E3C46B]" strokeWidth={1.6} />
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.26em] uppercase text-[#DFC070] mb-1.5">
                Edition V2 · Curadoria ({snapshot.registryKey})
              </p>
              <h3 className="font-serif text-xl md:text-2xl font-light text-[#FAF6EE] tracking-tight">
                Catálogo Baby Aylla & Curadoria de Presentes
              </h3>
              <p className="text-[13px] text-[#C8C0B2] mt-1.5 leading-relaxed max-w-2xl">
                Curadoria controlada dos {summary.total} artigos em 7 categorias. Cada presente
                permanece bloqueado até reunir aprovação familiar, especificações, segurança infantil,
                quantidade positiva e activação explícita.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span
              className={`px-2.5 py-1 rounded-md border ${
                snapshot.otpReadiness.emailReady
                  ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
                  : "border-amber-500/40 bg-amber-950/40 text-amber-200"
              }`}
            >
              Email OTP: {snapshot.otpReadiness.emailReady ? "Pronto" : "Pendente"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md border ${
                snapshot.otpReadiness.whatsappReady
                  ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
                  : "border-white/15 bg-white/[0.04] text-[#D1C9BC]"
              }`}
            >
              WhatsApp OTP: {snapshot.otpReadiness.whatsappReady ? "Pronto" : "Adormecido"}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md border ${
                snapshot.otpReadiness.smsReady
                  ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-200"
                  : "border-white/15 bg-white/[0.04] text-[#D1C9BC]"
              }`}
            >
              SMS OTP: {snapshot.otpReadiness.smsReady ? "Pronto" : "Adormecido"}
            </span>
          </div>
        </div>

        {!snapshot.configured && snapshot.statusMessage ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium text-amber-100">
                Ligação de escrita administrativa V2 inactiva neste ambiente
              </p>
              <p className="text-xs text-amber-200/85 mt-1">{snapshot.statusMessage}</p>
            </div>
          </div>
        ) : null}

        {/* Global Approval & Readiness Summary */}
        <div className="rounded-lg border border-admin-gold/20 bg-[#0D0B09] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Feather className="w-4 h-4 text-[#E3C46B]" strokeWidth={1.6} />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#E3C46B]">
                Resumo Global de Aprovações
              </span>
            </div>
            <div className="text-xs font-mono text-[#E7E0D3] tabular-nums">
              {summary.approvedCount}/{summary.total} aprovados pela família ({summary.approvalPercent}
              %) · {summary.readyCount}/{summary.total} disponíveis ({summary.readinessPercent}%)
            </div>
          </div>

          <div
            className="h-2 w-full rounded-full bg-white/10 overflow-hidden"
            aria-label={`Progresso global de aprovações: ${summary.approvalPercent}%`}
          >
            <div className="h-full flex">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${summary.readinessPercent}%` }}
              />
              <div
                className="h-full bg-[#E3C46B] transition-all duration-300"
                style={{
                  width: `${Math.max(0, summary.approvalPercent - summary.readinessPercent)}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            <div className="rounded-lg border border-white/10 bg-[#14110E] px-3.5 py-3">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#C9C0B0]">
                Artigos Canónicos
              </p>
              <p className="font-serif text-2xl font-light text-[#FAF6EE] mt-1 tabular-nums">
                {summary.total}
              </p>
              <p className="text-[11px] text-[#A89F91] mt-0.5">7 categorias</p>
            </div>
            <div className="rounded-lg border border-admin-gold/25 bg-[#14110E] px-3.5 py-3">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#DFC070]">
                Aprovados Família
              </p>
              <p className="font-serif text-2xl font-light text-[#FAF6EE] mt-1 tabular-nums">
                {summary.approvedCount}
                <span className="text-sm text-[#A89F91]">/{summary.total}</span>
              </p>
              <p className="text-[11px] text-[#C8C0B2] mt-0.5">
                {summary.pendingApprovalCount} por aprovar
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#14110E] px-3.5 py-3">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#C9C0B0]">
                Activos & Prontos
              </p>
              <p className="font-serif text-2xl font-light text-[#FAF6EE] mt-1 tabular-nums">
                {summary.enabledCount}
                <span className="text-sm text-emerald-300/90"> ({summary.readyCount} livres)</span>
              </p>
              <p className="text-[11px] text-[#A89F91] mt-0.5">
                {summary.specsCount} specs · {summary.safetyCount} seg.
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/25 bg-[#14110E] px-3.5 py-3">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-amber-200/90">
                Req. Pendentes
              </p>
              <p className="font-serif text-2xl font-light text-[#FAF6EE] mt-1 tabular-nums">
                {summary.pendingCount}
              </p>
              <p className="text-[11px] text-[#C8C0B2] mt-0.5">Artigos incompletos</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#14110E] px-3.5 py-3 col-span-2 sm:col-span-1">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#C9C0B0]">
                Unidades & Reservas
              </p>
              <p className="font-serif text-2xl font-light text-[#FAF6EE] mt-1 tabular-nums">
                {summary.totalAuthorizedUnits}
                <span className="text-sm text-[#A89F91]"> un.</span>
              </p>
              <p className="text-[11px] text-[#C8C0B2] mt-0.5">
                {summary.activeReservations} reservas activas
              </p>
            </div>
          </div>
        </div>

        {/* Sub-section Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {(
            [
              ["inventory", `Curadoria (${summary.total} Artigos)`],
              ["reservations", `Reservas (${snapshot.reservations.length})`],
              ["audit", `Auditoria (${snapshot.audits.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase border rounded-md transition-colors ${
                section === key
                  ? "bg-admin-gold/20 text-[#F4D98A] border-admin-gold/60 font-medium"
                  : "text-[#D1C9BC] border-white/15 hover:border-admin-gold/40 hover:text-white bg-white/[0.02]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {feedback ? (
          <div
            role="status"
            className={`px-4 py-3 rounded-lg border text-sm flex items-center gap-2.5 ${
              feedback.kind === "ok"
                ? "border-emerald-500/45 bg-emerald-950/40 text-emerald-100"
                : "border-red-500/45 bg-red-950/40 text-red-100"
            }`}
          >
            {feedback.kind === "ok" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-300" />
            )}
            <span>{feedback.text}</span>
          </div>
        ) : null}
      </section>

      {section === "inventory" ? (
        <section className="admin-card p-5 md:p-7 space-y-4">
          {/* Instant Search + Expand/Collapse Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <label className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9C0B0] pointer-events-none"
                aria-hidden
              />
              <input
                type="text"
                role="searchbox"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Pesquisar presente por nome, categoria ou ID…"
                aria-label="Pesquisar presente por nome"
                className="admin-input admin-input-icon pr-10 w-full text-sm text-[#FAF6EE] placeholder:text-[#988F82]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label="Limpar pesquisa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9C0B0] hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </label>

            <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
              <span className="text-xs font-mono text-[#D1C9BC] tabular-nums">
                {matchedItemTotal} de {summary.total} artigos
                {isFiltered ? ` · ${visibleGroups.length} cat.` : " · 7 categorias"}
              </span>
              <button
                type="button"
                onClick={toggleAllCategories}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-admin-gold/35 bg-admin-gold/10 hover:bg-admin-gold/20 text-[#F4D98A] font-mono text-[11px] tracking-[0.14em] uppercase transition-colors"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                {allExpanded ? "Recolher todas" : "Expandir todas"}
              </button>
            </div>
          </div>

          {/* Operational State Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#DFC070] shrink-0 sm:mr-1">
              <Filter className="w-3.5 h-3.5" />
              Estado:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {AYLLA_STATE_FILTER_OPTIONS.map((option) => {
                const active = stateFilter === option.id;
                const count = filterCounts[option.id];
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleFilterChange(option.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors border tabular-nums ${
                      active
                        ? "bg-[#E3C46B] text-[#0A0908] border-[#E3C46B] font-semibold"
                        : "bg-white/[0.03] text-[#DDD5C7] border-white/15 hover:border-admin-gold/45 hover:text-white"
                    }`}
                  >
                    {option.label} ({count})
                  </button>
                );
              })}
              {isFiltered ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-2.5 py-1.5 rounded-full text-xs font-mono text-[#E3C46B] hover:text-white border border-transparent hover:border-admin-gold/35 transition-colors"
                >
                  Limpar
                </button>
              ) : null}
            </div>
          </div>

          {/* 7 Expandable/Collapsible Categories */}
          {visibleGroups.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-[#0D0B09] px-6 py-10 text-center space-y-3">
              <p className="text-sm text-[#E7E0D3]">
                Nenhum presente encontrado com os filtros actuais.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="admin-btn-secondary text-xs px-4 py-2"
              >
                Repor pesquisa e filtros
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {visibleGroups.map((group) => {
                const open = isCategoryOpen(group.category.id);
                return (
                  <div
                    key={group.category.id}
                    className={`rounded-xl border transition-colors ${
                      open
                        ? "border-admin-gold/40 bg-[#0F0D0A]"
                        : "border-admin-gold/20 bg-[#0C0A08] hover:border-admin-gold/35"
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggleCategory(group.category.id)}
                      className="w-full px-4 py-3.5 md:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-md border border-admin-gold/30 bg-admin-gold/10 flex items-center justify-center shrink-0 text-[#E3C46B] mt-0.5 sm:mt-0">
                          {open ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-serif text-base md:text-lg font-normal text-[#FAF6EE]">
                              {group.category.title}
                            </h4>
                            {group.category.featured ? (
                              <span className="px-2 py-0.5 rounded border border-admin-gold/40 bg-admin-gold/15 font-mono text-[10px] uppercase tracking-wider text-[#F4D98A]">
                                Destaque
                              </span>
                            ) : null}
                            <span className="px-2 py-0.5 rounded bg-white/[0.06] font-mono text-[11px] text-[#DED6C8] tabular-nums">
                              {isFiltered && group.matchingItems.length !== group.totalInCategory
                                ? `${group.matchingItems.length} de ${group.totalInCategory} artigos`
                                : `${group.totalInCategory} artigos`}
                            </span>
                          </div>
                          <p className="text-xs text-[#BEB7AA] mt-0.5 truncate sm:whitespace-normal">
                            {group.category.lead}
                          </p>
                        </div>
                      </div>

                      {/* Category Progress & Counters */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 pl-10 sm:pl-0 shrink-0">
                        <div className="text-left sm:text-right font-mono text-[11px] text-[#D8D0C2] tabular-nums space-y-0.5">
                          <div>
                            <span className="text-[#F4D98A]">{group.approvedCount}</span>/
                            {group.totalInCategory} aprov. ·{" "}
                            <span className="text-emerald-300">{group.enabledCount}</span> activos
                          </div>
                          <div className="text-[10px] text-[#A89F91]">
                            {group.pendingCount} com req. pendentes · {group.totalAuthorizedUnits}{" "}
                            un.
                          </div>
                        </div>
                        <div className="w-24 sm:w-28 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#DFC070] tabular-nums">
                            <span>Progresso</span>
                            <span>{group.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#B88A2A] to-[#E3C46B] transition-all duration-300"
                              style={{ width: `${group.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>

                    {open ? (
                      <div className="border-t border-admin-gold/15 divide-y divide-white/10 px-3 py-2 md:px-5 md:py-3">
                        {group.matchingItems.map((item) => {
                          const draft = getDraft(item);
                          const draftState = evaluateAyllaDraftRequirements(
                            draft,
                            item.reservedQuantity
                          );
                          const dirty = isAyllaDraftDirty(item, draft);
                          const minQty = Math.max(1, item.reservedQuantity);
                          const currentParsedQty = draftState.parsedQuantity ?? 0;
                          const isSavingThisItem = isPending && savingItemId === item.definition.id;

                          const statusBadge = item.reservable
                            ? {
                                text: `Disponível (${item.remainingQuantity}/${item.approvedQuantity ?? 0})`,
                                cls: "border-emerald-500/45 bg-emerald-950/45 text-emerald-200",
                              }
                            : item.enabled && item.remainingQuantity === 0
                              ? {
                                  text: "Esgotado (Reservado)",
                                  cls: "border-amber-500/45 bg-amber-950/45 text-amber-200",
                                }
                              : item.familyApproved
                                ? {
                                    text: "Aprovado · Aguarda activação",
                                    cls: "border-admin-gold/45 bg-admin-gold/15 text-[#F4D98A]",
                                  }
                                : {
                                    text: "Aguarda curadoria",
                                    cls: "border-white/20 bg-white/[0.05] text-[#DED6C8]",
                                  };

                          return (
                            <article
                              key={item.definition.id}
                              className={`py-4 first:pt-2 last:pb-2 space-y-3 rounded-lg transition-colors ${
                                dirty ? "bg-admin-gold/[0.04] px-3 -mx-1 my-1 border border-admin-gold/30" : ""
                              }`}
                            >
                              {/* Top Header Row: Title, Flags, Operational Status */}
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="font-serif text-base md:text-[17px] text-[#FAF6EE]">
                                      {item.definition.name}
                                    </h5>
                                    {item.definition.priority === "high" ? (
                                      <span className="px-2 py-0.5 rounded border border-admin-gold/40 bg-admin-gold/10 font-mono text-[10px] uppercase tracking-wider text-[#F4D98A]">
                                        Prioritário
                                      </span>
                                    ) : null}
                                    {dirty ? (
                                      <span className="px-2 py-0.5 rounded border border-amber-400/50 bg-amber-950/40 font-mono text-[10px] uppercase tracking-wider text-amber-200">
                                        Alterações por guardar
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-[13px] text-[#C8C0B2] leading-snug">
                                    {item.definition.description}
                                  </p>
                                  {item.definition.reviewFlags.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89F91]">
                                        Notas de revisão:
                                      </span>
                                      {item.definition.reviewFlags.map((flag) => (
                                        <span
                                          key={flag}
                                          className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-[11px] text-[#D8D0C2]"
                                        >
                                          {AYLLA_REVIEW_FLAG_LABELS[flag]}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap sm:flex-col sm:items-end items-center justify-between gap-2 shrink-0 font-mono text-xs">
                                  <span className={`whitespace-nowrap px-2.5 py-1 rounded-md border ${statusBadge.cls}`}>
                                    {statusBadge.text}
                                  </span>
                                  <span className="whitespace-nowrap text-[11px] text-[#C9C0B0] tabular-nums">
                                    Reservado: {item.reservedQuantity} · Restante:{" "}
                                    {item.remainingQuantity}
                                  </span>
                                </div>
                              </div>

                              {/* Pending Requirements Strip */}
                              <div className="rounded-md border border-white/10 bg-[#0A0907] px-3 py-2 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-[#DFC070] mr-1">
                                  {draftState.pendingRequirements.length > 0
                                    ? `Requisitos em falta (${draftState.pendingRequirements.length}):`
                                    : "Requisitos completos:"}
                                </span>
                                {draftState.pendingRequirements.length > 0 ? (
                                  draftState.pendingRequirements.map((req) => (
                                    <span
                                      key={req}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/35 bg-amber-950/30 text-[11px] text-amber-100"
                                    >
                                      {req}
                                    </span>
                                  ))
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/40 text-[11px] text-emerald-200">
                                    <Check className="w-3 h-3" />
                                    Pronto para disponibilidade activa
                                  </span>
                                )}
                              </div>

                              {/* Controls Row: Individual Approval, Checklist Gates, Quantity Stepper, Availability & Save */}
                              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Individual Approval Action */}
                                  <button
                                    type="button"
                                    aria-pressed={draft.familyApproved}
                                    onClick={() =>
                                      updateDraft(item, { familyApproved: !draft.familyApproved })
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors min-h-[34px] ${
                                      draft.familyApproved
                                        ? "border-admin-gold/60 bg-admin-gold/20 text-[#F6DFA0]"
                                        : "border-white/20 bg-white/[0.03] text-[#E6DFD3] hover:border-admin-gold/45 hover:text-white"
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {draft.familyApproved ? "Família aprovou" : "Aprovar família"}
                                  </button>

                                  {/* Specs & Child Safety Checklist Pills */}
                                  <button
                                    type="button"
                                    aria-pressed={draft.specificationsComplete}
                                    onClick={() =>
                                      updateDraft(item, {
                                        specificationsComplete: !draft.specificationsComplete,
                                      })
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors min-h-[34px] ${
                                      draft.specificationsComplete
                                        ? "border-emerald-500/45 bg-emerald-950/40 text-emerald-200"
                                        : "border-white/15 bg-white/[0.03] text-[#D8D0C2] hover:border-white/35"
                                    }`}
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Especificações {draft.specificationsComplete ? "OK" : ""}
                                  </button>

                                  <button
                                    type="button"
                                    aria-pressed={draft.childSafetyValidated}
                                    onClick={() =>
                                      updateDraft(item, {
                                        childSafetyValidated: !draft.childSafetyValidated,
                                      })
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors min-h-[34px] ${
                                      draft.childSafetyValidated
                                        ? "border-emerald-500/45 bg-emerald-950/40 text-emerald-200"
                                        : "border-white/15 bg-white/[0.03] text-[#D8D0C2] hover:border-white/35"
                                    }`}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Segurança {draft.childSafetyValidated ? "OK" : ""}
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
                                  {/* Clear Quantity Stepper */}
                                  <div className="flex items-center gap-1.5 rounded-md border border-white/15 bg-[#0A0907] px-2 py-1">
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#C9C0B0] pr-1">
                                      Qtd
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`Diminuir quantidade de ${item.definition.name}`}
                                      disabled={currentParsedQty <= minQty}
                                      onClick={() =>
                                        updateDraft(item, {
                                          approvedQuantity: stepAyllaDraftQuantity(
                                            draft.approvedQuantity,
                                            -1,
                                            item.reservedQuantity
                                          ),
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-white/15 bg-white/[0.04] hover:border-admin-gold/50 text-[#FAF6EE] flex items-center justify-center disabled:opacity-35"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min={minQty}
                                      step={1}
                                      aria-label={`Quantidade autorizada para ${item.definition.name}`}
                                      value={draft.approvedQuantity}
                                      onChange={(e) =>
                                        updateDraft(item, { approvedQuantity: e.target.value })
                                      }
                                      placeholder="—"
                                      className="w-12 bg-transparent text-center font-mono text-sm text-[#FAF6EE] focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      aria-label={`Aumentar quantidade de ${item.definition.name}`}
                                      onClick={() =>
                                        updateDraft(item, {
                                          approvedQuantity: stepAyllaDraftQuantity(
                                            draft.approvedQuantity,
                                            1,
                                            item.reservedQuantity
                                          ),
                                        })
                                      }
                                      className="w-7 h-7 rounded border border-white/15 bg-white/[0.04] hover:border-admin-gold/50 text-[#FAF6EE] flex items-center justify-center"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Individual Availability Toggle */}
                                  <button
                                    type="button"
                                    aria-pressed={draft.enabled}
                                    disabled={!draftState.prerequisitesMet && !draft.enabled}
                                    title={
                                      !draftState.prerequisitesMet && !draft.enabled
                                        ? "Complete aprovação, especificações, segurança e quantidade antes de activar."
                                        : undefined
                                    }
                                    onClick={() => updateDraft(item, { enabled: !draft.enabled })}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono uppercase tracking-wider transition-colors min-h-[34px] disabled:opacity-40 disabled:cursor-not-allowed ${
                                      draft.enabled
                                        ? "border-emerald-500/55 bg-emerald-950/50 text-emerald-200"
                                        : "border-white/20 bg-white/[0.03] text-[#DED6C8] hover:border-admin-gold/45"
                                    }`}
                                  >
                                    {draft.enabled ? (
                                      <Unlock className="w-3.5 h-3.5" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5" />
                                    )}
                                    {draft.enabled ? "Activo" : "Activar"}
                                  </button>

                                  {/* Revert + Save */}
                                  <div className="flex items-center gap-1.5">
                                    {dirty ? (
                                      <button
                                        type="button"
                                        aria-label={`Reverter alterações de ${item.definition.name}`}
                                        onClick={() => resetDraft(item.definition.id)}
                                        className="p-2 rounded-md border border-white/15 bg-white/[0.03] text-[#D1C9BC] hover:text-white hover:border-white/35"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      disabled={!snapshot.configured || isPending || !dirty}
                                      onClick={() => handleSaveInventory(item)}
                                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-mono text-[11px] tracking-[0.15em] uppercase transition-colors min-h-[34px] ${
                                        dirty && snapshot.configured
                                          ? "bg-gradient-to-r from-[#E3C46B] to-[#B88A2A] text-[#090807] font-semibold border border-[#E3C46B] hover:brightness-105"
                                          : "bg-admin-gold/10 text-[#DFC070] border border-admin-gold/30 disabled:opacity-45"
                                      }`}
                                    >
                                      {!snapshot.configured ? (
                                        <Lock className="w-3.5 h-3.5" />
                                      ) : (
                                        <SlidersHorizontal className="w-3.5 h-3.5" />
                                      )}
                                      {isSavingThisItem ? "A guardar…" : "Guardar"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {section === "reservations" ? (
        <section className="admin-card overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-dark/80 flex items-center justify-between">
            <h4 className="font-mono text-[11px] tracking-[0.26em] uppercase text-[#E3C46B]">
              Reservas Verificadas V2
            </h4>
            <span className="text-xs text-[#C9C0B0] font-mono">
              {snapshot.reservations.length} registo(s)
            </span>
          </div>

          {snapshot.reservations.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-grey-dark/80 bg-black-soft">
                    {["Presente", "Convidado", "Qtd", "Estado", "Data", "Transição Admin"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-mono text-[10px] tracking-[0.2em] uppercase text-[#C9C0B0]"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {snapshot.reservations.map((res) => (
                    <tr
                      key={res.id}
                      className="border-b border-grey-dark/50 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 text-[#FAF6EE] text-sm">
                        {titleById.get(res.itemId) ?? res.itemId}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#DDD5C7]">
                        <div>{res.guestName}</div>
                        <div className="text-[#A89F91]">
                          {res.guestPhone || res.guestEmail || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#FAF6EE] font-mono tabular-nums">
                        {res.quantity}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded border border-white/20 bg-white/[0.04] text-[#F5EFE2]">
                          {STATUS_LABELS[res.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#C9C0B0] font-mono">
                        {formatDateTime(res.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {res.status === "reserved" || res.status === "purchased" ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder="Motivo (opcional)"
                              value={transitionReasons[res.id] ?? ""}
                              onChange={(e) =>
                                setTransitionReasons((prev) => ({
                                  ...prev,
                                  [res.id]: e.target.value,
                                }))
                              }
                              className="admin-input py-1 px-2 text-xs w-36"
                            />
                            {res.status === "reserved" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={!snapshot.configured || isPending}
                                  onClick={() => handleTransition(res, "purchased")}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-500/45 text-emerald-200 text-[11px] font-mono uppercase"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Adquirido
                                </button>
                                <button
                                  type="button"
                                  disabled={!snapshot.configured || isPending}
                                  onClick={() => handleTransition(res, "cancelled")}
                                  className="px-2.5 py-1 rounded border border-red-500/45 text-red-200 text-[11px] font-mono uppercase"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={!snapshot.configured || isPending}
                                onClick={() => handleTransition(res, "delivered")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-admin-gold/45 text-[#F4D98A] text-[11px] font-mono uppercase"
                              >
                                <PackageCheck className="w-3 h-3" /> Entregue
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#A89F91] font-mono">Terminal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 py-10 text-sm text-[#C9C0B0] text-center">
              Ainda não existem reservas V2 registadas neste evento.
            </p>
          )}
        </section>
      ) : null}

      {section === "audit" ? (
        <section className="admin-card overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-dark/80 flex items-center justify-between">
            <h4 className="font-mono text-[11px] tracking-[0.26em] uppercase text-[#E3C46B] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Trilha de Auditoria V2
            </h4>
            <span className="text-xs text-[#C9C0B0] font-mono">
              {snapshot.audits.length} evento(s)
            </span>
          </div>

          {snapshot.audits.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-grey-dark/80 bg-black-soft">
                    {["Artigo", "Acção", "Transição", "Actor", "Motivo", "Data"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-mono text-[10px] tracking-[0.2em] uppercase text-[#C9C0B0]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshot.audits.map((entry) => (
                    <tr key={entry.id} className="border-b border-grey-dark/50 text-xs">
                      <td className="px-4 py-3 text-[#FAF6EE]">
                        {(entry.itemId && titleById.get(entry.itemId)) || entry.itemId || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#E3C46B]">{entry.action}</td>
                      <td className="px-4 py-3 font-mono text-[#DDD5C7]">
                        {entry.previousStatus ?? "novo"} → {entry.nextStatus}
                      </td>
                      <td className="px-4 py-3 text-[#C9C0B0]">
                        {entry.actorAdminId ? "Admin HAXR" : "Convidado Verificado"}
                      </td>
                      <td className="px-4 py-3 text-[#C9C0B0]">{entry.reason ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[#A89F91]">
                        {formatDateTime(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 py-10 text-sm text-[#C9C0B0] text-center">
              Sem registos de auditoria V2 até ao momento.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
