"use client";

import { useCallback, useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Rocket,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  evaluateEditionPublishHealthAction,
  publishEditionInviteAction,
} from "@/lib/edition/actions/publish-edition-invite.actions";
import type { PublishHealthCheck } from "@/lib/edition/registry-health";

type ClientReport = {
  registryKey: string;
  overall: "healthy" | "warning" | "blocked";
  canPublish: boolean;
  checks: PublishHealthCheck[];
  evaluatedAt: string;
  version: string;
  publicSlug: string | null;
  inviteUrl: string | null;
};

type EditionPublishHealthPanelProps = {
  /** Admin managed event id — never an Edition RSVP event_id. */
  adminEventId: string;
  registryKey: string;
};

function severityStyles(severity: PublishHealthCheck["severity"]): string {
  switch (severity) {
    case "healthy":
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-100/90";
    case "warning":
      return "border-amber-500/25 bg-amber-500/5 text-amber-100/90";
    case "blocked":
      return "border-rose-500/25 bg-rose-500/5 text-rose-100/90";
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

function overallLabel(overall: ClientReport["overall"]): string {
  switch (overall) {
    case "healthy":
      return "Pronto a publicar";
    case "warning":
      return "Publicável com avisos";
    case "blocked":
      return "Bloqueado";
    default: {
      const _exhaustive: never = overall;
      return _exhaustive;
    }
  }
}

/**
 * Mounted on Admin event detail (EditionInviteCard).
 * Runs the real publish health gate before/when clicking Publicar.
 */
export default function EditionPublishHealthPanel({
  adminEventId,
  registryKey,
}: EditionPublishHealthPanelProps) {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<ClientReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [publishedVersion, setPublishedVersion] = useState<string | null>(null);

  const runEvaluate = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await evaluateEditionPublishHealthAction(adminEventId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data.ok) {
        setError(result.data.error);
        setReport(null);
        return;
      }
      setReport(result.data.report);
    });
  }, [adminEventId]);

  const runPublish = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await publishEditionInviteAction(adminEventId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (!result.data.ok) {
        setError(result.data.error);
        if (result.data.report) setReport(result.data.report);
        setPublishedAt(null);
        setPublishedVersion(null);
        return;
      }
      setReport(result.data.report);
      setPublishedAt(result.data.publishedAt);
      setPublishedVersion(result.data.version);
    });
  }, [adminEventId]);

  return (
    <div className="space-y-4 border-t border-grey-dark/60 pt-5 mt-2">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-admin-gold mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-grey/45 mb-1">
            Health gate · Publicar
          </p>
          <h4 className="font-serif text-lg font-light text-white/90">
            Validação antes de publicar
          </h4>
          <p className="text-sm text-grey/55 mt-1 leading-relaxed max-w-2xl">
            O botão Publicar corre o gate completo (binding, tema, RSVP, URL,
            aliases). Sem publicação parcial — erros críticos bloqueiam.
            Registry: <span className="font-mono text-xs">{registryKey}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runEvaluate}
          disabled={pending}
          className="admin-btn-secondary"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <ShieldAlert className="w-4 h-4" aria-hidden />
          )}
          Verificar saúde
        </button>
        <button
          type="button"
          onClick={runPublish}
          disabled={pending || (report !== null && !report.canPublish)}
          className="admin-btn-primary"
        >
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Rocket className="w-4 h-4" aria-hidden />
          )}
          Publicar
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-sm border border-rose-500/25 bg-rose-500/5 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-100/90 font-light">{error}</p>
        </div>
      ) : null}

      {publishedAt ? (
        <div className="flex items-start gap-2 rounded-sm border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-100/90 font-light">
            Publicado em {new Date(publishedAt).toLocaleString("pt-PT")}
            {publishedVersion ? ` · versão ${publishedVersion}` : ""}.
          </p>
        </div>
      ) : null}

      {report ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] uppercase ${severityStyles(report.overall)}`}
            >
              {overallLabel(report.overall)}
            </span>
            <span className="text-xs text-grey/45">
              Avaliado {new Date(report.evaluatedAt).toLocaleString("pt-PT")} ·
              gate v{report.version}
            </span>
          </div>

          <ul className="space-y-2" aria-label="Resultados do health gate">
            {report.checks.map((check) => (
              <li
                key={check.id}
                className={`rounded-sm border px-3 py-2.5 ${severityStyles(check.severity)}`}
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-70">
                    {check.id}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase">
                    {check.severity}
                  </span>
                </div>
                <p className="text-sm font-light mt-1">{check.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  Como corrigir: {check.fixHint}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-grey/45">
          Clique em «Verificar saúde» ou «Publicar» para correr o gate. O
          event_id Edition é resolvido só no servidor.
        </p>
      )}
    </div>
  );
}
