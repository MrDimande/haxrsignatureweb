import { brandAssets } from "@/lib/assets";
import { caseStudies } from "@/lib/marketing/editorial";
import {
  getDemoBySlug,
  getDemoPublicUrl,
} from "@/lib/demos/catalog";
import {
  marketingPagesSeo,
  type MarketingPageKey,
} from "@/lib/marketing/seo";
import { marketingPillars } from "@/lib/marketing/pages";
import { invitationFaqs, portfolioCopy, siteContact } from "@/lib/site-config";
import { assessoriaFaqs, convidadosFaqs } from "@/lib/seo/service-faqs";
import { siteSeo, siteUrl } from "@/lib/seo/site-meta";

export type JsonLd = Record<string, unknown>;

export const JSONLD_IDS = {
  organization: `${siteUrl}/#organization`,
  website: `${siteUrl}/#website`,
} as const;

const SERVICE_PAGES: MarketingPageKey[] = [
  "assessoria",
  "convites",
  "convidados",
  "plataforma",
];

function pageUrl(path: string): string {
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

function pageId(path: string, fragment = "webpage"): string {
  return `${pageUrl(path)}#${fragment}`;
}

export function buildFullOrganization(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService", "EventPlanner"],
    "@id": JSONLD_IDS.organization,
    name: siteSeo.name,
    legalName: siteSeo.legalName,
    url: siteUrl,
    logo: `${siteUrl}${brandAssets.logoHorizontal}`,
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
      "Assessoria de casamentos",
      "Convites digitais",
      "Casamentos",
      "Lobolos",
      "Save the date",
      "RSVP digital",
      "Find Your Seat",
      "Seating plan",
      "Check-in com QR Code",
      "Gestão de convidados",
      "Coordenação de eventos",
      "Curadoria de eventos",
      "Organização de casamentos",
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
        provider: { "@id": JSONLD_IDS.organization },
        areaServed: [
          { "@type": "City", name: "Maputo" },
          { "@type": "Country", name: "Moçambique" },
        ],
        availableLanguage: "pt-MZ",
        serviceType: service.name,
      },
    })),
  };
}

export function buildOrganizationReference(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService", "EventPlanner"],
    "@id": JSONLD_IDS.organization,
    name: siteSeo.name,
    url: siteUrl,
    logo: `${siteUrl}${brandAssets.logoHorizontal}`,
  };
}

export function buildWebsiteEntity(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": JSONLD_IDS.website,
    url: siteUrl,
    name: siteSeo.name,
    alternateName: ["HAXR", "HAXR Signature Maputo"],
    description: siteSeo.description,
    inLanguage: siteSeo.language,
    publisher: { "@id": JSONLD_IDS.organization },
  };
}

export function buildBreadcrumbList(
  path: string,
  title: string
): JsonLd {
  const items = [
    { name: "Início", path: "/" },
    ...(path === "/" ? [] : [{ name: title, path }]),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageId(path, "breadcrumb")}`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: pageUrl(item.path),
    })),
  };
}

export function buildWebPageEntity(input: {
  path: string;
  title: string;
  description: string;
  type?: string;
  mainEntityId?: string;
}): JsonLd {
  const { path, title, description, type = "WebPage", mainEntityId } = input;

  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": pageId(path),
    url: pageUrl(path),
    name: title,
    description,
    isPartOf: { "@id": JSONLD_IDS.website },
    about: { "@id": JSONLD_IDS.organization },
    inLanguage: siteSeo.language,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${siteUrl}${siteSeo.ogImage.url}`,
    },
    ...(mainEntityId ? { mainEntity: { "@id": mainEntityId } } : {}),
  };
}

export function buildServiceEntity(input: {
  path: string;
  name: string;
  description: string;
  serviceType?: string;
}): JsonLd {
  const serviceId = pageId(input.path, "service");

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": serviceId,
    name: input.name,
    description: input.description,
    url: pageUrl(input.path),
    serviceType: input.serviceType ?? input.name,
    provider: { "@id": JSONLD_IDS.organization },
    areaServed: [
      { "@type": "City", name: "Maputo" },
      { "@type": "Country", name: "Moçambique" },
    ],
    availableLanguage: siteSeo.language,
  };
}

export function buildFaqPage(faqs: ReadonlyArray<{ q: string; a: string }>): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: siteSeo.language,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

function buildHomeServiceList(): JsonLd {
  return {
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
}

function buildPortfolioCollection(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": pageId("/portfolio", "cases"),
    name: "Portfólio HAXR Signature",
    description: marketingPagesSeo.portfolio.description,
    itemListElement: caseStudies.map((study, index) => {
      const demo = getDemoBySlug(study.id);
      const itemUrl = demo
        ? getDemoPublicUrl(demo)
        : study.href
          ? study.href.startsWith("http")
            ? study.href
            : `${siteUrl}${study.href}`
          : `${siteUrl}/portfolio`;
      return {
        "@type": "ListItem",
        position: index + 1,
        name: study.title,
        description: study.context,
        url: itemUrl,
      };
    }),
  };
}

export function buildDemoStructuredData(slug: string): JsonLd[] {
  const demo = getDemoBySlug(slug);
  if (!demo) return [];

  const serviceId = pageId(demo.publicPath, "creative-work");

  return [
    buildOrganizationReference(),
    buildWebsiteEntity(),
    buildBreadcrumbList(demo.publicPath, demo.shortTitle),
    buildWebPageEntity({
      path: demo.publicPath,
      title: demo.title,
      description: demo.description,
      mainEntityId: serviceId,
    }),
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": serviceId,
      name: demo.title,
      description: demo.description,
      url: getDemoPublicUrl(demo),
      genre: demo.category,
      inLanguage: siteSeo.language,
      creator: { "@id": JSONLD_IDS.organization },
      isPartOf: { "@id": JSONLD_IDS.website },
    },
  ];
}

const SERVICE_NAMES: Partial<Record<MarketingPageKey, string>> = {
  assessoria: "Assessoria de Eventos",
  convites: "Convites Digitais e Identidade Visual",
  convidados: "Gestão de Convidados",
  plataforma: "Ecossistema Operacional de Eventos",
};

const CONVITES_FAQ_KEYWORDS = [
  "convite",
  "digital",
  "dispositivo",
  "alterações",
  "pagamento",
  "antecedência",
];

/** JSON-LD completo da homepage */
export function buildHomeStructuredData(): JsonLd[] {
  const organization = buildFullOrganization();
  const website = buildWebsiteEntity();
  const webpage = buildWebPageEntity({
    path: "/",
    title: siteSeo.title,
    description: siteSeo.description,
  });

  return [
    organization,
    website,
    webpage,
    buildBreadcrumbList("/", siteSeo.shortTitle),
    buildHomeServiceList(),
    buildFaqPage(invitationFaqs),
  ];
}

/** JSON-LD por página pilar do site institucional */
export function buildPageStructuredData(key: MarketingPageKey): JsonLd[] {
  if (key === "home") return buildHomeStructuredData();

  const page = marketingPagesSeo[key];
  const schemas: JsonLd[] = [
    buildOrganizationReference(),
    buildWebsiteEntity(),
    buildBreadcrumbList(page.path, page.title),
  ];

  const serviceName = SERVICE_NAMES[key];
  const serviceId = serviceName ? pageId(page.path, "service") : undefined;

  if (key === "contacto") {
    schemas.push(
      buildWebPageEntity({
        path: page.path,
        title: page.title,
        description: page.description,
        type: "ContactPage",
        mainEntityId: JSONLD_IDS.organization,
      })
    );
    return schemas;
  }

  if (key === "sobre") {
    schemas.push(
      buildWebPageEntity({
        path: page.path,
        title: page.title,
        description: page.description,
        type: "AboutPage",
        mainEntityId: JSONLD_IDS.organization,
      })
    );
    return schemas;
  }

  if (key === "portfolio") {
    schemas.push(
      buildWebPageEntity({
        path: page.path,
        title: page.title,
        description: page.description,
        type: "CollectionPage",
        mainEntityId: pageId("/portfolio", "cases"),
      }),
      buildPortfolioCollection()
    );
    return schemas;
  }

  if (key === "insights") {
    schemas.push(
      buildWebPageEntity({
        path: page.path,
        title: page.title,
        description: page.description,
        type: "CollectionPage",
      })
    );
    return schemas;
  }

  if (SERVICE_PAGES.includes(key) && serviceName) {
    const serviceDetail = siteSeo.serviceDetails.find((s) =>
      page.path.startsWith(s.url)
    );

    schemas.push(
      buildWebPageEntity({
        path: page.path,
        title: page.title,
        description: page.description,
        mainEntityId: serviceId,
      }),
      buildServiceEntity({
        path: page.path,
        name: serviceName,
        description: serviceDetail?.description ?? page.description,
        serviceType: serviceName,
      })
    );

    if (key === "convites") {
      const convitesFaqs = invitationFaqs.filter((faq) =>
        CONVITES_FAQ_KEYWORDS.some((kw) =>
          faq.q.toLowerCase().includes(kw)
        )
      );
      if (convitesFaqs.length) {
        schemas.push(buildFaqPage(convitesFaqs));
      }
    }

    if (key === "convidados") {
      schemas.push(buildFaqPage(convidadosFaqs));
    }

    if (key === "assessoria") {
      schemas.push(buildFaqPage(assessoriaFaqs));
    }

    return schemas;
  }

  schemas.push(
    buildWebPageEntity({
      path: page.path,
      title: page.title,
      description: page.description,
    })
  );

  return schemas;
}

/** @deprecated Usar buildHomeStructuredData */
export function buildStructuredData(): JsonLd[] {
  return buildHomeStructuredData();
}
