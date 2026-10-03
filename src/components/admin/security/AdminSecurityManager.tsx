"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Laptop,
} from "lucide-react";
import type { AdminCredential } from "@/lib/admin/admin-credentials.repository";
import type { AdminSession } from "@/lib/admin/admin-sessions.repository";
import type { AdminAuditLogEntry } from "@/lib/admin/admin-audit.repository";
import type { AdminIdentity } from "@/lib/admin/admin-user";
import {
  claimOrChangeOwnPasswordAction,
  revokeOwnSessionAction,
  logoutAllOwnSessionsAction,
} from "@/lib/admin/actions/admin-security.actions";

type AdminSecurityManagerProps = {
  identity: AdminIdentity;
  credentials: AdminCredential | null;
  activeSessions: AdminSession[];
  auditLogs: AdminAuditLogEntry[];
  currentSessionId?: string | null;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Ainda sem registo";
  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  }).format(new Date(value));
}

export default function AdminSecurityManager({
  identity,
  credentials,
  activeSessions,
  auditLogs,
  currentSessionId,
}: AdminSecurityManagerProps) {
  const router = useRouter();
  const hasExistingCredentials = Boolean(credentials);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [sessionLoading, setSessionLoading] = useState<string | null>(null);
  const [sessionFeedback, setSessionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "A confirmação da nova palavra-passe não coincide.",
      });
      return;
    }

    if (newPassword.length < 10) {
      setPasswordFeedback({
        type: "error",
        message: "A nova palavra-passe deve conter pelo menos 10 caracteres.",
      });
      return;
    }

    setSubmittingPassword(true);
    const result = await claimOrChangeOwnPasswordAction({
      currentPassword: currentPassword || undefined,
      newPassword,
    });
    setSubmittingPassword(false);

    if (result.success) {
      setPasswordFeedback({
        type: "success",
        message: hasExistingCredentials
          ? "Palavra-passe alterada com sucesso."
          : "Palavra-passe individual definida com sucesso. A sua credencial de base de dados está agora activa.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } else {
      setPasswordFeedback({ type: "error", message: result.error });
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!confirm("Revogar esta sessão? O utilizador terá de iniciar sessão novamente.")) {
      return;
    }

    setSessionLoading(sessionId);
    setSessionFeedback(null);
    const result = await revokeOwnSessionAction(sessionId);
    setSessionLoading(null);

    if (result.success) {
      setSessionFeedback({
        type: "success",
        message: "Sessão revogada com sucesso.",
      });
      router.refresh();
    } else {
      setSessionFeedback({ type: "error", message: result.error });
    }
  }

  async function handleLogoutAll() {
    if (
      !confirm(
        "Tem a certeza que deseja terminar todas as sessões? Será desconectado deste dispositivo imediatamente.",
      )
    ) {
      return;
    }

    setSessionLoading("all");
    setSessionFeedback(null);
    const result = await logoutAllOwnSessionsAction();
    setSessionLoading(null);

    if (result.success) {
      router.push("/admin/login");
    } else {
      setSessionFeedback({ type: "error", message: result.error });
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Credential Status Header */}
      <section className="admin-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold">
              Autenticação Individual
            </span>
            <h2 className="mt-1 font-serif text-xl font-light text-white">
              {identity.name}
            </h2>
            <p className="mt-1 text-xs font-mono text-grey-medium">{identity.email}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            {hasExistingCredentials ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Credencial Activa (v{credentials?.credentialVersion})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <ShieldAlert className="h-3 w-3" />
                Credencial de Base de Dados Pendente
              </span>
            )}
            <span className="text-[11px] font-mono text-grey-medium">
              Última actualização: {formatDateTime(credentials?.passwordUpdatedAt)}
            </span>
          </div>
        </div>
      </section>

      {/* Password Management Form */}
      <section className="admin-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full border border-admin-gold/30 bg-admin-gold/5 flex items-center justify-center">
            <KeyRound className="h-4 w-4 text-admin-gold" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-white">
              {hasExistingCredentials
                ? "Alterar Palavra-passe"
                : "Definir Palavra-passe Individual"}
            </h3>
            <p className="text-xs text-grey-medium mt-0.5">
              {hasExistingCredentials
                ? "Actualize a sua palavra-passe de acesso ao painel de administração"
                : "Reivindique a sua credencial individual para autenticação directa na base de dados"}
            </p>
          </div>
        </div>

        {!hasExistingCredentials && (
          <div className="mb-6 p-4 rounded-sm border border-admin-gold/20 bg-admin-gold/5 text-xs text-admin-gold flex items-start gap-3">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ao definir uma palavra-passe individual, esta conta passará a ser protegida
              com a arquitectura de <strong>um utilizador = uma credencial</strong>, com
              sessões criptográficas transparentes e revogação individual.
            </p>
          </div>
        )}

        {passwordFeedback && (
          <div
            className={`mb-6 p-4 rounded-sm flex items-start gap-3 text-xs ${
              passwordFeedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-red-500/10 text-red-300 border border-red-500/20"
            }`}
          >
            {passwordFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <p>{passwordFeedback.message}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
              {hasExistingCredentials
                ? "Palavra-passe Actual"
                : "Palavra-passe de Ambiente Actual (se aplicável)"}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required={hasExistingCredentials}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-sm bg-black/60 border border-grey-dark focus:border-admin-gold/60 focus:outline-none rounded-sm text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
              Nova Palavra-passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
              placeholder="Mínimo 10 caracteres"
              className="w-full px-3 py-2 text-sm bg-black/60 border border-grey-dark focus:border-admin-gold/60 focus:outline-none rounded-sm text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
              Confirmar Nova Palavra-passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={10}
              placeholder="Confirme a nova palavra-passe"
              className="w-full px-3 py-2 text-sm bg-black/60 border border-grey-dark focus:border-admin-gold/60 focus:outline-none rounded-sm text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submittingPassword}
              className="px-5 py-2 text-xs font-mono uppercase tracking-wider bg-admin-gold text-black hover:bg-admin-gold/90 transition-colors rounded-sm disabled:opacity-50"
            >
              {submittingPassword
                ? "A guardar..."
                : hasExistingCredentials
                ? "Actualizar Palavra-passe"
                : "Definir Palavra-passe e Activar"}
            </button>
          </div>
        </form>
      </section>

      {/* Active Sessions */}
      <section className="admin-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-admin-gold/30 bg-admin-gold/5 flex items-center justify-center">
              <Laptop className="h-4 w-4 text-admin-gold" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-white">Sessões Activas</h3>
              <p className="text-xs text-grey-medium mt-0.5">
                Dispositivos e navegadores com sessão válida na base de dados
              </p>
            </div>
          </div>

          {activeSessions.length > 0 && (
            <button
              type="button"
              onClick={handleLogoutAll}
              disabled={sessionLoading === "all"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 rounded-sm transition-colors"
            >
              <LogOut className="h-3 w-3" />
              {sessionLoading === "all" ? "A terminar..." : "Terminar Todas as Sessões"}
            </button>
          )}
        </div>

        {sessionFeedback && (
          <div
            className={`mb-6 p-4 rounded-sm flex items-start gap-3 text-xs ${
              sessionFeedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-red-500/10 text-red-300 border border-red-500/20"
            }`}
          >
            {sessionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <p>{sessionFeedback.message}</p>
          </div>
        )}

        {activeSessions.length === 0 ? (
          <p className="text-xs font-mono text-grey-medium py-4">
            Nenhuma sessão de base de dados registada de momento.
          </p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => {
              const isCurrent = currentSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-grey-dark/60 rounded-sm bg-black/30"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-white">
                        ID: {session.id.slice(0, 8)}...{session.id.slice(-4)}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-admin-gold/20 text-admin-gold border border-admin-gold/30 rounded-sm">
                          Sessão Actual
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-grey-medium truncate max-w-lg">
                      {session.userAgent || "Navegador não especificado"}
                    </p>
                    <div className="flex flex-wrap gap-4 text-[10px] font-mono text-grey-medium/70 pt-1">
                      <span>Criada: {formatDateTime(session.createdAt)}</span>
                      <span>Visto: {formatDateTime(session.lastSeenAt)}</span>
                      <span>Expira: {formatDateTime(session.expiresAt)}</span>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={sessionLoading === session.id}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-sm transition-colors self-end sm:self-center shrink-0"
                    >
                      {sessionLoading === session.id ? "A revogar..." : "Revogar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Security Audit Log */}
      <section className="admin-card p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full border border-admin-gold/30 bg-admin-gold/5 flex items-center justify-center">
            <Clock className="h-4 w-4 text-admin-gold" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-white">Auditoria de Segurança</h3>
            <p className="text-xs text-grey-medium mt-0.5">
              Eventos de autenticação e sessões associados a esta conta
            </p>
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs font-mono text-grey-medium py-4">
            Sem registos de auditoria recentes.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {auditLogs.map((entry) => (
              <div
                key={entry.id}
                className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-mono text-xs text-white uppercase tracking-wider">
                    {entry.action.replace(/_/g, " ")}
                  </span>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <span className="ml-3 text-[11px] font-mono text-grey-medium">
                      {JSON.stringify(entry.details)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-grey-medium/70 shrink-0">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
