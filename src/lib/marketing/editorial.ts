/** Diretriz editorial HAXR — narrativa, não catálogo */
import { portfolioAssets } from "@/lib/assets";
import { getDemoById } from "@/lib/demos/catalog";

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
    "A Plataforma HAXR — extensão da assessoria, não um produto à parte. Organização integral para eventos, convidados, fornecedores, contratos e documentos.",
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
    "O Portal Exclusivo HAXR — uma evolução natural da relação, onde cronograma, documentos e decisões partilhadas encontrarão lugar.",
  feelingAfter:
    "A tranquilidade de um acompanhamento contínuo — hoje pela equipa, amanhã num espaço dedicado à sua experiência.",
};

export const haxrStandardPillars = [
  {
    num: "01",
    title: "Independência & Transparência",
    subtitle: "Padrão de Lealdade Exclusiva",
    description:
      "A HAXR não aceita comissões ocultas ou kickbacks de fornecedores. Qualquer negociação e poupança obtida em benefício do evento pertence 100% ao casal.",
  },
  {
    num: "02",
    title: "Direcção Criativa Autoral",
    subtitle: "Estética com Intenção",
    description:
      "Cada casamento possui uma identidade singular. Desenhamos o conceito visual, a iluminação cenográfica, a acústica e a paleta de texturas como um projeto de alta-costura.",
  },
  {
    num: "03",
    title: "Engenharia & Comando Invisível",
    subtitle: "Presença Serena nos Bastidores",
    description:
      "Assumimos a complexidade operacional com tranquilidade. Planos de contingência técnica, geradores, climatização e logística de convidados rigorosamente ensaiados.",
  },
] as const;

export interface AssessoriaScope {
  id: string;
  num: string;
  name: string;
  nameEn: string;
  badge: string;
  tagline: string;
  deliverables: string[];
  idealFor: string;
}

export const assessoriaScopes: AssessoriaScope[] = [
  {
    id: "full-service",
    num: "I",
    name: "Assessoria Completa & Direcção Criativa",
    nameEn: "Full-Service Planning & Creative Direction",
    badge: "Acompanhamento Integral",
    tagline:
      "Para noivos que desejam delegação integral, curadoria de raiz e direção de arte do primeiro dia ao encerramento.",
    deliverables: [
      "Direção criativa & desenvolvimento de conceito visual exclusivo",
      "Engenharia orçamental contínua com The Wedding Financial Book (.xlsx)",
      "Curadoria rigorosa, negociação e blindagem contratual de fornecedores",
      "Planta cenográfica 2D/3D, paleta de texturas e styling floral",
      "Gestão completa de convidados, RSVP digital e mapa de lugares",
      "Direção de ensaios de cerimónia e comando operacional no dia",
    ],
    idealFor:
      "Celebrações onde o casal procura dedicação total, serenidade emocional e zero sobrecarga logística.",
  },
  {
    id: "spatial-design",
    num: "II",
    name: "Direcção Criativa, Cenografia & Gestão de Produção",
    nameEn: "Creative Direction, Spatial Design & Production Management",
    badge: "Design & Produção Técnica",
    tagline:
      "Para noivos que já possuem local ou parceiros base, mas exigem direção artística autoral, projeto floral e gestão técnica de fornecedores.",
    deliverables: [
      "Conceito cenográfico imersivo, iluminação arquitetural e paleta estética",
      "Curadoria de arte floral, mobiliário, toalharia e loiça de alta linha",
      "Validação técnica de riders de som, luz, estruturas e geradores",
      "Supervisão minuciosa de montagem, cronograma técnico e ensaios",
      "Acompanhamento estético presencial no dia do casamento",
    ],
    idealFor:
      "Casamentos com forte componente visual e estrutural que necessitam de liderança criativa e supervisão técnica de parceiros.",
  },
  {
    id: "run-of-show",
    num: "III",
    name: "Coordenação Executiva · Reta Final & Dia-D",
    nameEn: "Executive Run-of-Show & Day-Of Coordination",
    badge: "Governação Operacional",
    tagline:
      "A HAXR assume a governação operacional na fase final definida após diagnóstico do evento.",
    deliverables: [
      "Auditoria executiva de contratos e cronograma mestre de timings",
      "Reunião de alinhamento técnico com todos os fornecedores contratados",
      "Ensaio geral de cortejo, protocolo e alinhamento com celebrante",
      "Supervisão cirúrgica de montagem, recepção de convidados e cortejo",
      "Equipa sênior de bastidores dedicada à tranquilidade dos noivos",
    ],
    idealFor:
      "Noivos que organizaram o planeamento de forma autónoma e exigem comando experiente na reta final e no grande dia.",
  },
];

export const signatureJourneyPhases = [
  {
    phase: "Fase 01",
    title: "Visão & Conceito",
    titleEn: "Vision & Concept Architecture",
    description:
      "Diagnóstico de estilo, alinhamento de expectativas, definição da atmosfera visual e narrativa que guiará cada elemento do casamento.",
    items: [
      "Sessão de diagnóstico criativo",
      "Desenho de moodboards e narrativa",
      "Definição do perfil e escala do evento",
    ],
  },
  {
    phase: "Fase 02",
    title: "Arquitetura Financeira",
    titleEn: "Financial Architecture & Curating",
    description:
      "Fixação do teto orçamental, contratação com blindagem contratual e curadoria criteriosa dos melhores fornecedores de Moçambique.",
    items: [
      "The Wedding Financial Book (.xlsx)",
      "Análise e negociação de propostas",
      "Blindagem jurídica de contratos",
    ],
  },
  {
    phase: "Fase 03",
    title: "Produção Criativa & Cenografia",
    titleEn: "Creative Production & Spatial Design",
    description:
      "Desenho de plantas, fluxo de convidados, iluminação cenográfica, degustações gastronómicas e amostras reais de mesa.",
    items: [
      "Layout espacial e fluxo de circulação",
      "Degustação de menu e harmonização",
      "Amostra de styling floral e iluminação",
    ],
  },
  {
    phase: "Fase 04",
    title: "Experiência de Convidados",
    titleEn: "Guest Experience & Protocol",
    description:
      "Gestão de confirmações em tempo real, acompanhamento de restrições alimentares, mapa de mesas e acolhimento com discrição.",
    items: [
      "Live RSVP e controle de presenças",
      "Gestão de lugares e restrições",
      "Protocolo de recepção e check-in",
    ],
  },
  {
    phase: "Fase 05",
    title: "Execução & Comando no Grande Dia",
    titleEn: "Master Execution & Run-of-Show",
    description:
      "Montagem milimétrica, comando de bastidores, sincronização de cortejo e presença invisível para que o casal viva apenas o momento.",
    items: [
      "Comando de montagem e fornecedores",
      "Sincronização de cortejo e timings",
      "Resolução serena de qualquer imprevisto",
    ],
  },
] as const;

export function getCaseStudyForDemo(demoId: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.id === demoId);
}

export const caseStudies: CaseStudy[] = [
  {
    id: "casamento-leila-armando",
    title: "Leila & Armando",
    category: "Assessoria Integral",
    context:
      "Casamento no Catembe Gallery Hotel, Maputo, com 200 convidados e desafios de logística costeira, cenografia ao ar livre e múltiplos momentos musicais.",
    challenge:
      "Coordenar fornecedores de alta complexidade (catering, som, iluminação arquitetural e floristas) mantendo rigoroso controlo financeiro e fluidez para os noivos.",
    solution:
      "Direção criativa HAXR de ponta a ponta, governança fiduciária através do The Wedding Financial Book, RSVP em tempo real e comando de bastidores no dia.",
    result:
      "Execução cronometrada ao minuto, zero custos imprevistos e tranquilidade absoluta para o casal do cortejo ao encerramento.",
    image: portfolioAssets.casamentoSignature,
  },
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
    image: portfolioAssets.casamentoSignature,
    href: getDemoById("casamento-vania-fabiao")?.publicPath,
    external: false,
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
    image: portfolioAssets.saveTheDate,
    href: getDemoById("save-the-date-jessica-samuel")?.publicPath,
    external: false,
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
    image: portfolioAssets.celebracaoPrivada,
  },
];
