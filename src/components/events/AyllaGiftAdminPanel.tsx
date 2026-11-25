"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Gift,
  Lock,
  PackageCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import type { AyllaGiftReconciledItem } from "@/lib/edition/gifts/aylla/catalog-items";
import type {
  AyllaAdminReservationView,
  AyllaGiftAdminSnapshot,
} from "@/lib/edition/gifts/aylla/admin-store";
import type { AyllaGiftReservationStatus } from "@/lib/edition/gifts/aylla/types";
import {
  transitionAyllaGiftReservationAction,
  updateAyllaGiftInventoryAction,
} from "@/lib/events/actions/aylla-gifts.actions";

type AyllaGiftAdminPanelProps = {
  snapshot: AyllaGiftAdminSnapshot;
};

type InventoryDraft = {
  familyApproved: boolean;
  specificationsComplete: boolean;
  childSafetyValidated: boolean;
  approvedQuantity: string;
  enabled: boolean;
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

function toDraft(item: AyllaGiftReconciledItem): InventoryDraft {
  return {
    familyApproved: item.familyApproved,
    specificationsComplete: item.specificationsComplete,
    childSafetyValidated: item.childSafetyValidated,
    approvedQuantity: item.approvedQuantity != null ? String(item.approvedQuantity) : "",
    enabled: item.enabled,
  };
}

export default function AyllaGiftAdminPanel({ snapshot }: AyllaGiftAdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [section, setSection] = useState<"inventory" | "reservations" | "audit">("inventory");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState<"all" | "pending" | "ready" | "enabled">("all");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, InventoryDraft>>({});
  const [transitionReasons, setTransitionReasons] = useState<Record<string, string>>({});

  const titleById = useMemo(
    () => new Map(snapshot.items.map((item) => [item.definition.id, item.definition.name])),
    [snapshot.items]
  );

  const summary = useMemo(() => {
    const approvedCount = snapshot.items.filter((i) => i.familyApproved).length;
    const enabledCount = snapshot.items.filter((i) => i.enabled).length;
    const readyCount = snapshot.items.filter((i) => i.reservable).length;
    const activeReservations = snapshot.reservations.filter(
      (r) => r.status === "reserved" || r.status === "purchased" || r.status === "delivered"
    ).length;
    return {
      total: snapshot.items.length,
      approvedCount,
      enabledCount,
      readyCount,
      activeReservations,
    };
  }, [snapshot.items, snapshot.reservations]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return snapshot.items.filter((item) => {
      if (categoryFilter !== "all" && item.definition.category !== categoryFilter) {
        return false;
      }
      if (stateFilter === "pending" && item.pendingRequirements.length === 0) {
        return false;
      }
      if (stateFilter === "ready" && !item.reservable) {
        return false;
      }
      if (stateFilter === "enabled" && !item.enabled) {
        return false;
      }
      if (!query) return true;
      return (
        item.definition.name.toLowerCase().includes(query) ||
        item.definition.id.toLowerCase().includes(query) ||
        item.categoryTitle.toLowerCase().includes(query)
      );
    });
  }, [snapshot.items, search, categoryFilter, stateFilter]);

  function getDraft(item: AyllaGiftReconciledItem): InventoryDraft {
    return drafts[item.definition.id] ?? toDraft(item);
  }

  function updateDraft(item: AyllaGiftReconciledItem, patch: Partial<InventoryDraft>) {
    const current = getDraft(item);
    setDrafts((prev) => ({
      ...prev,
      [item.definition.id]: { ...current, ...patch },
    }));
  }

  function handleSaveInventory(item: AyllaGiftReconciledItem) {
    const draft = getDraft(item);
    const parsedQty = draft.approvedQuantity.trim()
      ? Number.parseInt(draft.approvedQuantity.trim(), 10)
      : null;

    if (parsedQty !== null && (!Number.isSafeInteger(parsedQty) || parsedQty <= 0)) {
      setFeedback({ kind: "err", text: "Quantidade autorizada deve ser um inteiro positivo." });
      return;
    }

    setFeedback(null);
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

      if (!result.success) {
        setFeedback({ kind: "err", text: result.error });
        return;
      }

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
    <div className="space-y-8">
      <section className="admin-card p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-admin-gold mt-0.5 shrink-0" />
            <div>
              <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
                Edition V2 · Registry Control ({snapshot.registryKey})
              </p>
              <h3 className="font-serif text-xl font-light text-white/90">
                Catálogo Baby Aylla & Reservas Verificadas
              </h3>
              <p className="text-sm text-grey/55 mt-2 leading-relaxed max-w-2xl">
                Separação integral entre curadoria editorial (52 artigos), aprovação familiar,
                especificações, segurança infantil, quantidade autorizada e disponibilidade activa.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider">
            <span
              className={`px-2.5 py-1 rounded border ${
                snapshot.otpReadiness.emailReady
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                  : "border-amber-500/30 bg-amber-950/30 text-amber-200"
              }`}
            >
              Email OTP: {snapshot.otpReadiness.emailReady ? "Pronto" : "Pendente"}
            </span>
            <span
              className={`px-2.5 py-1 rounded border ${
                snapshot.otpReadiness.whatsappReady
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                  : "border-white/10 bg-white/[0.03] text-grey/60"
              }`}
            >
              WhatsApp OTP: {snapshot.otpReadiness.whatsappReady ? "Pronto" : "Adormecido"}
            </span>
            <span
              className={`px-2.5 py-1 rounded border ${
                snapshot.otpReadiness.smsReady
                  ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                  : "border-white/10 bg-white/[0.03] text-grey/60"
              }`}
            >
              SMS OTP: {snapshot.otpReadiness.smsReady ? "Pronto" : "Adormecido"}
            </span>
          </div>
        </div>

        {!snapshot.configured && snapshot.statusMessage ? (
          <div className="rounded border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium">Ligação administrativa V2 pendente de provisionamento</p>
              <p className="text-xs text-amber-200/80 mt-1">{snapshot.statusMessage}</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              Artigos Canónicos
            </p>
            <p className="font-serif text-2xl font-light text-white">{summary.total}</p>
          </div>
          <div className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              Aprovados Família
            </p>
            <p className="font-serif text-2xl font-light text-white">{summary.approvedCount}</p>
          </div>
          <div className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              Activos Catálogo
            </p>
            <p className="font-serif text-2xl font-light text-white">{summary.enabledCount}</p>
          </div>
          <div className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              Disponíveis Agora
            </p>
            <p className="font-serif text-2xl font-light text-white">{summary.readyCount}</p>
          </div>
          <div className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              Reservas Activas
            </p>
            <p className="font-serif text-2xl font-light text-white">{summary.activeReservations}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
          {(
            [
              ["inventory", "Inventário (52 Artigos)"],
              ["reservations", `Reservas (${snapshot.reservations.length})`],
              ["audit", `Auditoria (${snapshot.audits.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`px-4 py-2 font-mono text-[9px] tracking-[0.25em] uppercase border rounded-sm transition-colors ${
                section === key
                  ? "bg-admin-gold/10 text-admin-gold border-admin-gold/30"
                  : "text-grey/70 border-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {feedback ? (
          <div
            role="status"
            className={`px-4 py-3 rounded border text-sm flex items-center gap-2 ${
              feedback.kind === "ok"
                ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-200"
                : "border-red-500/35 bg-red-950/25 text-red-200"
            }`}
          >
            {feedback.kind === "ok" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        ) : null}
      </section>

      {section === "inventory" ? (
        <section className="admin-card p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative flex-1 min-w-[220px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey/40 pointer-events-none"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar artigo, ID ou categoria…"
                className="admin-input admin-input-icon w-full"
              />
            </label>
            <select
              aria-label="Filtrar por categoria"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-input min-w-[220px]"
            >
              <option value="all">Todas as 7 categorias</option>
              {snapshot.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por estado"
              value={stateFilter}
              onChange={(e) =>
                setStateFilter(e.target.value as "all" | "pending" | "ready" | "enabled")
              }
              className="admin-input"
            >
              <option value="all">Todos ({snapshot.items.length})</option>
              <option value="pending">Pendentes</option>
              <option value="enabled">Activos</option>
              <option value="ready">Disponíveis</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredItems.map((item) => {
              const draft = getDraft(item);
              const parsedDraftQty = draft.approvedQuantity.trim()
                ? Number.parseInt(draft.approvedQuantity.trim(), 10)
                : null;
              const prerequisitesMet =
                draft.familyApproved &&
                draft.specificationsComplete &&
                draft.childSafetyValidated &&
                parsedDraftQty !== null &&
                parsedDraftQty > 0;

              return (
                <article
                  key={item.definition.id}
                  className="rounded border border-white/10 bg-black-soft/50 p-4 md:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-admin-gold/80">
                        {item.categoryTitle} · {item.definition.id}
                      </p>
                      <h4 className="font-serif text-lg text-white/95 mt-1">
                        {item.definition.name}
                      </h4>
                      <p className="text-xs text-grey/60 mt-1">{item.definition.description}</p>
                      {item.definition.reviewFlags.length > 0 ? (
                        <p className="text-[11px] font-mono text-grey/45 mt-1.5">
                          Requisitos editoriais: {item.definition.reviewFlags.join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 text-xs font-mono">
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          item.reservable
                            ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                            : "border-white/10 bg-white/[0.03] text-grey/60"
                        }`}
                      >
                        {item.reservable
                          ? `Reservável (${item.remainingQuantity}/${item.approvedQuantity ?? 0})`
                          : "Bloqueado Fail-Closed"}
                      </span>
                      <span className="text-grey/50">
                        Reservado: {item.reservedQuantity}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-center pt-3 border-t border-white/5 text-xs">
                    <label className="flex items-center gap-2 text-grey/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.familyApproved}
                        onChange={(e) =>
                          updateDraft(item, { familyApproved: e.target.checked })
                        }
                      />
                      <span>Família aprovou</span>
                    </label>
                    <label className="flex items-center gap-2 text-grey/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.specificationsComplete}
                        onChange={(e) =>
                          updateDraft(item, { specificationsComplete: e.target.checked })
                        }
                      />
                      <span>Especificações OK</span>
                    </label>
                    <label className="flex items-center gap-2 text-grey/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.childSafetyValidated}
                        onChange={(e) =>
                          updateDraft(item, { childSafetyValidated: e.target.checked })
                        }
                      />
                      <span>Segurança OK</span>
                    </label>
                    <label className="flex items-center gap-2 text-grey/80">
                      <span className="text-grey/50">Qtd:</span>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={draft.approvedQuantity}
                        onChange={(e) =>
                          updateDraft(item, { approvedQuantity: e.target.value })
                        }
                        placeholder="—"
                        className="admin-input w-20 py-1 px-2 text-xs"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-grey/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.enabled}
                        disabled={!prerequisitesMet && !draft.enabled}
                        onChange={(e) => updateDraft(item, { enabled: e.target.checked })}
                      />
                      <span>Activar</span>
                    </label>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!snapshot.configured || isPending}
                        onClick={() => handleSaveInventory(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-admin-gold/15 hover:bg-admin-gold/25 border border-admin-gold/40 text-admin-gold font-mono text-[9px] tracking-[0.2em] uppercase disabled:opacity-40"
                      >
                        {snapshot.configured ? (
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        Guardar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {section === "reservations" ? (
        <section className="admin-card overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-dark/80 flex items-center justify-between">
            <h4 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
              Reservas Verificadas V2
            </h4>
            <span className="text-xs text-grey/50 font-mono">
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
                          className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50"
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
                      <td className="px-4 py-3 text-white/90 text-sm">
                        {titleById.get(res.itemId) ?? res.itemId}
                      </td>
                      <td className="px-4 py-3 text-xs text-grey/75">
                        <div>{res.guestName}</div>
                        <div className="text-grey/50">
                          {res.guestPhone || res.guestEmail || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80 font-mono">
                        {res.quantity}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded border border-white/15 bg-white/[0.03] text-white/85">
                          {STATUS_LABELS[res.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-grey/50 font-mono">
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Adquirido
                                </button>
                                <button
                                  type="button"
                                  disabled={!snapshot.configured || isPending}
                                  onClick={() => handleTransition(res, "cancelled")}
                                  className="px-2.5 py-1 rounded border border-red-500/40 text-red-300 text-[10px] font-mono uppercase"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={!snapshot.configured || isPending}
                                onClick={() => handleTransition(res, "delivered")}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-admin-gold/40 text-admin-gold text-[10px] font-mono uppercase"
                              >
                                <PackageCheck className="w-3 h-3" /> Entregue
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-grey/40 font-mono">Terminal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 py-10 text-sm text-grey/60 text-center">
              Ainda não existem reservas V2 registadas neste evento.
            </p>
          )}
        </section>
      ) : null}

      {section === "audit" ? (
        <section className="admin-card overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-dark/80 flex items-center justify-between">
            <h4 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Trilha de Auditoria V2
            </h4>
            <span className="text-xs text-grey/50 font-mono">
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
                        className="px-4 py-3 text-left font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshot.audits.map((entry) => (
                    <tr key={entry.id} className="border-b border-grey-dark/50 text-xs">
                      <td className="px-4 py-3 text-white/90">
                        {(entry.itemId && titleById.get(entry.itemId)) || entry.itemId || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-admin-gold">{entry.action}</td>
                      <td className="px-4 py-3 font-mono text-grey/70">
                        {entry.previousStatus ?? "novo"} → {entry.nextStatus}
                      </td>
                      <td className="px-4 py-3 text-grey/60">
                        {entry.actorAdminId ? "Admin HAXR" : "Convidado Verificado"}
                      </td>
                      <td className="px-4 py-3 text-grey/60">{entry.reason ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-grey/50">
                        {formatDateTime(entry.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 py-10 text-sm text-grey/60 text-center">
              Sem registos de auditoria V2 até ao momento.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
