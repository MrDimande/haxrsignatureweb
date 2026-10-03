"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  getAdminRoleLabel,
  getAdminStatusLabel,
  ADMIN_USER_ROLES,
  type AdminUser,
  type AdminUserRole,
} from "@/lib/admin/admin-user";
import type { AdminSession } from "@/lib/admin/admin-sessions.repository";
import type { AdminAuditLogEntry } from "@/lib/admin/admin-audit.repository";
import {
  updateAdminUserAction,
  initiateAdminPasswordResetAction,
  revokeAdminSessionAction,
  revokeAllAdminSessionsAction,
} from "@/lib/admin/actions/admin-users.actions";

type AdminUserDetailManagerProps = {
  user: AdminUser;
  passwordUpdatedAt: string | null;
  activeSessions: AdminSession[];
  auditLogs: AdminAuditLogEntry[];
  isCurrentOwner: boolean;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Ainda sem registo";
  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  }).format(new Date(value));
}

export default function AdminUserDetailManager({
  user,
  passwordUpdatedAt,
  activeSessions,
  auditLogs,
  isCurrentOwner: _isCurrentOwner,
}: AdminUserDetailManagerProps) {
  const router = useRouter();
  const [role, setRole] = useState<AdminUserRole>(user.role);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isLastOwnerProtected = user.role === "OWNER" && user.status === "active";

  async function handleRoleChange(newRole: AdminUserRole) {
    if (!confirm(`Confirmar alteração da função para ${getAdminRoleLabel(newRole)}?`)) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    const result = await updateAdminUserAction({
      targetUserId: user.id,
      role: newRole,
    });
    setLoading(false);
    if (result.success) {
      setRole(newRole);
      setFeedback({ type: "success", message: "Função administrativa actualizada." });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  async function handleToggleStatus() {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    const promptMessage =
      nextStatus === "suspended"
        ? "Tem a certeza que deseja suspender este utilizador? Todas as sessões activas serão revogadas imediatamente."
        : "Reactivar o acesso deste utilizador?";

    if (!confirm(promptMessage)) return;

    setLoading(true);
    setFeedback(null);
    const result = await updateAdminUserAction({
      targetUserId: user.id,
      status: nextStatus,
    });
    setLoading(false);
    if (result.success) {
      setFeedback({
        type: "success",
        message: nextStatus === "active" ? "Utilizador reactivado." : "Utilizador suspenso.",
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  async function handleInitiateReset() {
    if (!confirm("Iniciar recuperação de palavra-passe para este utilizador?")) return;
    setLoading(true);
    setFeedback(null);
    const result = await initiateAdminPasswordResetAction(user.id);
    setLoading(false);
    if (result.success) {
      setFeedback({
        type: "success",
        message: result.data.emailSent
          ? "Ligação de recuperação enviada por email."
          : "Token de recuperação gerado na base de dados com validade de 1 hora.",
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  async function handleRevokeSession(sessionId: string) {
    if (!confirm("Revogar esta sessão?")) return;
    setLoading(true);
    setFeedback(null);
    const result = await revokeAdminSessionAction(sessionId);
    setLoading(false);
    if (result.success) {
      setFeedback({ type: "success", message: "Sessão revogada com sucesso." });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  async function handleRevokeAllSessions() {
    if (!confirm("Revogar todas as sessões activas deste utilizador?")) return;
    setLoading(true);
    setFeedback(null);
    const result = await revokeAllAdminSessionsAction(user.id);
    setLoading(false);
    if (result.success) {
      setFeedback({
        type: "success",
        message: `${result.data.revokedCount} sessões revogadas com sucesso.`,
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-grey-medium hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao directório
        </Link>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            feedback.type === "success"
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/20 border-red-500/30 text-red-300"
          } text-xs font-sans`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="admin-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-5">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
                  Ficha de Identidade
                </span>
                <h2 className="mt-1 font-serif text-2xl font-light text-white">{user.name}</h2>
                <p className="mt-0.5 font-mono text-xs text-grey/60">{user.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${
                    user.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {getAdminStatusLabel(user.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-grey-medium">
                  Função no Sistema
                </span>
                <p className="text-white font-medium text-sm font-serif">
                  {getAdminRoleLabel(user.role)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-grey-medium">
                  Permissões Especiais
                </span>
                <p className="text-white font-mono text-xs">
                  {user.permissions.includes("SUPER_ADMIN") ? (
                    <span className="inline-flex items-center gap-1.5 text-admin-gold">
                      <ShieldCheck className="w-3.5 h-3.5" /> SUPER_ADMIN
                    </span>
                  ) : (
                    <span className="text-grey/40">Padrão da função</span>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-grey-medium">
                  Data de Admissão
                </span>
                <p className="text-white font-mono text-xs">{formatDateTime(user.createdAt)}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-grey-medium">
                  Último Acesso
                </span>
                <p className="text-white font-mono text-xs">{formatDateTime(user.lastLoginAt)}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.04] space-y-1 sm:col-span-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-grey-medium">
                  Última Actualização de Palavra-passe
                </span>
                <p className="text-white font-mono text-xs">
                  {passwordUpdatedAt ? formatDateTime(passwordUpdatedAt) : "Sem credencial de base de dados"}
                </p>
              </div>
            </div>
          </section>

          {/* Active Sessions Section */}
          <section className="admin-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/[0.05]">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
                  Segurança de Sessões
                </span>
                <h3 className="mt-1 font-serif text-lg font-light text-white">
                  Sessões activas ({activeSessions.length})
                </h3>
              </div>

              {activeSessions.length > 0 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRevokeAllSessions}
                  className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-[10px] font-mono uppercase tracking-wider hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                >
                  Revogar todas
                </button>
              )}
            </div>

            {activeSessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-grey/50 italic font-mono">
                Nenhuma sessão activa no momento.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="text-white/90 font-mono text-[11px] truncate max-w-md">
                        {session.userAgent || "Navegador padrão"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-grey/60">
                        <span>IP: {session.ipAddress || "—"}</span>
                        <span>Criada: {formatDateTime(session.createdAt)}</span>
                        <span>Último contacto: {formatDateTime(session.lastSeenAt)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-3 py-1 rounded-md border border-white/[0.08] hover:border-red-500/40 text-[10px] font-mono uppercase tracking-wider text-grey-medium hover:text-red-300 transition-colors"
                    >
                      Revogar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Management Controls */}
        <div className="space-y-6">
          <section className="admin-card p-6 space-y-5">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
                Autorização
              </span>
              <h3 className="mt-1 font-serif text-lg font-light text-white">Acções do Proprietário</h3>
            </div>

            {/* Role Changer */}
            <div className="space-y-2 pt-2 border-t border-white/[0.05]">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium">
                Alterar Função
              </label>
              <select
                value={role}
                disabled={loading || (isLastOwnerProtected && role === "OWNER")}
                onChange={(e) => handleRoleChange(e.target.value as AdminUserRole)}
                className="w-full px-3 py-2 rounded-xl bg-[#141210] border border-white/[0.08] text-white text-xs font-sans focus:border-admin-gold/50 focus:outline-hidden disabled:opacity-50"
              >
                {ADMIN_USER_ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#141210] text-white">
                    {getAdminRoleLabel(r)}
                  </option>
                ))}
              </select>
              {isLastOwnerProtected && (
                <p className="text-[9px] text-admin-gold/70 leading-relaxed font-sans">
                  Protecção de integridade: O único Proprietário activo não pode ser despromovido.
                </p>
              )}
            </div>

            {/* Suspend / Reactivate Button */}
            <div className="pt-3 border-t border-white/[0.05]">
              <button
                type="button"
                disabled={loading || isLastOwnerProtected}
                onClick={handleToggleStatus}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-colors ${
                  user.status === "active"
                    ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Ban className="w-3.5 h-3.5" />
                {user.status === "active" ? "Suspender acesso" : "Reactivar acesso"}
              </button>
            </div>

            {/* Password Reset Button */}
            <div className="pt-3 border-t border-white/[0.05]">
              <button
                type="button"
                disabled={loading}
                onClick={handleInitiateReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-admin-gold" />
                Recuperação de credencial
              </button>
            </div>
          </section>

          {/* Audit History */}
          <section className="admin-card p-6 space-y-4">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
                Rastreio
              </span>
              <h3 className="mt-1 font-serif text-lg font-light text-white">Actividade recente</h3>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/[0.05] max-h-80 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-grey/40 italic font-mono">Sem eventos auditados.</p>
              ) : (
                auditLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-white/[0.015] border border-white/[0.03] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-admin-gold">
                        {entry.action}
                      </span>
                      <span className="font-mono text-[8.5px] text-grey/40">
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
