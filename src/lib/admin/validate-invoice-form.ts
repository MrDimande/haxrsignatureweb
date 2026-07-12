import { parseSignatureDataUrl } from "@/lib/admin/signatures";
import type { InvoiceFormData } from "@/lib/admin/types";

export type InvoiceFormValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateInvoiceForm(
  form: InvoiceFormData
): InvoiceFormValidationResult {
  if (!form.clientName.trim()) {
    return { ok: false, error: "Indique o nome do cliente." };
  }

  if (!form.issueDate) {
    return { ok: false, error: "Indique a data de emissão." };
  }

  if (!form.expiryDate) {
    return { ok: false, error: "Indique a data de validade." };
  }

  if (form.issueDate > form.expiryDate) {
    return {
      ok: false,
      error: "A data de validade deve ser igual ou posterior à emissão.",
    };
  }

  const validLines = form.lineItems.filter(
    (item) => item.description.trim() && item.quantity > 0
  );

  if (validLines.length === 0) {
    return {
      ok: false,
      error: "Adicione pelo menos uma linha com descrição e quantidade.",
    };
  }

  const subtotal = validLines.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  if (subtotal <= 0) {
    return {
      ok: false,
      error: "O total do documento deve ser superior a zero.",
    };
  }

  if (form.issuerSignatureImage.trim()) {
    try {
      parseSignatureDataUrl(form.issuerSignatureImage);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Assinatura inválida.";
      return { ok: false, error: message };
    }
  }

  return { ok: true };
}

export function validateDocumentEmail(
  form: Pick<InvoiceFormData, "clientEmail">
): InvoiceFormValidationResult {
  const email = form.clientEmail.trim();
  if (!email) {
    return {
      ok: false,
      error: "Indique o email do cliente para enviar o documento.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "O email do cliente não é válido." };
  }

  return { ok: true };
}

export function validateDocumentWhatsApp(
  form: Pick<InvoiceFormData, "clientPhone">,
  businessWhatsapp: string
): InvoiceFormValidationResult {
  const phone =
    form.clientPhone.replace(/\D/g, "") || businessWhatsapp.replace(/\D/g, "");

  if (!phone) {
    return {
      ok: false,
      error:
        "Indique o telefone do cliente ou configure o WhatsApp da empresa.",
    };
  }

  return { ok: true };
}
