import type { Metadata } from "next";
import { siteUrl, siteSeo } from "@/lib/seo/site-meta";

export type OgPreviewMode = "brand" | "event" | "vip";

export interface OgImageOptions {
  mode?: OgPreviewMode;
  title?: string;
  couple?: string;
  guest?: string;
  date?: string;
  venue?: string;
  coverImage?: string;
}

/**
 * Constrói a URL canónica absoluta para a rota de geração Edge OG da HAXR Signature.
 */
export function buildOgImageUrl(options: OgImageOptions = {}): string {
  const url = new URL("/api/og", siteUrl);

  if (options.mode) url.searchParams.set("mode", options.mode);
  if (options.title) url.searchParams.set("title", options.title);
  if (options.couple) url.searchParams.set("couple", options.couple);
  if (options.guest) url.searchParams.set("guest", options.guest);
  if (options.date) url.searchParams.set("date", options.date);
  if (options.venue) url.searchParams.set("venue", options.venue);
  if (options.coverImage) url.searchParams.set("coverImage", options.coverImage);

  return url.toString();
}

export interface DynamicEventMetadataInput {
  slug: string;
  title?: string;
  coupleName: string;
  guestName?: string | null;
  dateText?: string;
  venueName?: string;
  coverImageUrl?: string;
}

/**
 * Gera o bloco completo de metadados semânticos para páginas de evento e convites VIP no Next.js.
 * Respeita rigorosamente a Safe Zone do WhatsApp e as convenções da marca HAXR Signature.
 */
export function buildDynamicEventMetadata(
  input: DynamicEventMetadataInput
): Metadata {
  const isVip = Boolean(input.guestName?.trim());
  const ogMode: OgPreviewMode = isVip ? "vip" : "event";

  const ogImageUrl = buildOgImageUrl({
    mode: ogMode,
    title: input.title || (isVip ? "Convite de Honra" : "Celebração de Casamento"),
    couple: input.coupleName,
    guest: input.guestName ?? undefined,
    date: input.dateText,
    venue: input.venueName,
    coverImage: input.coverImageUrl,
  });

  // Copywriting magnético e minimalista adaptado ao modo
  const pageTitle = isVip
    ? `${input.guestName} · Convite Exclusivo para o Casamento de ${input.coupleName}`
    : `Casamento de ${input.coupleName} | HAXR Signature`;

  const pageDescription = isVip
    ? `Reserva de honra para ${input.guestName}. Aceda ao seu Web-Convite exclusivo e confirme a sua presença com distinção.`
    : `Celebração de casamento de ${input.coupleName}. Web-Convite interactivo com confirmação de presença e detalhes do evento.`;

  const canonicalPath = `/event/${input.slug}${
    isVip ? `?convidado=${encodeURIComponent(input.guestName!)}` : ""
  }`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalPath,
      languages: { "pt-MZ": canonicalPath },
    },
    openGraph: {
      type: "website",
      locale: siteSeo.locale,
      url: `${siteUrl}${canonicalPath}`,
      siteName: siteSeo.name,
      title: pageTitle,
      description: pageDescription,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: isVip
            ? `Envelope digital e convite de honra para ${input.guestName}`
            : `Web-Convite do casamento de ${input.coupleName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      creator: siteSeo.twitterHandle,
      images: [ogImageUrl],
    },
    robots: {
      index: !isVip, // Convites VIP personalizados não devem ser indexados publicamente por motores de busca
      follow: !isVip,
    },
  };
}
