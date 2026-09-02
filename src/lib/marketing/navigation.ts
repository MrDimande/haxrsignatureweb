export type NavLink = {
  href: string;
  label: string;
  accent?: boolean;
  description?: string;
};

export type NavGroup = {
  id: string;
  label: string;
  links: readonly NavLink[];
};

export const navGroups: readonly NavGroup[] = [
  {
    id: "inspiracao",
    label: "Inspiração",
    links: [
      {
        href: "/portfolio",
        label: "Portfólio",
        description: "Experiências e trabalhos assinados HAXR.",
      },
      {
        href: "/experiencias",
        label: "Experiências",
        description: "Convites digitais interactivos e demonstrações ao vivo.",
      },
      {
        href: "/guias",
        label: "Guias Gratuitos",
        description: "Checklists e PDFs para planear com método.",
      },
      {
        href: "/insights",
        label: "Insights",
        description: "Guias editoriais para planeamento em Maputo.",
      },
      {
        href: "/style-quiz",
        label: "Style Quiz",
        description: "Descubra o estilo e o pacote HAXR mais adequado.",
      },
    ],
  },
  {
    id: "servicos",
    label: "Serviços",
    links: [
      {
        href: "/assessoria-eventos",
        label: "Assessoria",
        description: "Planeamento, curadoria e coordenação.",
      },
      {
        href: "/convites-identidade-visual",
        label: "Convites & Identidade",
        description: "Convites digitais e direcção visual.",
      },
      {
        href: "/plus-memories",
        label: "Plus Memories",
        description: "Desafios e álbum colectivo da celebração.",
      },
      {
        href: "/gestao-convidados",
        label: "Gestão de Convidados",
        description: "RSVP, lista, lugares e check-in no dia.",
      },
      {
        href: "/plataforma-eventos",
        label: "Plataforma HAXR",
        description: "Concierge, tecnologia e ecossistema do evento.",
      },
    ],
  },
  {
    id: "ferramentas",
    label: "Ferramentas",
    links: [
      {
        href: "/ferramentas",
        label: "Todas as Ferramentas",
        description: "Hub completo da plataforma HAXR.",
      },
      {
        href: "/tools/haxr-concierge",
        label: "HAXR Concierge",
        description: "Organiza propostas, recibos e inspiração automaticamente.",
      },
      {
        href: "/tools/guest-list",
        label: "Lista & RSVP",
        description: "Lista de convidados e confirmações de presença.",
      },
      {
        href: "/tools/vendor-manager",
        label: "Gestor de Fornecedores",
        description: "Contratos, contactos e pagamentos a fornecedores.",
      },
      {
        href: "/tools/budget-tracker",
        label: "Orçamento",
        description: "Despesas, sinais e controlo financeiro do evento.",
      },
      {
        href: "/tools/calculadora-bebidas-catering",
        label: "Calculadora de Bebidas",
        description: "Estime garrafas de vinho, cerveja, whisky, salgados e bolo.",
      },
      {
        href: "/tools/cronograma-casamento",
        label: "Cronograma do Grande Dia",
        description: "Timeline minuto a minuto dos preparativos à última música.",
      },
      {
        href: "/tools/simulador-layout-salao",
        label: "Simulador de Layout de Salão",
        description: "Calcule a área em m², mesas, pista de dança e buffet.",
      },
      {
        href: "/tools/wedding-checklist",
        label: "Checklist",
        description: "Cronograma e tarefas personalizadas por data.",
      },
      {
        href: "/tools/vision-boards",
        label: "Vision Boards",
        description: "Moodboards partilháveis com a equipa e fornecedores.",
      },
    ],
  },
];

export const navDirectLinks: readonly NavLink[] = [
  { href: "/fornecedores", label: "Fornecedores" },
  {
    href: "/convites-identidade-visual#pacotes",
    label: "Pacotes",
  },
];

export const navAccountLink: NavLink = {
  href: "/sign-in",
  label: "Entrar",
};

export const navCta: NavLink = {
  href: "/sign-up",
  label: "Get Started",
  accent: true,
};

/** @deprecated Usar navGroups — mantido para compatibilidade pontual */
export const primaryNav: NavLink[] = [
  { href: "/assessoria-eventos", label: "Assessoria" },
  { href: "/convites-identidade-visual", label: "Convites" },
  { href: "/plus-memories", label: "Plus Memories" },
  { href: "/gestao-convidados", label: "Convidados" },
  { href: "/plataforma-eventos", label: "Plataforma" },
  { href: "/tools/haxr-concierge", label: "Concierge" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/insights", label: "Insights" },
  { href: "/style-quiz", label: "Style Quiz" },
  { href: "/sobre", label: "Sobre" },
  { href: "/area-cliente", label: "Área do Cliente" },
  { href: "/contacto", label: "Contacto", accent: true },
];

export const footerNav: NavLink[] = [
  { href: "/assessoria-eventos", label: "Assessoria" },
  { href: "/convites-identidade-visual", label: "Convites" },
  { href: "/plus-memories", label: "Plus Memories" },
  { href: "/gestao-convidados", label: "Convidados" },
  { href: "/plataforma-eventos", label: "Plataforma" },
  { href: "/tools/haxr-concierge", label: "Concierge" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/insights", label: "Insights" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contacto", label: "Contacto" },
];

export const footerLegalNav: NavLink[] = [
  { href: "/insights", label: "Insights" },
];

export type FooterLinkGroup = {
  title: string;
  links: NavLink[];
};

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "Serviços",
    links: [
      { href: "/assessoria-eventos", label: "Assessoria de Eventos" },
      { href: "/convites-identidade-visual", label: "Convites e Identidade" },
      { href: "/plus-memories", label: "Plus Memories" },
      { href: "/gestao-convidados", label: "Gestão de Convidados" },
      { href: "/plataforma-eventos", label: "Plataforma HAXR" },
      {
        href: "/convites-identidade-visual#pacotes",
        label: "Pacotes e Preços",
      },
    ],
  },
  {
    title: "Ferramentas",
    links: [
      { href: "/ferramentas", label: "Hub de Ferramentas" },
      { href: "/tools/haxr-concierge", label: "HAXR Concierge" },
      { href: "/tools/guest-list", label: "Lista e RSVP" },
      { href: "/tools/calculadora-bebidas-catering", label: "Calculadora de Bebidas" },
      { href: "/tools/vendor-manager", label: "Gestor de Fornecedores" },
      { href: "/tools/budget-tracker", label: "Orçamento" },
      { href: "/tools/wedding-checklist", label: "Checklist" },
      { href: "/tools/vision-boards", label: "Vision Boards" },
    ],
  },
  {
    title: "Inspiração",
    links: [
      { href: "/portfolio", label: "Portfólio" },
      { href: "/experiencias", label: "Experiências" },
      { href: "/fornecedores", label: "Fornecedores" },
      { href: "/insights", label: "Insights" },
      { href: "/guias", label: "Guias Gratuitos" },
      { href: "/style-quiz", label: "Style Quiz" },
      { href: "/portfolio/submeter", label: "Submeter Casamento" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/area-cliente", label: "Área do Cliente" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacto", label: "Contacto" },
      { href: "/contacto?intent=fornecedor", label: "Para Profissionais" },
    ],
  },
];
