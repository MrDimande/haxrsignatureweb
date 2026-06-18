import type { PortalModuleId } from "@/lib/portal/types";

export type PortalModuleSpec = {
  id: PortalModuleId;
  label: string;
  path: string;
  phase: "mvp" | "v2";
  /** Repositório ou função admin existente a reutilizar */
  dataSource: string;
  notes: string;
};

/**
 * Mapa de módulos — fonte única para spec, UI futura e verify script.
 * Paths sob `/portal` (route group futuro), separado de `/area-cliente` (marketing).
 */
export const portalModules: PortalModuleSpec[] = [
  {
    id: "dashboard",
    label: "Resumo",
    path: "/portal",
    phase: "mvp",
    dataSource: "getClientCommercialOverview()",
    notes: "KPIs + próximo marco + alertas de aprovação.",
  },
  {
    id: "events",
    label: "Eventos",
    path: "/portal/eventos",
    phase: "mvp",
    dataSource: "eventsRepo.listEventsByClientId()",
    notes: "Lista read-only; detalhe por evento.",
  },
  {
    id: "guests",
    label: "Convidados",
    path: "/portal/eventos/[id]/convidados",
    phase: "mvp",
    dataSource: "guestsRepo.getEventStats()",
    notes: "Apenas estatísticas agregadas — sem nomes/emails.",
  },
  {
    id: "documents",
    label: "Documentos",
    path: "/portal/documentos",
    phase: "mvp",
    dataSource: "documentsRepo.listDocuments({ clientId })",
    notes: "Proformas, facturas, recibos; PDF se sent/paid.",
  },
  {
    id: "finance",
    label: "Financeiro",
    path: "/portal/financeiro",
    phase: "mvp",
    dataSource: "paymentsRepo.listPaymentsByClientId()",
    notes: "Histórico de pagamentos e saldo pendente.",
  },
  {
    id: "timeline",
    label: "Cronograma",
    path: "/portal/cronograma",
    phase: "v2",
    dataSource: "portal_timeline_items (nova tabela)",
    notes: "Marcos partilhados; admin gere visibilidade.",
  },
  {
    id: "approvals",
    label: "Aprovações",
    path: "/portal/aprovacoes",
    phase: "v2",
    dataSource: "portal_approvals (nova tabela)",
    notes: "Cliente aprova layouts, textos, entregas.",
  },
  {
    id: "contracts",
    label: "Contratos",
    path: "/portal/contratos",
    phase: "v2",
    dataSource: "documents + portal_contracts",
    notes: "Contratos assinados e condições gerais.",
  },
  {
    id: "suppliers",
    label: "Fornecedores",
    path: "/portal/fornecedores",
    phase: "v2",
    dataSource: "portal_suppliers (nova tabela)",
    notes: "Vista resumida; dados sensíveis só no admin.",
  },
];

export const portalMvpModuleIds = portalModules
  .filter((m) => m.phase === "mvp")
  .map((m) => m.id);

export function getPortalModule(id: PortalModuleId): PortalModuleSpec | undefined {
  return portalModules.find((m) => m.id === id);
}
