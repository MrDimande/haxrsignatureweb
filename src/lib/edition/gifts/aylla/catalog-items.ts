import type { CoreGiftInventoryRecord } from "./types";

export type AyllaGiftCategoryId =
  | "cantinho-dos-sonhos"
  | "guarda-roupa"
  | "bonecas-companhia"
  | "descobrir-aprender"
  | "brincar-explorar"
  | "pequenos-essenciais"
  | "tesouros-recordacoes";

export type AyllaGiftReviewFlag =
  | "age-safety"
  | "dimensions"
  | "size"
  | "colour"
  | "material"
  | "personalisation"
  | "overlap-review";

export interface AyllaGiftCategoryDefinition {
  readonly id: AyllaGiftCategoryId;
  readonly title: string;
  readonly lead: string;
  readonly featured?: boolean;
}

export interface AyllaGiftCatalogItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: AyllaGiftCategoryId;
  readonly description: string;
  readonly priority: "high" | "standard";
  readonly reviewFlags: readonly AyllaGiftReviewFlag[];
}

export interface AyllaGiftReconciledItem {
  readonly definition: AyllaGiftCatalogItemDefinition;
  readonly categoryTitle: string;
  /** Editorial gallery inclusion decided in Edition shortlist. */
  readonly editorialCurated: true;
  /** Operational approval pillars persisted in Core DB (fail-closed until confirmed). */
  readonly familyApproved: boolean;
  readonly specificationsComplete: boolean;
  readonly childSafetyValidated: boolean;
  readonly approvedQuantity: number | null;
  readonly enabled: boolean;
  readonly reservedQuantity: number;
  readonly remainingQuantity: number;
  readonly reservable: boolean;
  readonly pendingRequirements: readonly string[];
}

export const AYLLA_GIFT_CATEGORIES: readonly AyllaGiftCategoryDefinition[] = [
  { id: "cantinho-dos-sonhos", title: "O Cantinho dos Sonhos da Aylla", lead: "Peças para um quarto sereno, acolhedor e cheio de imaginação.", featured: true },
  { id: "guarda-roupa", title: "O Guarda-Roupa da Aylla", lead: "Pequenos detalhes para crescer com delicadeza." },
  { id: "bonecas-companhia", title: "Bonecas & Companhia", lead: "Companheiras para histórias, afecto e imaginação." },
  { id: "descobrir-aprender", title: "Descobrir & Aprender", lead: "Descobertas que acompanham os primeiros anos." },
  { id: "brincar-explorar", title: "Brincar & Explorar", lead: "Convites suaves ao movimento e à curiosidade." },
  { id: "pequenos-essenciais", title: "Pequenos Essenciais", lead: "Gestos úteis, escolhidos com carinho." },
  { id: "tesouros-recordacoes", title: "Tesouros & Recordações", lead: "Peças para guardar os momentos mais bonitos." },
] as const;

const item = (
  id: string,
  name: string,
  category: AyllaGiftCategoryId,
  description: string,
  priority: "high" | "standard",
  reviewFlags: readonly AyllaGiftReviewFlag[] = []
): AyllaGiftCatalogItemDefinition => ({
  id,
  name,
  category,
  description,
  priority,
  reviewFlags,
});

/**
 * Canonical 52 articles across 7 categories mirrored from Edition shortlist.
 * Zero quantities, sizes, brands, or prices are assumed here; operational gates
 * remain fail-closed inside public.edition_gift_inventory.
 */
export const AYLLA_CANONICAL_CATALOG_ITEMS: readonly AyllaGiftCatalogItemDefinition[] = [
  item("dream-cot-sheets", "Lençóis de berço", "cantinho-dos-sonhos", "Base têxtil para o cantinho de descanso.", "high", ["material", "dimensions", "age-safety"]),
  item("dream-blankets", "Cobertores e mantinhas", "cantinho-dos-sonhos", "Camadas de aconchego para momentos acompanhados.", "high", ["material", "age-safety"]),
  item("dream-washable-rug", "Tapete infantil macio e lavável", "cantinho-dos-sonhos", "Textura suave para a área de brincar do quarto.", "high", ["dimensions", "material", "age-safety"]),
  item("dream-childrens-lamp", "Candeeiro infantil", "cantinho-dos-sonhos", "Luz decorativa para o quarto da Aylla.", "high", ["dimensions", "age-safety"]),
  item("dream-night-light", "Luz de presença nocturna", "cantinho-dos-sonhos", "Ponto de luz suave para a rotina nocturna.", "high", ["age-safety"]),
  item("dream-decorative-frames", "Quadros decorativos infantis", "cantinho-dos-sonhos", "Peças visuais para compor a parede do quarto.", "high", ["dimensions"]),
  item("dream-personalised-name-decor", "Decoração personalizada com o nome Aylla", "cantinho-dos-sonhos", "Peça de assinatura para o quarto da Aylla.", "high", ["personalisation", "dimensions"]),
  item("dream-toy-baskets", "Cestos organizadores de brinquedos", "cantinho-dos-sonhos", "Organização discreta para os pequenos tesouros.", "high", ["dimensions", "material"]),
  item("dream-keepsake-box", "Caixa de recordações", "cantinho-dos-sonhos", "Arquivo delicado para memórias do quarto.", "high", ["material", "overlap-review"]),
  item("dream-growth-ruler", "Régua decorativa de crescimento", "cantinho-dos-sonhos", "Marco visual para acompanhar o crescimento.", "high", ["dimensions"]),
  item("dream-padded-changing-mat", "Trocador acolchoado", "cantinho-dos-sonhos", "Apoio prático para a rotina de cuidados.", "high", ["dimensions", "material", "age-safety"]),

  item("wardrobe-princess-dresses", "Vestidos de princesa", "guarda-roupa", "Peças especiais para dias de imaginação.", "standard", ["size", "colour", "material"]),
  item("wardrobe-occasion-dresses", "Vestidos para ocasiões especiais", "guarda-roupa", "Silhuetas para momentos de celebração.", "standard", ["size", "colour", "material"]),
  item("wardrobe-outing-sets", "Conjuntos de passeio", "guarda-roupa", "Coordenações leves para pequenos passeios.", "standard", ["size", "colour", "material"]),
  item("wardrobe-pyjamas", "Pijamas confortáveis", "guarda-roupa", "Conforto para a rotina de descanso.", "standard", ["size", "material"]),
  item("wardrobe-shoes", "Sapatos infantis", "guarda-roupa", "Calçado para os primeiros passos com elegância.", "standard", ["size", "colour"]),
  item("wardrobe-sandals", "Sandálias infantis", "guarda-roupa", "Calçado leve para dias luminosos.", "standard", ["size", "colour"]),
  item("wardrobe-casual-sets", "Conjuntos de roupa casual", "guarda-roupa", "Essenciais suaves para todos os dias.", "standard", ["size", "colour", "material"]),

  item("companions-12m-dolls", "Bonecas adequadas a partir de 12 meses", "bonecas-companhia", "Companhia imaginativa pensada para a idade da Aylla.", "standard", ["age-safety", "material"]),
  item("companions-teddy-bears", "Ursinhos de peluche", "bonecas-companhia", "Abraços suaves para momentos de afecto.", "standard", ["age-safety", "material"]),
  item("companions-cloth-dolls", "Bonecas de pano macias", "bonecas-companhia", "Companheiras de textura suave e acolhedora.", "standard", ["age-safety", "material"]),
  item("companions-animal-plush", "Peluches de animais", "bonecas-companhia", "Pequenos animais para histórias e brincadeira.", "standard", ["age-safety", "material"]),

  item("learn-activity-cube", "Cubo de actividades", "descobrir-aprender", "Exploração de gestos, formas e texturas.", "standard", ["age-safety"]),
  item("learn-shape-sorter", "Brinquedo de encaixar formas", "descobrir-aprender", "Descoberta de formas através do brincar.", "standard", ["age-safety"]),
  item("learn-ring-stack", "Torre de argolas para empilhar", "descobrir-aprender", "Coordenação e sequência em pequenos gestos.", "standard", ["age-safety"]),
  item("learn-stacking-cups", "Copos de empilhar", "descobrir-aprender", "Brincadeira de ritmo, altura e encaixe.", "standard", ["age-safety"]),
  item("learn-large-building-blocks", "Blocos de construção grandes", "descobrir-aprender", "Construções seguras para mãos curiosas.", "standard", ["age-safety", "material"]),
  item("learn-wooden-blocks", "Blocos de madeira", "descobrir-aprender", "Peças de descoberta com textura natural.", "standard", ["age-safety", "material"]),
  item("learn-board-books", "Livros de cartão resistentes", "descobrir-aprender", "Primeiras páginas para explorar em conjunto.", "standard", ["age-safety"]),
  item("learn-large-piece-puzzles", "Puzzles simples com peças grandes", "descobrir-aprender", "Pequenos desafios para descobrir e combinar.", "standard", ["age-safety"]),
  item("learn-childrens-instruments", "Instrumentos musicais infantis", "descobrir-aprender", "Som e ritmo para os primeiros momentos musicais.", "standard", ["age-safety"]),
  item("learn-activity-table", "Mesa de actividades", "descobrir-aprender", "Estação de exploração pensada para a idade.", "standard", ["dimensions", "age-safety"]),
  item("learn-soft-sensory-ball", "Bola sensorial macia", "descobrir-aprender", "Textura e movimento para a descoberta sensorial.", "standard", ["age-safety", "material"]),

  item("explore-activity-mat", "Tapete de actividades", "brincar-explorar", "Base confortável para explorar no chão.", "standard", ["dimensions", "material", "age-safety"]),
  item("explore-stable-push-toy", "Brinquedo de empurrar estável, adequado à idade", "brincar-explorar", "Apoio lúdico para movimento acompanhado.", "standard", ["age-safety"]),
  item("explore-small-slide", "Escorrega infantil pequeno", "brincar-explorar", "Pequena aventura para brincar com supervisão.", "standard", ["dimensions", "age-safety"]),
  item("explore-childrens-tent", "Tenda infantil", "brincar-explorar", "Refúgio de imaginação para brincar em casa.", "standard", ["dimensions", "age-safety"]),
  item("explore-water-play-table", "Mesa de brincar com água", "brincar-explorar", "Exploração de água sob supervisão.", "standard", ["dimensions", "age-safety"]),
  item("explore-large-soft-ball", "Bola grande e macia", "brincar-explorar", "Movimento suave para brincar acompanhado.", "standard", ["age-safety", "material"]),
  item("explore-small-inflatable-pool", "Piscina insuflável pequena", "brincar-explorar", "Brincadeira de água exclusivamente supervisionada.", "standard", ["dimensions", "age-safety"]),

  item("essentials-childrens-plates", "Pratos infantis", "pequenos-essenciais", "Peças práticas para as refeições da Aylla.", "standard", ["material"]),
  item("essentials-learning-cups", "Copos de aprendizagem", "pequenos-essenciais", "Apoio à rotina de beber com autonomia.", "standard", ["material", "age-safety"]),
  item("essentials-childrens-cutlery", "Talheres infantis", "pequenos-essenciais", "Pequenos talheres para as primeiras refeições.", "standard", ["material", "age-safety"]),
  item("essentials-feeding-chair", "Cadeira de alimentação", "pequenos-essenciais", "Lugar dedicado para refeições em família.", "standard", ["dimensions", "age-safety"]),
  item("essentials-childrens-backpack", "Mochila infantil", "pequenos-essenciais", "Pequena companhia para saídas e descobertas.", "standard", ["colour", "material"]),
  item("essentials-childrens-thermal-bottle", "Garrafa térmica infantil", "pequenos-essenciais", "Peça funcional para as rotinas fora de casa.", "standard", ["material", "age-safety"]),
  item("essentials-waterproof-bibs", "Babadores impermeáveis", "pequenos-essenciais", "Protecção prática para as refeições.", "standard", ["material"]),

  item("keepsakes-mana-dior-savings-bank", "Cofrinho para a poupança da Mana Dior", "tesouros-recordacoes", "Peça simbólica para começar a guardar sonhos.", "standard", ["personalisation"]),
  item("keepsakes-photo-album", "Álbum de fotografias", "tesouros-recordacoes", "Páginas para reunir os primeiros momentos.", "standard"),
  item("keepsakes-personalised-memory-box", "Caixa de recordações personalizada", "tesouros-recordacoes", "Arquivo personalizado para memórias preciosas.", "standard", ["personalisation", "overlap-review"]),
  item("keepsakes-first-year-memory-book", "Livro de memórias do primeiro ano", "tesouros-recordacoes", "Registo delicado do primeiro ano da Aylla.", "standard"),
  item("keepsakes-personalised-commemorative-gift", "Presente comemorativo personalizado", "tesouros-recordacoes", "Peça de celebração a definir com a família.", "standard", ["personalisation"]),
] as const;

const CATEGORY_MAP = new Map(AYLLA_GIFT_CATEGORIES.map((c) => [c.id, c.title]));
const ITEM_MAP = new Map(AYLLA_CANONICAL_CATALOG_ITEMS.map((entry) => [entry.id, entry]));

export function findAyllaCatalogItem(itemId: string): AyllaGiftCatalogItemDefinition | null {
  return ITEM_MAP.get(itemId) ?? null;
}

/**
 * Reconciles each of the 52 curated articles against the live Core PostgreSQL inventory
 * record while keeping editorial curation, specs, safety, quantities, and enablement strictly distinct.
 */
export function reconcileAyllaCatalogInventory(
  inventoryRows: readonly CoreGiftInventoryRecord[],
  reservedQuantities: ReadonlyMap<string, number>
): readonly AyllaGiftReconciledItem[] {
  const rowMap = new Map(inventoryRows.map((row) => [row.itemId, row]));

  return AYLLA_CANONICAL_CATALOG_ITEMS.map((definition) => {
    const row = rowMap.get(definition.id);
    const familyApproved = Boolean(row?.familyApproved);
    const specificationsComplete = Boolean(row?.specificationsComplete);
    const childSafetyValidated = Boolean(row?.childSafetyValidated);
    const approvedQuantity = row?.approvedQuantity ?? null;
    const enabled = Boolean(row?.enabled);
    const reservedQuantity = reservedQuantities.get(definition.id) ?? 0;
    const remainingQuantity =
      approvedQuantity === null ? 0 : Math.max(0, approvedQuantity - reservedQuantity);
    const reservable = Boolean(
      familyApproved &&
        specificationsComplete &&
        childSafetyValidated &&
        approvedQuantity !== null &&
        enabled &&
        remainingQuantity > 0
    );

    const pendingRequirements: string[] = [];
    if (!familyApproved) pendingRequirements.push("Aprovação da família");
    if (approvedQuantity === null) pendingRequirements.push("Quantidade autorizada");
    if (!specificationsComplete) pendingRequirements.push("Especificações completas");
    if (!childSafetyValidated) pendingRequirements.push("Validação de segurança infantil");
    if (!enabled) pendingRequirements.push("Activação operacional");

    return {
      definition,
      categoryTitle: CATEGORY_MAP.get(definition.category) ?? definition.category,
      editorialCurated: true,
      familyApproved,
      specificationsComplete,
      childSafetyValidated,
      approvedQuantity,
      enabled,
      reservedQuantity,
      remainingQuantity,
      reservable,
      pendingRequirements,
    };
  });
}
