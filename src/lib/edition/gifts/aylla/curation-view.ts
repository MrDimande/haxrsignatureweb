import type {
  AyllaGiftCategoryDefinition,
  AyllaGiftReconciledItem,
  AyllaGiftReviewFlag,
} from "./catalog-items";
import type { AyllaAdminReservationView } from "./admin-store";

export type AyllaCurationStateFilter =
  | "all"
  | "pending_approval"
  | "pending_requirements"
  | "approved"
  | "enabled"
  | "ready"
  | "reserved";

export type AyllaInventoryDraft = {
  familyApproved: boolean;
  specificationsComplete: boolean;
  childSafetyValidated: boolean;
  approvedQuantity: string;
  enabled: boolean;
};

export const AYLLA_REVIEW_FLAG_LABELS: Record<AyllaGiftReviewFlag, string> = {
  "age-safety": "Segurança etária",
  dimensions: "Dimensões",
  size: "Tamanho",
  colour: "Cor",
  material: "Material",
  personalisation: "Personalização",
  "overlap-review": "Revisão de sobreposição",
};

export const AYLLA_STATE_FILTER_OPTIONS: ReadonlyArray<{
  id: AyllaCurationStateFilter;
  label: string;
}> = [
  { id: "all", label: "Todos" },
  { id: "pending_approval", label: "Por aprovar" },
  { id: "pending_requirements", label: "Req. pendentes" },
  { id: "approved", label: "Aprovados" },
  { id: "enabled", label: "Activos" },
  { id: "ready", label: "Disponíveis" },
  { id: "reserved", label: "Com reservas" },
];

export interface AyllaGlobalCurationSummary {
  total: number;
  approvedCount: number;
  specsCount: number;
  safetyCount: number;
  enabledCount: number;
  readyCount: number;
  pendingCount: number;
  pendingApprovalCount: number;
  totalAuthorizedUnits: number;
  totalReservedUnits: number;
  activeReservations: number;
  approvalPercent: number;
  readinessPercent: number;
}

export interface AyllaCategoryCurationGroup {
  category: AyllaGiftCategoryDefinition;
  totalInCategory: number;
  approvedCount: number;
  enabledCount: number;
  readyCount: number;
  pendingCount: number;
  progressPercent: number;
  totalAuthorizedUnits: number;
  matchingItems: AyllaGiftReconciledItem[];
}

export interface AyllaDraftRequirementState {
  parsedQuantity: number | null;
  quantityValid: boolean;
  prerequisitesMet: boolean;
  pendingRequirements: string[];
  satisfiedCount: number;
}

/**
 * Converts a reconciled inventory item into an editable client draft without
 * inventing approvals or defaulting quantities.
 */
export function toAyllaInventoryDraft(item: AyllaGiftReconciledItem): AyllaInventoryDraft {
  return {
    familyApproved: item.familyApproved,
    specificationsComplete: item.specificationsComplete,
    childSafetyValidated: item.childSafetyValidated,
    approvedQuantity: item.approvedQuantity != null ? String(item.approvedQuantity) : "",
    enabled: item.enabled,
  };
}

/**
 * Evaluates live operational gates and pending requirements for an item draft,
 * mirroring the Core fail-closed SQL constraints.
 */
export function evaluateAyllaDraftRequirements(
  draft: AyllaInventoryDraft,
  reservedQuantity: number
): AyllaDraftRequirementState {
  const trimmed = draft.approvedQuantity.trim();
  const parsed = trimmed ? Number.parseInt(trimmed, 10) : null;
  const isWholePositive =
    parsed !== null &&
    /^\d+$/.test(trimmed) &&
    Number.isSafeInteger(parsed) &&
    parsed > 0;
  const parsedQuantity = isWholePositive ? parsed : null;
  const quantityValid =
    parsedQuantity !== null && parsedQuantity >= Math.max(1, reservedQuantity);

  const prerequisitesMet = Boolean(
    draft.familyApproved &&
      draft.specificationsComplete &&
      draft.childSafetyValidated &&
      quantityValid
  );

  const pendingRequirements: string[] = [];
  if (!draft.familyApproved) pendingRequirements.push("Aprovação da família");
  if (!quantityValid) {
    pendingRequirements.push(
      parsedQuantity !== null && parsedQuantity < reservedQuantity
        ? `Quantidade >= reservado (${reservedQuantity})`
        : "Quantidade autorizada"
    );
  }
  if (!draft.specificationsComplete) pendingRequirements.push("Especificações completas");
  if (!draft.childSafetyValidated) pendingRequirements.push("Validação de segurança infantil");
  if (!draft.enabled) pendingRequirements.push("Activação operacional");

  return {
    parsedQuantity,
    quantityValid,
    prerequisitesMet,
    pendingRequirements,
    satisfiedCount: 5 - pendingRequirements.length,
  };
}

/**
 * Returns true if the local curation draft differs from the persisted Core snapshot.
 */
export function isAyllaDraftDirty(
  item: AyllaGiftReconciledItem,
  draft: AyllaInventoryDraft
): boolean {
  const initial = toAyllaInventoryDraft(item);
  return (
    initial.familyApproved !== draft.familyApproved ||
    initial.specificationsComplete !== draft.specificationsComplete ||
    initial.childSafetyValidated !== draft.childSafetyValidated ||
    initial.approvedQuantity !== draft.approvedQuantity.trim() ||
    initial.enabled !== draft.enabled
  );
}

/**
 * Applies a partial update to a draft while automatically turning off `enabled`
 * if any mandatory approval/spec/safety/quantity prerequisite becomes false.
 */
export function mergeAyllaInventoryDraft(
  current: AyllaInventoryDraft,
  patch: Partial<AyllaInventoryDraft>,
  reservedQuantity: number
): AyllaInventoryDraft {
  const next: AyllaInventoryDraft = {
    ...current,
    ...patch,
  };

  if (patch.enabled === undefined && next.enabled) {
    const check = evaluateAyllaDraftRequirements(next, reservedQuantity);
    if (!check.prerequisitesMet) {
      next.enabled = false;
    }
  }

  return next;
}

/**
 * Steps the quantity draft safely up or down without going below reserved units.
 */
export function stepAyllaDraftQuantity(
  currentRaw: string,
  delta: 1 | -1,
  reservedQuantity: number
): string {
  const minQty = Math.max(1, reservedQuantity);
  const parsed = currentRaw.trim() ? Number.parseInt(currentRaw.trim(), 10) : 0;
  const safeCurrent = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const nextValue = Math.max(minQty, safeCurrent + delta);
  return String(nextValue);
}

/**
 * Computes global approval, readiness, and inventory totals across all 52 items.
 */
export function computeAyllaGlobalSummary(
  items: readonly AyllaGiftReconciledItem[],
  reservations: readonly AyllaAdminReservationView[]
): AyllaGlobalCurationSummary {
  const total = items.length;
  let approvedCount = 0;
  let specsCount = 0;
  let safetyCount = 0;
  let enabledCount = 0;
  let readyCount = 0;
  let pendingCount = 0;
  let pendingApprovalCount = 0;
  let totalAuthorizedUnits = 0;
  let totalReservedUnits = 0;

  for (const item of items) {
    if (item.familyApproved) approvedCount += 1;
    else pendingApprovalCount += 1;

    if (item.specificationsComplete) specsCount += 1;
    if (item.childSafetyValidated) safetyCount += 1;
    if (item.enabled) enabledCount += 1;
    if (item.reservable) readyCount += 1;
    if (item.pendingRequirements.length > 0) pendingCount += 1;
    if (item.approvedQuantity !== null && item.approvedQuantity > 0) {
      totalAuthorizedUnits += item.approvedQuantity;
    }
    totalReservedUnits += item.reservedQuantity;
  }

  const activeReservations = reservations.filter(
    (r) => r.status === "reserved" || r.status === "purchased" || r.status === "delivered"
  ).length;

  return {
    total,
    approvedCount,
    specsCount,
    safetyCount,
    enabledCount,
    readyCount,
    pendingCount,
    pendingApprovalCount,
    totalAuthorizedUnits,
    totalReservedUnits,
    activeReservations,
    approvalPercent: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
    readinessPercent: total > 0 ? Math.round((readyCount / total) * 100) : 0,
  };
}

/**
 * Evaluates whether an item matches a given operational state filter.
 */
export function matchesAyllaStateFilter(
  item: AyllaGiftReconciledItem,
  stateFilter: AyllaCurationStateFilter
): boolean {
  switch (stateFilter) {
    case "all":
      return true;
    case "pending_approval":
      return !item.familyApproved;
    case "pending_requirements":
      return item.pendingRequirements.length > 0;
    case "approved":
      return item.familyApproved;
    case "enabled":
      return item.enabled;
    case "ready":
      return item.reservable;
    case "reserved":
      return item.reservedQuantity > 0;
  }
}

/**
 * Computes exact per-filter counts across all canonical catalog items.
 */
export function countAyllaItemsByFilter(
  items: readonly AyllaGiftReconciledItem[]
): Record<AyllaCurationStateFilter, number> {
  return {
    all: items.length,
    pending_approval: items.filter((item) => matchesAyllaStateFilter(item, "pending_approval")).length,
    pending_requirements: items.filter((item) => matchesAyllaStateFilter(item, "pending_requirements")).length,
    approved: items.filter((item) => matchesAyllaStateFilter(item, "approved")).length,
    enabled: items.filter((item) => matchesAyllaStateFilter(item, "enabled")).length,
    ready: items.filter((item) => matchesAyllaStateFilter(item, "ready")).length,
    reserved: items.filter((item) => matchesAyllaStateFilter(item, "reserved")).length,
  };
}

/**
 * Groups the catalog into the 7 canonical categories with category-level curation
 * progress metrics and search/state-filtered matching items.
 */
export function groupAyllaItemsByCategory(
  categories: readonly AyllaGiftCategoryDefinition[],
  items: readonly AyllaGiftReconciledItem[],
  search: string,
  stateFilter: AyllaCurationStateFilter
): AyllaCategoryCurationGroup[] {
  const normalizedQuery = search.trim().toLowerCase();

  return categories.map((category) => {
    const categoryItems = items.filter((item) => item.definition.category === category.id);
    let approvedCount = 0;
    let enabledCount = 0;
    let readyCount = 0;
    let pendingCount = 0;
    let totalAuthorizedUnits = 0;

    for (const item of categoryItems) {
      if (item.familyApproved) approvedCount += 1;
      if (item.enabled) enabledCount += 1;
      if (item.reservable) readyCount += 1;
      if (item.pendingRequirements.length > 0) pendingCount += 1;
      if (item.approvedQuantity !== null && item.approvedQuantity > 0) {
        totalAuthorizedUnits += item.approvedQuantity;
      }
    }

    const matchingItems = categoryItems.filter((item) => {
      if (!matchesAyllaStateFilter(item, stateFilter)) return false;
      if (!normalizedQuery) return true;
      return (
        item.definition.name.toLowerCase().includes(normalizedQuery) ||
        item.definition.description.toLowerCase().includes(normalizedQuery) ||
        item.definition.id.toLowerCase().includes(normalizedQuery) ||
        item.categoryTitle.toLowerCase().includes(normalizedQuery)
      );
    });

    const totalInCategory = categoryItems.length;
    const progressPercent =
      totalInCategory > 0 ? Math.round((approvedCount / totalInCategory) * 100) : 0;

    return {
      category,
      totalInCategory,
      approvedCount,
      enabledCount,
      readyCount,
      pendingCount,
      progressPercent,
      totalAuthorizedUnits,
      matchingItems,
    };
  });
}
