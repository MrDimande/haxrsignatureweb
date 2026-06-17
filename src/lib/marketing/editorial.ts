/** Diretriz editorial HAXR — narrativa, não catálogo */

export type PageNarrative = {
  problem: string;
  emotionalImpact: string;
  solution: string;
  feelingAfter: string;
};

export type BenefitStory = {
  title: string;
  body: string;
  feeling?: string;
};

export type CaseStudy = {
  id: string;
  title: string;
  category: string;
  context: string;
  challenge: string;
  solution: string;
  result: string;
  image: string;
  href?: string;
  external?: boolean;
};

export const brandEssence = {
  homeHeadline:
    "Tranquilidade, elegância e precisão — para eventos que merecem ser lembrados.",
  homeIntro:
    "A HAXR Signature não vende serviços. Curamos experiências onde cada detalhe tem intenção, cada decisão tem propósito e cada momento encontra quem sabe conduzi-lo.",
  pillarsHeadline: "Um universo cuidadosamente curado.",
  pillarsIntro:
    "Quatro dimensões da mesma assinatura — para que o seu evento seja vivido com discrição, não gerido com ansiedade.",
} as const;

export const assessoriaNarrative: PageNarrative = {
  problem:
    "Organizar um evento de excelência exige dezenas de decisões simultâneas — fornecedores, prazos, orçamento, convidados, imprevistos.",
  emotionalImpact:
    "A sensação de estar sempre a apagar fogos, sem tempo para viver a antecipação do momento.",
  solution:
    "Direcção estratégica e operacional HAXR — uma equipa que assume a complexidade com método, discrição e presença no dia.",
  feelingAfter:
    "A tranquilidade de saber que existe alguém a cuidar de tudo por si — para que entre na experiência, não na logística.",
};

export const convitesNarrative: PageNarrative = {
  problem:
    "O evento ainda não aconteceu — mas a primeira impressão já está a ser formada.",
  emotionalImpact:
    "A ansiedade de comunicar elegância num mundo digital ruidoso, sem perder identidade nem calor humano.",
  solution:
    "Uma linguagem visual e narrativa que antecipa a atmosfera do evento — do save the date ao convite, cada ponto de contacto é curado.",
  feelingAfter:
    "Os convidados sentem, antes de chegar, que algo especial os espera — e o tom do grande dia fica definido desde o primeiro clique.",
};

export const convidadosNarrative: PageNarrative = {
  problem:
    "Centenas de nomes, confirmações dispersas, mesas por definir e recepção sem visibilidade.",
  emotionalImpact:
    "A incerteza de não saber quem vem, quem falta e como cada pessoa será recebida no dia.",
  solution:
    "Controlo elegante de ponta a ponta — confirmações, lugares e acolhimento pensados com a mesma precisão da assessoria.",
  feelingAfter:
    "Clareza absoluta: sabe quem confirmou, quem falta, onde cada convidado ficará e como será recebido.",
};

export const plataformaNarrative: PageNarrative = {
  problem:
    "Eventos premium não podem depender de folhas soltas, mensagens perdidas e informação fragmentada.",
  emotionalImpact:
    "A fragilidade de uma operação que parece organizada — até o dia em que um detalhe escapa.",
  solution:
    "Um ecossistema operacional próprio, invisível para o convidado, que sustenta cada decisão da equipa HAXR com rigor e memória.",
  feelingAfter:
    "A confiança de uma operação que funciona nos bastidores — para que a experiência à frente permaneça impecável.",
};

export const portfolioNarrative: PageNarrative = {
  problem: "Cada evento é único — e merece ser contado com a profundidade que teve na execução.",
  emotionalImpact:
    "A dificuldade de perceber, à distância, se quem promete excelência realmente a entrega.",
  solution:
    "Histórias reais — contexto, desafio, curadoria HAXR e o que ficou na memória.",
  feelingAfter:
    "A certeza de que está perante uma marca que já viveu o que promete criar para si.",
};

export const sobreNarrative: PageNarrative = {
  problem:
    "Eventos marcam histórias — mas são frágeis quando organização e emoção não coexistem.",
  emotionalImpact:
    "O medo de que o dia mais importante seja consumido pela logística, não pela celebração.",
  solution:
    "A HAXR existe para unir curadoria estética, precisão operacional e tecnologia discreta — numa só assinatura.",
  feelingAfter:
    "A convicção de que cada detalhe importa — e que alguém o defende com a mesma intensidade que você.",
};

export const contactoNarrative: PageNarrative = {
  problem: "Cada evento começa com uma história por contar — e merece ser ouvida com atenção.",
  emotionalImpact:
    "A hesitação de partilhar algo tão pessoal com quem ainda não conhece.",
  solution:
    "Um primeiro contacto humano, discreto e cuidadoso — por WhatsApp, email ou presencialmente em Maputo.",
  feelingAfter:
    "A sensação de que está entre mãos que compreendem a dimensão do que está a planear.",
};

export const areaClienteNarrative: PageNarrative = {
  problem:
    "Clientes HAXR merecem acompanhar o seu evento com a mesma clareza com que a equipa o conduz.",
  emotionalImpact:
    "A distância entre o que acontece nos bastidores e o que o cliente consegue visualizar.",
  solution:
    "Um ecossistema em evolução — onde cronograma, documentos e decisões partilhadas encontrarão lugar.",
  feelingAfter:
    "A tranquilidade de um acompanhamento contínuo — hoje pela equipa, amanhã num espaço dedicado.",
};

export const caseStudies: CaseStudy[] = [
  {
    id: "casamento-vania-fabiao",
    title: "Vânia & Fabiao",
    category: "Casamentos",
    context:
      "Casamento em Maputo com visão de uma experiência digital que definisse o tom de toda a celebração.",
    challenge:
      "Criar um convite que fosse mais do que informação — uma narrativa imersiva, elegante e funcional no telemóvel.",
    solution:
      "Convite digital Signature com identidade própria, música, confirmação de presença e curadoria editorial HAXR.",
    result:
      "Os convidados falaram do convite durante semanas. A experiência digital antecipou a fluidez do dia do casamento.",
    image: "/images/convite-mockup-vania-fabiao.png",
    href: "https://casamento-vania-fabiao.vercel.app/",
    external: true,
  },
  {
    id: "save-the-date-jessica-samuel",
    title: "Jessica & Samuel",
    category: "Save the Date",
    context:
      "Primeiro gesto antes do grande dia — um save the date com tom editorial e confirmação integrada.",
    challenge:
      "Comunicar data, dress code e narrativa do casal numa experiência leve, memorável e partilhável.",
    solution:
      "Save the date em capítulos, referências visuais de dress code e RSVP integrado — assinatura Royal HAXR.",
    result:
      "O primeiro contacto com os convidados estabeleceu expectativa, tom e elegância antes de qualquer outro detalhe.",
    image: "/images/save-the-date-jessica-samuel-preview.png",
    href: "https://jessica-samuel-save-the-date.vercel.app/",
    external: true,
  },
  {
    id: "corporativo",
    title: "Evento Corporativo",
    category: "Corporativos",
    context:
      "Marca institucional que precisava de comunicar exclusividade num evento de alto perfil.",
    challenge:
      "Traduzir identidade corporativa em linguagem visual coerente — do convite à recepção.",
    solution:
      "Identidade visual e convite digital alinhados à marca, com curadoria HAXR de ponta a ponta.",
    result:
      "Uma experiência que reflectiu o posicionamento da organização — antes, durante e após o evento.",
    image: "/images/archive-03.webp",
  },
  {
    id: "celebracao-privada",
    title: "Celebração Privada",
    category: "Aniversários",
    context:
      "Celebração íntima com exigência estética e necessidade de acompanhamento próximo.",
    challenge:
      "Equilibrar discrição, personalização e rigor operacional num evento de dimensão contida.",
    solution:
      "Assessoria e curadoria HAXR — do conceito à execução, com atenção ao detalhe em cada etapa.",
    result:
      "Um evento vivido com leveza pelo cliente, conduzido com precisão nos bastidores.",
    image: "/images/archive-01.webp",
  },
];
