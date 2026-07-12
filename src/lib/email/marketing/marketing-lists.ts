import type { MarketingSegment } from "@/lib/email/email-types";
import {
  getBrevoClientsListId,
  getBrevoMarketingListId,
  getBrevoSuppliersListId,
} from "@/lib/email/email-config";
import {
  getBrevoLeadsListId,
  getBrevoNewsletterListId,
} from "@/lib/brevo/config";

export type ListEnvKey =
  | "BREVO_LIST_LEADS"
  | "BREVO_LIST_NEWSLETTER"
  | "BREVO_MARKETING_LIST_ID"
  | "BREVO_SUPPLIERS_LIST_ID"
  | "BREVO_CLIENTS_LIST_ID";

export type MarketingListDefinition = {
  envKey: ListEnvKey;
  label: string;
  segments: MarketingSegment[];
  resolveId: () => number | null;
};

/**
 * Mapeamento segmento → lista Brevo.
 * Cold outreach: usar apenas com contactos seleccionados na lista correcta.
 */
export const marketingLists: MarketingListDefinition[] = [
  {
    envKey: "BREVO_LIST_LEADS",
    label: "Leads website",
    segments: ["leads_site", "clientes_interessados", "casais_noivos"],
    resolveId: getBrevoLeadsListId,
  },
  {
    envKey: "BREVO_LIST_NEWSLETTER",
    label: "Newsletter",
    segments: ["newsletter"],
    resolveId: getBrevoNewsletterListId,
  },
  {
    envKey: "BREVO_MARKETING_LIST_ID",
    label: "Marketing geral",
    segments: [
      "clientes_interessados",
      "leads_site",
      "contactos_seleccionados",
      "prospects_eventos",
    ],
    resolveId: getBrevoMarketingListId,
  },
  {
    envKey: "BREVO_SUPPLIERS_LIST_ID",
    label: "Fornecedores",
    segments: [
      "fornecedores",
      "empresas_eventos",
      "contactos_seleccionados",
      "prospects_eventos",
    ],
    resolveId: getBrevoSuppliersListId,
  },
  {
    envKey: "BREVO_CLIENTS_LIST_ID",
    label: "Clientes",
    segments: [
      "clientes_activos",
      "clientes_inactivos",
      "casais_noivos",
      "prospects_corporativos",
    ],
    resolveId: getBrevoClientsListId,
  },
];

export function resolveListIdsForSegments(
  segments: MarketingSegment[]
): { listIds: number[]; missing: ListEnvKey[] } {
  const target = new Set(segments);
  const listIds = new Set<number>();
  const missing: ListEnvKey[] = [];

  for (const list of marketingLists) {
    const matches = list.segments.some((s) => target.has(s));
    if (!matches) continue;

    const id = list.resolveId();
    if (id) {
      listIds.add(id);
    } else {
      missing.push(list.envKey);
    }
  }

  return { listIds: [...listIds], missing };
}
