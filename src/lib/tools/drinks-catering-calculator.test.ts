import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateDrinksAndCatering,
  buildWhatsAppVendorMessage,
  DEFAULT_CALCULATOR_INPUTS,
} from "./drinks-catering-calculator";

describe("drinks-catering-calculator", () => {
  it("calculates baseline numbers for standard 250 adults + 25 children wedding", () => {
    const result = calculateDrinksAndCatering(DEFAULT_CALCULATOR_INPUTS);

    assert.equal(result.totals.totalGuests, 275);
    assert.ok(result.totals.totalBottlesAlcohol > 0);
    assert.ok(result.totals.totalLitersNonAlcoholic > 0);
    assert.ok(result.totals.totalCanapes > 0);
    assert.ok(result.totals.cakeWeightKg >= 24);
    assert.ok(result.totals.totalEstimatedBudgetMzn > 100000);
  });

  it("scales up quantities when consumption profile is high", () => {
    const standard = calculateDrinksAndCatering({
      ...DEFAULT_CALCULATOR_INPUTS,
      consumptionProfile: "standard",
    });

    const high = calculateDrinksAndCatering({
      ...DEFAULT_CALCULATOR_INPUTS,
      consumptionProfile: "high",
    });

    assert.ok(high.totals.totalBottlesAlcohol > standard.totals.totalBottlesAlcohol);
    assert.ok(high.totals.estimatedBeverageBudgetMzn > standard.totals.estimatedBeverageBudgetMzn);
  });

  it("respects toggles when champagne and cake are disabled", () => {
    const result = calculateDrinksAndCatering({
      ...DEFAULT_CALCULATOR_INPUTS,
      includeChampagneToast: false,
      includeWeddingCake: false,
    });

    const hasChampagne = result.beverages.some((b) => b.id === "champagne_toast");
    const hasCake = result.food.some((f) => f.id === "wedding_cake");

    assert.equal(hasChampagne, false);
    assert.equal(hasCake, false);
    assert.equal(result.totals.cakeWeightKg, 0);
  });

  it("formats valid WhatsApp vendor message containing totals and items", () => {
    const result = calculateDrinksAndCatering(DEFAULT_CALCULATOR_INPUTS);
    const msg = buildWhatsAppVendorMessage(result);

    assert.ok(msg.includes("Total de Convidados: 275"));
    assert.ok(msg.includes("ESTIMATIVA DE BEBIDAS"));
    assert.ok(msg.includes("ESTIMATIVA DE CATERING"));
    assert.ok(msg.includes("HAXR Signature"));
  });
});
