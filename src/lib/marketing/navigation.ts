export type NavLink = {
  href: string;
  label: string;
  accent?: boolean;
};

export const primaryNav: NavLink[] = [
  { href: "/assessoria-eventos", label: "Assessoria" },
  { href: "/convites-identidade-visual", label: "Convites" },
  { href: "/gestao-convidados", label: "Convidados" },
  { href: "/plataforma", label: "Plataforma" },
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
  { href: "/plataforma", label: "Plataforma" },
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
      { href: "/plataforma", label: "Plataforma HAXR" },
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
