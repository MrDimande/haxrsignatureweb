"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, KeyRound, RotateCw, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendPortalActivationAction } from "@/lib/admin/actions/portal-activation.actions";
import type { AdminPortalAccount } from "@/lib/admin/portal-accounts.repository";

type PortalAccountsManagerProps = {
  accounts: AdminPortalAccount[];
};

const statusLabels: Record<AdminPortalAccount["status"], string> = {
  PENDING_ACTIVATION: "Pendente de activação",
  ACTIVE: "Activa",
  SUSPENDED: "Suspensa",
  PENDING_IDENTITY_RESOLUTION: "A aguardar reconciliação",
};

function statusClass(status: AdminPortalAccount["status"]): string {
  if (status === "ACTIVE") return "text-emerald-300 border-emerald-500/25 bg-emerald-500/10";
  if (status === "PENDING_ACTIVATION") return "text-amber-200 border-amber-400/25 bg-amber-400/10";
  if (status === "SUSPENDED") return "text-red-300 border-red-500/25 bg-red-500/10";
  return "text-grey/70 border-white/[0.08] bg-white/[0.03]";
}

export default function PortalAccountsManager({ accounts }: PortalAccountsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);

  function sendActivation(account: AdminPortalAccount) {
    setFeedback(null);
    setPendingAccountId(account.accountId);
    startTransition(async () => {
      const result = await sendPortalActivationAction({ accountId: account.accountId });
      setPendingAccountId(null);

      if (!result.success) {
        setFeedback({ type: "error", message: result.error });
        return;
      }

      setFeedback({
        type: result.data.auditRecorded ? "success" : "warning",
        message: result.data.auditRecorded
          ? "Activação enviada. O link expira em 3 dias."
          : "Activação enviada. Confirme o registo de auditoria antes de voltar a enviar.",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={`flex items-center gap-3 border p-4 text-xs ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
              : feedback.type === "warning"
                ? "border-amber-400/30 bg-amber-950/20 text-amber-200"
                : "border-red-500/30 bg-red-950/20 text-red-300"
          }`}
          role="status"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <section className="admin-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-white/[0.05] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-admin-gold">
              Acesso de cliente
            </span>
            <h2 className="mt-1 font-serif text-xl font-light text-white">Activações pendentes</h2>
          </div>
          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-grey/60">
            <KeyRound className="h-3.5 w-3.5 text-admin-gold" />
            {accounts.length} contas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left">
            <thead className="border-b border-white/[0.04] bg-white/[0.015]">
              <tr className="text-[8px] font-mono uppercase tracking-[0.2em] text-grey-medium">
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Email reconciliado</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Activação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {accounts.map((account) => {
                const canSend = account.status === "PENDING_ACTIVATION" && Boolean(account.email);
                const isSending = isPending && pendingAccountId === account.accountId;
                const isReissue = account.hasLiveActivation;

                return (
                  <tr key={account.accountId} className="text-xs text-grey-medium">
                    <td className="px-6 py-4">
                      <p className="text-white/90">{account.fullName || "Perfil sem nome"}</p>
                      <p className="mt-1 font-mono text-[10px] text-grey/45">{account.profileId}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-grey/75">
                      {account.email || "Sem email reconciliado"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex border px-2 py-1 text-[9px] font-mono uppercase tracking-wide ${statusClass(account.status)}`}>
                        {statusLabels[account.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canSend ? (
                        <button
                          type="button"
                          onClick={() => sendActivation(account)}
                          disabled={isPending}
                          className="inline-flex items-center gap-2 border border-admin-gold/35 px-3 py-2 text-[10px] font-mono uppercase tracking-wide text-admin-gold transition-colors hover:bg-admin-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSending ? (
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                          ) : isReissue ? (
                            <RotateCw className="h-3.5 w-3.5" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {isSending ? "A enviar" : isReissue ? "Reenviar activação" : "Enviar activação"}
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono uppercase tracking-wide text-grey/45">
                          {account.status === "PENDING_IDENTITY_RESOLUTION" ? "Reconciliar identidade" : "Indisponível"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center text-sm text-grey/60">Não existem contas do Portal para apresentar.</div>
        ) : null}
      </section>
    </div>
  );
}
