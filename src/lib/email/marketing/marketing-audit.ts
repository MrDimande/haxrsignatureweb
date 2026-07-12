import { getEmailLogoDiagnostics } from "@/lib/brand/logo-url";
import { brevoReady } from "@/lib/email/brevo-client";
import {
  getBrevoSender,
  getBrevoTestRecipient,
  getEmailSendMode,
  MARKETING_SEND_CONFIRMATION,
} from "@/lib/email/email-config";
import {
  getBrevoLeadsListId,
  getBrevoNewsletterListId,
  isBrevoConfigured,
} from "@/lib/brevo/config";
import {
  getBrevoClientsListId,
  getBrevoMarketingListId,
  getBrevoSuppliersListId,
} from "@/lib/email/email-config";
import { marketingLists } from "@/lib/email/marketing/marketing-lists";
import { marketingCampaignDrafts } from "@/lib/email/marketing/marketing-campaigns";
import { marketingTemplates } from "@/lib/email/marketing/marketing-templates";

export type LaunchChecklistItem = {
  id: string;
  label: string;
  status: "ok" | "warning" | "pending";
  detail?: string;
};

/**
 * Checklist antes do primeiro envio real de marketing.
 * Não verifica DNS automaticamente — validar no painel Brevo.
 */
export function getMarketingLaunchChecklist(): LaunchChecklistItem[] {
  const sender = getBrevoSender();
  const mode = getEmailSendMode();
  const testRecipient = getBrevoTestRecipient();
  const logoDiagnostics = getEmailLogoDiagnostics();

  const items: LaunchChecklistItem[] = [
    {
      id: "email_logo_url",
      label: "URL do logo para email (HTTPS público)",
      status: logoDiagnostics.safeForEmail ? "ok" : "warning",
      detail: logoDiagnostics.safeForEmail
        ? logoDiagnostics.resolvedUrl ?? "n/d"
        : logoDiagnostics.resolvedUrl
          ? `${logoDiagnostics.resolvedUrl} — text-only fallback will be used`
          : "Não configurado — text-only fallback will be used",
    },
    {
      id: "email_logo_asset",
      label: "Asset do logo em email",
      status: logoDiagnostics.safeForEmail ? "ok" : "warning",
      detail: `${logoDiagnostics.assetPath} · fonte: ${logoDiagnostics.source} · modo: ${logoDiagnostics.fallbackMode}`,
    },
    {
      id: "api_key",
      label: "BREVO_API_KEY configurada (server-side)",
      status: isBrevoConfigured() ? "ok" : "pending",
    },
    {
      id: "sender_email",
      label: "Remetente configurado (BREVO_SENDER_EMAIL)",
      status: sender.email ? "ok" : "pending",
      detail: sender.email,
    },
    {
      id: "sender_name",
      label: "Nome do remetente (BREVO_SENDER_NAME)",
      status: sender.name ? "ok" : "pending",
      detail: sender.name,
    },
    {
      id: "domain_auth",
      label: "Domínio autenticado (SPF/DKIM/DMARC no Brevo)",
      status: "warning",
      detail: "Verificar manualmente no painel Brevo → Senders & Domains",
    },
    {
      id: "test_recipient",
      label: "Destinatário de teste (BREVO_TEST_RECIPIENT)",
      status: testRecipient ? "ok" : "pending",
      detail: testRecipient ?? "Não configurado",
    },
    {
      id: "send_mode",
      label: "Modo de envio (EMAIL_SEND_MODE)",
      status:
        mode === "production"
          ? "warning"
          : mode === "test"
            ? "ok"
            : "pending",
      detail: `${mode} — production só após validação completa`,
    },
    {
      id: "list_leads",
      label: "Lista leads (BREVO_LIST_LEADS)",
      status: getBrevoLeadsListId() ? "ok" : "pending",
    },
    {
      id: "list_newsletter",
      label: "Lista newsletter (BREVO_LIST_NEWSLETTER)",
      status: getBrevoNewsletterListId() ? "ok" : "warning",
      detail: "Obrigatória para subscritores com opt-in",
    },
    {
      id: "list_suppliers",
      label: "Lista fornecedores (BREVO_SUPPLIERS_LIST_ID)",
      status: getBrevoSuppliersListId() ? "ok" : "warning",
    },
    {
      id: "list_clients",
      label: "Lista clientes (BREVO_CLIENTS_LIST_ID)",
      status: getBrevoClientsListId() ? "ok" : "warning",
    },
    {
      id: "list_marketing",
      label: "Lista marketing (BREVO_MARKETING_LIST_ID)",
      status: getBrevoMarketingListId() ? "ok" : "warning",
    },
    {
      id: "unsubscribe",
      label: "Link de unsubscribe nas campanhas Brevo",
      status: "warning",
      detail: "Activar no editor de campanha Brevo — não remover dos templates",
    },
    {
      id: "consent",
      label: "Consentimento de marketing verificado nos formulários",
      status: "ok",
      detail: "Checkbox obrigatório — sync Brevo só com consentStatus=granted",
    },
    {
      id: "templates",
      label: "Templates de marketing definidos",
      status: Object.keys(marketingTemplates).length >= 9 ? "ok" : "pending",
      detail: `${Object.keys(marketingTemplates).length} templates (incl. aliases)`,
    },
    {
      id: "campaigns",
      label: "Rascunhos de campanha preparados",
      status: marketingCampaignDrafts.length >= 7 ? "ok" : "pending",
      detail: `${marketingCampaignDrafts.length} rascunhos locais`,
    },
    {
      id: "lists_mapped",
      label: "Listas mapeadas a segmentos",
      status: marketingLists.some((l) => l.resolveId() !== null)
        ? "ok"
        : "pending",
    },
    {
      id: "test_email",
      label: "Email de teste enviado (npm run email:test)",
      status: "pending",
      detail: "Executar manualmente antes do primeiro envio real",
    },
    {
      id: "links",
      label: "Links do email verificados",
      status: "pending",
      detail: "Rever CTAs em mobile e desktop",
    },
    {
      id: "production_confirm",
      label: "Confirmação manual de envio em produção",
      status: "pending",
      detail: `Requer confirm: "${MARKETING_SEND_CONFIRMATION}"`,
    },
  ];

  return items;
}

/**
 * Guia de deliverability — comentários para a equipa.
 * - Remetente: nome reconhecível + email do domínio autenticado
 * - SPF/DKIM/DMARC: configurar no DNS conforme painel Brevo
 * - Unsubscribe: obrigatório em campanhas de marketing
 * - Consent: não adicionar às listas sem opt-in
 * - Test inbox: enviar para Gmail/Outlook antes de produção
 * - Links: usar HTTPS, evitar encurtadores suspeitos
 * - Spam: evitar CAPS, promessas exageradas, excesso de imagens
 * - Plain text: Brevo gera fallback; manter HTML leve
 */
export const deliverabilityNotes = [
  "Usar remetente verificado no domínio haxrsignature.com",
  "Confirmar SPF, DKIM e DMARC no painel Brevo",
  "Incluir unsubscribe em todas as campanhas",
  "Respeitar consentStatus antes de sync às listas",
  "Testar com BREVO_TEST_RECIPIENT antes de production",
  "Rever links e pré-visualização mobile",
  "Evitar linguagem spam e promessas não validadas",
] as const;

export function isMarketingReadyForTestSend(): boolean {
  return brevoReady() && Boolean(getBrevoTestRecipient());
}
