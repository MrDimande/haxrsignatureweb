"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2 } from "lucide-react";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import { registerPaymentAction } from "@/lib/finance/actions/payments.actions";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from "@/lib/finance/constants";
import { formatCurrency } from "@/lib/calculations";
import type { BusinessId, Client, Currency, InvoiceDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type { PaymentMethod } from "@/lib/finance/types";

type RegisterPaymentFormProps = {
  businesses: { id: BusinessId; name: string }[];
  clients: Client[];
  events: ManagedEvent[];
  openDocuments: InvoiceDocument[];
  defaultBusinessId?: BusinessId;
};

export default function RegisterPaymentForm({
  businesses,
  clients,
  events,
  openDocuments,
  defaultBusinessId = "haxr-signature",
}: RegisterPaymentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [businessId, setBusinessId] = useState<BusinessId>(defaultBusinessId);
  const [clientId, setClientId] = useState("");
  const [eventId, setEventId] = useState("");
  const [sourceDocumentId, setSourceDocumentId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("MZN");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  const selectedDocument = useMemo(
    () => openDocuments.find((doc) => doc.id === sourceDocumentId),
    [openDocuments, sourceDocumentId]
  );

  const availableEvents = useMemo(() => {
    if (!clientId) return events;
    return events.filter(
      (event) => !event.clientId || event.clientId === clientId
    );
  }, [events, clientId]);

  function handleDocumentChange(id: string) {
    setSourceDocumentId(id);
    const doc = openDocuments.find((item) => item.id === id);
    if (!doc) return;
    setBusinessId(doc.businessId);
    setCurrency(doc.totals.currency);
    setAmount(String(doc.totals.grandTotal));
    if (doc.clientId) setClientId(doc.clientId);
    if (doc.event.eventId) setEventId(doc.event.eventId);
  }

  function handleClientChange(id: string) {
    setClientId(id);
    const client = clients.find((item) => item.id === id);
    if (!client) return;
    setEventId("");
  }

  function handleEventChange(id: string) {
    setEventId(id);
    const event = events.find((item) => item.id === id);
    if (!event) return;
    if (event.clientId) setClientId(event.clientId);
  }

  function handleSubmit() {
    setError("");
    setSuccess("");
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Indique um valor válido para o pagamento.");
      return;
    }

    const client = clients.find((item) => item.id === clientId);

    startTransition(async () => {
      const result = await registerPaymentAction({
        businessId,
        clientId: clientId || null,
        clientName: client?.fullName,
        eventId: eventId || null,
        sourceDocumentId: sourceDocumentId || null,
        amount: parsedAmount,
        currency,
        paymentMethod,
        reference,
        notes,
        paidAt: new Date(`${paidAt}T12:00:00`).toISOString(),
        generateReceipt: true,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      const receiptNumber = result.data.receipt?.documentNumber;
      setSuccess(
        receiptNumber
          ? `Pagamento registado. Recibo ${receiptNumber} emitido automaticamente.${
              result.data.sourceFullyPaid
                ? " Documento de origem marcado como pago."
                : ""
            }`
          : "Pagamento registado com sucesso."
      );

      setAmount("");
      setReference("");
      setNotes("");
      setSourceDocumentId("");
      router.refresh();
    });
  }

  return (
    <section className="admin-card p-6 md:p-8 space-y-6 border-admin-gold/15">
      <div>
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-admin-gold/80 mb-2">
          Registar entrada
        </p>
        <h3 className="font-serif text-xl font-light text-white/90">
          Novo recebimento
        </h3>
        <p className="text-sm text-grey/55 mt-2 leading-relaxed">
          Registe o pagamento, escolha o método e gere o recibo automaticamente.
          Pagamentos parciais são suportados — a factura só fecha quando o total
          for atingido.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminSelect
          label="Documento em aberto (opcional)"
          value={sourceDocumentId}
          onChange={(e) => handleDocumentChange(e.target.value)}
        >
          <option value="">Sem documento associado</option>
          {openDocuments.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.documentNumber} · {doc.clientName || "—"} ·{" "}
              {formatCurrency(doc.totals.grandTotal, doc.totals.currency)}
            </option>
          ))}
        </AdminSelect>

        <AdminSelect
          label="Empresa"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value as BusinessId)}
        >
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </AdminSelect>

        <AdminSelect
          label="Cliente"
          value={clientId}
          onChange={(e) => handleClientChange(e.target.value)}
        >
          <option value="">Seleccionar cliente</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName}
            </option>
          ))}
        </AdminSelect>

        <AdminSelect
          label="Evento (opcional)"
          value={eventId}
          onChange={(e) => handleEventChange(e.target.value)}
        >
          <option value="">Sem evento associado</option>
          {availableEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
              {event.clientName ? ` · ${event.clientName}` : ""}
            </option>
          ))}
        </AdminSelect>

        <AdminInput
          label="Valor recebido"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
        />

        <AdminSelect
          label="Método de pagamento"
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
          label="Data do pagamento"
          type="date"
          value={paidAt}
          onChange={(e) => setPaidAt(e.target.value)}
        />

        <AdminInput
          label="Referência / comprovativo"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Nº transferência, M-Pesa, etc."
        />
      </div>

      <AdminTextarea
        label="Notas internas"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Observações sobre este recebimento"
      />

      {selectedDocument ? (
        <p className="text-xs text-grey/50 border-l border-admin-gold/30 pl-3 italic">
          Documento seleccionado: {selectedDocument.documentNumber} — total{" "}
          {formatCurrency(
            selectedDocument.totals.grandTotal,
            selectedDocument.totals.currency
          )}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-300/90 border border-red-500/20 px-4 py-3">
          {error}
        </p>
      ) : null}

      {success ? (
        <div className="border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400/90 mt-0.5 shrink-0" />
          <p className="text-sm text-grey/70">{success}</p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="admin-btn-primary"
      >
        <Banknote className="w-4 h-4" />
        {isPending ? "A registar…" : "Registar pagamento e emitir recibo"}
      </button>
    </section>
  );
}
