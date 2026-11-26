import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  AYLLA_CANONICAL_CATALOG_ITEMS,
  AYLLA_GIFT_CATEGORIES,
  reconcileAyllaCatalogInventory,
} from "@/lib/edition/gifts/aylla/catalog-items";
import { AYLLA_GIFTS_CONFIG } from "@/lib/edition/gifts/aylla/config";
import type { AyllaAdminReservationView } from "@/lib/edition/gifts/aylla/admin-store";
import {
  AYLLA_REVIEW_FLAG_LABELS,
  computeAyllaGlobalSummary,
  countAyllaItemsByFilter,
  evaluateAyllaDraftRequirements,
  groupAyllaItemsByCategory,
  isAyllaDraftDirty,
  mergeAyllaInventoryDraft,
  stepAyllaDraftQuantity,
  toAyllaInventoryDraft,
} from "@/lib/edition/gifts/aylla/curation-view";

function buildMixedCatalogItems() {
  const rows = [
    // Ready & reservable item (approved=3, reserved=1 -> remaining=2)
    {
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      registryKey: AYLLA_GIFTS_CONFIG.registryKey,
      itemId: "dream-cot-sheets",
      familyApproved: true,
      enabled: true,
      approvedQuantity: 3,
      specificationsComplete: true,
      childSafetyValidated: true,
    },
    // Approved + specs + safety + qty, not yet enabled
    {
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      registryKey: AYLLA_GIFTS_CONFIG.registryKey,
      itemId: "dream-blankets",
      familyApproved: true,
      enabled: false,
      approvedQuantity: 2,
      specificationsComplete: true,
      childSafetyValidated: true,
    },
    // Approved by family, missing specs/safety/qty/activation
    {
      eventId: AYLLA_GIFTS_CONFIG.eventId,
      registryKey: AYLLA_GIFTS_CONFIG.registryKey,
      itemId: "wardrobe-princess-dresses",
      familyApproved: true,
      enabled: false,
      approvedQuantity: null,
      specificationsComplete: false,
      childSafetyValidated: false,
    },
  ];
  const reserved = new Map<string, number>([["dream-cot-sheets", 1]]);
  return reconcileAyllaCatalogInventory(rows, reserved);
}

describe("AyllaGiftAdminPanel curation view model", () => {
  it("preserves all 52 fail-closed canonical items across 7 categories with zero invented approvals", () => {
    const items = reconcileAyllaCatalogInventory([], new Map());
    const summary = computeAyllaGlobalSummary(items, []);
    const groups = groupAyllaItemsByCategory(AYLLA_GIFT_CATEGORIES, items, "", "all");

    assert.equal(AYLLA_GIFT_CATEGORIES.length, 7);
    assert.equal(AYLLA_CANONICAL_CATALOG_ITEMS.length, 52);
    assert.equal(summary.total, 52);
    assert.equal(summary.approvedCount, 0);
    assert.equal(summary.enabledCount, 0);
    assert.equal(summary.readyCount, 0);
    assert.equal(summary.pendingCount, 52);
    assert.equal(summary.pendingApprovalCount, 52);
    assert.equal(summary.totalAuthorizedUnits, 0);
    assert.equal(summary.approvalPercent, 0);

    assert.equal(groups.length, 7);
    const groupedItemCount = groups.reduce((acc, g) => acc + g.matchingItems.length, 0);
    assert.equal(groupedItemCount, 52);
    assert.ok(groups.every((g) => g.progressPercent === 0));
  });

  it("computes global approvals, category progress, and active reservations accurately", () => {
    const items = buildMixedCatalogItems();
    const reservations: AyllaAdminReservationView[] = [
      {
        id: "res-1",
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        itemId: "dream-cot-sheets",
        guestId: "guest-1",
        guestName: "Tia Rosa",
        guestPhone: "+258840000001",
        guestEmail: "",
        guestStatus: "confirmed",
        quantity: 1,
        status: "reserved",
        createdAt: "2026-11-26T12:00:00Z",
        updatedAt: "2026-11-26T12:00:00Z",
        cancelledAt: null,
        purchasedAt: null,
        deliveredAt: null,
      },
      {
        id: "res-2",
        eventId: AYLLA_GIFTS_CONFIG.eventId,
        itemId: "dream-cot-sheets",
        guestId: "guest-2",
        guestName: "Tio Paulo",
        guestPhone: "",
        guestEmail: "tio@example.com",
        guestStatus: "confirmed",
        quantity: 1,
        status: "cancelled",
        createdAt: "2026-11-26T11:00:00Z",
        updatedAt: "2026-11-26T11:30:00Z",
        cancelledAt: "2026-11-26T11:30:00Z",
        purchasedAt: null,
        deliveredAt: null,
      },
    ];

    const summary = computeAyllaGlobalSummary(items, reservations);
    assert.equal(summary.approvedCount, 3);
    assert.equal(summary.enabledCount, 1);
    assert.equal(summary.readyCount, 1);
    assert.equal(summary.pendingCount, 51);
    assert.equal(summary.pendingApprovalCount, 49);
    assert.equal(summary.totalAuthorizedUnits, 5);
    assert.equal(summary.activeReservations, 1);

    const groups = groupAyllaItemsByCategory(AYLLA_GIFT_CATEGORIES, items, "", "all");
    const dreamsGroup = groups.find((g) => g.category.id === "cantinho-dos-sonhos");
    assert.ok(dreamsGroup);
    assert.equal(dreamsGroup.totalInCategory, 11);
    assert.equal(dreamsGroup.approvedCount, 2);
    assert.equal(dreamsGroup.enabledCount, 1);
    assert.equal(dreamsGroup.progressPercent, 18);
    assert.equal(dreamsGroup.totalAuthorizedUnits, 5);
  });

  it("supports instant search and operational state filters cleanly", () => {
    const items = buildMixedCatalogItems();
    const counts = countAyllaItemsByFilter(items);
    assert.equal(counts.all, 52);
    assert.equal(counts.approved, 3);
    assert.equal(counts.pending_approval, 49);
    assert.equal(counts.pending_requirements, 51);
    assert.equal(counts.enabled, 1);
    assert.equal(counts.ready, 1);
    assert.equal(counts.reserved, 1);

    const byName = groupAyllaItemsByCategory(AYLLA_GIFT_CATEGORIES, items, "berço", "all");
    const nameMatches = byName.flatMap((g) => g.matchingItems);
    assert.equal(nameMatches.length, 1);
    assert.equal(nameMatches[0].definition.id, "dream-cot-sheets");

    const approvedGroups = groupAyllaItemsByCategory(AYLLA_GIFT_CATEGORIES, items, "", "approved");
    assert.equal(approvedGroups.flatMap((g) => g.matchingItems).length, 3);
  });

  it("identifies pending requirements, clamps quantity steppers, and auto-disables enabled on missing gate", () => {
    const items = buildMixedCatalogItems();
    const reservedItem = items.find((i) => i.definition.id === "dream-cot-sheets")!;

    let draft = toAyllaInventoryDraft(reservedItem);
    assert.equal(isAyllaDraftDirty(reservedItem, draft), false);
    assert.equal(evaluateAyllaDraftRequirements(draft, reservedItem.reservedQuantity).prerequisitesMet, true);
    assert.deepEqual(evaluateAyllaDraftRequirements(draft, reservedItem.reservedQuantity).pendingRequirements, []);

    // Stepper respects active reservation floor (minQty = max(1, reservedQuantity = 1))
    assert.equal(stepAyllaDraftQuantity(draft.approvedQuantity, 1, 1), "4");
    assert.equal(stepAyllaDraftQuantity("1", -1, 1), "1");
    assert.equal(stepAyllaDraftQuantity("", 1, 0), "1");

    // Revoking family approval automatically turns enabled off so SQL 23514 never fires
    draft = mergeAyllaInventoryDraft(draft, { familyApproved: false }, reservedItem.reservedQuantity);
    assert.equal(draft.enabled, false);
    assert.equal(isAyllaDraftDirty(reservedItem, draft), true);

    const evalAfterRevoke = evaluateAyllaDraftRequirements(draft, reservedItem.reservedQuantity);
    assert.equal(evalAfterRevoke.prerequisitesMet, false);
    assert.ok(evalAfterRevoke.pendingRequirements.includes("Aprovação da família"));
    assert.ok(evalAfterRevoke.pendingRequirements.includes("Activação operacional"));

    // Lowering quantity below reservedQuantity surfaces exact floor warning
    const lowQtyDraft = mergeAyllaInventoryDraft(
      toAyllaInventoryDraft(reservedItem),
      { approvedQuantity: "1" },
      2
    );
    assert.equal(lowQtyDraft.enabled, false);
    assert.ok(
      evaluateAyllaDraftRequirements(lowQtyDraft, 2).pendingRequirements.includes(
        "Quantidade >= reservado (2)"
      )
    );
  });

  it("enforces Alta Costura Digital icon rules and localizes all review flags", () => {
    const componentSource = readFileSync(
      resolve(process.cwd(), "src/components/events/AyllaGiftAdminPanel.tsx"),
      "utf8"
    );

    // Ban in .cursor/rules/alta-costura-digital-ux.mdc
    assert.doesNotMatch(componentSource, /\b(Sparkles|Star|Zap|Rocket|Trophy)\b/);
    // Preserves existing actions without reconstructing reservation engine
    assert.match(componentSource, /updateAyllaGiftInventoryAction/);
    assert.match(componentSource, /transitionAyllaGiftReservationAction/);

    const flagKeys = Object.keys(AYLLA_REVIEW_FLAG_LABELS);
    assert.deepEqual(flagKeys.sort(), [
      "age-safety",
      "colour",
      "dimensions",
      "material",
      "overlap-review",
      "personalisation",
      "size",
    ]);
  });
});
