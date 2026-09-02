export type InsightArticle = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readMinutes: number;
  body: string[];
  relatedHref: string;
  relatedLabel: string;
};

export const insightArticles: InsightArticle[] = [
  {
    slug: "casamentos",
    title: "A arte de organizar casamentos em Maputo",
    category: "Casamentos",
    excerpt:
      "Planeamento, fornecedores e decisões que definem o grande dia, com método, não com sorte.",
    readMinutes: 6,
    body: [
      "Organizar um casamento premium em Maputo exige mais do que escolher flores e menu. Exige sequência: data, espaço, capacidade de convidados, fornecedores curados e uma narrativa visual coerente desde o primeiro save the date.",
      "A HAXR trabalha com uma equipa que assume a complexidade, orçamento, cronograma, confirmações e imprevistos, para que o casal viva a antecipação, não a logística.",
      "O primeiro passo não é contratar tudo de uma vez: é definir prioridades (experiência dos convidados, estética, música, operação) e construir um plano que respeite o orçamento em meticais.",
    ],
    relatedHref: "/assessoria-eventos",
    relatedLabel: "Conhecer assessoria HAXR",
  },
  {
    slug: "convidados-rsvp",
    title: "Gestão de convidados com clareza",
    category: "Convidados",
    excerpt:
      "RSVP, listas, mesas e recepção, como estruturar cada etapa com discrição.",
    readMinutes: 5,
    body: [
      "A gestão de convidados começa antes da lista: define-se quem convida, quantos acompanhantes são permitidos e como se comunica o dress code.",
      "O RSVP digital integrado no convite HAXR permite confirmar presença, restrições alimentares e mensagens, sem folhas dispersas ou grupos de WhatsApp caóticos.",
      "Find Your Seat e check-in QR fecham o ciclo no dia: o convidado é recebido com fluidez e a equipa vê presenças em tempo real.",
    ],
    relatedHref: "/gestao-convidados",
    relatedLabel: "Gestão de convidados",
  },
  {
    slug: "assessoria-orcamento",
    title: "Orçamento e assessoria — decisões com tranquilidade",
    category: "Assessoria",
    excerpt:
      "Como distribuir investimento, sinais e parcelas num casamento de alto padrão.",
    readMinutes: 5,
    body: [
      "Um orçamento de casamento não é uma folha de cálculo é uma ferramenta de decisão. A HAXR ajuda a definir tetos por categoria: espaço, catering, foto, música, decoração e contingência.",
      "Sinais a fornecedores devem estar ligados a marcos claros no cronograma. A plataforma regista pagamentos e alerta para pendências.",
      "A assessoria completa inclui não só curadoria estética, mas blindagem financeira e operacional até ao dia do evento.",
    ],
    relatedHref: "/contacto?tipo=casamento",
    relatedLabel: "Pedir proposta",
  },
];

export function getInsightArticle(slug: string): InsightArticle | undefined {
  return insightArticles.find((article) => article.slug === slug);
}
