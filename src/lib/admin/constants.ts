import type {
  ClientType,
  Currency,
  DocumentContactChannel,
  DocumentPdfTemplate,
  DocumentStatus,
  DocumentType,
  EventType,
  ServiceCategory,
} from "@/lib/admin/types";

export const VAT_RATE = 0.16;

export const ADMIN_GOLD = "#C9A227";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  proforma: "Proforma",
  invoice: "Factura",
  receipt: "Recibo",
};

export const DOCUMENT_PDF_TEMPLATE_LABELS: Record<DocumentPdfTemplate, string> = {
  editorial_ivory: "Editorial Marfim",
  signature_noir: "Signature Noir",
  executive: "Executive",
  atelier_blanc: "Atelier Blanc",
  maison_signature: "Maison Signature",
};

export const DOCUMENT_CONTACT_CHANNEL_LABELS: Record<DocumentContactChannel, string> = {
  financeiro: "Financeiro",
  convites: "Convites",
  info: "Informações",
  geral: "Geral",
};

export const DOCUMENT_PREFIX: Record<DocumentType, string> = {
  proforma: "PRO",
  invoice: "INV",
  receipt: "REC",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  paid: "Pago",
  cancelled: "Cancelado",
};

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  individual: "Particular",
  company: "Empresa",
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  invitations: "Convites",
  websites: "Websites",
  assessoria: "Assessoria",
  branding: "Branding",
  experiences: "Experiências",
  event_packages: "Pacotes",
  addons: "Extras",
  coordination: "Coordenação",
  media: "Media",
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "invitations",
  "websites",
  "assessoria",
  "branding",
  "experiences",
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Casamento",
  birthday: "Aniversário",
  corporate: "Evento Corporativo",
  baby_shower: "Baby Shower",
  graduation: "Graduação",
  other: "Outro",
};

export const EVENT_TYPES: EventType[] = [
  "wedding",
  "birthday",
  "corporate",
  "baby_shower",
  "graduation",
  "other",
];

export const CURRENCY_LABELS: Record<Currency, string> = {
  MZN: "Metical (MZN)",
  USD: "Dólar (USD)",
  ZAR: "Rand (ZAR)",
};

export const HAXR_PROFORMA_TERMS = [
  "Este documento constitui uma proposta comercial e cotação de serviços.",
  "Válido pelo período indicado na data de validade deste documento.",
  "A adjudicação e início de produção ocorrem após confirmação do pagamento acordado.",
  "Valores expressos na moeda indicada, salvo menção expressa em contrário.",
];

export const HAXR_INVOICE_TERMS = [
  "O pagamento deve ser efectuado conforme as condições e prazos acordados.",
  "Por favor indique o número desta factura no descritivo da transferência bancária ou pagamento móvel.",
  "Valores expressos na moeda indicada, salvo menção expressa em contrário.",
];

export const HAXR_RECEIPT_TERMS = [
  "Este recibo confirma exclusivamente o pagamento do valor nele indicado.",
  "Quando associado a uma factura, não representa por si só a liquidação integral de eventual saldo remanescente.",
  "A referência do pagamento permite relacionar este registo com o documento de origem.",
  "Valores expressos na moeda indicada, salvo menção expressa em contrário.",
];

export const DEFAULT_TERMS_HAXR = HAXR_PROFORMA_TERMS;

export const DEFAULT_TERMS_BRAINYWRITE = [
  "Pagamento a 50% na adjudicação e 50% na entrega final.",
  "Prazo de validade conforme data indicada neste documento.",
  "Alterações fora do âmbito acordado podem implicar custos adicionais.",
  "Valores em Metical (MZN), salvo menção expressa.",
];

export const ADMIN_SESSION_COOKIE = "haxr_admin_session";
