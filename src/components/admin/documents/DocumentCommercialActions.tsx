"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Bell, Loader2 } from "lucide-react";
import {
  convertProformaToInvoiceAction,
  sendPaymentReminderAction,
} from "@/lib/admin/actions/documents.actions";
import type { InvoiceDocument } from "@/lib/admin/types";

type DocumentCommercialActionsProps = {
  document: InvoiceDocument;
};

export default function DocumentCommercialActions({
  document,
}: DocumentCommercialActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const canConvert =
    document.documentType === "proforma" &&
    document.status !== "cancelled";

  const canRemind =
    (document.documentType === "invoice" ||
      document.documentType === "proforma") &&
    document.status === "sent" &&
    Boolean(document.clientEmail.trim());

  function handleConvert() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await convertProformaToInvoiceAction(document.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(`Factura ${result.data.documentNumber} criada.`);
      router.push(`/admin/documents/${result.data.id}`);
      router.refresh();
    });
  }

  function handleReminder() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await sendPaymentReminderAction(document.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess("Lembrete de cobrança enviado por email.");
      router.refresh();
    });
  }

  if (!canConvert && !canRemind) return null;

  return (
    <section className="admin-card p-6 mb-8 border-white/5 space-y-4">
      <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80">
        Acções comerciais
      </p>

      <div className="flex flex-wrap gap-3">
        {canConvert ? (
          <button
            type="button"
            onClick={handleConvert}
            disabled={isPending}
            className="admin-btn-primary"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
            Converter em factura
          </button>
        ) : null}

        {canRemind ? (
          <button
            type="button"
            onClick={handleReminder}
            disabled={isPending}
            className="admin-btn-secondary"
          >
            <Bell className="w-4 h-4" />
            Enviar lembrete de cobrança
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

      {(document.emailSentAt || document.whatsappSharedAt) && (
        <p className="text-xs text-grey/50">
          {document.emailSentAt ? "Email enviado · " : ""}
          {document.whatsappSharedAt ? "WhatsApp partilhado · " : ""}
          {document.pdfGeneratedAt ? "PDF gerado" : ""}
        </p>
      )}
    </section>
  );
}
