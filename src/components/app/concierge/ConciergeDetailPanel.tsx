import type { ConciergeInboxItem, ConciergeModuleData } from "@/lib/concierge/portal/types";
import type { ReactNode } from "react";
import {
  CONCIERGE_DESTINATION_LABELS,
  CONCIERGE_SOURCE_LABELS,
  CONCIERGE_TYPE_LABELS,
  formatConciergeDate,
} from "@/lib/concierge/portal/presentation";
import { ConciergeConfidenceBadge, ConciergeStatusBadge } from "./ConciergeBadges";
import ConciergeSuggestions, { ConciergeActivityFeed } from "./ConciergeSuggestions";

type ConciergeDetailPanelProps = {
  item: ConciergeInboxItem | null;
  data: ConciergeModuleData;
  onClassify: () => void;
  onValidate: () => void;
  onRoute: () => void;
  onReject: () => void;
  onArchive: () => void;
  isProcessing: boolean;
};

export default function ConciergeDetailPanel({
  item,
  data,
  onClassify,
  onValidate,
  onRoute,
  onReject,
  onArchive,
  isProcessing,
}: ConciergeDetailPanelProps) {
  const permissions = data.workspaceMeta.permissions;
  if (!item) {
    return (
      <aside className="rounded-3xl border border-brand-champagne/15 bg-white/[0.03] p-6 text-sm text-zinc-500">
        Seleccione um item da inbox para ver detalhes, classificação e acções sugeridas.
      </aside>
    );
  }

  const classification = data.classifications.find((c) => c.itemId === item.id);
  const itemSuggestions = data.suggestions.filter((s) => s.itemId === item.id);
  const itemActivities = data.activities.filter((a) => a.itemId === item.id);

  return (
    <aside className="space-y-4 rounded-3xl border border-brand-champagne/15 bg-white/[0.03] p-5 md:p-6">
      <div className="space-y-2 border-b border-brand-champagne/10 pb-4">
        <h2 className="font-serif text-xl text-white">{item.title}</h2>
        <div className="flex flex-wrap gap-2">
          <ConciergeStatusBadge status={item.status} />
          {permissions.showConfidence ? (
            <ConciergeConfidenceBadge confidence={item.confidence} />
          ) : null}
        </div>
        <dl className="grid gap-2 text-xs text-zinc-400">
          <div>
            <dt className="font-mono text-[8px] uppercase text-zinc-600">Origem</dt>
            <dd>{CONCIERGE_SOURCE_LABELS[item.source]}</dd>
          </div>
          <div>
            <dt className="font-mono text-[8px] uppercase text-zinc-600">Tipo</dt>
            <dd>{CONCIERGE_TYPE_LABELS[item.type]}</dd>
          </div>
          <div>
            <dt className="font-mono text-[8px] uppercase text-zinc-600">Data</dt>
            <dd>{formatConciergeDate(item.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {item.fileName ? (
        <MetadataBlock title="Ficheiro">
          <p>{item.fileName}</p>
          {item.mimeType ? <p className="text-zinc-500">{item.mimeType}</p> : null}
          {item.sizeBytes ? (
            <p className="text-zinc-500">{Math.round(item.sizeBytes / 1024)} KB</p>
          ) : null}
        </MetadataBlock>
      ) : null}

      {item.clippedUrl ? (
        <MetadataBlock title="Link guardado">
          <a href={item.clippedUrl} className="text-brand-gold underline break-all" target="_blank" rel="noreferrer">
            {item.clippedTitle ?? item.clippedUrl}
          </a>
        </MetadataBlock>
      ) : null}

      {item.originalEmailSubject ? (
        <MetadataBlock title="Email (preparado)">
          <p>De: {item.originalEmailFrom}</p>
          <p>Assunto: {item.originalEmailSubject}</p>
        </MetadataBlock>
      ) : null}

      {item.extractedText ? (
        <MetadataBlock title="Texto extraído (pré-visualização)">
          <p className="line-clamp-4 whitespace-pre-wrap">{item.extractedText}</p>
        </MetadataBlock>
      ) : null}

      <MetadataBlock title="Classificação assistida">
        <p>
          Destino sugerido:{" "}
          <strong className="text-white">
            {item.suggestedDestination
              ? CONCIERGE_DESTINATION_LABELS[item.suggestedDestination]
              : "—"}
          </strong>
        </p>
        <p className="mt-1 text-zinc-500">
          {item.classificationReason ?? classification?.reason ?? "Ainda por classificar."}
        </p>
        {classification?.provider ? (
          <p className="mt-1 font-mono text-[8px] uppercase text-zinc-600">
            Motor: {classification.provider === "gemini" ? "Gemini (servidor)" : "Regras locais"}
          </p>
        ) : null}
      </MetadataBlock>

      {classification?.summary ? (
        <MetadataBlock title="Resumo assistido">
          <p>{classification.summary.summary}</p>
          {classification.summary.importantPoints.length > 0 ? (
            <ul className="mt-2 list-inside list-disc text-zinc-400">
              {classification.summary.importantPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          {classification.summary.risksOrWarnings.length > 0 ? (
            <p className="mt-2 text-amber-200/80">
              {classification.summary.risksOrWarnings.join(" · ")}
            </p>
          ) : null}
        </MetadataBlock>
      ) : null}

      {classification?.extractedFields &&
      Object.keys(classification.extractedFields).length > 0 ? (
        <MetadataBlock title="Campos extraídos">
          <dl className="grid gap-1">
            {Object.entries(classification.extractedFields).map(([key, value]) =>
              value != null && value !== "" ? (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-zinc-500">{key}</dt>
                  <dd className="text-right text-white">{String(value)}</dd>
                </div>
              ) : null
            )}
          </dl>
        </MetadataBlock>
      ) : null}

      {item.notes ? (
        <MetadataBlock title="Notas">
          <p>{item.notes}</p>
        </MetadataBlock>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {permissions.canClassify ? (
          <ActionButton label="Classificar" onClick={onClassify} disabled={isProcessing} />
        ) : null}
        {permissions.canValidate ? (
          <ActionButton label="Validar" onClick={onValidate} disabled={isProcessing} />
        ) : null}
        {permissions.canRoute ? (
          <ActionButton label="Enviar para módulo" onClick={onRoute} disabled={isProcessing} primary />
        ) : null}
        {permissions.canReject ? (
          <ActionButton label="Rejeitar" onClick={onReject} disabled={isProcessing} />
        ) : null}
        {permissions.canArchive ? (
          <ActionButton label="Arquivar" onClick={onArchive} disabled={isProcessing} />
        ) : null}
      </div>

      <ConciergeSuggestions suggestions={itemSuggestions} />
      <ConciergeActivityFeed activities={itemActivities.length ? itemActivities : data.activities.slice(0, 3)} />
    </aside>
  );
}

function MetadataBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-champagne/10 bg-black/20 p-3 text-xs text-zinc-300">
      <p className="mb-1 font-mono text-[8px] uppercase tracking-widest text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 font-mono text-[8px] font-bold uppercase tracking-widest disabled:opacity-50 ${
        primary
          ? "bg-brand-gold text-brand-black"
          : "border border-brand-champagne/20 text-zinc-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
