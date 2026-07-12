"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Link2,
  RotateCcw,
  UserX,
  XCircle,
} from "lucide-react";
import {
  attachReviewItemAction,
  ignoreReviewItemAction,
  loadGuestReviewQueueAction,
  markReviewItemNeedsReviewAction,
  markReviewItemResolvedAction,
  restoreGuestFromReviewItemAction,
} from "@/lib/events/actions/guest-review.actions";
import {
  confirmPartySuggestionAction,
  dismissPartySuggestionAction,
} from "@/lib/events/actions/guest-party.actions";
import { formatPartyParseSummary } from "@/lib/events/party-parser";
import type {
  EventGuest,
  ReviewQueueItem,
  ReviewQueueResult,
  ReviewQueueSummary,
} from "@/lib/events/types";

type GuestReviewQueueProps = {
  eventId: string;
  guests: EventGuest[];
  initialQueue: ReviewQueueResult;
  onChanged: () => void;
};

const EMPTY_SUMMARY: ReviewQueueSummary = {
  toReview: 0,
  ignored: 0,
  missingGuest: 0,
  possibleDuplicates: 0,
  syncErrors: 0,
  total: 0,
};

const TYPE_LABELS: Record<ReviewQueueItem["type"], string> = {
  missing_guest: "Convidado removido",
  ignored_import_row: "Ignorado",
  duplicate_needs_review: "A rever",
  primary_guest_missing: "Principal ausente",
  possible_duplicate: "Possível duplicado",
  sync_error: "Erro de sync",
  party_needs_review: "Grupo detectado",
};

const SOURCE_LABELS: Record<ReviewQueueItem["source"], string> = {
  ledger: "Sync / import",
  duplicate_resolution: "Resolução de duplicado",
  deduplication: "Deduplicação",
  party_parser: "Party parser",
};

function formatReason(item: ReviewQueueItem): string {
  const reason = item.reason?.trim();
  if (!reason) return "—";
  const map: Record<string, string> = {
    guest_deleted_or_missing: "Convidado ligado foi removido",
    primary_guest_missing: "Convidado principal não existe",
    duplicate_resolution_needs_review: "Duplicado pendente de revisão",
    duplicate_resolution_ignored: "Duplicado ignorado no sync",
    admin_ignored: "Ignorado pelo admin",
    admin_attached: "Associado a convidado existente",
    admin_restored: "Restaurado pelo admin",
    admin_resolved: "Resolvido pelo admin",
    needs_review: "Aguarda decisão",
    ignored: "Ignorado",
    party_needs_review: "Grupo composto — precisa revisão",
  };
  return map[reason] ?? reason;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Maputo",
  });
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "gold" | "amber" | "rose" | "slate" | "violet";
}) {
  const tones = {
    gold: "border-admin-gold/20 bg-admin-gold/5 text-admin-gold",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-300",
    slate: "border-grey-dark/80 bg-white/[0.02] text-grey/70",
    violet: "border-violet-500/20 bg-violet-500/5 text-violet-300",
  };

  return (
    <div className={`rounded-sm border px-4 py-3 ${tones[tone]}`}>
      <p className="font-mono text-[9px] tracking-[0.35em] uppercase opacity-70">
        {label}
      </p>
      <p className="text-2xl font-light mt-1 tabular-nums">{value}</p>
    </div>
  );
}

export default function GuestReviewQueue({
  eventId,
  guests,
  initialQueue,
  onChanged,
}: GuestReviewQueueProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachItem, setAttachItem] = useState<ReviewQueueItem | null>(null);
  const [attachGuestId, setAttachGuestId] = useState("");
  const [payloadItem, setPayloadItem] = useState<ReviewQueueItem | null>(null);

  const guestOptions = useMemo(
    () =>
      [...guests].sort((a, b) =>
        a.name.localeCompare(b.name, "pt", { sensitivity: "base" })
      ),
    [guests]
  );

  async function refreshQueue() {
    const result = await loadGuestReviewQueueAction(eventId);
    if (result.success) {
      setQueue(result.data);
    }
  }

  async function runAction(
    itemId: string,
    action: () => Promise<{ success: boolean; error?: string }>
  ) {
    setBusyId(itemId);
    setError(null);
    const result = await action();
    setBusyId(null);

    if (!result.success) {
      setError(result.error ?? "Não foi possível concluir a acção.");
      return;
    }

    await refreshQueue();
    onChanged();
  }

  async function handleAttach() {
    if (!attachItem || !attachGuestId) return;
    await runAction(attachItem.id, () =>
      attachReviewItemAction(eventId, attachItem.id, attachGuestId)
    );
    setAttachItem(null);
    setAttachGuestId("");
  }

  const summary = queue.summary ?? EMPTY_SUMMARY;

  if (!summary.total) {
    return (
      <section className="admin-card p-8 text-center space-y-3">
        <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto" />
        <p className="text-white/90 font-light">Fila de revisão vazia</p>
        <p className="text-sm text-grey/55 max-w-lg mx-auto leading-relaxed">
          Não há linhas de sync pendentes, duplicados em revisão nem erros a
          tratar. Itens ignorados ou resolvidos pelo admin deixam de aparecer
          aqui.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Fila de revisão RSVP
        </p>
        <p className="text-sm text-grey/55 leading-relaxed max-w-3xl">
          Revise linhas de import/sync e resoluções de duplicados antes de
          fundir ou ignorar. Nenhuma acção apaga convidados nem altera a folha
          Google externa.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="A rever" value={summary.toReview} tone="gold" />
        <SummaryCard label="Ignorados" value={summary.ignored} tone="slate" />
        <SummaryCard
          label="Convidado removido"
          value={summary.missingGuest}
          tone="rose"
        />
        <SummaryCard
          label="Possíveis duplicados"
          value={summary.possibleDuplicates}
          tone="violet"
        />
        <SummaryCard
          label="Erros de sync"
          value={summary.syncErrors}
          tone="amber"
        />
      </div>

      {error ? (
        <div className="rounded-sm border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-grey-dark/80 text-left">
                <th className="px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                  Nome
                </th>
                <th className="px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                  Email
                </th>
                <th className="px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                  Telefone
                </th>
                <th className="px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                  Origem
                </th>
                <th className="px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                  Motivo
                </th>
                <th className="px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                  Última vez visto
                </th>
                <th className="px-4 py-3 font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50 text-right">
                  Acções
                </th>
              </tr>
            </thead>
            <tbody>
              {queue.items.map((item) => {
                const busy = busyId === item.id;
                const isParty = item.type === "party_needs_review";
                const canAttach =
                  item.source !== "deduplication" && !isParty;
                const canRestore =
                  item.source === "ledger" &&
                  (item.type === "missing_guest" ||
                    item.type === "primary_guest_missing");
                const partyGuestId = isParty ? item.guestId ?? item.sourceId : null;

                return (
                  <tr
                    key={item.id}
                    className="border-b border-grey-dark/40 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="text-white/90">{item.displayName}</div>
                      <div className="text-[10px] font-mono text-grey/45 mt-0.5">
                        {TYPE_LABELS[item.type]}
                      </div>
                      {item.partyParse ? (
                        <pre className="text-[10px] text-grey/50 mt-2 whitespace-pre-wrap font-sans leading-relaxed">
                          {formatPartyParseSummary(item.partyParse)}
                        </pre>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-grey/65">{item.email || "—"}</td>
                    <td className="px-4 py-3 text-grey/65">{item.phone || "—"}</td>
                    <td className="px-4 py-3 text-grey/65">
                      {SOURCE_LABELS[item.source]}
                      {item.sourceSystem ? (
                        <span className="block text-[10px] text-grey/40">
                          {item.sourceSystem}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-grey/65 max-w-[200px]">
                      {formatReason(item)}
                    </td>
                    <td className="px-4 py-3 text-grey/55 whitespace-nowrap">
                      {formatDateTime(item.lastSeenAt ?? item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {item.rowPayload || item.source === "ledger" || item.partyParse ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setPayloadItem(item)}
                            className="admin-btn-secondary text-[10px] px-2 py-1"
                            title="Ver payload"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        ) : null}
                        {isParty && partyGuestId ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                runAction(item.id, () =>
                                  confirmPartySuggestionAction(
                                    eventId,
                                    partyGuestId,
                                    item.partyParse?.suggestedPlusOnes
                                  )
                                )
                              }
                              className="admin-btn-secondary text-[10px] px-2 py-1"
                              title="Confirmar grupo"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                runAction(item.id, () =>
                                  dismissPartySuggestionAction(
                                    eventId,
                                    partyGuestId
                                  )
                                )
                              }
                              className="admin-btn-secondary text-[10px] px-2 py-1"
                              title="Ignorar sugestão"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          </>
                        ) : null}
                        {canAttach ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setAttachItem(item);
                              setAttachGuestId(guestOptions[0]?.id ?? "");
                            }}
                            className="admin-btn-secondary text-[10px] px-2 py-1"
                            title="Associar a convidado existente"
                          >
                            <Link2 className="w-3 h-3" />
                          </button>
                        ) : null}
                        {canRestore ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (
                                !confirm(
                                  `Restaurar convidado «${item.displayName}» a partir dos dados guardados?`
                                )
                              ) {
                                return;
                              }
                              void runAction(item.id, () =>
                                restoreGuestFromReviewItemAction(eventId, item.id)
                              );
                            }}
                            className="admin-btn-secondary text-[10px] px-2 py-1"
                            title="Restaurar convidado"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        ) : null}
                        {!isParty ? (
                          <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (
                              !confirm(
                                `Ignorar «${item.displayName}»? Syncs futuros não recriarão automaticamente.`
                              )
                            ) {
                              return;
                            }
                            void runAction(item.id, () =>
                              ignoreReviewItemAction(eventId, item.id)
                            );
                          }}
                          className="admin-btn-secondary text-[10px] px-2 py-1"
                          title="Ignorar"
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            runAction(item.id, () =>
                              markReviewItemNeedsReviewAction(eventId, item.id)
                            )
                          }
                          className="admin-btn-secondary text-[10px] px-2 py-1"
                          title="Manter em revisão"
                        >
                          <AlertTriangle className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            runAction(item.id, () =>
                              markReviewItemResolvedAction(eventId, item.id)
                            )
                          }
                          className="admin-btn-secondary text-[10px] px-2 py-1"
                          title="Marcar como resolvido"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {attachItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="admin-card w-full max-w-md p-6 space-y-4">
            <h3 className="text-white/90 font-light">
              Associar a convidado existente
            </h3>
            <p className="text-sm text-grey/55">
              Linha: <strong className="text-white/80">{attachItem.displayName}</strong>
            </p>
            <label className="block space-y-2">
              <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                Convidado principal
              </span>
              <select
                value={attachGuestId}
                onChange={(e) => setAttachGuestId(e.target.value)}
                className="admin-input w-full"
              >
                {guestOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {g.email ? ` · ${g.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setAttachItem(null);
                  setAttachGuestId("");
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={!attachGuestId || busyId === attachItem.id}
                onClick={() => void handleAttach()}
              >
                Associar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {payloadItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="admin-card w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-white/90 font-light">Origem e payload</h3>
                <p className="text-sm text-grey/55 mt-1">{payloadItem.displayName}</p>
              </div>
              <button
                type="button"
                className="admin-btn-secondary p-2"
                onClick={() => setPayloadItem(null)}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-grey/45 text-[10px] uppercase tracking-wider">
                  Tipo
                </dt>
                <dd className="text-white/80">{TYPE_LABELS[payloadItem.type]}</dd>
              </div>
              <div>
                <dt className="text-grey/45 text-[10px] uppercase tracking-wider">
                  Fonte
                </dt>
                <dd className="text-white/80">{SOURCE_LABELS[payloadItem.source]}</dd>
              </div>
              <div>
                <dt className="text-grey/45 text-[10px] uppercase tracking-wider">
                  ID origem
                </dt>
                <dd className="text-white/80 font-mono text-xs break-all">
                  {payloadItem.sourceId}
                </dd>
              </div>
              {payloadItem.rowFingerprint ? (
                <div>
                  <dt className="text-grey/45 text-[10px] uppercase tracking-wider">
                    Fingerprint
                  </dt>
                  <dd className="text-white/80 font-mono text-xs break-all">
                    {payloadItem.rowFingerprint}
                  </dd>
                </div>
              ) : null}
            </dl>
            <pre className="text-xs bg-black/40 border border-grey-dark/60 rounded-sm p-4 overflow-x-auto text-grey/75">
              {JSON.stringify(
                payloadItem.partyParse
                  ? {
                      partyParse: payloadItem.partyParse,
                      rowPayload: payloadItem.rowPayload,
                    }
                  : (payloadItem.rowPayload ?? {}),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
