export type PortalRouteId =
  | "dashboard"
  | "eventos"
  | "documentos"
  | "financeiro"
  | "aprovacoes"
  | "cronograma"
  | "contratos"
  | "concierge";

export type PortalNavItem = {
  id: PortalRouteId;
  label: string;
  segment: string;
  description: string;
};

export const PORTAL_NAV_ITEMS: readonly PortalNavItem[] = [
  {
    id: "dashboard",
    label: "Resumo",
    segment: "",
    description: "Visão geral do projecto",
  },
  {
    id: "eventos",
    label: "Eventos",
    segment: "eventos",
    description: "Progresso e RSVP por evento",
  },
  {
    id: "documentos",
    label: "Documentos",
    segment: "documentos",
    description: "Proformas, facturas e recibos",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    segment: "financeiro",
    description: "Pagamentos, sinal e comprovativos",
  },
  {
    id: "aprovacoes",
    label: "Aprovações",
    segment: "aprovacoes",
    description: "Propostas, convites e layouts",
  },
  {
    id: "cronograma",
    label: "Cronograma",
    segment: "cronograma",
    description: "Marcos e actividade do projecto",
  },
  {
    id: "contratos",
    label: "Contratos",
    segment: "contratos",
    description: "Contratos e condições",
  },
  {
    id: "concierge",
    label: "Concierge",
    segment: "concierge",
    description: "Envio de ficheiros e inbox partilhada",
  },
] as const;

export function portalPath(token: string, segment?: string): string {
  const base = `/portal/${encodeURIComponent(token)}`;
  if (!segment) return base;
  return `${base}/${segment}`;
}

export function portalHref(token: string, id: PortalRouteId): string {
  const item = PORTAL_NAV_ITEMS.find((nav) => nav.id === id);
  if (!item) return portalPath(token);
  return portalPath(token, item.segment || undefined);
}
