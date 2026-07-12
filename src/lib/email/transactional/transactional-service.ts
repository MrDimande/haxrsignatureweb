/**
 * Serviço transaccional — funil Brevo e emails operacionais outbound.
 * Separado de Resend (formulário contacto) e Concierge inbound.
 */

export {
  sendFunnelEmail,
  type SendFunnelEmailInput,
} from "@/lib/brevo/transactional";

export {
  getFunnelTemplate,
  type FunnelEmailKind,
  type FunnelTemplateParams,
} from "@/lib/brevo/templates";

export { sendTransactionalEmail } from "@/lib/email/brevo-client";
