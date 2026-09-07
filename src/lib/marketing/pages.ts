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
    title: "Assessoria de Casamento",
    desc: "Acompanhamento completo, parcial e coordenação operacional para garantir tranquilidade e perfeição.",
    href: "/assessoria-eventos",
  },
  {
    num: "02",
    title: "Convites Digitais",
    desc: "Experiências digitais imersivas e personalizadas para anunciar o vosso grande dia aos convidados.",
    href: "/convites-identidade-visual",
  },
  {
    num: "03",
    title: "Save the Date",
    desc: "O primeiro gesto editorial. Comunique a vossa data com elegância, expectativa e design exclusivo.",
    href: "/convites-identidade-visual",
  },
  {
    num: "04",
    title: "RSVP",
    desc: "Confirmação de presença digitalizada e intuitiva, mantendo a vossa lista organizada e sob controlo.",
    href: "/gestao-convidados",
  },
  {
    num: "05",
    title: "Websites de Casamento",
    desc: "Presença online integrada com lista de presentes, mapas, cronograma e toda a informação para os vossos convidados.",
    href: "/convites-identidade-visual",
  },
  {
    num: "06",
    title: "Identidade Visual para Eventos",
    desc: "Direcção de arte completa, paletas de cores, tipografia e monogramas com uma linguagem contemporânea.",
    href: "/convites-identidade-visual",
  },
];

export const homeHowWeWork = [
  {
    phase: "01 · Conversa inicial",
    items: [
      "Escuta atenta da vossa visão e expectativas",
      "Alinhamento do perfil e propósito do evento",
      "Definição do nível de assessoria ideal",
    ],
  },
  {
    phase: "02 · Planeamento",
    items: [
      "Desenho de conceito estético e direccional",
      "Controlo de orçamento inicial transparente",
      "Cronograma detalhado com prazos e etapas",
    ],
  },
  {
    phase: "03 · Organização",
    items: [
      "Curadoria rigorosa de fornecedores e parceiros",
      "Negociação, análise de contratos e segurança",
      "Selecção e desenvolvimento de convites digitais",
    ],
  },
  {
    phase: "04 · Coordenação",
    items: [
      "Alinhamento final operacional de todos os parceiros",
      "Ensaios, confirmações finais de convidados",
      "Cronograma minucioso de montagem e timings",
    ],
  },
  {
    phase: "05 · Execução no grande dia",
    items: [
      "Supervisão cirúrgica de montagem e montras",
      "Presença invisível para resolução de imprevistos",
      "Coordenação de protocolo e timings para o casal",
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
        title: "Planeamento",
        body: "Estruturamos o projecto com objectivos, prioridades e marcos — para que cada decisão tenha contexto e cada etapa tenha sentido.",
      },
      {
        title: "Estratégia",
        body: "Definimos o tom, o perfil dos convidados e o nível de acompanhamento — alinhando visão, orçamento e ambição do evento.",
      },
      {
        title: "Orçamento",
        body: "Controlo financeiro transparente, com alinhamento contínuo — sem surpresas, sem fragmentação.",
      },
      {
        title: "Cronograma",
        body: "Cada etapa tem responsável, horário e margem — para que a semana do evento respire com tranquilidade.",
      },
      {
        title: "Fornecedores",
        body: "Espaços, catering, produção e parceiros seleccionados com critério absoluto. Nada entra por conveniência.",
      },
      {
        title: "Contratos",
        body: "Acordos, prazos e entregáveis acompanhados com rigor — para que a operação avance com segurança.",
      },
    ],
  },
  {
    phase: "Durante o evento",
    headline: "Presença invisível. Execução impecável.",
    items: [
      {
        title: "Coordenação",
        body: "A equipa HAXR conduz montagem, fornecedores e sequência — para que cada momento decorra como foi imaginado.",
      },
      {
        title: "Supervisão",
        body: "Imprevistos resolvidos longe do seu campo de visão. A complexidade permanece nos bastidores.",
      },
      {
        title: "Gestão operacional",
        body: "Fluxos, equipas e fornecedores alinhados em tempo real — para que nada dependa de improviso.",
      },
      {
        title: "Cerimonial",
        body: "Momentos-chave conduzidos com elegância — você vive a experiência, nós cuidamos do resto.",
      },
    ],
  },
  {
    phase: "Depois do evento",
    headline: "Encerramento com a mesma atenção do início.",
    items: [
      {
        title: "Encerramento",
        body: "Pagamentos, devoluções e fecho administrativo com o rigor que cada projecto merece.",
      },
      {
        title: "Relatórios",
        body: "Síntese do que foi executado — especialmente relevante para eventos corporativos e celebrações de grande dimensão.",
      },
      {
        title: "Avaliação",
        body: "Revisão cuidadosa do percurso, aprendizagens e próximos passos — para fechar o ciclo com memória e clareza.",
      },
    ],
  },
] as const;

export const convitesOfferings = [
  {
    title: "Save The Date",
    body: "O primeiro gesto editorial — data, tom e expectativa definidos com elegância.",
  },
  {
    title: "Convites digitais",
    body: "Experiências imersivas com música, galeria e confirmação integrada.",
  },
  {
    title: "Websites de casamento",
    body: "Presença digital coerente com a identidade do casal e do evento.",
  },
  {
    title: "Monogramas",
    body: "Assinatura visual exclusiva — do convite ao papel de mesa.",
  },
  {
    title: "Menus",
    body: "Composição editorial para cada momento da recepção.",
  },
  {
    title: "Seating charts",
    body: "Planos de mesa com curadoria estética e clareza operacional.",
  },
  {
    title: "Identidade visual completa",
    body: "Paleta, tipografia e linguagem visual unificadas em cada ponto de contacto.",
  },
] as const;

export const convidadosCapabilities = [
  { title: "RSVP", body: "Confirmações personalizadas com clareza para a equipa." },
  { title: "Find Your Seat", body: "O convidado encontra o lugar pelo nome, sem filas." },
  { title: "Check-in", body: "Presença registada em tempo real na recepção." },
  { title: "QR Codes", body: "Materiais impressos e digitais com assinatura HAXR." },
  { title: "Seating Plan", body: "Mesas e lugares definidos com visão operacional." },
  { title: "Gestão de listas", body: "Base de convidados organizada, validada e actualizada." },
  { title: "Google Sheets", body: "Sincronização elegante para equipas que trabalham em folha de cálculo." },
  { title: "Confirmações", body: "Visibilidade total sobre quem vem, quem falta e acompanhantes." },
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
    desc: "Planeamento, fornecedores e decisões que definem o grande dia — com método, não com sorte.",
  },
  {
    title: "Eventos corporativos de alto padrão",
    desc: "Identidade, operação e memória para marcas e instituições exigentes.",
  },
  {
    title: "Gestão de convidados com clareza",
    desc: "RSVP, listas, mesas e recepção — como estruturar cada etapa com discrição.",
  },
  {
    title: "Etiqueta e experiência do convidado",
    desc: "Do primeiro contacto ao acolhimento — cada gesto comunica o nível do evento.",
  },
  {
    title: "Tendências em convites digitais",
    desc: "O que muda na forma como comunicamos datas, dress codes e narrativas.",
  },
  {
    title: "Assessoria e tranquilidade",
    desc: "Porque organização nos bastidores é o que liberta a experiência à frente.",
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
