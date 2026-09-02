import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  CalendarDays,
  ClipboardList,
  FileText,
  Gift,
  Images,
  LayoutDashboard,
  Mail,
  Palette,
  QrCode,
  Receipt,
  Gem,
  Upload,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

export const homeHero = {
  label: "Maputo · Moçambique",
  headline: "A assinatura do vosso evento começa aqui.",
  subhead:
    "Assessoria, convites digitais e tecnologia para celebrações exclusivas em Moçambique.",
  ctaLabel: "Iniciar o projecto",
  secondaryLabel: "Ver experiências reais",
  secondaryHref: "/portfolio",
  undecidedLabel: "Ainda sem data definida",
  undecidedHref: "/contacto",
  imageAlt:
    "Momento íntimo de casamento — aliança e bouquet em celebração editorial",
} as const;

export const homeEventTypes = [
  { value: "casamento", label: "Casamento & Lobolo" },
  { value: "noivado", label: "Noivado" },
  { value: "corporativo", label: "Corporativo" },
  { value: "celebracao", label: "Outros Eventos" },
] as const;

export const homePlatformSection = {
  label: "Plataforma HAXR",
  headline: "A plataforma HAXR para planear o vosso evento com elegância.",
  description:
    "Organize convidados, confirmações, lugares, programa e experiência do evento num só lugar — com a discrição que a HAXR Signature exige.",
  bullets: [
    "RSVP digital com confirmações em tempo real",
    "Find Your Seat para acolhimento impecável na recepção",
    "Check-in QR e visão operacional no dia do evento",
    "Convite digital, galeria e dashboard integrados",
  ],
  ctaLabel: "Explorar plataforma",
  ctaHref: "/plataforma-eventos",
  secondaryLabel: "Pedir proposta",
  secondaryHref: "/contacto",
} as const;

export type ConciergeScenarioId =
  | "vendor_proposal"
  | "payment_receipt"
  | "guest_list"
  | "visual_reference"
  | "checklist";

export type ConciergeScenario = {
  id: ConciergeScenarioId;
  tabLabel: string;
  documentTypeLabel: string;
  title: string;
  status: string;
  fileHint: string;
  organizedModules: string;
  processingLabel: string;
  fields: ReadonlyArray<{ label: string; value: string; highlight?: boolean }>;
  extra?: ReadonlyArray<{ name: string; detail: string; meta?: string }>;
};

export const homeConciergeSection = {
  label: "HAXR Concierge",
  tagline: "O assistente inteligente que organiza cada detalhe do seu evento.",
  headline: "Conheça o HAXR Concierge",
  subheadline:
    "A inteligência que transforma documentos soltos em decisões organizadas.",
  description:
    "Encaminhe emails, carregue ficheiros e partilhe referências. O HAXR Concierge lê, classifica e organiza tudo no painel do seu evento — com validação da nossa equipa.",
  introLine:
    "A forma mais inteligente de organizar a caixa de entrada do seu evento.",
  benefits: [
    "Lê propostas de fornecedores",
    "Organiza recibos e pagamentos",
    "Estrutura listas de convidados",
    "Classifica referências visuais",
    "Sugere checklist do evento",
  ],
  supportCards: [
    "Fornecedores",
    "Orçamento",
    "Checklist",
    "Convidados",
    "Moodboard",
    "Documentos",
  ],
  trustLine: "O HAXR Concierge organiza. A equipa HAXR valida.",
  sentCardTitle: "Enviado para HAXR Concierge",
  organizedCardTitle: "Organizado em:",
  classifiedCardTitle: "Classificado como",
  validationNote: "Aguarda validação HAXR",
  setupCtaLabel: "Testar gratuitamente",
  setupCtaHref: "/tools/haxr-concierge",
  ctaLabel: "Testar gratuitamente",
  ctaHref: "/tools/haxr-concierge",
  projectCtaLabel: "Iniciar o meu projecto",
  projectCtaHref: "/contacto",
  secondaryCtaLabel: "Explorar a plataforma",
  secondaryCtaHref: "/plataforma-eventos",
  inputMethods: [
    {
      id: "upload",
      icon: Upload,
      title: "Carregar ficheiros",
      description: "PDF, Excel, imagem ou Word no painel do evento.",
      detail: "Propostas · Recibos · Listas",
    },
    {
      id: "email",
      icon: Mail,
      title: "Encaminhar por email",
      description: "Envie documentos para o endereço Concierge do evento.",
      detail: "concierge@haxrsignature.com",
    },
    {
      id: "paste",
      icon: FileText,
      title: "Colar ou importar",
      description: "Texto de WhatsApp, notas ou listas já existentes.",
      detail: "Convidados · Observações",
    },
  ],
  steps: [
    {
      num: "01",
      title: "Envie o que tiver em mãos",
      description:
        "Proposta, recibo, lista de convidados ou referência visual — no formato que já tiver.",
    },
    {
      num: "02",
      title: "O Concierge lê e classifica",
      description:
        "A IA identifica o tipo de documento e extrai os dados relevantes automaticamente.",
    },
    {
      num: "03",
      title: "Revê antes de gravar",
      description:
        "A equipa HAXR confirma, edita ou rejeita — nada entra no painel sem validação.",
    },
    {
      num: "04",
      title: "O painel actualiza-se",
      description:
        "Fornecedores, orçamento, convidados, moodboard e checklist ficam sincronizados.",
    },
  ],
  scenarios: [
    {
      id: "vendor_proposal",
      tabLabel: "Proposta",
      documentTypeLabel: "Proposta de Fornecedor",
      title: "Proposta de Decoração",
      status: "Em análise",
      fileHint: "PDF · Proposta recebida",
      organizedModules: "Fornecedores · Orçamento",
      processingLabel: "A extrair fornecedor e valor…",
      fields: [
        { label: "Fornecedor", value: "Não associado" },
        { label: "Valor proposto", value: "85.000 MT", highlight: true },
        { label: "Condições", value: "50% sinal · 50% até 7 dias antes" },
        {
          label: "Observações",
          value: "Flores naturais, montagem e desmontagem incluídas",
        },
      ],
    },
    {
      id: "payment_receipt",
      tabLabel: "Recibo",
      documentTypeLabel: "Comprovativo de Pagamento",
      title: "Sinal — Decoração",
      status: "Por validar",
      fileHint: "Imagem · M-Pesa",
      organizedModules: "Orçamento · Financeiro",
      processingLabel: "A registar pagamento…",
      fields: [
        { label: "Valor pago", value: "42.500 MT", highlight: true },
        { label: "Data", value: "12 Jun 2026" },
        { label: "Método", value: "M-Pesa" },
        { label: "Fornecedor", value: "Não associado" },
        { label: "Referência", value: "MP260612847391" },
      ],
    },
    {
      id: "guest_list",
      tabLabel: "Convidados",
      documentTypeLabel: "Lista de Convidados",
      title: "Importação — Família & Amigos",
      status: "12 registos",
      fileHint: "Excel · Lista recebida",
      organizedModules: "Convidados · RSVP · Find Your Seat",
      processingLabel: "A estruturar convidados…",
      fields: [
        { label: "Origem", value: "Excel partilhado por email" },
        { label: "Total", value: "48 convidados · 12 famílias", highlight: true },
        { label: "Pendentes RSVP", value: "23 sem confirmação" },
      ],
      extra: [
        { name: "Ana & Miguel Silva", detail: "Mesa 4", meta: "+1" },
        { name: "Família Nhantumbo", detail: "Mesa 2", meta: "+4" },
        { name: "Colegas Corporativos", detail: "Mesa 8", meta: "+6" },
      ],
    },
    {
      id: "visual_reference",
      tabLabel: "Inspiração",
      documentTypeLabel: "Referência Visual",
      title: "Paleta & Decoração de Mesa",
      status: "Classificado",
      fileHint: "Imagem · Pinterest",
      organizedModules: "Moodboard · Inspiração",
      processingLabel: "A classificar estilo visual…",
      fields: [
        { label: "Categoria", value: "Paleta · Mesa · Flores", highlight: true },
        { label: "Tom", value: "Champagne, marfim e dourado suave" },
        { label: "Tags", value: "Editorial · Romântico · Premium" },
      ],
      extra: [
        { name: "Centro de mesa", detail: "Velas altas + hortênsias" },
        { name: "Convite", detail: "Tipografia serifada em marfim" },
        { name: "Dress code", detail: "Paletó escuro · vestidos longos" },
      ],
    },
    {
      id: "checklist",
      tabLabel: "Checklist",
      documentTypeLabel: "Tarefas Sugeridas",
      title: "Checklist — Casamento Out 2026",
      status: "8 tarefas",
      fileHint: "IA · Sugestão automática",
      organizedModules: "Checklist · Prazos",
      processingLabel: "A sugerir próximos passos…",
      fields: [
        { label: "Evento", value: "Casamento · 18 Out 2026" },
        { label: "Prioridade", value: "3 tarefas urgentes", highlight: true },
      ],
      extra: [
        { name: "Aprovar convite digital", detail: "Até 1 Ago", meta: "Urgente" },
        { name: "Confirmar lista final", detail: "Até 15 Set" },
        { name: "Validar fornecedores", detail: "Em curso" },
        { name: "Preparar QR check-in", detail: "Até 10 Out" },
      ],
    },
  ] satisfies ReadonlyArray<ConciergeScenario>,
  moduleCards: [
    {
      id: "vendors",
      scenarioId: "vendor_proposal" as ConciergeScenarioId,
      icon: Gem,
      title: "Fornecedores",
      description:
        "Encaminhe uma proposta e o Concierge regista contacto, valor, condições e estado.",
    },
    {
      id: "budget",
      scenarioId: "payment_receipt" as ConciergeScenarioId,
      icon: Wallet,
      title: "Orçamento",
      description:
        "Recibos e comprovativos alimentam o controlo financeiro com método e referência.",
    },
    {
      id: "guests",
      scenarioId: "guest_list" as ConciergeScenarioId,
      icon: Users,
      title: "Convidados",
      description:
        "Listas em Excel ou texto são estruturadas para RSVP, mesas e check-in.",
    },
    {
      id: "moodboard",
      scenarioId: "visual_reference" as ConciergeScenarioId,
      icon: Palette,
      title: "Moodboard",
      description:
        "Imagens e referências visuais classificadas por estilo, paleta e categoria.",
    },
    {
      id: "checklist",
      scenarioId: "checklist" as ConciergeScenarioId,
      icon: ClipboardList,
      title: "Checklist",
      description:
        "Tarefas sugeridas com base na data, tipo de evento e serviços contratados.",
    },
    {
      id: "documents",
      scenarioId: "vendor_proposal" as ConciergeScenarioId,
      icon: Receipt,
      title: "Documentos",
      description:
        "Ficheiro original, extracção da IA e histórico de aprovação sempre guardados.",
    },
  ],
  heroBullets: [
    "Encaminhar para concierge@haxrsignature.com",
    "Carregar PDF, Excel ou imagens na página de teste",
    "A IA classifica — a equipa HAXR valida antes de gravar",
  ],
  editorialBlocks: [
    {
      id: "save-sort-plan",
      headline: "Guarde. Organize. Decida.",
      description:
        "Encaminhe emails, carregue ficheiros e partilhe referências sem interromper o planeamento. Tudo flui para um só lugar — exactamente quando precisa.",
      ctaLabel: "Testar gratuitamente",
    },
    {
      id: "organizes-all",
      headline: "IA que organiza. Equipa que valida.",
      description:
        "Cada email, recibo e ideia é classificado no momento em que chega. Fornecedores, orçamento, convidados e moodboard — mas nada entra no painel sem revisão humana da equipa HAXR.",
      ctaLabel: "Ver como funciona",
    },
  ],
  featureHighlights: [
    {
      id: "upload",
      title: "Carregue qualquer documento",
      description:
        "PDF, Excel, imagem ou Word — propostas, recibos e listas entram pela caixa de entrada do evento.",
      ctaLabel: "Organizar agora",
    },
    {
      id: "email",
      title: "Encaminhe para concierge@haxrsignature.com",
      description:
        "Envie propostas, orçamentos, recibos e listas de convidados. A IA lê e distribui pelas ferramentas certas.",
      ctaLabel: "Começar",
    },
    {
      id: "sync",
      title: "Painel sincronizado após validação",
      description:
        "Depois de validado, fornecedores, pagamentos, convidados e moodboard ficam sincronizados no painel HAXR.",
      ctaLabel: "Explorar fluxo",
    },
  ],
  inbox: {
    panelTitle: "Painel do Evento",
    title: "Rever o HAXR Concierge",
    subtitle: "Inbox HAXR Concierge",
    viewAllLabel: "Ver lista completa",
    tabs: ["Inbox", "Por rever", "Aprovados", "Histórico IA"],
    activeTab: "Por rever",
    emailPromo: {
      title: "Encaminhe documentos por email",
      text: "Transforme contratos, recibos, listas e referências num plano organizado. Encaminhe para concierge@haxrsignature.com e o Concierge ordena por si.",
      email: "concierge@haxrsignature.com",
      ctaLabel: "Copiar endereço",
    },
    items: [
      {
        id: "inbox-1",
        scenarioId: "vendor_proposal" as ConciergeScenarioId,
        title: "Proposta de decoração — sem fornecedor associado",
        type: "Proposta",
        time: "Há 12 min",
        status: "Por rever",
      },
      {
        id: "inbox-2",
        scenarioId: "payment_receipt" as ConciergeScenarioId,
        title: "Sinal M-Pesa — 42.500 MT",
        type: "Recibo",
        time: "Há 1 h",
        status: "Por rever",
      },
      {
        id: "inbox-3",
        scenarioId: "guest_list" as ConciergeScenarioId,
        title: "Lista Excel — 48 convidados",
        type: "Convidados",
        time: "Ontem",
        status: "Classificado",
      },
      {
        id: "inbox-4",
        scenarioId: "visual_reference" as ConciergeScenarioId,
        title: "Paleta champagne & dourado",
        type: "Inspiração",
        time: "Ontem",
        status: "Aprovado",
      },
      {
        id: "inbox-5",
        scenarioId: "checklist" as ConciergeScenarioId,
        title: "8 tarefas sugeridas — Out 2026",
        type: "Checklist",
        time: "2 dias",
        status: "Sugestão IA",
      },
    ],
  },
  integrationTools: [
    {
      id: "vendors",
      scenarioId: "vendor_proposal" as ConciergeScenarioId,
      title: "Fornecedores",
      description:
        "Encaminhe uma proposta de catering ou fotografia e o Concierge regista contacto, valor e condições.",
    },
    {
      id: "guests",
      scenarioId: "guest_list" as ConciergeScenarioId,
      title: "Convidados",
      description:
        "Envie uma lista em Excel e o Concierge estrutura nomes, contactos e grupos para RSVP e mesas.",
    },
    {
      id: "budget",
      scenarioId: "payment_receipt" as ConciergeScenarioId,
      title: "Orçamento",
      description:
        "Encaminhe um comprovativo ou factura e o Concierge regista valor, método e referência no financeiro.",
    },
    {
      id: "moodboard",
      scenarioId: "visual_reference" as ConciergeScenarioId,
      title: "Moodboard",
      description:
        "Guarde e classifique ideias visuais — decoração, convite, paleta e dress code num só lugar.",
    },
    {
      id: "checklist",
      scenarioId: "checklist" as ConciergeScenarioId,
      title: "Checklist",
      description:
        "Receba tarefas sugeridas com base na data do evento, tipo de celebração e serviços contratados.",
    },
  ],
  finalCta: {
    headline: "Planeie com calma. Celebre com foco.",
    description:
      "Encaminhe os documentos. Carregue as listas. Deixe o HAXR Concierge organizar o resto — com validação da nossa equipa em cada passo.",
    ctaLabel: "Iniciar o meu projecto",
  },
  flowHeadline: "Como funciona o HAXR Concierge",
  flowDescription:
    "Cada documento segue o mesmo fluxo: entrada, classificação, revisão humana e actualização do painel.",
  modulesHeadline: "Cada documento no módulo certo",
  modulesDescription:
    "Cada tipo de informação flui para o módulo certo — sempre com revisão humana antes de gravar.",
} as const;

export type HomeTool = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const homeTools: readonly HomeTool[] = [
  {
    id: "rsvp",
    title: "RSVP Digital",
    description:
      "Confirmações elegantes com experiência personalizada para cada convidado.",
    href: "/gestao-convidados",
    icon: UserCheck,
  },
  {
    id: "guest-list",
    title: "Lista de Convidados",
    description:
      "Importação, grupos e visão clara — organização sem folhas dispersas.",
    href: "/tools/guest-list",
    icon: ClipboardList,
  },
  {
    id: "find-seat",
    title: "Find Your Seat",
    description:
      "O convidado encontra o lugar pelo nome, com discrição na recepção.",
    href: "/gestao-convidados",
    icon: Armchair,
  },
  {
    id: "checkin",
    title: "Check-in Digital",
    description:
      "Presença registada em tempo real para conduzir o evento com calma.",
    href: "/gestao-convidados",
    icon: QrCode,
  },
  {
    id: "program",
    title: "Programa do Evento",
    description:
      "Cronograma interactivo partilhado com convidados e equipa no convite.",
    href: "/convites-identidade-visual",
    icon: CalendarDays,
  },
  {
    id: "gallery",
    title: "Galeria",
    description:
      "Memórias visuais curadas no convite digital — estética editorial HAXR.",
    href: "/convites-identidade-visual",
    icon: Images,
  },
  {
    id: "gifts",
    title: "Página de Presentes",
    description:
      "Espaço discreto para donativos e presentes, integrado na experiência.",
    href: "/tools/cash-registry/setup",
    icon: Gift,
  },
  {
    id: "dashboard",
    title: "Dashboard do Evento",
    description:
      "Indicadores, convidados e operação num ecossistema próprio HAXR.",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

export const homeServices = [
  {
    num: "01",
    title: "Assessoria de Eventos",
    desc: "Planeamento, curadoria e acompanhamento para celebrar com clareza e elegância.",
    href: "/assessoria-eventos",
  },
  {
    num: "02",
    title: "Convites & Identidade",
    desc: "O primeiro contacto com a experiência — design digital e linguagem visual coerente.",
    href: "/convites-identidade-visual",
  },
  {
    num: "03",
    title: "Gestão de Convidados",
    desc: "RSVP, lista, lugares e check-in — operação fluida até ao dia do evento.",
    href: "/gestao-convidados",
  },
  {
    num: "04",
    title: "Experiências Assinadas",
    desc: "Propostas exclusivas para momentos que exigem conceito, estética e atenção ao detalhe.",
    href: "/portfolio",
  },
] as const;

export const homeToolsSection = {
  label: "Ferramentas",
  headline: "Ferramentas digitais para cada etapa do vosso evento.",
  description:
    "Incluídas nos nossos serviços — pensadas para tranquilidade, clareza e operação premium.",
  ctaLabel: "Ver todas as capacidades",
  ctaHref: "/ferramentas",
} as const;

export const homeServicesSection = {
  label: "Serviços",
  headline: "Curadoria, design e operação com assinatura HAXR.",
  description:
    "Do convite à coordenação no dia — cada serviço pensado para eventos exclusivos em Maputo.",
} as const;
