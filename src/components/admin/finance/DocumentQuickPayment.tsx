"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote } from "lucide-react";
import { AdminInput, AdminSelect } from "@/components/admin/AdminField";
import { registerPaymentAction } from "@/lib/finance/actions/payments.actions";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from "@/lib/finance/constants";
import { formatCurrency } from "@/lib/calculations";
import type { InvoiceDocument } from "@/lib/admin/types";
import type { PaymentMethod } from "@/lib/finance/types";

type DocumentQuickPaymentProps = {
  document: InvoiceDocument;
};

export default function DocumentQuickPayment({
  document,
}: DocumentQuickPaymentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(document.totals.grandTotal));
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit() {
    setError("");
    setSuccess("");
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Indique um valor válido.");
      return;
    }

    startTransition(async () => {
      const result = await registerPaymentAction({
        businessId: document.businessId,
        clientId: document.clientId,
        clientName: document.clientName,
        sourceDocumentId: document.id,
        amount: parsedAmount,
        currency: document.totals.currency,
        paymentMethod,
        reference,
        generateReceipt: true,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(
        result.data.receipt
          ? `Pagamento registado. Recibo ${result.data.receipt.documentNumber} emitido.${
              result.data.sourceFullyPaid ? " Documento fechado como pago." : ""
            }`
          : "Pagamento registado."
      );
      router.refresh();
    });
  }

  return (
    <section className="admin-card p-6 md:p-8 mt-8 border-admin-gold/15 space-y-5">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Registar pagamento
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Receber valor deste documento
        </h3>
        <p className="text-sm text-grey/55 mt-2">
          Total em aberto:{" "}
          <span className="text-white/80 font-serif">
            {formatCurrency(
              document.totals.grandTotal,
              document.totals.currency
            )}
          </span>
          . O recibo é gerado automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminInput
          label="Valor recebido"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <AdminSelect
          label="Método"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </AdminSelect>
        <AdminInput
          label="Referência"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Comprovativo"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-300/90">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-300/90">{success}</p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="admin-btn-primary"
      >
        <Banknote className="w-4 h-4" />
        {isPending ? "A registar…" : "Registar pagamento"}
      </button>
    </section>
  );
}
