import type { MarketingSegment } from "@/lib/email/email-types";

export type SegmentDefinition = {
  id: MarketingSegment;
  label: string;
  description: string;
  /** true = cold outreach; exige contactos seleccionados, nunca listas compradas */
  coldOutreach?: boolean;
};

export const marketingSegments: SegmentDefinition[] = [
  {
    id: "leads_site",
    label: "Leads do site",
    description: "Contactos via formulário website com interacção directa.",
  },
  {
    id: "clientes_interessados",
    label: "Clientes interessados",
    description: "Pedidos de contacto ou orçamento com consentimento.",
  },
  {
    id: "casais_noivos",
    label: "Casais / noivos",
    description: "Leads ou clientes com projecto de casamento.",
  },
  {
    id: "newsletter",
    label: "Newsletter",
    description: "Subscritores com consentimento explícito.",
  },
  {
    id: "clientes_activos",
    label: "Clientes activos",
    description: "Eventos em curso ou contratos activos.",
  },
  {
    id: "clientes_inactivos",
    label: "Clientes inactivos",
    description: "Eventos concluídos ou sem actividade recente.",
  },
  {
    id: "fornecedores",
    label: "Fornecedores",
    description:
      "Prestadores seleccionados — fotógrafos, caterers, decoradores, etc.",
    coldOutreach: true,
  },
  {
    id: "empresas_eventos",
    label: "Empresas de eventos",
    description: "Agências, venues e empresas B2B do sector.",
    coldOutreach: true,
  },
  {
    id: "contactos_seleccionados",
    label: "Contactos seleccionados",
    description:
      "Contactos relevantes escolhidos manualmente. NUNCA listas compradas ou aleatórias.",
    coldOutreach: true,
  },
  {
    id: "prospects_eventos",
    label: "Prospects de eventos",
    description:
      "Referências, planners, venues e profissionais do sector — outreach controlado.",
    coldOutreach: true,
  },
  {
    id: "prospects_corporativos",
    label: "Prospects corporativos",
    description:
      "Empresas para galas, lançamentos e celebrações — contacto respeitoso e breve.",
    coldOutreach: true,
  },
];

export function getSegmentDefinition(
  id: MarketingSegment
): SegmentDefinition | undefined {
  return marketingSegments.find((s) => s.id === id);
}

export function isColdOutreachSegment(id: MarketingSegment): boolean {
  return getSegmentDefinition(id)?.coldOutreach === true;
}
