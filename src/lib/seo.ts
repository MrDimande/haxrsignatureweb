import type { Metadata } from "next";
import {
  invitationFaqs,
  portfolioCopy,
  siteContact,
  universePillars,
} from "@/lib/site-config";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://haxrsignature.vercel.app";

export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ??
  "_GYFKaSxcMgPb8AHwDC3JVt-BD--GVdb0I_7n53yu9Y";

export const siteSeo = {
  name: "HAXR Signature",
  legalName: "HAXR Signature",
  tagline: "Curadoria de Eventos Exclusivos",
  locale: "pt_MZ",
  language: "pt-MZ",
  country: "MZ",
  city: "Maputo",
  title:
    "HAXR Signature | Convites Digitais e Curadoria de Eventos em Maputo, Moçambique",
  titleTemplate: "%s | HAXR Signature",
  shortTitle: "HAXR Signature — Experiência Definida",
  description:
    "HAXR Signature — curadoria de eventos exclusivos em Maputo, Moçambique. Convites digitais, save the date, identidade visual, assessoria de eventos e coordenação no dia, com elegância e assinatura própria.",
  ogDescription:
    "Convites digitais premium, identidade visual e assessoria de eventos exclusivos em Maputo, Moçambique. Elegância, precisão e assinatura HAXR em cada experiência.",
  keywords: [
    "HAXR Signature",
    "convites digitais",
    "convite digital",
    "save the date",
    "convite digital casamento",
    "convite digital lobolo",
    "convites digitais Maputo",
    "convites digitais Moçambique",
    "curadoria de eventos",
    "assessoria de eventos",
    "planeamento de eventos",
    "planeamento de eventos Maputo",
    "coordenação de eventos",
    "coordenação no dia",
    "eventos exclusivos Maputo",
    "eventos exclusivos Moçambique",
    "identidade visual eventos",
    "design de convites",
    "casamento Maputo",
    "lobolo Maputo",
    "noivado convite digital",
    "eventos corporativos Maputo",
    "RSVP digital",
    "wedding planner Maputo",
  ],
  ogImage: {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "HAXR Signature — Convites digitais e curadoria de eventos em Maputo, Moçambique",
  },
  twitterHandle: "@haxrsignature",
  category: "Planeamento de Eventos",
  services: [
    "Convites Digitais",
    "Identidade Visual",
    "Assessoria de Eventos",
    "Coordenação no Dia",
    "Experiências Personalizadas",
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
    "@type": ["Organization", "ProfessionalService"],
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
    makesOffer: siteSeo.services.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service,
        provider: { "@id": organizationId },
        areaServed: "Maputo, Moçambique",
        availableLanguage: "pt-MZ",
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
    itemListElement: universePillars.map((pillar, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: pillar.title,
      description: pillar.desc,
      url: `${siteUrl}/#universo`,
    })),
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
