export type GuiaItem = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  source: string;
};

export const guiasCatalog: readonly GuiaItem[] = [
  {
    id: "checklist-12-meses",
    title: "Checklist 12 Meses — Casamento em Maputo",
    description:
      "Cronograma mês a mês desde o noivado até ao grande dia — fornecedores, prazos e decisões críticas.",
    bullets: [
      "Marcos por trimestre",
      "Fornecedores prioritários em MZ",
      "Prazos de convite e RSVP",
    ],
    source: "lead_magnet_checklist",
  },
  {
    id: "guia-rsvp",
    title: "Guia RSVP Digital — Boas Práticas",
    description:
      "Como estruturar confirmações, acompanhantes e comunicação com convidados sem stress.",
    bullets: [
      "Textos de convite e lembretes",
      "Gestão de pendências",
      "Integração com mesas",
    ],
    source: "lead_magnet_rsvp",
  },
  {
    id: "orcamento-casamento",
    title: "Orçamento de Casamento — Modelo MT",
    description:
      "Distribuição sugerida de orçamento para casamentos premium em meticais.",
    bullets: [
      "Percentagens por categoria",
      "Sinais e parcelas",
      "Reserva de contingência",
    ],
    source: "lead_magnet_budget",
  },
] as const;
