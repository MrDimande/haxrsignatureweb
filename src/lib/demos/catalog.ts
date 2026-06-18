import { portfolioAssets } from "@/lib/assets";
import { siteUrl } from "@/lib/seo/site-meta";

const IPHONE_17_WIDTH = 402;

export type DemoProject = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: string;
  format: string;
  occasion: string;
  caption: string;
  editorialNote: string;
  description: string;
  /** Caminho canónico no site HAXR (sem domínio) */
  publicPath: string;
  /** Origem real do convite (iframe) — actualizar quando houver domínio próprio */
  embedUrl: string;
  /** URLs legadas para referência / migração DNS */
  legacyUrls: readonly string[];
  mockupImage: string;
  previewPortrait: string;
  mobileViewportWidth: number;
  ctaLabel: string;
};

export const demoCatalog: readonly DemoProject[] = [
  {
    id: "casamento-vania-fabiao",
    slug: "casamento-vania-fabiao",
    title: "Vânia & Fabiao — Convite de Casamento",
    shortTitle: "Vânia & Fabiao",
    category: "Casamento",
    format: "Pacote Royal · Convite Digital",
    occasion: "Curadoria Digital & Identidade",
    caption: "Convite de Casamento Signature",
    editorialNote:
      "Experiência imersiva com identidade, música, confirmação e narrativa do casal — pensada para viver no telemóvel.",
    description:
      "Convite digital Signature para casamento em Maputo — experiência imersiva com RSVP, música e identidade visual HAXR.",
    publicPath: "/experiencias/casamento-vania-fabiao",
    embedUrl: "https://casamento-vania-fabiao.vercel.app/",
    legacyUrls: ["https://casamento-vania-fabiao.vercel.app/"],
    mockupImage: portfolioAssets.casamentoSignature,
    previewPortrait: portfolioAssets.convitePreviewPortrait,
    mobileViewportWidth: IPHONE_17_WIDTH,
    ctaLabel: "Ver convite ao vivo",
  },
  {
    id: "save-the-date-jessica-samuel",
    slug: "save-the-date-jessica-samuel",
    title: "Jessica & Samuel — Save the Date",
    shortTitle: "Jessica & Samuel",
    category: "Save the Date",
    format: "Pacote Royal · Save The Date",
    occasion: "Narrativa Editorial & RSVP",
    caption: "Save the Date Bespoke",
    editorialNote:
      "Narrativa em capítulos, dress code com referências visuais e confirmação de presença — o primeiro gesto antes do grande dia.",
    description:
      "Save the date editorial com RSVP integrado — primeiro contacto digital antes do casamento.",
    publicPath: "/experiencias/save-the-date-jessica-samuel",
    embedUrl: "https://jessica-samuel-save-the-date.vercel.app/",
    legacyUrls: ["https://jessica-samuel-save-the-date.vercel.app/"],
    mockupImage: portfolioAssets.saveTheDate,
    previewPortrait: portfolioAssets.saveTheDate,
    mobileViewportWidth: IPHONE_17_WIDTH,
    ctaLabel: "Ver save the date",
  },
] as const;

const bySlug = new Map(demoCatalog.map((demo) => [demo.slug, demo]));
const byId = new Map(demoCatalog.map((demo) => [demo.id, demo]));

export function getDemoBySlug(slug: string): DemoProject | undefined {
  return bySlug.get(slug);
}

export function getDemoById(id: string): DemoProject | undefined {
  return byId.get(id);
}

export function getDemoPublicUrl(demo: DemoProject): string {
  return `${siteUrl}${demo.publicPath}`;
}

export function getDemoEmbedUrl(demo: DemoProject): string {
  return demo.embedUrl;
}

export function isLegacyDemoUrl(url: string): DemoProject | undefined {
  const normalized = url.replace(/\/$/, "");
  return demoCatalog.find((demo) =>
    demo.legacyUrls.some((legacy) => legacy.replace(/\/$/, "") === normalized)
  );
}
