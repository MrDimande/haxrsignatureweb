"use client";

import { useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import {
  confirmGuestImportAction,
  previewGuestImportAction,
} from "@/lib/events/actions/guest-import.actions";
import type { ImportPreviewResult } from "@/lib/events/services/import-preview.service";
import type { GuestImportBatch } from "@/lib/events/types";
import type { SheetGuestRow } from "@/lib/events/sheets/types";

type GuestImportPanelProps = {
  eventId: string;
  importBatches: GuestImportBatch[];
  onImported: () => void;
  onRemoveBatch: (batchId: string) => void;
};

const STATUS_LABEL: Record<string, string> = {
  valid: "Válida",
  duplicate: "Duplicada",
  invalid: "Inválida",
  existing: "Já existe",
  excluded: "Excluída",
};

export default function GuestImportPanel({
  eventId,
  importBatches,
  onImported,
  onRemoveBatch,
}: GuestImportPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [includeExisting, setIncludeExisting] = useState(true);

  const visibleRows = useMemo(() => {
    if (!preview) return [];
    return preview.rows.map((row) => ({
      ...row,
      excluded: excluded.has(row.rowKey),
      status: excluded.has(row.rowKey) ? ("excluded" as const) : row.status,
    }));
  }, [preview, excluded]);

  async function runPreview(text: string, name: string, keys: string[]) {
    setBusy(true);
    setMessage("");
    const result = await previewGuestImportAction(eventId, text, keys);
    setBusy(false);
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setFilename(name);
    setCsvText(text);
    setPreview(result.data);
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setExcluded(new Set());
    await runPreview(text, file.name, []);
  }

  function toggleExclude(rowKey: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  }

  function updateRowField(
    rowKey: string,
    field: "name" | "email" | "phone",
    value: string
  ) {
    setPreview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) =>
          row.rowKey === rowKey
            ? {
                ...row,
                [field]: value,
                editable: { ...row.editable, [field]: value },
              }
            : row
        ),
      };
    });
  }

  async function refreshPreview() {
    if (!csvText) return;
    await runPreview(csvText, filename, [...excluded]);
  }

  async function handleConfirm() {
    if (!preview) return;
    setBusy(true);
    setMessage("");

    const rows: SheetGuestRow[] = preview.rows
      .filter((row) => !excluded.has(row.rowKey))
      .map((row) => row.editable);

    const result = await confirmGuestImportAction(eventId, {
      filename: filename || "upload.csv",
      rows,
      previewSummary: {
        ...preview.summary,
        excludedRows: excluded.size,
        finalImportTotal: rows.length,
      },
      includeExisting,
    });

    setBusy(false);
    if (!result.success) {
      setMessage(result.error);
      return;
    }

    setMessage(
      `Lote ${result.data.batchId.slice(0, 8)}… · ${result.data.created} novos · ${result.data.updated} actualizados · ${result.data.skipped} ignorados`
    );
    setPreview(null);
    setCsvText("");
    setExcluded(new Set());
    onImported();
  }

  return (
    <section className="admin-card p-6 space-y-4">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
          Importação CSV com preview
        </p>
        <p className="text-sm text-grey/55 leading-relaxed">
          Antes de gravar, reveja linhas válidas, duplicados, telefones inválidos,
          campos vazios e convidados já existentes. Pode editar ou excluir linhas.
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
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="admin-btn-secondary"
        >
          <Upload className="w-4 h-4" />
          Carregar CSV
        </button>
        {preview ? (
          <>
            <button
              type="button"
              onClick={() => void refreshPreview()}
              disabled={busy}
              className="admin-btn-secondary text-xs"
            >
              Recalcular preview
            </button>
            <label className="flex items-center gap-2 text-xs text-grey/60">
              <input
                type="checkbox"
                checked={includeExisting}
                onChange={(e) => setIncludeExisting(e.target.checked)}
              />
              Actualizar existentes
            </label>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={busy}
              className="admin-btn-primary"
            >
              Confirmar importação
            </button>
          </>
        ) : null}
      </div>

      {preview ? (
        <div className="space-y-3">
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-admin-gold">
            Preview · {preview.summary.validRows} válidas ·{" "}
            {preview.summary.duplicateRows} duplicadas ·{" "}
            {preview.summary.invalidRows} inválidas ·{" "}
            {preview.summary.existingRows} existentes · {excluded.size} excluídas
            · total final ~{preview.summary.finalImportTotal}
          </p>
          <div className="overflow-x-auto max-h-80 border border-grey-dark/60 rounded-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-grey-dark/80 bg-black-soft">
                  {["Incluir", "Linha", "Nome", "Email", "Telefone", "Estado"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-mono text-[8px] tracking-[0.25em] uppercase text-grey/50"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.rowKey}
                    className="border-b border-grey-dark/40 hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!excluded.has(row.rowKey)}
                        onChange={() => toggleExclude(row.rowKey)}
                        aria-label={`Incluir linha ${row.rowNumber}`}
                      />
                    </td>
                    <td className="px-3 py-2 text-grey/50">{row.rowNumber}</td>
                    <td className="px-3 py-2">
                      <input
                        value={row.editable.name}
                        onChange={(e) =>
                          updateRowField(row.rowKey, "name", e.target.value)
                        }
                        className="admin-input w-full min-w-[140px]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.editable.email}
                        onChange={(e) =>
                          updateRowField(row.rowKey, "email", e.target.value)
                        }
                        className="admin-input w-full min-w-[140px]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.editable.phone}
                        onChange={(e) =>
                          updateRowField(row.rowKey, "phone", e.target.value)
                        }
                        className="admin-input w-full min-w-[120px]"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-grey/55">
                      {STATUS_LABEL[row.status] ?? row.status}
                      {row.existingGuestName
                        ? ` · ${row.existingGuestName}`
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {importBatches.length ? (
        <div className="pt-3 border-t border-grey-dark/60 space-y-2">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45">
            Lotes de importação
          </p>
          <ul className="space-y-2">
            {importBatches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs text-grey/60"
              >
                <span>
                  {batch.filename || "sem nome"} ·{" "}
                  {new Date(batch.createdAt).toLocaleString("pt-MZ")} ·{" "}
                  {batch.validRows}/{batch.totalRows} válidos · {batch.status}
                  {batch.operatorEmail ? ` · ${batch.operatorEmail}` : ""}
                </span>
                <button
                  type="button"
                  className="admin-btn-secondary text-[10px]"
                  onClick={() => onRemoveBatch(batch.id)}
                >
                  Remover lote
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <p className="text-xs text-grey/50 italic whitespace-pre-line max-w-2xl">
          {message}
        </p>
      ) : null}
    </section>
  );
}
