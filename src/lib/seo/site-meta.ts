/** URL canónica de produção (www — o apex redirecciona 308 para aqui na Vercel). */
export const DEFAULT_SITE_URL = "https://www.haxrsignature.com";

const LEGACY_SITE_HOSTS = new Set([
  "haxrsignature.vercel.app",
  "haxrsignature.com",
]);

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;

  try {
    const { origin, hostname } = new URL(raw.replace(/\/$/, ""));
    if (LEGACY_SITE_HOSTS.has(hostname)) return DEFAULT_SITE_URL;
    return origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = resolveSiteUrl();

export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ??
  "_GYFKaSxcMgPb8AHwDC3JVt-BD--GVdb0I_7n53yu9Y";

export const siteSeo = {
  name: "HAXR Signature",
  legalName: "HAXR Signature",
  tagline: "Assessoria, Design e Tecnologia para Eventos Exclusivos",
  locale: "pt_MZ",
  language: "pt-MZ",
  country: "MZ",
  city: "Maputo",
  title:
    "HAXR Signature | Assessoria de Eventos, Convites Digitais e Gestão de Convidados",
  titleTemplate: "%s | HAXR Signature",
  shortTitle: "HAXR Signature — Eventos, Convites e RSVP",
  description:
    "HAXR Signature — assessoria de eventos, convites digitais para casamentos, RSVP, Find Your Seat, check-in e gestão de convidados em Maputo, Moçambique. Organização premium para casamentos, lobolos e celebrações exclusivas.",
  ogDescription:
    "Assessoria de eventos, convites digitais, RSVP e Find Your Seat em Maputo. HAXR Signature — curadoria e tecnologia para casamentos e eventos exclusivos.",
  keywords: [
    "HAXR Signature",
    "assessoria de eventos",
    "assessoria de eventos Maputo",
    "assessoria de eventos Moçambique",
    "assessoria de casamentos",
    "assessoria de casamentos Maputo",
    "organização de casamentos",
    "organização de casamentos Maputo",
    "organização de eventos",
    "planeamento de eventos Maputo",
    "wedding planner Maputo",
    "wedding planner Moçambique",
    "event planner Maputo",
    "curadoria de eventos",
    "empresa de eventos Maputo",
    "convites digitais",
    "convites digitais Maputo",
    "convites digitais Moçambique",
    "convite digital",
    "convite digital casamento",
    "convite digital lobolo",
    "convite digital noivado",
    "criação de convites digitais",
    "convites digitais para casamento",
    "convite interativo casamento",
    "save the date",
    "save the date digital",
    "RSVP digital",
    "RSVP casamento",
    "confirmação de presença digital",
    "gestão de convidados",
    "gestão de convidados casamento",
    "lista de convidados digital",
    "find your seat",
    "find your seat casamento",
    "seating plan",
    "seating plan casamento",
    "plano de mesas casamento",
    "check-in eventos",
    "check-in QR code eventos",
    "coordenação de eventos",
    "coordenação no dia",
    "coordenação de casamentos",
    "casamento Maputo",
    "casamentos Maputo",
    "lobolo Maputo",
    "lobolo convite digital",
    "noivado convite digital",
    "eventos corporativos Maputo",
    "eventos exclusivos Maputo",
    "identidade visual eventos",
    "design de convites",
    "design de convites casamento",
  ],
  ogImage: {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "HAXR Signature — Convites digitais, assessoria e curadoria de eventos em Maputo, Moçambique",
  },
  twitterHandle: "@haxrsignature",
  category: "Curadoria de Eventos",
  services: [
    "Convites Digitais",
    "Identidade Visual",
    "Assessoria de Eventos",
    "Coordenação no Dia",
    "Experiências Personalizadas",
  ],
  serviceDetails: [
    {
      name: "Assessoria de Eventos",
      description:
        "Assessoria de eventos em Maputo — planeamento, fornecedores, orçamento e cronograma para casamentos, lobolos, corporativos e celebrações exclusivas.",
      url: "/assessoria-eventos",
    },
    {
      name: "Convites Digitais",
      description:
        "Criação de convites digitais premium para casamentos, lobolos, noivados e eventos em Maputo — com RSVP, save the date, localização, galeria e design personalizado.",
      url: "/convites-identidade-visual",
    },
    {
      name: "Gestão de Convidados",
      description:
        "RSVP digital, Find Your Seat, seating plan, check-in com QR Code e lista de convidados — gestão completa para casamentos e eventos em Maputo e Moçambique.",
      url: "/gestao-convidados",
    },
    {
      name: "Plataforma de Eventos",
      description:
        "Dashboard operacional HAXR — eventos, clientes, documentos, finanças e relatórios para equipas de eventos premium.",
      url: "/plataforma-eventos",
    },
    {
      name: "Identidade Visual",
      description:
        "Identidade visual para eventos exclusivos — convites, sinalização, materiais de mesa e linguagem estética coerente em Maputo e Moçambique.",
      url: "/convites-identidade-visual",
    },
    {
      name: "Coordenação no Dia",
      description:
        "Coordenação profissional no dia do evento em Maputo — montagem, fornecedores, cronograma e gestão discreta de imprevistos.",
      url: "/assessoria-eventos",
    },
  ],
  eventTypes: [
    "Casamentos",
    "Lobolos",
    "Noivados",
    "Aniversários",
    "Baptizados",
    "Graduações",
    "Eventos corporativos",
    "Galas",
  ],
} as const;

export function getGoogleVerificationFileName(): string {
  return `google${googleSiteVerification}.html`;
}

export function getGoogleVerificationFileContent(): string {
  const fileName = getGoogleVerificationFileName();
  return `google-site-verification: ${fileName}`;
}
