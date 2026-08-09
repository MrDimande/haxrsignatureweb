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
        href: "/fornecedores",
        label: "Fornecedores",
        description: "Diretório curado dos melhores profissionais em Maputo.",
      },
      {
        href: "/insights",
        label: "Insights",
        description: "Guias editoriais para planeamento em Maputo.",
      },
      {
        href: "/experiencias/casamento-vania-fabiao",
        label: "Experiências",
        description: "Convites digitais e casos reais.",
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
        href: "/gestao-convidados",
        label: "Gestão de Convidados",
        description: "RSVP, lista, lugares e check-in.",
      },
      {
        href: "/plataforma-eventos",
        label: "Plataforma",
        description: "Ecossistema digital para o seu evento.",
      },
    ],
  },
  {
    id: "ferramentas",
    label: "Ferramentas",
    links: [
      {
        href: "/gestao-convidados",
        label: "RSVP Digital",
        description: "Confirmações elegantes e organizadas.",
      },
      {
        href: "/gestao-convidados",
        label: "Find Your Seat",
        description: "Localização de lugares na recepção.",
      },
      {
        href: "/gestao-convidados",
        label: "Lista de Convidados",
        description: "Gestão completa da lista.",
      },
      {
        href: "/gestao-convidados",
        label: "Check-in QR",
        description: "Registo de presença no dia.",
      },
    ],
  },
];

export const navDirectLinks: readonly NavLink[] = [
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/portfolio", label: "Eventos Reais" },
  {
    href: "/convites-identidade-visual#pacotes",
    label: "Pacotes",
  },
];

export const navCta: NavLink = {
  href: "/sign-up",
  label: "Get Started",
  accent: true,
};

/** @deprecated Usar navGroups — mantido para compatibilidade pontual */
export const primaryNav: NavLink[] = [
  { href: "/assessoria-eventos", label: "Assessoria" },
  { href: "/convites-identidade-visual", label: "Convites" },
  { href: "/gestao-convidados", label: "Convidados" },
  { href: "/plataforma-eventos", label: "Plataforma" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/insights", label: "Insights" },
  { href: "/area-cliente", label: "Área do Cliente" },
  { href: "/contacto", label: "Contacto", accent: true },
];

export const footerNav: NavLink[] = [
  { href: "/assessoria-eventos", label: "Assessoria" },
  { href: "/convites-identidade-visual", label: "Convites" },
  { href: "/gestao-convidados", label: "Convidados" },
  { href: "/plataforma-eventos", label: "Plataforma" },
  { href: "/portfolio", label: "Portfólio" },
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
      { href: "/gestao-convidados", label: "Gestão de Convidados" },
      { href: "/plataforma-eventos", label: "Plataforma HAXR" },
    ],
  },
  {
    title: "Experiências",
    links: [
      { href: "/portfolio", label: "Portfólio" },
      { href: "/insights", label: "Insights" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/area-cliente", label: "Portal Exclusivo" },
    ],
  },
];
