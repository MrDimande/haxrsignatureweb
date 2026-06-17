import type { PortfolioArchiveItem } from "@/lib/site-config";
import type { BenefitStory } from "@/lib/marketing/editorial";

export type MarketingPillar = {
  num: string;
  title: string;
  desc: string;
  href: string;
};

export const marketingPillars: MarketingPillar[] = [
  {
    num: "01",
    title: "Assessoria de Eventos",
    desc: "Direcção estratégica e operacional — para que alguém cuide de tudo por si, com discrição e precisão.",
    href: "/assessoria-eventos",
  },
  {
    num: "02",
    title: "Convites & Identidade Visual",
    desc: "A primeira impressão do evento — antes de ele existir fisicamente. Curadoria estética com intenção.",
    href: "/convites-identidade-visual",
  },
  {
    num: "03",
    title: "Gestão de Convidados",
    desc: "Controlo e clareza — quem confirmou, quem falta, onde cada pessoa ficará e como será recebida.",
    href: "/gestao-convidados",
  },
  {
    num: "04",
    title: "Ecossistema Operacional",
    desc: "Tecnologia invisível que sustenta a excelência HAXR — rigor nos bastidores, elegância à frente.",
    href: "/plataforma-eventos",
  },
];

export const homeHowWeWork = [
  {
    phase: "Antes",
    items: [
      "Escuta e alinhamento de visão",
      "Curadoria de cada decisão",
      "Cronograma com margem e intenção",
    ],
  },
  {
    phase: "Durante",
    items: [
      "Presença discreta da equipa",
      "Fluidez em cada momento",
      "Resolução sem exposição",
    ],
  },
  {
    phase: "Depois",
    items: [
      "Encerramento com rigor",
      "Memória do que foi vivido",
      "Acompanhamento até ao fim",
    ],
  },
] as const;

export const homeTechnology: readonly BenefitStory[] = [
  {
    title: "Confirmações com elegância",
    body: "Cada convidado responde numa experiência personalizada — e a equipa acompanha com clareza, sem folhas dispersas.",
    feeling: "Tranquilidade nas semanas que antecedem o evento.",
  },
  {
    title: "O lugar, encontrado",
    body: "Na recepção, o convidado localiza o seu lugar pelo nome — sem filas, sem confusão, com a discrição que o momento exige.",
    feeling: "Acolhimento impecável desde o primeiro passo.",
  },
  {
    title: "Presença registada",
    body: "A equipa sabe, em tempo real, quem chegou — para conduzir o evento com visibilidade e calma.",
    feeling: "Controlo operacional sem perder a elegância.",
  },
  {
    title: "Uma operação unificada",
    body: "Convidados, mesas e indicadores num ecossistema próprio — a tecnologia trabalha nos bastidores, invisível.",
    feeling: "Excelência que não se nota, mas se sente.",
  },
];

export const assessoriaPhases = [
  {
    phase: "Antes do evento",
    headline: "Clareza antes de qualquer execução.",
    items: [
      {
        title: "Escuta profunda",
        body: "Compreendemos a essência do evento, o perfil dos convidados e o nível de acompanhamento que procura — antes de qualquer decisão.",
      },
      {
        title: "Curadoria de decisões",
        body: "Fornecedores, espaços e referências seleccionados com critério absoluto. Nada entra por conveniência.",
      },
      {
        title: "Cronograma vivo",
        body: "Cada etapa tem responsável, horário e margem — para que a semana do evento respire com tranquilidade.",
      },
      {
        title: "Orçamento transparente",
        body: "Controlo financeiro com discrição e alinhamento contínuo — sem surpresas, sem fragmentação.",
      },
    ],
  },
  {
    phase: "No dia",
    headline: "Presença invisível. Execução impecável.",
    items: [
      {
        title: "Coordenação integral",
        body: "A equipa HAXR conduz montagem, fornecedores e sequência — para que cada momento decorra como foi imaginado.",
      },
      {
        title: "Supervisão discreta",
        body: "Imprevistos resolvidos longe do seu campo de visão. A complexidade permanece nos bastidores.",
      },
      {
        title: "Cerimonial sensível",
        body: "Momentos-chave conduzidos com elegância — você vive a experiência, nós cuidamos do resto.",
      },
    ],
  },
  {
    phase: "Depois",
    headline: "Encerramento com a mesma atenção do início.",
    items: [
      {
        title: "Síntese e memória",
        body: "Relatório do que foi executado — especialmente relevante para eventos corporativos e celebrações de grande dimensão.",
      },
      {
        title: "Follow-up cuidadoso",
        body: "Pagamentos, devoluções e encerramento administrativo com o rigor que cada projecto merece.",
      },
    ],
  },
] as const;

export const convitesCreativeProcess = [
  {
    num: "01",
    title: "Escuta e conceito",
    body: "Perfil do evento, referências estéticas e tom narrativo — a base de cada decisão visual.",
  },
  {
    num: "02",
    title: "Direcção de arte",
    body: "Tipografia, paleta, monograma e composição editorial alinhados à identidade do casal ou marca.",
  },
  {
    num: "03",
    title: "Experiência digital",
    body: "Desenvolvimento responsivo onde música, galeria e confirmação de presença completam a narrativa.",
  },
  {
    num: "04",
    title: "Refinamento e entrega",
    body: "Rondas de alteração, testes em dispositivos reais e lançamento com acompanhamento HAXR.",
  },
] as const;

export const convidadosFlow = [
  "A lista toma forma",
  "Cada convidado responde",
  "As confirmações ganham clareza",
  "Os lugares são definidos",
  "O convidado encontra o seu lugar",
  "A recepção flui com elegância",
] as const;

export const convidadosBenefits: readonly BenefitStory[] = [
  {
    title: "Confirmações sem incerteza",
    body: "Cada convidado recebe uma experiência personalizada de confirmação — e a equipa acompanha presenças e acompanhantes com clareza absoluta.",
    feeling: "Sabe exactamente quem vem — e quem ainda falta responder.",
  },
  {
    title: "Listas sob controlo",
    body: "Importação organizada e validação de dados — para que a base de convidados esteja limpa antes do grande dia.",
    feeling: "Organização desde a origem, não correcções de última hora.",
  },
  {
    title: "Sincronização elegante",
    body: "Para equipas que preferem folhas de cálculo, a sincronização com Google Sheets mantém todos alinhados sem perder precisão.",
    feeling: "Flexibilidade sem fragmentação.",
  },
  {
    title: "Lugares com intenção",
    body: "Mesas e lugares atribuídos com visão operacional — cada convidado no lugar certo, cada mesa com equilíbrio.",
    feeling: "A recepção pensada antes de abrir as portas.",
  },
  {
    title: "Encontro sem filas",
    body: "Na recepção, o convidado localiza o seu lugar pelo nome — discreto, rápido, memorável.",
    feeling: "Acolhimento que começa com elegância.",
  },
  {
    title: "Visibilidade no dia",
    body: "Registo de entrada em tempo real — a equipa conduz o evento com informação, não com suposições.",
    feeling: "Controlo operacional com calma.",
  },
  {
    title: "Materiais com assinatura",
    body: "QR codes e materiais impressos com curadoria editorial HAXR — coerentes com a identidade do evento.",
    feeling: "Cada detalhe visual reforça a experiência.",
  },
];

export const plataformaBenefits: readonly BenefitStory[] = [
  {
    title: "Cada evento, uma história viva",
    body: "Do planeamento à conclusão, cada projecto tem o seu percurso — visível, organizado e arquivado com memória.",
    feeling: "Nada se perde entre conversas e decisões.",
  },
  {
    title: "Clientes com contexto",
    body: "Cada cliente carrega o histórico dos seus eventos, documentos e contactos — para propostas e acompanhamento com profundidade.",
    feeling: "Relações construídas, não transacções isoladas.",
  },
  {
    title: "Propostas e documentos com rigor",
    body: "Proformas, facturas e recibos ligados a clientes e eventos — num fluxo comercial claro e profissional.",
    feeling: "Clareza financeira sem desvio de atenção.",
  },
  {
    title: "Controlo financeiro integral",
    body: "Pagamentos, despesas por categoria e margens — para que cada evento seja conduzido com visão económica real.",
    feeling: "Decisões informadas, não estimativas.",
  },
  {
    title: "Cada pedido, uma oportunidade",
    body: "Pedidos do website centralizados para resposta cuidadosa — porque cada história merece atenção individual.",
    feeling: "Nenhum contacto perdido na correria.",
  },
  {
    title: "Convidados integrados na operação",
    body: "Listas, confirmações, mesas e check-in no mesmo universo do evento — sem ferramentas desconectadas.",
    feeling: "Uma operação, uma verdade.",
  },
  {
    title: "Visão do todo",
    body: "Dashboard com eventos activos, indicadores e analítica — para conduzir a operação HAXR com excelência.",
    feeling: "A equipa vê o que importa, quando importa.",
  },
];

export const portfolioCategories = [
  { id: "todos", label: "Todos" },
  { id: "casamentos", label: "Casamentos" },
  { id: "corporativos", label: "Corporativos" },
  { id: "aniversarios", label: "Aniversários" },
  { id: "save-the-date", label: "Save the Date" },
  { id: "websites", label: "Websites" },
] as const;

export type PortfolioCategoryId = (typeof portfolioCategories)[number]["id"];

export const portfolioCategoryMap: Record<string, PortfolioCategoryId> = {
  Casamento: "casamentos",
  Casamentos: "casamentos",
  Noivado: "save-the-date",
  "Save the Date": "save-the-date",
  Corporativo: "corporativos",
  Corporativos: "corporativos",
  Privado: "aniversarios",
  Aniversários: "aniversarios",
};

export function filterPortfolioByCategory(
  items: PortfolioArchiveItem[],
  category: PortfolioCategoryId
): PortfolioArchiveItem[] {
  if (category === "todos") return items;
  return items.filter((item) => portfolioCategoryMap[item.category] === category);
}

export const insightsCategories = [
  {
    title: "A arte de organizar casamentos",
    desc: "Reflexões sobre planeamento, fornecedores e decisões que definem o grande dia.",
  },
  {
    title: "Confirmações com elegância",
    desc: "Como estruturar convites digitais e acompanhar presenças com discrição.",
  },
  {
    title: "A experiência do convidado",
    desc: "Do primeiro contacto ao acolhimento na recepção — cada etapa importa.",
  },
  {
    title: "Assessoria e presença",
    desc: "Porque a excelência operacional é o que permite viver o momento.",
  },
  {
    title: "Eventos corporativos de alto padrão",
    desc: "Identidade, operação e memória para marcas e instituições exigentes.",
  },
] as const;

export const areaClienteFuture = [
  "Cronograma partilhado em tempo real",
  "Documentos e contratos num só lugar",
  "Visibilidade financeira do projecto",
  "Aprovações com clareza e registo",
  "Acompanhamento de convidados",
] as const;

export const sobreBeliefs = [
  {
    title: "Porque existimos",
    body: "Acreditamos que eventos marcam histórias — e que cada detalhe importa na forma como essas histórias são vividas e lembradas.",
  },
  {
    title: "O que defendemos",
    body: "Organização e emoção não são opostos. Precisão nos bastidores é o que liberta a experiência à frente.",
  },
  {
    title: "Como trabalhamos",
    body: "Escuta, curadoria, direcção, gestão integral, execução e presença invisível — do primeiro contacto ao encerramento.",
  },
  {
    title: "Para quem criamos",
    body: "Para quem valoriza discrição, elegância e a certeza de que existe alguém a cuidar de tudo com excelência.",
  },
] as const;
