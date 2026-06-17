import type { Metadata } from "next";
import {
  invitationFaqs,
  portfolioCopy,
  siteContact,
} from "@/lib/site-config";
import { marketingPillars } from "@/lib/marketing/pages";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://haxrsignature.com";

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
    "HAXR Signature | Assessoria, Design e Tecnologia para Eventos em Maputo",
  titleTemplate: "%s | HAXR Signature",
  shortTitle: "HAXR Signature — Assessoria, Design & Tecnologia",
  description:
    "Assessoria de eventos, convites digitais, gestão de convidados e plataforma operacional premium em Maputo, Moçambique. Curadoria com assinatura HAXR para casamentos, corporativos e celebrações exclusivas.",
  ogDescription:
    "Assessoria, identidade visual, RSVP, seating e gestão de eventos em Maputo. Tecnologia e curadoria com assinatura HAXR.",
  keywords: [
    "HAXR Signature",
    // Convites digitais
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
    "confirmação de presença digital",
    // Assessoria e planeamento
    "assessoria de eventos",
    "assessoria de eventos Maputo",
    "assessoria de eventos Moçambique",
    "assessoria de casamentos",
    "assessoria de casamentos Maputo",
    "planeamento de eventos",
    "planeamento de eventos Maputo",
    "organização de casamentos Maputo",
    "empresa de eventos Maputo",
    "wedding planner Maputo",
    "wedding planner Moçambique",
    "event planner Maputo",
    // Curadoria
    "curadoria de eventos",
    "curadoria de eventos exclusivos",
    "curadoria de casamentos",
    // Tipos de evento
    "casamento Maputo",
    "casamentos Maputo",
    "lobolo Maputo",
    "lobolo convite digital",
    "noivado convite digital",
    "eventos corporativos Maputo",
    "eventos exclusivos Maputo",
    "eventos exclusivos Moçambique",
    // Serviços complementares
    "coordenação de eventos",
    "coordenação no dia",
    "coordenação de casamentos",
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
  /** Descrições SEO para JSON-LD e motores de busca */
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
        "RSVP digital, seating plan, Find Your Seat, check-in e QR codes — gestão completa de convidados para eventos em Moçambique.",
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

export function buildSiteMetadata(overrides?: Partial<Metadata>): Metadata {
  const { name, title, description, ogDescription, keywords, ogImage, locale } =
    siteSeo;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: siteSeo.titleTemplate,
    },
    description,
    keywords: [...keywords],
    applicationName: name,
    authors: [{ name, url: siteUrl }],
    creator: name,
    publisher: name,
    category: siteSeo.category,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
      languages: {
        "pt-MZ": "/",
      },
    },
    openGraph: {
      type: "website",
      locale,
      url: siteUrl,
      siteName: name,
      title,
      description: ogDescription,
      images: [
        {
          url: ogImage.url,
          width: ogImage.width,
          height: ogImage.height,
          alt: ogImage.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      creator: siteSeo.twitterHandle,
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon.png", type: "image/png", sizes: "192x192" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: [
        {
          url: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
      shortcut: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
    verification: {
      google: googleSiteVerification,
    },
    other: {
      "geo.region": "MZ-MPM",
      "geo.placename": `${siteSeo.city}, Moçambique`,
      "geo.position": "-25.9653;32.5892",
      ICBM: "-25.9653, 32.5892",
      "content-language": "pt-MZ",
    },
    ...overrides,
  };
}

type JsonLd = Record<string, unknown>;

export function buildStructuredData(): JsonLd[] {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const webpageId = `${siteUrl}/#webpage`;

  const organization: JsonLd = {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService", "EventPlanner"],
    "@id": organizationId,
    name: siteSeo.name,
    legalName: siteSeo.legalName,
    url: siteUrl,
    logo: `${siteUrl}/images/brand/logo-horizontal-gold.png`,
    image: `${siteUrl}${siteSeo.ogImage.url}`,
    description: siteSeo.description,
    slogan: siteSeo.tagline,
    email: siteContact.email,
    telephone: siteContact.phones.map((p) => p.tel),
    sameAs: [siteContact.instagram.href, siteContact.whatsapp.href],
    areaServed: [
      { "@type": "City", name: "Maputo" },
      { "@type": "Country", name: "Moçambique" },
    ],
    knowsLanguage: ["pt-MZ"],
    knowsAbout: [
      "Assessoria de eventos",
      "Convites digitais",
      "Casamentos",
      "Lobolos",
      "Save the date",
      "RSVP digital",
      "Coordenação de eventos",
      "Curadoria de eventos",
    ],
    priceRange: "$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Julius Nyerere, 119, Polana Canico 'B'",
      addressLocality: "Maputo",
      addressRegion: "Cidade de Maputo",
      addressCountry: "MZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: -25.9653,
      longitude: 32.5892,
    },
    hasMap: siteContact.mapsHref,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "atendimento ao cliente",
        telephone: siteContact.phones[0]?.tel,
        email: siteContact.email,
        availableLanguage: ["Português (Moçambique)", "pt-MZ"],
        areaServed: "MZ",
      },
    ],
    makesOffer: siteSeo.serviceDetails.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        url: `${siteUrl}${service.url}`,
        provider: { "@id": organizationId },
        areaServed: [
          { "@type": "City", name: "Maputo" },
          { "@type": "Country", name: "Moçambique" },
        ],
        availableLanguage: "pt-MZ",
        serviceType: service.name,
      },
    })),
  };

  const website: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: siteUrl,
    name: siteSeo.name,
    description: siteSeo.description,
    inLanguage: siteSeo.language,
    publisher: { "@id": organizationId },
  };

  const webpage: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": webpageId,
    url: siteUrl,
    name: siteSeo.title,
    description: siteSeo.description,
    isPartOf: { "@id": websiteId },
    about: { "@id": organizationId },
    inLanguage: siteSeo.language,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${siteUrl}${siteSeo.ogImage.url}`,
    },
  };

  const serviceList: JsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Serviços HAXR Signature em Maputo",
    description: portfolioCopy.universo.areas,
    inLanguage: siteSeo.language,
    itemListElement: marketingPillars.map((pillar, index) => {
      const serviceDetail = siteSeo.serviceDetails.find(
        (service) =>
          service.name === pillar.title ||
          pillar.title.includes(service.name.split(" ")[0] ?? "")
      );
      return {
        "@type": "ListItem",
        position: index + 1,
        name: pillar.title,
        description: serviceDetail?.description ?? pillar.desc,
        url: `${siteUrl}${pillar.href}`,
      };
    }),
  };

  const faqPage: JsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: siteSeo.language,
    mainEntity: invitationFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return [organization, website, webpage, serviceList, faqPage];
}

/** Metadados optimizados para a homepage (pesquisa local + serviços) */
export function buildHomeMetadata(): Metadata {
  return {
    title: siteSeo.title,
    description: siteSeo.description,
    alternates: {
      canonical: "/",
      languages: { "pt-MZ": "/" },
    },
  };
}

export type PageSeoInput = {
  path: string;
  title: string;
  description: string;
  keywords?: readonly string[];
};

/** Metadados por página do site institucional */
export function buildPageMetadata(config: PageSeoInput): Metadata {
  const { path, title, description, keywords } = config;

  return {
    title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: {
      canonical: path,
      languages: { "pt-MZ": path },
    },
    openGraph: {
      type: "website",
      locale: siteSeo.locale,
      url: `${siteUrl}${path}`,
      siteName: siteSeo.name,
      title,
      description,
      images: [
        {
          url: siteSeo.ogImage.url,
          width: siteSeo.ogImage.width,
          height: siteSeo.ogImage.height,
          alt: siteSeo.ogImage.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteSeo.twitterHandle,
      images: [siteSeo.ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
