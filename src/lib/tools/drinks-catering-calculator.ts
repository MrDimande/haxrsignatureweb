export type EventStyle = "lunch" | "dinner" | "full_party";
export type ConsumptionProfile = "moderate" | "standard" | "high";

export interface CalculatorInputs {
  adults: number;
  children: number;
  durationHours: number;
  eventStyle: EventStyle;
  consumptionProfile: ConsumptionProfile;
  includeWhisky: boolean;
  includeGinBar: boolean;
  includeChampagneToast: boolean;
  includeWeddingCake: boolean;
  includeDesserts: boolean;
}

export interface BeverageItem {
  id: string;
  name: string;
  category: "champagne" | "wine" | "spirits" | "beer" | "non_alcoholic" | "ice";
  quantity: number;
  unit: string;
  detail: string;
  estimatedCostMzn: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: "canapes" | "main" | "cake" | "dessert";
  quantity: number;
  unit: string;
  detail: string;
  estimatedCostMzn: number;
}

export interface CalculationResult {
  inputs: CalculatorInputs;
  totals: {
    totalGuests: number;
    totalBottlesAlcohol: number;
    totalLitersNonAlcoholic: number;
    totalIceKg: number;
    totalCanapes: number;
    cakeWeightKg: number;
    estimatedBeverageBudgetMzn: number;
    estimatedFoodBudgetMzn: number;
    totalEstimatedBudgetMzn: number;
  };
  beverages: BeverageItem[];
  food: FoodItem[];
}

export const DEFAULT_CALCULATOR_INPUTS: CalculatorInputs = {
  adults: 250,
  children: 25,
  durationHours: 8,
  eventStyle: "dinner",
  consumptionProfile: "standard",
  includeWhisky: true,
  includeGinBar: true,
  includeChampagneToast: true,
  includeWeddingCake: true,
  includeDesserts: true,
};

const PROFILE_MULTIPLIERS: Record<ConsumptionProfile, number> = {
  moderate: 0.8,
  standard: 1.0,
  high: 1.35,
};

const DURATION_MULTIPLIERS: Record<EventStyle, number> = {
  lunch: 0.85,
  dinner: 1.0,
  full_party: 1.25,
};

/**
 * Calculates beverage & catering quantities calibrated for Mozambican weddings and events.
 */
export function calculateDrinksAndCatering(inputs: CalculatorInputs): CalculationResult {
  const {
    adults,
    children,
    eventStyle,
    consumptionProfile,
    includeWhisky,
    includeGinBar,
    includeChampagneToast,
    includeWeddingCake,
    includeDesserts,
  } = inputs;

  const totalGuests = adults + children;
  const alcoholMult = PROFILE_MULTIPLIERS[consumptionProfile] * DURATION_MULTIPLIERS[eventStyle];
  const drinkingAdults = Math.round(adults * 0.82); // ~82% of adults consume alcohol

  const beverages: BeverageItem[] = [];
  const food: FoodItem[] = [];

  // ── 1. Champanhe / Espumante para o Brinde ──
  if (includeChampagneToast) {
    // 1 garrafa (750ml) serve ~6 taças para o brinde protocolar
    const bottlesChampagne = Math.ceil(adults / 6);
    beverages.push({
      id: "champagne_toast",
      name: "Champanhe / Espumante de Brinde",
      category: "champagne",
      quantity: bottlesChampagne,
      unit: "garrafas (750ml)",
      detail: `Ideal para o brinde protocolar de ${adults} adultos (~6 taças por garrafa).`,
      estimatedCostMzn: bottlesChampagne * 1250, // Estimativa média MZN
    });
  }

  // ── 2. Vinhos de Mesa (Tinto & Branco) ──
  // Durante a refeição: 1 garrafa para cada 2.5 adultos
  const baseWineBottles = Math.ceil((drinkingAdults / 2.5) * alcoholMult);
  const redWineBottles = Math.ceil(baseWineBottles * 0.55);
  const whiteWineBottles = Math.ceil(baseWineBottles * 0.45);

  beverages.push({
    id: "wine_red",
    name: "Vinho Tinto Fino",
    category: "wine",
    quantity: redWineBottles,
    unit: "garrafas (750ml)",
    detail: "Servido durante a refeição e jantar (55% do volume de vinhos).",
    estimatedCostMzn: redWineBottles * 750,
  });

  beverages.push({
    id: "wine_white",
    name: "Vinho Branco / Verde Suave",
    category: "wine",
    quantity: whiteWineBottles,
    unit: "garrafas (750ml)",
    detail: "Servido com entradas de marisco e peixe (45% do volume).",
    estimatedCostMzn: whiteWineBottles * 750,
  });

  // ── 3. Cervejas (Nacionais & Premium) ──
  // 4 a 6 garrafas/latas por adulto consumidor
  const beerPerPerson = Math.round(4.5 * alcoholMult);
  const totalBeerUnits = drinkingAdults * beerPerPerson;
  const beerCases = Math.ceil(totalBeerUnits / 24); // Caixas de 24

  beverages.push({
    id: "beers",
    name: "Cervejas Nacionais & Premium (2M, Laurentina, Heineken)",
    category: "beer",
    quantity: totalBeerUnits,
    unit: `unidades (~${beerCases} caixas)`,
    detail: `Média de ${beerPerPerson} garrafas/latas por adulto consumidor ao longo do evento.`,
    estimatedCostMzn: totalBeerUnits * 85,
  });

  // ── 4. Destilados (Whisky & Gin Bar) ──
  if (includeWhisky) {
    // 1 garrafa (750ml) serve ~16 doses (1 garrafa para cada 12 adultos)
    const whiskyBottles = Math.ceil((drinkingAdults / 12) * alcoholMult);
    beverages.push({
      id: "whisky",
      name: "Whisky 12 Anos / Premium",
      category: "spirits",
      quantity: whiskyBottles,
      unit: "garrafas (750ml)",
      detail: `Aproximadamente ${whiskyBottles * 16} doses servidas com gelo e água.`,
      estimatedCostMzn: whiskyBottles * 2400,
    });
  }

  if (includeGinBar) {
    // 1 garrafa de Gin serve ~15 cocktails
    const ginBottles = Math.ceil((drinkingAdults / 16) * alcoholMult);
    const tonicCans = ginBottles * 16;
    beverages.push({
      id: "gin_station",
      name: "Gin Fino & Água Tónica / Botânicos",
      category: "spirits",
      quantity: ginBottles,
      unit: `garrafas Gin + ${tonicCans} Tónicas`,
      detail: "Bar aberto de Gin tónico com botânicos, zimbro e citrinos.",
      estimatedCostMzn: ginBottles * 1850 + tonicCans * 65,
    });
  }

  // ── 5. Bebidas Não Alcoólicas & Gelo ──
  // Água Mineral: 600ml por convidado
  const waterBottles = Math.ceil(totalGuests * 1.2); // Garrafas de 500ml
  beverages.push({
    id: "water",
    name: "Água Mineral (Lisa & Gás)",
    category: "non_alcoholic",
    quantity: waterBottles,
    unit: "garrafas (500ml)",
    detail: "60% água natural sem gás e 40% água com gás.",
    estimatedCostMzn: waterBottles * 25,
  });

  // Refrigerantes & Sumos: 500ml por adulto + 600ml por criança
  const sodaUnits = Math.ceil(adults * 1.5 + children * 2.2);
  beverages.push({
    id: "sodas_juices",
    name: "Refrigerantes & Sumos Naturais",
    category: "non_alcoholic",
    quantity: sodaUnits,
    unit: "latas / garrafas (330ml)",
    detail: "Coca-Cola, Fanta, Sprite, Sumos de Compal e Águas Tónicas.",
    estimatedCostMzn: sodaUnits * 50,
  });

  // Gelo em sacos de 5kg: 1.5kg por pessoa
  const totalIceKg = Math.ceil(totalGuests * 1.4);
  const iceBags = Math.ceil(totalIceKg / 5);
  beverages.push({
    id: "ice",
    name: "Gelo Filtrado para Serviço & Bar",
    category: "ice",
    quantity: iceBags,
    unit: "sacos (5kg)",
    detail: `Total de ~${totalIceKg} kg para refrigeração contínua e copos.`,
    estimatedCostMzn: iceBags * 150,
  });

  // ── 6. Catering & Salgados ──
  // Canapés & Salgados de Entrada: 7 a 9 por pessoa
  const canapesPerPerson = eventStyle === "full_party" ? 10 : 8;
  const totalCanapes = totalGuests * canapesPerPerson;
  food.push({
    id: "canapes",
    name: "Canapés & Salgados Finos de Entrada",
    category: "canapes",
    quantity: totalCanapes,
    unit: "unidades",
    detail: `Média de ${canapesPerPerson} unidades por convidado durante o cocktail volante.`,
    estimatedCostMzn: totalCanapes * 45,
  });

  // Prato Principal (Buffet completo)
  food.push({
    id: "buffet_main",
    name: "Buffet Principal (Carnes Nobres, Peixes/Mariscos & Acompanhamentos)",
    category: "main",
    quantity: totalGuests,
    unit: "cobertos completos",
    detail: "Gramagem estimada de 450g a 500g de proteína e guarnições por pessoa.",
    estimatedCostMzn: totalGuests * 1450,
  });

  // Bolo de Noiva: ~90g por convidado (1kg serve ~11 pessoas)
  if (includeWeddingCake) {
    const cakeKg = Math.ceil((totalGuests * 0.09));
    food.push({
      id: "wedding_cake",
      name: "Bolo de Casamento de Alta Confeitaria",
      category: "cake",
      quantity: cakeKg,
      unit: "kg",
      detail: `Bolo artístico com andares estruturados para ${totalGuests} fatias.`,
      estimatedCostMzn: cakeKg * 1350,
    });
  }

  // Doces Finos & Sobremesas: 4 por pessoa
  if (includeDesserts) {
    const totalDesserts = totalGuests * 4;
    food.push({
      id: "desserts",
      name: "Mesa de Sobremesas & Doces Finos",
      category: "dessert",
      quantity: totalDesserts,
      unit: "unidades",
      detail: "Brigadeiros gourmet, macarons, mini-tartes e sobremesas em taça.",
      estimatedCostMzn: totalDesserts * 40,
    });
  }

  // Totais
  const totalBottlesAlcohol =
    (includeChampagneToast ? Math.ceil(adults / 6) : 0) +
    redWineBottles +
    whiteWineBottles +
    (includeWhisky ? Math.ceil((drinkingAdults / 12) * alcoholMult) : 0) +
    (includeGinBar ? Math.ceil((drinkingAdults / 16) * alcoholMult) : 0);

  const totalLitersNonAlcoholic = Math.round((waterBottles * 0.5) + (sodaUnits * 0.33));

  const estimatedBeverageBudgetMzn = beverages.reduce((sum, item) => sum + item.estimatedCostMzn, 0);
  const estimatedFoodBudgetMzn = food.reduce((sum, item) => sum + item.estimatedCostMzn, 0);

  return {
    inputs,
    totals: {
      totalGuests,
      totalBottlesAlcohol,
      totalLitersNonAlcoholic,
      totalIceKg,
      totalCanapes,
      cakeWeightKg: includeWeddingCake ? Math.ceil(totalGuests * 0.09) : 0,
      estimatedBeverageBudgetMzn,
      estimatedFoodBudgetMzn,
      totalEstimatedBudgetMzn: estimatedBeverageBudgetMzn + estimatedFoodBudgetMzn,
    },
    beverages,
    food,
  };
}

/**
 * Builds a formatted WhatsApp quotation message to send directly to drink / catering suppliers.
 */
export function buildWhatsAppVendorMessage(result: CalculationResult): string {
  const { inputs, totals, beverages, food } = result;

  const bevList = beverages
    .map((b) => `• ${b.name}: ${b.quantity} ${b.unit}`)
    .join("\n");

  const foodList = food
    .map((f) => `• ${f.name}: ${f.quantity} ${f.unit}`)
    .join("\n");

  return `Olá! Estivemos a planear o nosso casamento com a Calculadora da HAXR Signature e gostaríamos de solicitar uma cotação para o nosso evento com os seguintes dados:

👥 *DADOS DO EVENTO*:
• Total de Convidados: ${totals.totalGuests} (${inputs.adults} adultos, ${inputs.children} crianças)
• Estilo: ${inputs.eventStyle === "full_party" ? "Festa Completa até de Madrugada" : inputs.eventStyle === "dinner" ? "Jantar & Recepção" : "Almoço & Tarde"}
• Duração: ~${inputs.durationHours} horas

🍾 *ESTIMATIVA DE BEBIDAS*:
${bevList}

🍽️ *ESTIMATIVA DE CATERING*:
${foodList}

💰 *Orçamento Estimado*: ~${totals.totalEstimatedBudgetMzn.toLocaleString("pt-MZ")} MT

Poderiam partilhar a vossa disponibilidade e proposta formal para esta quantidade? Obrigado!`;
}
