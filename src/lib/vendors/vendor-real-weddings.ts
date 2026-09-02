/**
 * Casamentos Reais HAXR — Registo Curado
 *
 * Vincula casamentos reais em Moçambique a categorias de fornecedores,
 * permitindo que cada perfil no directório mostre provas sociais editoriais.
 */

import type { SupplierCategoryId } from "@/lib/vendors/marketplace";

export type RealWedding = {
  id: string;
  couple: string;
  venue: string;
  city: string;
  date: string;
  coverImage: string;
  slug: string;
  vendorCategories: SupplierCategoryId[];
  editorial: string;
};

/**
 * Casamentos Reais Curados — editados manualmente pela equipa HAXR.
 * Estes dados seriam eventualmente migrados para o Supabase,
 * mas por agora vivem como constante estática de alta qualidade.
 */
export const HAXR_REAL_WEDDINGS: RealWedding[] = [
  {
    id: "vania-fabiao",
    couple: "Vânia Luky & Fabião Dimande",
    venue: "Evelyn Eventos",
    city: "Maputo",
    date: "Dezembro 2024",
    coverImage: "/images/casamento-vania-fabiao-evelyn-eventos.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "videographers",
      "caterers",
      "decor",
      "music",
      "beauty",
      "planning",
    ],
    editorial:
      "Casamento editorial em tons dourados e marfim no Evelyn Eventos, com 350 convidados e produção integral HAXR Signature.",
  },
  {
    id: "jessica-samuel",
    couple: "Jéssica & Samuel",
    venue: "Espaço Nobre Maputo",
    city: "Maputo",
    date: "Março 2025",
    coverImage: "/images/portfolio/mosaic-salao-branco-preparado.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "caterers",
      "decor",
      "stationery",
      "planning",
    ],
    editorial:
      "Cerimónia íntima e sofisticada para 180 convidados, com convites personalizados e decoração floral branca minimalista.",
  },
  {
    id: "ana-carlos",
    couple: "Ana & Carlos",
    venue: "Vila Laguna Marracuene",
    city: "Marracuene",
    date: "Junho 2025",
    coverImage: "/images/portfolio/mosaic-mesa-detalhe-dourado.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "videographers",
      "caterers",
      "decor",
      "music",
    ],
    editorial:
      "Casamento ao ar livre com toque tropical e elegância europeia, numa quinta privada em Marracuene com 280 convidados.",
  },
  {
    id: "lurdes-fernando",
    couple: "Lurdes & Fernando",
    venue: "Polana Serena Hotel",
    city: "Maputo",
    date: "Setembro 2025",
    coverImage: "/images/portfolio/mosaic-casal-painel-branco.webp",
    slug: "/portfolio",
    vendorCategories: [
      "venues",
      "photographers",
      "caterers",
      "beauty",
      "music",
      "planning",
    ],
    editorial:
      "Gala de luxo no Polana Serena com 400 convidados, menu de autor e orquestra ao vivo.",
  },
];

/**
 * Retorna os casamentos reais curados que correspondem
 * à categoria do fornecedor (máximo 3 por perfil).
 */
export function getRealWeddingsForCategory(
  category: SupplierCategoryId,
  maxResults = 3,
): RealWedding[] {
  return HAXR_REAL_WEDDINGS.filter((wedding) =>
    wedding.vendorCategories.includes(category),
  ).slice(0, maxResults);
}
