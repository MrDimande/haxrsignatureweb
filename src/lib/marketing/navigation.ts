export type NavLink = {
  href: string;
  label: string;
  accent?: boolean;
};

export const primaryNav: NavLink[] = [
  { href: "/assessoria-eventos", label: "Assessoria" },
  { href: "/convites-identidade-visual", label: "Convites" },
  { href: "/gestao-convidados", label: "Convidados" },
  { href: "/plataforma-eventos", label: "Ecossistema" },
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
  { href: "/plataforma-eventos", label: "Ecossistema" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contacto", label: "Contacto" },
];

export const footerLegalNav: NavLink[] = [
  { href: "/insights", label: "Insights" },
  { href: "/area-cliente", label: "Área do Cliente" },
];
