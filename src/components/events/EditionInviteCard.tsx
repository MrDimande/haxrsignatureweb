"use client";

import { useId, useState } from "react";
import { Check, Copy, ExternalLink, Link2, AlertTriangle } from "lucide-react";
import {
  isAuthorizedEditionInviteUrl,
  resolveEditionInviteAssociation,
  type EditionAssociationState,
} from "@/lib/edition/invite-catalog";

type EditionInviteCardProps = {
  registryKey: string | null | undefined;
  eventName?: string;
};

function stateLabel(state: EditionAssociationState): string {
  switch (state) {
    case "active":
      return "Associado e activo";
    case "unavailable":
      return "Associado, indisponível";
    case "unknown_registry":
      return "Registry key desconhecida";
    case "missing":
      return "Sem convite Edition";
    case "invalid_config":
      return "Configuração inválida";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export default function EditionInviteCard({
  registryKey,
}: EditionInviteCardProps) {
  const previewTitleId = useId();
  const association = resolveEditionInviteAssociation(registryKey);
  const [copied, setCopied] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  if (association.state === "missing") {
    return null;
  }

  const inviteUrl =
    association.inviteUrl && isAuthorizedEditionInviteUrl(association.inviteUrl)
      ? association.inviteUrl
      : null;

  const canPreview =
    association.state === "active" && Boolean(inviteUrl) && !iframeBlocked;

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      className="admin-card p-6 md:p-8 space-y-5 mb-8 border border-admin-gold/15"
      aria-labelledby="edition-invite-heading"
    >
      <div className="flex items-start gap-3">
        <Link2 className="w-5 h-5 text-admin-gold mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-2">
            Edition · Convite digital
          </p>
          <h3
            id="edition-invite-heading"
            className="font-serif text-xl font-light text-white/90"
          >
            Convite digital Edition
          </h3>
          <p className="text-sm text-grey/55 mt-2 leading-relaxed max-w-2xl">
            Associação entre o evento Admin e o convite público na Edition.
            Sem campanhas nem envio em massa nesta fase.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 text-sm">
        <div>
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45 mb-1">
            Estado
          </p>
          <p
            className={
              association.state === "active"
                ? "text-admin-gold/90"
                : association.state === "unavailable"
                  ? "text-amber-200/90"
                  : "text-rose-300/90"
            }
          >
            {stateLabel(association.state)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45 mb-1">
            Registry key
          </p>
          <p className="text-white/80 font-mono text-xs break-all">
            {association.registryKey ?? "—"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45 mb-1">
            Nome do convite
          </p>
          <p className="text-white/80 font-light">
            {association.label ?? "Não associado"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45 mb-1">
            Slug Edition
          </p>
          <p className="text-white/80 font-mono text-xs break-all">
            {association.inviteSlug ?? "—"}
          </p>
        </div>
      </div>

      {association.state === "unknown_registry" ? (
        <div className="flex items-start gap-2 rounded-sm border border-rose-500/25 bg-rose-500/5 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-100/90 font-light">
            A registry key não está no catálogo Core. Não há fallback para outro
            convite — corrija a associação no evento.
          </p>
        </div>
      ) : null}

      {association.state === "invalid_config" ? (
        <div className="flex items-start gap-2 rounded-sm border border-rose-500/25 bg-rose-500/5 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-100/90 font-light">
            Configuração inválida
            {"reason" in association && association.reason
              ? ` (${association.reason})`
              : ""}
            . URL Edition não disponível.
          </p>
        </div>
      ) : null}

      {inviteUrl ? (
        <div className="space-y-2">
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45">
            URL
          </p>
          <p className="text-xs text-grey/60 break-all font-mono">{inviteUrl}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-primary"
            >
              <ExternalLink className="w-4 h-4" aria-hidden />
              Ver convite
            </a>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="admin-btn-secondary"
              aria-live="polite"
            >
              {copied ? (
                <Check className="w-4 h-4" aria-hidden />
              ) : (
                <Copy className="w-4 h-4" aria-hidden />
              )}
              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </div>
        </div>
      ) : null}

      {canPreview && inviteUrl ? (
        <div className="space-y-2">
          <p
            id={previewTitleId}
            className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45"
          >
            Preview
          </p>
          <div className="relative w-full overflow-hidden rounded-sm border border-grey-dark/80 bg-black/40 aspect-[4/3] md:aspect-[16/10]">
            <iframe
              title="Preview do convite Edition"
              aria-labelledby={previewTitleId}
              src={inviteUrl}
              className="absolute inset-0 h-full w-full border-0 bg-transparent"
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setIframeBlocked(true)}
            />
          </div>
          <p className="text-xs text-grey/45">
            Se o preview estiver bloqueado pelo navegador, use «Ver convite».
          </p>
        </div>
      ) : null}

      {association.state === "active" && inviteUrl && iframeBlocked ? (
        <p className="text-xs text-grey/50">
          Preview em iframe indisponível neste ambiente. Abra o convite numa
          nova aba.
        </p>
      ) : null}
    </section>
  );
}
