import type { Metadata } from "next";
import { brandAssets } from "@/lib/assets";
import {
  googleSiteVerification,
  siteSeo,
  siteUrl,
} from "@/lib/seo/site-meta";

export {
  DEFAULT_SITE_URL,
  siteUrl,
  siteSeo,
  googleSiteVerification,
  getGoogleVerificationFileName,
  getGoogleVerificationFileContent,
} from "@/lib/seo/site-meta";

export {
  buildStructuredData,
  buildHomeStructuredData,
  buildPageStructuredData,
  buildDemoStructuredData,
} from "@/lib/seo/jsonld";

export { buildDemoSitemapEntries } from "@/lib/seo/sitemap-config";

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
        { url: brandAssets.faviconPng, type: "image/png", sizes: "512x512" },
        { url: brandAssets.faviconPng, type: "image/png", sizes: "192x192" },
        { url: brandAssets.faviconPng, type: "image/png", sizes: "32x32" },
      ],
      apple: [
        {
          url: brandAssets.appleTouchIcon,
          sizes: "180x180",
          type: "image/png",
        },
        {
          url: brandAssets.appleTouchIcon,
          sizes: "512x512",
          type: "image/png",
        },
      ],
      shortcut: brandAssets.faviconPng,
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
    applicationName: siteSeo.name,
    authors: [{ name: siteSeo.name, url: siteUrl }],
    creator: siteSeo.name,
    publisher: siteSeo.name,
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

/** Metadados para páginas operacionais de evento (RSVP, check-in, seating). */
export function buildPrivateEventMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}
