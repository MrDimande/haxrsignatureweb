import type { StyleQuizStyleKey } from "@/lib/marketing/style-quiz-packages";
import { CATEGORY_DEFAULT_STYLES } from "@/lib/vendors/vendor-styles";
import {
  DEFAULT_VENDOR_SEASONALITY,
  type VendorSeasonality,
} from "@/lib/vendors/vendor-seasonality";

export const SUPPLIER_CATEGORIES = [
  { id: "venues", label: "Espaços para eventos" },
  { id: "photographers", label: "Fotografia" },
  { id: "videographers", label: "Vídeo" },
  { id: "caterers", label: "Catering" },
  { id: "decor", label: "Decoração e flores" },
  { id: "music", label: "Música e entretenimento" },
  { id: "beauty", label: "Beleza" },
  { id: "stationery", label: "Convites e papelaria" },
  { id: "planning", label: "Assessoria e coordenação" },
  { id: "other", label: "Outros serviços" },
] as const;

export type SupplierCategoryId = (typeof SUPPLIER_CATEGORIES)[number]["id"];

export type SupplierProfileRow = {
  id: string;
  slug: string;
  business_name: string;
  category: string;
  city: string;
  short_description: string | null;
  about: string | null;
  public_email: string | null;
  public_phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  service_level: string | null;
  services: string[] | null;
  is_verified: boolean;
  published_at: string | null;
  avatar_url?: string | null;
  cover_image_url?: string | null;
  portfolio_images?: string[] | null;
  price_range?: string | null;
  experience_years?: number | null;
  featured_badge?: string | null;
  response_time?: string | null;
  satisfaction_rate?: number | null;
  member_since?: string | null;
  styles?: StyleQuizStyleKey[] | null;
};

export type PublicSupplierProfile = {
  id: string;
  slug: string;
  name: string;
  category: SupplierCategoryId;
  categoryLabel: string;
  city: string;
  description: string;
  about: string;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  serviceLevel: string | null;
  services: string[];
  verified: boolean;
  publishedAt: string | null;
  avatarUrl: string | null;
  coverImageUrl: string;
  portfolioImages: string[];
  priceRange: string;
  experienceYears: number;
  featuredBadge: string;
  responseTime: string;
  satisfactionRate: number;
  memberSince: string;
  styles: StyleQuizStyleKey[];
  seasonality: VendorSeasonality;
};

const CATEGORY_ALIASES: Record<string, SupplierCategoryId> = {
  venue: "venues",
  venues: "venues",
  local: "venues",
  espaço: "venues",
  espaco: "venues",
  salão: "venues",
  salao: "venues",
  fotografia: "photographers",
  fotógrafo: "photographers",
  fotografo: "photographers",
  photographers: "photographers",
  vídeo: "videographers",
  video: "videographers",
  videographers: "videographers",
  catering: "caterers",
  caterers: "caterers",
  buffet: "caterers",
  decoração: "decor",
  decoracao: "decor",
  flores: "decor",
  decor: "decor",
  música: "music",
  musica: "music",
  dj: "music",
  music: "music",
  beleza: "beauty",
  beauty: "beauty",
  maquilhagem: "beauty",
  cabelo: "beauty",
  convites: "stationery",
  stationery: "stationery",
  papelaria: "stationery",
  design: "stationery",
  planeamento: "planning",
  planning: "planning",
  assessoria: "planning",
  coordenação: "planning",
  coordenacao: "planning",
  outro: "other",
  outros: "other",
  other: "other",
};

export const CATEGORY_CURATED_MEDIA: Record<
  SupplierCategoryId,
  { cover: string; portfolio: string[]; defaultPrice: string; defaultBadge: string }
> = {
  venues: {
    cover: "/images/portfolio/mosaic-salao-branco-preparado.webp",
    portfolio: [
      "/images/portfolio/mosaic-salao-branco-preparado.webp",
      "/images/casamento-vania-fabiao-evelyn-eventos.webp",
      "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
    ],
    defaultPrice: "Sob Consulta",
    defaultBadge: "Espaço Selecionado HAXR",
  },
  photographers: {
    cover: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
    portfolio: [
      "/images/casamento-vania-fabiao-evelyn-eventos.webp",
      "/images/portfolio/mosaic-casal-painel-branco.webp",
      "/images/portfolio-page-5.png",
    ],
    defaultPrice: "A partir de 45.000 MT",
    defaultBadge: "Fotografia Editorial HAXR",
  },
  videographers: {
    cover: "/images/portfolio-page-5.png",
    portfolio: [
      "/images/portfolio-page-5.png",
      "/images/portfolio-page-6.png",
      "/images/casamento-vania-fabiao-evelyn-eventos.webp",
    ],
    defaultPrice: "A partir de 50.000 MT",
    defaultBadge: "Cinematografia de Casamento",
  },
  caterers: {
    cover: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
    portfolio: [
      "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
      "/images/casamento-vania-fabiao-evelyn-eventos.webp",
      "/images/portfolio/mosaic-salao-branco-preparado.webp",
    ],
    defaultPrice: "Por pessoa · Sob Consulta",
    defaultBadge: "Alta Gastronomia HAXR",
  },
  decor: {
    cover: "/images/archive-03.webp",
    portfolio: [
      "/images/archive-03.webp",
      "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
      "/images/archive-01.webp",
    ],
    defaultPrice: "A partir de 60.000 MT",
    defaultBadge: "Design Floral & Cenografia",
  },
  music: {
    cover: "/images/archive-01.webp",
    portfolio: [
      "/images/archive-01.webp",
      "/images/portfolio/mosaic-salao-branco-preparado.webp",
      "/images/archive-04.webp",
    ],
    defaultPrice: "A partir de 30.000 MT",
    defaultBadge: "Entretenimento & DJ de Gala",
  },
  beauty: {
    cover: "/images/archive-02.webp",
    portfolio: [
      "/images/archive-02.webp",
      "/images/archive-04.webp",
      "/images/portfolio/mosaic-casal-painel-branco.webp",
    ],
    defaultPrice: "A partir de 15.000 MT",
    defaultBadge: "Beleza de Noiva & Alta-Costura",
  },
  stationery: {
    cover: "/images/convite-mockup-vania-fabiao.png",
    portfolio: [
      "/images/convite-mockup-vania-fabiao.png",
      "/images/convite-preview-portrait.png",
      "/images/portfolio/mosaic-convite-jessica-samuel-dark.png",
    ],
    defaultPrice: "A partir de 12.500 MT",
    defaultBadge: "Convites & Papelaria Fina",
  },
  planning: {
    cover: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
    portfolio: [
      "/images/casamento-vania-fabiao-evelyn-eventos.webp",
      "/images/portfolio/mosaic-salao-branco-preparado.webp",
      "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
    ],
    defaultPrice: "Sob Consulta",
    defaultBadge: "Assessoria & Coordenação VIP",
  },
  other: {
    cover: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
    portfolio: [
      "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
      "/images/casamento-vania-fabiao-evelyn-eventos.webp",
    ],
    defaultPrice: "Sob Consulta",
    defaultBadge: "Serviço Verificado HAXR",
  },
};

function normalizeSearchValue(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function normalizeSupplierCategory(value: string): SupplierCategoryId {
  const normalized = normalizeSearchValue(value);
  return CATEGORY_ALIASES[normalized] ?? "other";
}

export function getSupplierCategoryLabel(category: SupplierCategoryId): string {
  return (
    SUPPLIER_CATEGORIES.find((item) => item.id === category)?.label ??
    "Outros serviços"
  );
}

function cleanOptionalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

export function mapSupplierProfileRow(
  row: SupplierProfileRow,
): PublicSupplierProfile {
  const category = normalizeSupplierCategory(row.category);
  const mediaFallback = CATEGORY_CURATED_MEDIA[category] ?? CATEGORY_CURATED_MEDIA.other;

  const coverImageUrl = row.cover_image_url?.trim() || mediaFallback.cover;
  const portfolioImages =
    row.portfolio_images && row.portfolio_images.length > 0
      ? row.portfolio_images
      : mediaFallback.portfolio;

  return {
    id: row.id,
    slug: row.slug,
    name: row.business_name.trim(),
    category,
    categoryLabel: getSupplierCategoryLabel(category),
    city: row.city.trim() || "Maputo",
    description: row.short_description?.trim() ?? "",
    about: row.about?.trim() ?? "",
    email: row.public_email?.trim() || null,
    phone: row.public_phone?.trim() || null,
    websiteUrl: cleanOptionalUrl(row.website_url),
    instagramUrl: cleanOptionalUrl(row.instagram_url),
    serviceLevel: row.service_level?.trim() || null,
    services: (row.services ?? []).map((service) => service.trim()).filter(Boolean),
    verified: row.is_verified,
    publishedAt: row.published_at,
    avatarUrl: row.avatar_url?.trim() || null,
    coverImageUrl,
    portfolioImages,
    priceRange: row.price_range?.trim() || mediaFallback.defaultPrice,
    experienceYears: row.experience_years ?? 5,
    featuredBadge: row.featured_badge?.trim() || mediaFallback.defaultBadge,
    responseTime: row.response_time?.trim() || "Responde em menos de 2h",
    satisfactionRate: row.satisfaction_rate ?? 98,
    memberSince: row.member_since?.trim() || new Date().getFullYear().toString(),
    styles:
      row.styles && row.styles.length > 0
        ? row.styles
        : CATEGORY_DEFAULT_STYLES[category] ?? ["editorial", "minimalist"],
    seasonality: DEFAULT_VENDOR_SEASONALITY,
  };
}

export function filterSupplierProfiles(
  suppliers: PublicSupplierProfile[],
  input: { query?: string; category?: string; city?: string },
): PublicSupplierProfile[] {
  const query = normalizeSearchValue(input.query ?? "");
  const category =
    input.category && input.category !== "all"
      ? normalizeSupplierCategory(input.category)
      : null;
  const city = normalizeSearchValue(input.city ?? "");

  return suppliers.filter((supplier) => {
    if (category && supplier.category !== category) return false;
    if (city && !normalizeSearchValue(supplier.city).includes(city)) return false;
    if (!query) return true;

    const searchable = normalizeSearchValue(
      [
        supplier.name,
        supplier.categoryLabel,
        supplier.city,
        supplier.description,
        supplier.about,
        ...supplier.services,
      ].join(" "),
    );

    return searchable.includes(query);
  });
}

export function buildSupplierInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FS";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-PT") ?? "")
    .join("");
}
