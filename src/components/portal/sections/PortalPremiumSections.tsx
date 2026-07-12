"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, MessageSquare, Upload } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/constants";
import type { PortalDashboardData } from "@/lib/portal/services/portal-dashboard.service";
import type { PortalCreativeApproval } from "@/lib/portal/portal-premium.types";

function formatWhen(value: string): string {
  return new Date(value).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export function PortalCreativeApprovalCard({
  token,
  approval,
}: {
  token: string;
  approval: PortalCreativeApproval;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const typeLabel =
    approval.approvalType === "invite"
      ? "Convite"
      : approval.approvalType === "layout"
        ? "Layout"
        : "Entrega";

  function decide(status: "approved" | "changes_requested") {
    setError("");
    startTransition(async () => {
      const response = await fetch(
        `/api/portal/${encodeURIComponent(token)}/approvals/${encodeURIComponent(approval.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        }
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Não foi possível registar a decisão.");
        return;
      }
      router.refresh();
    });
  }

  if (approval.status !== "pending") return null;

  return (
    <article className="border border-white/10 rounded-sm p-5 bg-white/[0.02] space-y-4">
      <div>
        <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-admin-gold">
          Aprovar {typeLabel.toLowerCase()}
        </p>
        <p className="font-serif text-xl mt-2">{approval.title}</p>
        {approval.description ? (
          <p className="text-sm text-grey/55 mt-2">{approval.description}</p>
        ) : null}
      </div>
      {approval.attachmentUrl ? (
        <a
          href={approval.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-admin-gold hover:underline"
        >
          Ver anexo
        </a>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide("approved")}
          className="inline-flex items-center justify-center gap-2 border border-emerald-500/30 text-emerald-300 text-[10px] tracking-[0.25em] uppercase px-4 py-3"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Aprovar
        </button>
        <button
          type="button"
          disabled={isPending || !note.trim()}
          onClick={() => decide("changes_requested")}
          className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/80 text-[10px] tracking-[0.25em] uppercase px-4 py-3"
        >
          <MessageSquare className="w-4 h-4" />
          Pedir alterações
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Notas sobre o convite ou layout."
        className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </article>
  );
}

export function PortalMessagesSection({
  messages,
}: {
  messages: PortalDashboardData["messages"];
}) {
  if (messages.length === 0) return null;

  return (
    <section className="space-y-3">
      {messages.map((message) => (
        <article
          key={message.id}
          className="border border-white/10 rounded-sm p-4 bg-white/[0.02]"
        >
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45">
            {message.authorName} · {formatWhen(message.createdAt)}
          </p>
          <p className="text-sm text-white/85 mt-2 whitespace-pre-wrap">{message.body}</p>
        </article>
      ))}
    </section>
  );
}

export function PortalContractsSection({
  contracts,
}: {
  contracts: PortalDashboardData["contracts"];
}) {
  if (contracts.length === 0) {
    return (
      <p className="text-sm text-grey/50">Ainda não há contratos publicados no portal.</p>
    );
  }

  return (
    <div className="space-y-3">
      {contracts.map((contract) => (
        <article
          key={contract.id}
          className="border border-white/10 rounded-sm p-4 bg-white/[0.02] flex justify-between gap-4"
        >
          <div>
            <p className="font-serif text-lg">{contract.title}</p>
            {contract.description ? (
              <p className="text-sm text-grey/55 mt-1">{contract.description}</p>
            ) : null}
          </div>
          {contract.fileUrl ? (
            <a
              href={contract.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-admin-gold hover:underline shrink-0"
            >
              Abrir PDF
            </a>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function PortalPaymentsSection({
  token,
  data,
}: {
  token: string;
  data: PortalDashboardData;
}) {
  const router = useRouter();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [proofMessage, setProofMessage] = useState("");
  const [proofError, setProofError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitProof() {
    setProofError("");
    setProofMessage("");
    startTransition(async () => {
      let fileBase64: string | undefined;
      if (proofFile) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
              reject(new Error("Falha ao ler ficheiro."));
              return;
            }
            resolve(result.split(",")[1] ?? "");
          };
          reader.onerror = () => reject(new Error("Falha ao ler ficheiro."));
          reader.readAsDataURL(proofFile);
        });
      }
      const response = await fetch(
        `/api/portal/${encodeURIComponent(token)}/payment-proofs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
            fileName: proofFile?.name,
            mimeType: proofFile?.type,
            fileBase64,
          }),
        }
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setProofError(payload.error ?? "Não foi possível enviar o comprovativo.");
        return;
      }
      setProofMessage("Comprovativo enviado. A equipa HAXR irá validar e emitir recibo.");
      setProofFile(null);
      setReference("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          {
            label: "Contratado",
            value: formatCurrency(data.financial.invoicedTotal, data.financial.currency),
          },
          {
            label: "Pago",
            value: formatCurrency(data.financial.receivedTotal, data.financial.currency),
          },
          {
            label: "Pendente",
            value: formatCurrency(data.financial.pendingBalance, data.financial.currency),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="border border-white/10 rounded-sm p-4 bg-white/[0.02]"
          >
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/45">
              {item.label}
            </p>
            <p className="font-serif text-xl mt-2">{item.value}</p>
          </div>
        ))}
      </section>

      {data.payments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Histórico de pagamentos
          </h2>
          <ul className="space-y-2">
            {data.payments.map((payment) => (
              <li
                key={payment.id}
                className="border border-white/10 rounded-sm p-4 bg-white/[0.02] flex justify-between gap-4"
              >
                <div>
                  <p className="text-sm text-white/85">
                    {payment.reference || payment.documentNumber || "Pagamento"}
                  </p>
                  <p className="text-xs text-grey/50 mt-1">
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod]} ·{" "}
                    {formatWhen(payment.paidAt)}
                  </p>
                </div>
                <p className="font-serif text-lg">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4 border border-white/10 rounded-sm p-5 bg-white/[0.02]">
        <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
          Instruções e comprovativo
        </h2>
        {data.paymentInstructions.methods.map((method) => (
          <div key={method.id}>
            <p className="font-serif text-lg">{method.label}</p>
            <ul className="text-sm text-grey/55 mt-2 space-y-1">
              {method.details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Referência do pagamento"
            className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-grey/60 cursor-pointer">
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            />
            {proofFile ? proofFile.name : "Carregar comprovativo"}
          </label>
          <button
            type="button"
            disabled={isPending || (!proofFile && !reference.trim())}
            onClick={submitProof}
            className="border border-admin-gold/30 text-admin-gold text-[10px] tracking-[0.25em] uppercase px-4 py-3 disabled:opacity-50"
          >
            {isPending ? "A enviar..." : "Enviar comprovativo"}
          </button>
          {proofMessage ? <p className="text-sm text-emerald-300">{proofMessage}</p> : null}
          {proofError ? <p className="text-sm text-red-400">{proofError}</p> : null}
        </div>
        {data.paymentProofs.length > 0 ? (
          <ul className="text-xs text-grey/50 space-y-1 border-t border-white/10 pt-3">
            {data.paymentProofs.map((proof) => (
              <li key={proof.id}>
                {proof.fileName ?? "Comprovativo"} · {proof.status}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
