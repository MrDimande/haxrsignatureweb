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
  papelaria: "stationery",
  convites: "stationery",
  stationery: "stationery",
  assessoria: "planning",
  coordenação: "planning",
  coordenacao: "planning",
  planning: "planning",
  other: "other",
  outro: "other",
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

function cleanOptionalUrl(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

export function mapSupplierProfileRow(
  row: SupplierProfileRow,
): PublicSupplierProfile {
  const category = normalizeSupplierCategory(row.category);

  return {
    id: row.id,
    slug: row.slug,
    name: row.business_name.trim(),
    category,
    categoryLabel: getSupplierCategoryLabel(category),
    city: row.city.trim(),
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
