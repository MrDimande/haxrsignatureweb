import type { StyleQuizStyleKey } from "@/lib/marketing/style-quiz-packages";
import type { SupplierCategoryId } from "@/lib/vendors/marketplace";

export type VendorStyleConfig = {
  key: StyleQuizStyleKey;
  label: string;
  tagline: string;
  badgeColor: string;
};

export const VENDOR_STYLES: Record<StyleQuizStyleKey, VendorStyleConfig> = {
  minimalist: {
    key: "minimalist",
    label: "Minimalismo Contemporâneo",
    tagline: "Quiet luxury, linhas retas, espaços botânicos e estética orgânica.",
    badgeColor: "bg-stone-900 text-stone-100",
  },
  editorial: {
    key: "editorial",
    label: "Clássico Editorial",
    tagline: "Alta-costura, paletas marfim & champagne, protocolo nobre e sofisticação intemporal.",
    badgeColor: "bg-brand-gold/15 text-brand-gold border-brand-gold/30",
  },
  opulent: {
    key: "opulent",
    label: "Opulência Real",
    tagline: "Grandes banquetes de gala, lustres de cristal, contrastes pretos & dourados metálicos.",
    badgeColor: "bg-amber-950/40 text-amber-300 border-amber-500/30",
  },
  romantic: {
    key: "romantic",
    label: "Romântico Poético",
    tagline: "Jardins encantados, rosa blush, detalhes em aguarela e conto de fadas moderno.",
    badgeColor: "bg-rose-950/30 text-rose-300 border-rose-400/30",
  },
};

/**
 * Mapeamento padrão de estilos por categoria para curadoria inteligente
 */
export const CATEGORY_DEFAULT_STYLES: Record<SupplierCategoryId, StyleQuizStyleKey[]> = {
  venues: ["editorial", "opulent", "romantic"],
  photographers: ["editorial", "minimalist", "opulent", "romantic"],
  videographers: ["editorial", "minimalist", "opulent"],
  caterers: ["editorial", "opulent", "minimalist"],
  decor: ["editorial", "romantic", "opulent", "minimalist"],
  music: ["editorial", "opulent", "minimalist"],
  beauty: ["editorial", "romantic", "minimalist"],
  stationery: ["editorial", "minimalist", "romantic", "opulent"],
  planning: ["editorial", "opulent", "minimalist", "romantic"],
  other: ["editorial", "minimalist"],
};

export type SavedStyleQuizResult = {
  key: StyleQuizStyleKey;
  title: string;
  timestamp: number;
};

export function getStyleMatchScore(
  supplierStyles: StyleQuizStyleKey[],
  userStyleKey: StyleQuizStyleKey | null,
): { matchPercentage: number; isMatch: boolean; styleLabel: string } {
  if (!userStyleKey) {
    return { matchPercentage: 0, isMatch: false, styleLabel: "" };
  }

  const isMatch = supplierStyles.includes(userStyleKey);
  const styleLabel = VENDOR_STYLES[userStyleKey]?.label ?? "Clássico Editorial";

  // Match score algorítmico realista: 94% a 98% para matches primários
  if (isMatch) {
    const isPrimary = supplierStyles[0] === userStyleKey;
    const matchPercentage = isPrimary ? 98 : 94;
    return { matchPercentage, isMatch: true, styleLabel };
  }

  return { matchPercentage: 68, isMatch: false, styleLabel };
}
