"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Trash2, BookOpen, MessageCircle, PenLine } from "lucide-react";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/AdminField";
import InvoicePreview from "@/components/admin/InvoicePreview";
import ServiceCatalogPanel from "@/components/admin/ServiceCatalogPanel";
import SignaturePadModal from "@/components/admin/SignaturePadModal";
import {
  markPdfGeneratedAction,
  peekDocumentNumberAction,
  saveDocumentAction,
} from "@/lib/admin/actions/documents.actions";
import { calculateLineItems, calculateTotals, formatCurrency } from "@/lib/calculations";
import {
  CLIENT_TYPE_LABELS,
  CURRENCY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  VAT_RATE,
} from "@/lib/admin/constants";
import { getWhatsAppShareUrl } from "@/lib/admin/whatsapp";
import {
  buildInvoiceDocument,
  clientToInvoiceFields,
  createDefaultInvoiceForm,
  createEmptyLineItem,
  createId,
  documentToForm,
  getDefaultSignatureForBusiness,
  signatureToFormFields,
} from "@/lib/invoice-generator";
import { downloadInvoicePDF } from "@/lib/pdf";
import type {
  Business,
  BusinessSignature,
  Client,
  ClientType,
  DocumentType,
  EventType,
  InvoiceDocument,
  InvoiceFormData,
  ServiceCatalogItem,
} from "@/lib/admin/types";

type InvoiceFormProps = {
  documentType: DocumentType;
  businesses: Business[];
  catalog: ServiceCatalogItem[];
  clients: Client[];
  signatures: BusinessSignature[];
  initialDocument?: InvoiceDocument;
  initialDocumentNumber?: string;
  onSaved: (document: InvoiceDocument) => void;
  onDocumentTypeChange?: (documentType: DocumentType) => void;
};

export default function InvoiceForm({
  documentType,
  businesses,
  catalog,
  clients,
  signatures,
  initialDocument,
  initialDocumentNumber,
  onSaved,
  onDocumentTypeChange,
}: InvoiceFormProps) {
  const [form, setForm] = useState<InvoiceFormData>(() => {
    if (initialDocument) return documentToForm(initialDocument);
    const base = createDefaultInvoiceForm(documentType, [], "haxr-signature");
    if (initialDocumentNumber) base.documentNumber = initialDocumentNumber;
    const defaultSignature = getDefaultSignatureForBusiness(
      signatures,
      base.businessId
    );
    if (defaultSignature) {
      Object.assign(base, signatureToFormFields(defaultSignature));
    }
    return base;
  });
  const [showCatalog, setShowCatalog] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [isNewClient, setIsNewClient] = useState(!form.clientId);
  const [error, setError] = useState("");
  const [numberError, setNumberError] = useState("");
  const [isPending, startTransition] = useTransition();

  const businessSignatures = useMemo(
    () => signatures.filter((sig) => sig.businessId === form.businessId),
    [signatures, form.businessId]
  );

  const activeBusiness = useMemo(
    () => businesses.find((b) => b.id === form.businessId) ?? businesses[0],
    [businesses, form.businessId]
  );

  const businessCatalog = useMemo(
    () =>
      catalog.filter(
        (item) =>
          !item.businessIds || item.businessIds.includes(form.businessId)
      ),
    [catalog, form.businessId]
  );

  const previewDocument = useMemo(
    () => buildInvoiceDocument(form, initialDocument),
    [form, initialDocument]
  );

  const totals = useMemo(
    () => calculateTotals(form.lineItems, form.includeVat, form.currency),
    [form.lineItems, form.includeVat, form.currency]
  );

  useEffect(() => {
    if (initialDocument) return;

    const businessId = form.businessId;
    const docType = form.documentType;
    let cancelled = false;

    startTransition(async () => {
      setNumberError("");
      const result = await peekDocumentNumberAction(businessId, docType);
      if (cancelled) return;

      if (result.success) {
        setForm((prev) => {
          if (
            prev.businessId !== businessId ||
            prev.documentType !== docType
          ) {
            return prev;
          }
          return { ...prev, documentNumber: result.data };
        });
        return;
      }

      setNumberError(result.error);
    });

    return () => {
      cancelled = true;
    };
  }, [form.businessId, form.documentType, initialDocument]);

  function handleDocumentTypeChange(nextType: DocumentType) {
    if (initialDocument) return;

    const nextStatus =
      nextType === "receipt"
        ? "paid"
        : form.status === "paid"
          ? "draft"
          : form.status;

    updateForm({
      documentType: nextType,
      status: nextStatus,
    });
    onDocumentTypeChange?.(nextType);
  }

  function updateForm(patch: Partial<InvoiceFormData>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.businessId && patch.businessId !== prev.businessId) {
        const business = businesses.find((b) => b.id === patch.businessId);
        if (business) next.currency = business.defaultCurrency;
        const defaultSignature = getDefaultSignatureForBusiness(
          signatures,
          patch.businessId
        );
        if (defaultSignature) {
          Object.assign(next, signatureToFormFields(defaultSignature));
        } else {
          next.issuerSignatureId = null;
          next.issuerName = "";
          next.issuerRole = "";
          next.issuerSignatureImage = "";
        }
      }
      return next;
    });
  }

  function handleOnlineSignConfirm(dataUrl: string) {
    updateForm({
      issuerSignatureId: null,
      issuerSignatureImage: dataUrl,
    });
    setShowSignPad(false);
  }

  function handleClearSignature() {
    updateForm({
      issuerSignatureId: null,
      issuerSignatureImage: "",
    });
  }

  function handleSignatureSelect(signatureId: string) {
    if (!signatureId) {
      updateForm({
        issuerSignatureId: null,
        issuerName: "",
        issuerRole: "",
        issuerSignatureImage: "",
      });
      return;
    }

    const signature = businessSignatures.find((sig) => sig.id === signatureId);
    if (signature) {
      updateForm(signatureToFormFields(signature));
    }
  }

  function handleClientSelect(clientId: string) {
    if (clientId === "new") {
      setIsNewClient(true);
      updateForm({
        clientId: null,
        clientType: "individual",
        clientName: "",
        companyName: "",
        clientNuit: "",
        clientEmail: "",
        clientPhone: "",
        clientAddress: "",
      });
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setIsNewClient(false);
    updateForm(clientToInvoiceFields(client));
  }

  function updateLineItem(id: string, patch: Partial<(typeof form.lineItems)[0]>) {
    const lineItems = calculateLineItems(
      form.lineItems.map((item) =>
        item.id === id ? { ...item, ...patch, source: "manual" as const } : item
      )
    );
    updateForm({ lineItems });
  }

  function addLineItem() {
    updateForm({ lineItems: [...form.lineItems, createEmptyLineItem()] });
  }

  function removeLineItem(id: string) {
    if (form.lineItems.length <= 1) return;
    updateForm({ lineItems: form.lineItems.filter((item) => item.id !== id) });
  }

  function addFromCatalog(serviceId: string) {
    const service = businessCatalog.find((s) => s.id === serviceId);
    if (!service) return;
    const emptyIndex = form.lineItems.findIndex((i) => !i.description.trim());
    const newItem = {
      id: createId(),
      description: service.name,
      quantity: 1,
      unitPrice: service.basePrice,
      total: service.basePrice,
      source: "catalog" as const,
      catalogServiceId: service.id,
    };
    if (emptyIndex >= 0) {
      const lineItems = [...form.lineItems];
      lineItems[emptyIndex] = newItem;
      updateForm({ lineItems: calculateLineItems(lineItems) });
    } else {
      updateForm({
        lineItems: calculateLineItems([...form.lineItems, newItem]),
      });
    }
    setShowCatalog(false);
  }

  async function handleSave() {
    setError("");
    const result = await saveDocumentAction(form, initialDocument?.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSaved(result.data);
  }

  async function handleGeneratePdf() {
    setError("");
    const saveResult = await saveDocumentAction(form, initialDocument?.id);
    if (!saveResult.success) {
      setError(saveResult.error);
      return;
    }

    const pdfResult = await markPdfGeneratedAction(saveResult.data.id);
    const doc = pdfResult.success ? pdfResult.data : saveResult.data;

    await downloadInvoicePDF(doc, activeBusiness);
    onSaved(doc);
  }

  function handleWhatsApp() {
    const doc = buildInvoiceDocument(form, initialDocument);
    window.open(getWhatsAppShareUrl(doc), "_blank", "noopener,noreferrer");
  }

  const vatPercent = Math.round(VAT_RATE * 100);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="space-y-6">
        {error ? (
          <p className="text-red-400 text-sm admin-card p-4" role="alert">
            {error}
          </p>
        ) : null}

        <section className="admin-card p-6 space-y-5">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Empresa
          </h2>
          <AdminSelect
            label="Perfil de Negócio"
            value={form.businessId}
            onChange={(e) =>
              updateForm({
                businessId: e.target.value as InvoiceFormData["businessId"],
              })
            }
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </AdminSelect>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/70 mb-2">
                N.º Documento
              </p>
              <p className="font-mono text-sm text-admin-gold px-4 py-3 bg-black-soft border border-grey-dark/80 rounded-sm">
                {form.documentNumber}
                {isPending && !initialDocument ? (
                  <span className="text-grey/40 text-xs ml-2">…</span>
                ) : null}
              </p>
            </div>
            <AdminSelect
              label="Estado"
              value={form.status}
              onChange={(e) =>
                updateForm({ status: e.target.value as InvoiceFormData["status"] })
              }
            >
              {Object.entries(DOCUMENT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </AdminSelect>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AdminSelect
              label="Tipo de Documento"
              value={form.documentType}
              onChange={(e) =>
                handleDocumentTypeChange(e.target.value as DocumentType)
              }
              disabled={Boolean(initialDocument)}
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Moeda"
              value={form.currency}
              onChange={(e) =>
                updateForm({ currency: e.target.value as InvoiceFormData["currency"] })
              }
            >
              {Object.entries(CURRENCY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </AdminSelect>
          </div>
          {initialDocument ? (
            <p className="text-xs text-grey/50">
              O tipo de documento não pode ser alterado após criação.
            </p>
          ) : null}
          {numberError ? (
            <p className="text-xs text-red-400" role="alert">
              {numberError}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <AdminInput
              label="Data de Emissão"
              type="date"
              value={form.issueDate}
              onChange={(e) => updateForm({ issueDate: e.target.value })}
            />
            <AdminInput
              label="Data de Validade"
              type="date"
              value={form.expiryDate}
              onChange={(e) => updateForm({ expiryDate: e.target.value })}
            />
          </div>
        </section>

        <section className="admin-card p-6 space-y-5">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Cliente
          </h2>
          <AdminSelect
            label="Seleccionar Cliente"
            value={isNewClient ? "new" : (form.clientId ?? "new")}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="new">+ Novo Cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
                {c.companyName ? ` · ${c.companyName}` : ""}
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Tipo de Cliente"
            value={form.clientType}
            onChange={(e) =>
              updateForm({ clientType: e.target.value as ClientType })
            }
          >
            {(Object.entries(CLIENT_TYPE_LABELS) as [ClientType, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </AdminSelect>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label={
                form.clientType === "company" ? "Nome do Responsável" : "Nome Completo"
              }
              value={form.clientName}
              onChange={(e) => updateForm({ clientName: e.target.value })}
            />
            <AdminInput
              label={form.clientType === "company" ? "Empresa" : "Empresa (opcional)"}
              value={form.companyName}
              onChange={(e) => updateForm({ companyName: e.target.value })}
            />
            <AdminInput
              label="NUIT"
              value={form.clientNuit}
              onChange={(e) => updateForm({ clientNuit: e.target.value })}
            />
            <AdminInput
              label="Telefone"
              value={form.clientPhone}
              onChange={(e) => updateForm({ clientPhone: e.target.value })}
            />
            <AdminInput
              label="Email"
              type="email"
              value={form.clientEmail}
              onChange={(e) => updateForm({ clientEmail: e.target.value })}
            />
          </div>
          <AdminTextarea
            label="Morada"
            value={form.clientAddress}
            onChange={(e) => updateForm({ clientAddress: e.target.value })}
          />
        </section>

        <section className="admin-card p-6 space-y-5">
          <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Evento
          </h2>
          <AdminSelect
            label="Tipo de Evento"
            value={form.eventType ?? ""}
            onChange={(e) =>
              updateForm({
                eventType: (e.target.value || null) as EventType | null,
              })
            }
          >
            <option value="">— Não aplicável —</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </option>
            ))}
          </AdminSelect>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label="Nome do Evento"
              value={form.eventName}
              onChange={(e) => updateForm({ eventName: e.target.value })}
              placeholder="Ex.: Casamento Silva & Costa"
            />
            <AdminInput
              label="Data do Evento"
              type="date"
              value={form.eventDate ?? ""}
              onChange={(e) =>
                updateForm({ eventDate: e.target.value || null })
              }
            />
          </div>
          <AdminInput
            label="Local do Evento"
            value={form.eventLocation}
            onChange={(e) => updateForm({ eventLocation: e.target.value })}
            placeholder="Ex.: Maputo, Hotel Polana"
          />
        </section>

        <section className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
              Serviços
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCatalog((v) => !v)}
                className={`admin-btn-secondary text-[10px] ${
                  showCatalog ? "border-admin-gold/50 text-admin-gold" : ""
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Catálogo
              </button>
              <button
                type="button"
                onClick={addLineItem}
                className="admin-btn-secondary text-[10px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Manual
              </button>
            </div>
          </div>

          {showCatalog ? (
            <ServiceCatalogPanel
              catalog={businessCatalog}
              currency={form.currency}
              onSelect={addFromCatalog}
            />
          ) : null}

          <div className="space-y-3">
            {form.lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-end p-3 bg-black-soft border border-grey-dark/60 rounded-sm"
              >
                <div className="col-span-12 md:col-span-5">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50">
                      Descrição
                    </label>
                    {item.source === "catalog" ? (
                      <span className="font-mono text-[7px] tracking-wider uppercase text-admin-gold/60">
                        Catálogo
                      </span>
                    ) : null}
                  </div>
                  <input
                    className="admin-input w-full"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, { description: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50">
                    Qtd.
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="admin-input mt-1 w-full"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50">
                    Preço
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="admin-input mt-1 w-full"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        unitPrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50">
                    Total
                  </label>
                  <p className="mt-2 text-sm text-admin-gold font-mono">
                    {formatCurrency(item.total, form.currency)}
                  </p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="text-grey/40 hover:text-red-400 p-2"
                    aria-label={`Remover linha ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.includeVat}
              onChange={(e) => updateForm({ includeVat: e.target.checked })}
              className="accent-admin-gold"
            />
            <span className="font-sans text-sm text-grey">
              Incluir IVA ({vatPercent}%)
            </span>
          </label>

          <div className="pt-4 border-t border-grey-dark/60 space-y-2 text-sm">
            <div className="flex justify-between text-grey">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal, form.currency)}</span>
            </div>
            {form.includeVat ? (
              <div className="flex justify-between text-grey">
                <span>IVA ({vatPercent}%)</span>
                <span>{formatCurrency(totals.vatAmount, form.currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between font-serif text-lg text-white">
              <span>Total</span>
              <span>{formatCurrency(totals.grandTotal, form.currency)}</span>
            </div>
          </div>
        </section>

        <section className="admin-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
              Assinatura do Emissor
            </h2>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-grey/50 hover:text-admin-gold transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              Gerir assinaturas
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowSignPad(true)}
              className="admin-btn-secondary text-[10px]"
            >
              <PenLine className="w-3.5 h-3.5" />
              Assinar online
            </button>
            {form.issuerSignatureImage ? (
              <button
                type="button"
                onClick={handleClearSignature}
                className="admin-btn-secondary text-[10px] text-grey/60"
              >
                Remover assinatura
              </button>
            ) : null}
          </div>

          {businessSignatures.length > 0 ? (
            <AdminSelect
              label="Assinatura guardada"
              value={form.issuerSignatureId ?? ""}
              onChange={(e) => handleSignatureSelect(e.target.value)}
            >
              <option value="">Sem assinatura</option>
              {businessSignatures.map((signature) => (
                <option key={signature.id} value={signature.id}>
                  {signature.label}
                  {signature.isDefault ? " (padrão)" : ""}
                </option>
              ))}
            </AdminSelect>
          ) : (
            <p className="text-sm text-grey/50">
              Ainda não há assinaturas guardadas. Pode{" "}
              <button
                type="button"
                onClick={() => setShowSignPad(true)}
                className="text-admin-gold hover:underline"
              >
                assinar online agora
              </button>{" "}
              ou{" "}
              <Link href="/admin/settings" className="text-admin-gold hover:underline">
                guardar uma em Definições
              </Link>
              .
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label="Nome no documento"
              value={form.issuerName}
              onChange={(e) => updateForm({ issuerName: e.target.value })}
              placeholder="Nome de quem assina"
            />
            <AdminInput
              label="Cargo / função"
              value={form.issuerRole}
              onChange={(e) => updateForm({ issuerRole: e.target.value })}
              placeholder="Ex.: Director Comercial"
            />
          </div>

          {form.issuerSignatureImage ? (
            <div className="p-4 border border-grey-dark/60 rounded-sm bg-black-soft inline-block">
              <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/50 mb-3">
                Pré-visualização
              </p>
              <img
                src={form.issuerSignatureImage}
                alt={form.issuerName || "Assinatura"}
                className="h-16 max-w-[220px] object-contain"
              />
            </div>
          ) : null}
        </section>

        <AdminTextarea
          label="Notas"
          value={form.notes}
          onChange={(e) => updateForm({ notes: e.target.value })}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="admin-btn-primary"
          >
            Guardar Documento
          </button>
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isPending}
            className="admin-btn-secondary"
          >
            Gerar PDF
          </button>
          <button type="button" onClick={handleWhatsApp} className="admin-btn-secondary">
            <MessageCircle className="w-4 h-4" />
            Partilhar WhatsApp
          </button>
        </div>
      </div>

      <SignaturePadModal
        open={showSignPad}
        onClose={() => setShowSignPad(false)}
        onConfirm={handleOnlineSignConfirm}
        title="Assinar documento"
        description="Assine directamente neste documento. A assinatura ficará gravada ao guardar a factura, proforma ou recibo."
        confirmLabel="Aplicar ao documento"
      />

      <div className="xl:sticky xl:top-24 xl:self-start">
        <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-grey/50 mb-4">
          Pré-visualização
        </p>
        {activeBusiness ? (
          <InvoicePreview document={previewDocument} business={activeBusiness} />
        ) : null}
      </div>
    </div>
  );
}
