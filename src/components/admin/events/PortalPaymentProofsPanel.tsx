"use client";

import { useState, useTransition } from "react";
import type { PortalPaymentProof } from "@/lib/portal/portal-premium.types";

type PortalPaymentProofsPanelProps = {
  proofs: PortalPaymentProof[];
};

export default function PortalPaymentProofsPanel({
  proofs,
}: PortalPaymentProofsPanelProps) {
  const pending = proofs.filter((proof) => proof.status === "pending_review");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  if (pending.length === 0) return null;

  function validateProof(proofId: string, approve: boolean) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/payment-proofs/${proofId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(payload.error ?? "Falha na validação.");
        return;
      }
      setMessage(approve ? "Comprovativo aprovado e recibo emitido." : "Comprovativo rejeitado.");
      window.location.reload();
    });
  }

  return (
    <section className="admin-card p-6 mb-8 border-amber-500/20 space-y-4">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-amber-300/80 mb-2">
          Portal cliente
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Comprovativos por validar ({pending.length})
        </h3>
      </div>
      <ul className="space-y-3">
        {pending.map((proof) => (
          <li
            key={proof.id}
            className="border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm text-white/85">
                {proof.fileName ?? "Comprovativo"} · {proof.reference ?? "Sem referência"}
              </p>
              <p className="text-xs text-grey/50 mt-1">
                {proof.amount ? `${proof.amount} ${proof.currency}` : "Valor por confirmar"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => validateProof(proof.id, true)}
                className="admin-btn-primary text-xs"
              >
                Aprovar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => validateProof(proof.id, false)}
                className="admin-btn-secondary text-xs"
              >
                Rejeitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
    </section>
  );
}
