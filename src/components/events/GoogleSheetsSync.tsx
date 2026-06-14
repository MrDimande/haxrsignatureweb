"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Link2,
  RefreshCw,
  Sheet,
  Unplug,
} from "lucide-react";
import { AdminInput } from "@/components/admin/AdminField";
import SheetSyncNotice from "@/components/events/SheetSyncNotice";
import {
  saveEventSheetConnectionAction,
  syncEventSheetAction,
  testEventSheetConnectionAction,
  exportEventGuestsCsvAction,
} from "@/lib/events/actions/sheets.actions";
import { downloadCsvFile } from "@/lib/finance/export/csv";
import { eventReportSlug } from "@/lib/events/export/report";
import { formatSheetConnectionLabel } from "@/lib/events/sheets/parse-url";
import {
  SHEETS_SYNC_MODE_HINTS,
  SHEETS_SYNC_MODE_LABELS,
} from "@/lib/events/sheets/detect-mode";
import type { ManagedEvent, SheetSyncResult, SheetsSyncMode } from "@/lib/events/types";

type GoogleSheetsSyncProps = {
  event: ManagedEvent;
  onUpdated: (event: ManagedEvent) => void;
  onSynced: () => void;
};

type ProcessPhase = "idle" | "saving" | "testing" | "syncing";
type NoticeState =
  | { kind: "idle" }
  | { kind: "processing"; title: string; message: string }
  | { kind: "success"; title: string; message: string; hint?: string }
  | { kind: "error"; title: string; message: string; hint?: string }
  | { kind: "info"; title: string; message: string; hint?: string };

const SYNC_STEPS = {
  master: [
    "A contactar a folha de convidados…",
    "A ler nomes e contactos…",
    "A actualizar a base de dados do evento…",
  ],
  rsvp: [
    "A contactar a folha de confirmações…",
    "A identificar respostas RSVP…",
    "A marcar confirmados na base de dados…",
  ],
} as const;

function formatSyncDate(iso: string | null): string {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  });
}

function parseActionError(raw: string): NoticeState {
  const [title, ...rest] = raw.split(": ");
  if (rest.length) {
    return {
      kind: "error",
      title: title.trim(),
      message: rest.join(": ").trim(),
    };
  }
  return {
    kind: "error",
    title: "Não foi possível concluir",
    message: raw,
    hint: "Verifique a partilha da folha e o formato das colunas.",
  };
}

export default function GoogleSheetsSync({
  event,
  onUpdated,
  onSynced,
}: GoogleSheetsSyncProps) {
  const [sheetUrl, setSheetUrl] = useState(event.googleSheetUrl);
  const [sheetGid, setSheetGid] = useState(event.googleSheetGid || "0");
  const [sheetMode, setSheetMode] = useState<SheetsSyncMode>(
    event.sheetsSyncMode ?? "master"
  );
  const [detectedMode, setDetectedMode] = useState<SheetsSyncMode | null>(null);
  const [phase, setPhase] = useState<ProcessPhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [notice, setNotice] = useState<NoticeState>({ kind: "idle" });
  const [lastResult, setLastResult] = useState<SheetSyncResult | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const isBusy = phase !== "idle";
  const isConnected = Boolean(event.googleSheetUrl.trim());
  const hasUnsavedUrl =
    sheetUrl.trim() !== event.googleSheetUrl.trim() ||
    sheetGid.trim() !== (event.googleSheetGid || "0");

  const connectionLabel = useMemo(
    () => formatSheetConnectionLabel(event.googleSheetUrl),
    [event.googleSheetUrl]
  );

  useEffect(() => {
    if (phase !== "syncing") return;
    setStepIndex(0);
    const steps = SYNC_STEPS[sheetMode];
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [phase, sheetMode]);

  const payload = {
    googleSheetUrl: sheetUrl,
    googleSheetGid: sheetGid,
    sheetsSyncMode: sheetMode,
  };

  async function handleSaveConnection() {
    setPhase("saving");
    setNotice({
      kind: "processing",
      title: "A guardar ligação",
      message: "A validar o link e associar a folha a este evento.",
    });

    const result = await saveEventSheetConnectionAction(event.id, payload);
    setPhase("idle");

    if (!result.success) {
      setNotice(parseActionError(result.error));
      return;
    }

    onUpdated(result.data);
    setPreviewCount(null);
    setNotice({
      kind: "success",
      title: "Folha ligada",
      message: "A Google Sheet está ligada à base de dados deste evento.",
      hint: "Pode testar a ligação ou importar a lista de convidados.",
    });
  }

  async function handleTestConnection() {
    setPhase("testing");
    setNotice({
      kind: "processing",
      title: "A testar ligação",
      message: "A ler a folha sem alterar dados — apenas confirmação da ligação.",
    });

    const result = await testEventSheetConnectionAction(event.id, payload);
    setPhase("idle");

    if (!result.success) {
      setNotice(parseActionError(result.error));
      return;
    }

    setPreviewCount(result.data.totalRows);
    setDetectedMode(result.data.detectedMode);
    if (result.data.detectedMode === "rsvp" && sheetMode === "master") {
      setSheetMode("rsvp");
    }

    const modeLabel = SHEETS_SYNC_MODE_LABELS[result.data.detectedMode];
    setNotice({
      kind: "info",
      title:
        result.data.detectedMode === "rsvp"
          ? "Folha de confirmações RSVP detectada"
          : "Ligação confirmada",
      message:
        result.data.detectedMode === "rsvp"
          ? `Detectámos ${result.data.totalRows} resposta${result.data.totalRows === 1 ? "" : "s"} de confirmação — não é uma lista manual.`
          : `Encontrámos ${result.data.totalRows} convidado${result.data.totalRows === 1 ? "" : "s"} na folha (${modeLabel}).`,
      hint:
        result.data.analysisReasons[0] ??
        (result.data.sampleNames.length > 0
          ? `Exemplos: ${result.data.sampleNames.join(", ")}`
          : undefined),
    });
  }

  async function handleSync() {
    if (!sheetUrl.trim() && !isConnected) {
      setNotice({
        kind: "error",
        title: "Folha não ligada",
        message: "Cole o URL da Google Sheet antes de sincronizar.",
        hint: "Passo 1: cole o link · Passo 2: guarde a ligação · Passo 3: sincronize.",
      });
      return;
    }

    setPhase("syncing");
    setNotice({
      kind: "processing",
      title: "A sincronizar",
      message: SYNC_STEPS[sheetMode][0],
    });

    const result = await syncEventSheetAction(
      event.id,
      hasUnsavedUrl || !isConnected ? payload : undefined
    );

    setPhase("idle");

    if (!result.success) {
      setNotice(parseActionError(result.error));
      return;
    }

    setLastResult(result.data);
    setPreviewCount(result.data.totalRows);
    const isRsvp = result.data.syncMode === "rsvp";
    setNotice({
      kind: "success",
      title: isRsvp ? "RSVP sincronizado" : "Sincronização concluída",
      message: isRsvp
        ? `${result.data.confirmedFromSheet} confirmado${result.data.confirmedFromSheet === 1 ? "" : "s"} via folha · ${result.data.pendingGuests} ainda por confirmar.`
        : `${result.data.created} novo${result.data.created === 1 ? "" : "s"} · ${result.data.updated} actualizado${result.data.updated === 1 ? "" : "s"} · ${result.data.totalRows} linha${result.data.totalRows === 1 ? "" : "s"} processada${result.data.totalRows === 1 ? "" : "s"}.`,
      hint: isRsvp
        ? "Convidados na folha ficam marcados como RSVP · Sheets. Os restantes permanecem «Convidado» até confirmarem."
        : "Lugares, QR e check-in definidos no painel permanecem intactos após cada importação.",
    });

    if (hasUnsavedUrl || !isConnected) {
      onUpdated({
        ...event,
        googleSheetUrl: sheetUrl.trim(),
        googleSheetGid: sheetGid.trim() || "0",
        sheetsLastSyncedAt: result.data.syncedAt,
        sheetsSyncMode: sheetMode,
      });
    }

    onSynced();
  }

  async function handleExportToSheet() {
    setPhase("syncing");
    const result = await exportEventGuestsCsvAction(event.id);
    setPhase("idle");

    if (!result.success) {
      setNotice(parseActionError(result.error));
      return;
    }

    downloadCsvFile(
      result.data,
      `haxr-sheets-${eventReportSlug(event)}.csv`
    );
    setNotice({
      kind: "info",
      title: "Exportado para Sheets",
      message:
        "CSV descarregado com o formato compatível. Na Google Sheet: Ficheiro → Importar → Carregar ficheiro.",
      hint: "Substitui ou actualiza a folha existente conforme a sua organização.",
    });
  }

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-admin-gold mb-4">
          Google Sheets
        </p>
        <h2 className="font-serif text-2xl md:text-3xl font-light text-white/95">
          Lista de convidados
        </h2>
        <p className="mt-4 text-sm text-grey/65 leading-relaxed">
          Ligue a sua Google Sheet à base de dados do evento — a folha alimenta
          a lista; o painel governa a experiência. Após cada importação, lugares,
          códigos QR e confirmações de presença permanecem sob curadoria editorial.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Última sincronização",
            value: formatSyncDate(event.sheetsLastSyncedAt),
          },
          {
            label: "Registos importados",
            value: lastResult?.totalRows ?? previewCount ?? "—",
          },
          {
            label: "Novos convidados",
            value: lastResult?.created ?? "—",
          },
          {
            label: "Actualizados",
            value: lastResult?.updated ?? "—",
          },
        ].map((item) => (
          <div key={item.label} className="admin-stat-card">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-2">
              {item.label}
            </p>
            <p className="font-serif text-xl font-light text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 px-3 py-1.5 border font-mono text-[9px] tracking-[0.2em] uppercase ${
            isConnected
              ? "border-emerald-500/30 text-emerald-300/90 bg-emerald-500/5"
              : "border-grey-dark/80 text-grey/50"
          }`}
        >
          {isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Unplug className="w-3.5 h-3.5" />
          )}
          {isConnected ? "Folha ligada" : "Sem ligação"}
        </span>
        {isConnected ? (
          <span
            className={`inline-flex items-center px-3 py-1.5 border font-mono text-[9px] tracking-[0.2em] uppercase ${
              sheetMode === "rsvp"
                ? "border-blue-500/30 text-blue-300/90 bg-blue-500/5"
                : "border-grey-dark/80 text-grey/50"
            }`}
          >
            {SHEETS_SYNC_MODE_LABELS[sheetMode]}
          </span>
        ) : null}
        {isConnected && connectionLabel ? (
          <span className="font-mono text-[10px] text-grey/45">{connectionLabel}</span>
        ) : null}
        {hasUnsavedUrl ? (
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-amber-400/80">
            Alterações por guardar
          </span>
        ) : null}
      </div>

      {notice.kind !== "idle" ? (
        <SheetSyncNotice
          variant={notice.kind === "processing" ? "processing" : notice.kind}
          title={notice.title}
          message={
            notice.kind === "processing" && phase === "syncing"
              ? SYNC_STEPS[sheetMode][stepIndex]
              : notice.message
          }
          hint={"hint" in notice ? notice.hint : undefined}
          detail={
            notice.kind === "processing" ? (
              <div className="flex gap-1.5 pt-2">
                {SYNC_STEPS[sheetMode].map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 max-w-12 transition-colors duration-500 ${
                      i <= stepIndex ? "bg-admin-gold/60" : "bg-grey-dark/80"
                    }`}
                  />
                ))}
              </div>
            ) : null
          }
        />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="space-y-8">
          <section className="admin-card p-6 md:p-8 space-y-6">
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45">
              Ligação
            </p>

            <AdminInput
              label="URL da Google Sheet"
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              disabled={isBusy}
            />
            <AdminInput
              label="GID da folha (opcional)"
              value={sheetGid}
              onChange={(e) => setSheetGid(e.target.value)}
              placeholder="0"
              disabled={isBusy}
            />

            <div className="space-y-3">
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/60">
                Tipo de folha
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["master", "rsvp"] as SheetsSyncMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSheetMode(mode)}
                    className={`text-left border p-4 transition-colors ${
                      sheetMode === mode
                        ? "border-admin-gold/40 bg-admin-gold/8"
                        : "border-grey-dark/80 hover:border-grey/40"
                    }`}
                  >
                    <p className="font-serif text-sm text-white/85">
                      {SHEETS_SYNC_MODE_LABELS[mode]}
                    </p>
                    <p className="mt-1 text-xs text-grey/50 leading-relaxed">
                      {SHEETS_SYNC_MODE_HINTS[mode]}
                    </p>
                  </button>
                ))}
              </div>
              {detectedMode === "rsvp" && sheetMode === "rsvp" ? (
                <p className="text-xs text-blue-300/70 border-l border-blue-500/30 pl-3">
                  Auto-detectado: folha de respostas RSVP (Google Forms).
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveConnection}
                disabled={isBusy || !sheetUrl.trim()}
                className="admin-btn-secondary"
              >
                <Link2 className="w-4 h-4" />
                {phase === "saving" ? "A guardar…" : "Guardar ligação"}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isBusy || (!sheetUrl.trim() && !isConnected)}
                className="admin-btn-secondary"
              >
                <ExternalLink className="w-4 h-4" />
                {phase === "testing" ? "A testar…" : "Testar ligação"}
              </button>
              <button
                type="button"
                onClick={handleSync}
                disabled={isBusy || (!sheetUrl.trim() && !isConnected)}
                className="admin-btn-primary"
              >
                <RefreshCw
                  className={`w-4 h-4 ${phase === "syncing" ? "animate-spin" : ""}`}
                />
                {phase === "syncing" ? "A sincronizar…" : "Sincronizar agora"}
              </button>
            </div>

            {hasUnsavedUrl ? (
              <p className="text-xs text-grey/50 italic">
                Se ainda não guardou a ligação, a importação regista o link
                automaticamente.
              </p>
            ) : null}
          </section>

          <section className="admin-card p-6 md:p-8 space-y-4">
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45">
              Sync inverso
            </p>
            <p className="text-sm text-grey/55 leading-relaxed">
              Exporte a lista actual da base de dados para actualizar a Google
              Sheet — útil após confirmar presenças ou atribuir lugares no painel.
            </p>
            <button
              type="button"
              onClick={handleExportToSheet}
              disabled={isBusy}
              className="admin-btn-secondary"
            >
              <Download className="w-4 h-4" />
              Exportar para Google Sheets
            </button>
          </section>

          <section className="admin-card p-6 md:p-8 space-y-5">
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45">
              Como ligar a folha
            </p>
            <ol className="space-y-4">
              {[
                {
                  step: "01",
                  title: "Prepare a folha",
                  body: "Primeira linha: Nome, Email, Telefone (opcionais). Dados a partir da linha 2.",
                },
                {
                  step: "02",
                  title: "Abra a partilha",
                  body: "No Google Sheets: Partilhar → «Qualquer pessoa com o link» → Leitor.",
                },
                {
                  step: "03",
                  title: "Cole o URL",
                  body: "Copie o link do browser (docs.google.com/spreadsheets/d/…) e cole acima.",
                },
                {
                  step: "04",
                  title: "Teste e sincronize",
                  body: "Use «Testar ligação» para validar. Depois «Sincronizar agora» transfere os convidados para a base de dados.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-admin-gold/70 pt-1 shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-serif text-base text-white/85">{item.title}</p>
                    <p className="text-sm text-grey/55 mt-1 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="admin-card p-6 space-y-4">
            <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45">
              Estado
            </p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-grey/50 font-mono text-[9px] uppercase tracking-[0.2em] mb-1">
                  Última sync
                </p>
                <p className="text-white/80 font-serif text-lg font-light">
                  {formatSyncDate(event.sheetsLastSyncedAt)}
                </p>
              </div>
              <div>
                <p className="text-grey/50 font-mono text-[9px] uppercase tracking-[0.2em] mb-1">
                  Resumo
                </p>
                <p className="text-white/70">{event.sheetsSyncSummary || "—"}</p>
              </div>
              {previewCount !== null ? (
                <div>
                  <p className="text-grey/50 font-mono text-[9px] uppercase tracking-[0.2em] mb-1">
                    Última leitura
                  </p>
                  <p className="text-admin-gold/90 font-serif text-xl font-light">
                    {previewCount} convidado{previewCount === 1 ? "" : "s"}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="admin-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-admin-gold/80">
              <Sheet className="w-4 h-4" />
              <p className="font-mono text-[8px] tracking-[0.35em] uppercase">
                Correspondência
              </p>
            </div>
            <p className="text-xs text-grey/55 leading-relaxed">
              Identificação por email, telefone ou nome. Lugares já atribuídos no
              painel{" "}
              <strong className="text-white/50 font-normal">nunca</strong> são
              removidos numa nova importação.
            </p>
          </section>

          {lastResult?.errors.length ? (
            <section className="admin-card p-5 border-red-500/20 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-red-300/80">
                Avisos ({lastResult.errors.length})
              </p>
              {lastResult.errors.slice(0, 5).map((item) => (
                <p key={item} className="text-xs text-red-200/65 leading-relaxed">
                  {item}
                </p>
              ))}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
