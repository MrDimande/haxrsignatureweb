import type {
  ClientType,
  Currency,
  DocumentStatus,
  DocumentType,
  EventType,
  ServiceCategory,
} from "@/lib/admin/types";

export const VAT_RATE = 0.16;

export const ADMIN_GOLD = "#C9A227";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  proforma: "Proforma Invoice",
  invoice: "Factura",
  receipt: "Recibo",
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

export const DEFAULT_TERMS_HAXR = [
  "O pagamento deve ser efectuado conforme as condições acordadas na proposta.",
  "A produção inicia após confirmação do pagamento inicial.",
  "Este documento constitui prova oficial da transacção, salvo indicação em contrário.",
  "Valores em Metical (MZN), salvo menção expressa.",
];

export const DEFAULT_TERMS_BRAINYWRITE = [
  "Pagamento a 50% na adjudicação e 50% na entrega final.",
  "Prazo de validade conforme data indicada neste documento.",
  "Alterações fora do âmbito acordado podem implicar custos adicionais.",
  "Valores em Metical (MZN), salvo menção expressa.",
];

export const ADMIN_SESSION_COOKIE = "haxr_admin_session";
