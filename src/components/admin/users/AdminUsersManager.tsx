"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  getAdminRoleLabel,
  getAdminStatusLabel,
  ADMIN_USER_ROLES,
  type AdminUser,
  type AdminUserRole,
} from "@/lib/admin/admin-user";
import type { AdminInvite } from "@/lib/admin/admin-invites.repository";
import {
  inviteAdminUserAction,
  reissueAdminInviteAction,
  revokeAdminInviteAction,
} from "@/lib/admin/actions/admin-users.actions";

type AdminUsersManagerProps = {
  users: AdminUser[];
  pendingInvites: AdminInvite[];
  emailDeliveryAvailable: boolean;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Ainda sem registo";
  return new Intl.DateTimeFormat("pt-MZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Maputo",
  }).format(new Date(value));
}

export default function AdminUsersManager({
  users,
  pendingInvites,
  emailDeliveryAvailable,
}: AdminUsersManagerProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminUserRole>("EVENT_MANAGER");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const result = await inviteAdminUserAction({
      email: inviteEmail,
      role: inviteRole,
    });

    setLoading(false);
    if (result.success) {
      setInviteEmail("");
      setInviteModalOpen(false);
      setFeedback({
        type: "success",
        message: result.data.emailSent
          ? "Convite enviado com sucesso por email."
          : "Convite criado com sucesso no sistema. (Email não configurado no ambiente)",
      });
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  async function handleReissue(inviteId: string) {
    setLoading(true);
    setFeedback(null);
    const result = await reissueAdminInviteAction(inviteId);
    setLoading(false);
    if (result.success) {
      setFeedback({
        type: "success",
        message: result.data.emailSent
          ? "Convite reemitido e enviado por email."
          : "Convite reemitido com sucesso.",
      });
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  async function handleRevoke(inviteId: string) {
    if (!confirm("Tem a certeza que deseja revogar este convite?")) return;
    setLoading(true);
    setFeedback(null);
    const result = await revokeAdminInviteAction(inviteId);
    setLoading(false);
    if (result.success) {
      setFeedback({ type: "success", message: "Convite revogado." });
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }

  return (
    <div className="space-y-6">
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

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-admin-gold/20 bg-admin-gold/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.16em] text-admin-gold">
          <Users className="h-3.5 w-3.5" strokeWidth={1.25} />
          {users.length} {users.length === 1 ? "utilizador activo" : "utilizadores activos"}
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-admin-gold text-black font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#d6ad34] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Convidar utilizador
        </button>
      </div>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <section className="admin-card overflow-hidden border border-admin-gold/20">
          <div className="flex items-center justify-between border-b border-white/[0.05] p-5 bg-admin-gold/[0.02]">
            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
                Admissão
              </span>
              <h3 className="mt-0.5 font-serif text-lg font-light text-white">
                Convites pendentes
              </h3>
            </div>
            <span className="text-[10px] font-mono text-grey-medium">
              {pendingInvites.length} aguardando activação
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-left">
              <thead className="border-b border-white/[0.04] bg-white/[0.015]">
                <tr className="text-[8px] font-mono uppercase tracking-[0.2em] text-grey-medium">
                  <th className="px-6 py-3 font-medium">Email destinatário</th>
                  <th className="px-6 py-3 font-medium">Função atribuída</th>
                  <th className="px-6 py-3 font-medium">Expiração</th>
                  <th className="px-6 py-3 font-medium text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {pendingInvites.map((inv) => (
                  <tr key={inv.id} className="text-xs text-grey-medium">
                    <td className="px-6 py-3 font-mono text-white/90">{inv.email}</td>
                    <td className="px-6 py-3 text-admin-gold font-medium">
                      {getAdminRoleLabel(inv.role)}
                    </td>
                    <td className="px-6 py-3 font-mono text-[11px] text-grey/70">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-admin-gold/60" />
                        {formatDateTime(inv.expiresAt)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleReissue(inv.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-admin-gold hover:underline disabled:opacity-50"
                      >
                        <RotateCw className="w-3 h-3" /> Reemitir
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleRevoke(inv.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-red-400 hover:underline disabled:opacity-50"
                      >
                        <X className="w-3 h-3" /> Revogar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Main Users Table */}
      <section className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.05] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
              Administração
            </span>
            <h2 className="mt-1 font-serif text-xl font-light text-white">
              Identidades autorizadas
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left">
            <thead className="border-b border-white/[0.04] bg-white/[0.015]">
              <tr className="text-[8px] font-mono uppercase tracking-[0.2em] text-grey-medium">
                <th className="px-6 py-3 font-medium">Utilizador</th>
                <th className="px-6 py-3 font-medium">Função</th>
                <th className="px-6 py-3 font-medium">Permissão</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Último acesso</th>
                <th className="px-6 py-3 font-medium text-right">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map((user) => (
                <tr key={user.id} className="text-xs text-grey-medium hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-grey/60">{user.email}</p>
                  </td>
                  <td className="px-6 py-4 text-white/90">
                    <span className="font-serif tracking-wide">{getAdminRoleLabel(user.role)}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.permissions.includes("SUPER_ADMIN") ? (
                      <span className="inline-flex items-center gap-1.5 text-admin-gold font-mono text-[10px] font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.25} /> SUPER_ADMIN
                      </span>
                    ) : (
                      <span className="text-grey/40 font-mono text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider ${
                        user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {getAdminStatusLabel(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[10px] text-grey/70">
                    {formatDateTime(user.lastLoginAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-admin-gold/40 bg-white/[0.02] hover:bg-admin-gold/10 text-[10px] font-mono uppercase tracking-wider text-white transition-all"
                    >
                      Gerir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Convidar Utilizador */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#100e0c] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
                  Novo Acesso
                </span>
                <h3 className="font-serif text-xl font-light text-white mt-1">
                  Convidar utilizador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-grey hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
                  Email institucional
                </label>
                <input
                  type="email"
                  required
                  placeholder="utilizador@haxrsignature.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-xs font-mono focus:border-admin-gold/50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-grey-medium mb-1.5">
                  Função atribuída
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AdminUserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141210] border border-white/[0.08] text-white text-xs font-sans focus:border-admin-gold/50 focus:outline-hidden"
                >
                  {ADMIN_USER_ROLES.filter((r) => r !== "OWNER").map((role) => (
                    <option key={role} value={role} className="bg-[#141210] text-white">
                      {getAdminRoleLabel(role)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[9px] text-grey/50">
                  O proprietário é único no sistema. Novas funções concedem permissões delimitadas.
                </p>
              </div>

              {!emailDeliveryAvailable && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] leading-relaxed">
                  Nota: O serviço de email transaccional Resend não está activo neste ambiente. O convite será registado na base de dados com token seguro de utilização única.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs font-mono uppercase tracking-wider text-grey-medium hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-admin-gold text-black font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#d6ad34] disabled:opacity-50 transition-colors"
                >
                  {loading ? "A processar..." : "Emitir convite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
