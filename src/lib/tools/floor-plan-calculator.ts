export type TableFormat =
  | "round_10" // Mesas Redondas de 10 pessoas (Ø 1.80m)
  | "round_12" // Mesas Redondas de 12 pessoas (Ø 2.00m)
  | "imperial_long" // Mesas Imperiais Longas de Gala
  | "hybrid_royal"; // Mesa Imperial de Honra + Mesas Redondas

export type ServiceComfortLevel = "comfort" | "standard" | "compact";

export type FloorPlanInput = {
  guestCount: number; // 50 to 1200
  tableFormat: TableFormat;
  serviceComfortLevel: ServiceComfortLevel;
  hasDanceFloor: boolean;
  hasStageBanda: boolean;
  hasBuffetStations: boolean;
  hasOpenBarStation: boolean;
  hasHonorTable: boolean;
  hasLoungeArea: boolean;
  coupleNames?: string;
  venueName?: string;
};

export type TableVisualItem = {
  id: string;
  name: string;
  type: "round" | "imperial" | "honor" | "stage" | "dancefloor" | "buffet" | "bar" | "lounge";
  capacity: number;
  seats: number;
  row?: number;
  col?: number;
};

export type FloorPlanResult = {
  input: FloorPlanInput;
  totalTables: number;
  honorTableCapacity: number;
  regularTableCount: number;
  diningAreaSqM: number;
  danceFloorSqM: number;
  danceFloorDimension: string;
  stageAreaSqM: number;
  buffetAreaSqM: number;
  barAreaSqM: number;
  loungeAreaSqM: number;
  circulationBufferSqM: number;
  minTotalAreaSqM: number;
  recommendedTotalAreaSqM: number;
  suggestedRoomDimensions: string;
  visualTables: TableVisualItem[];
  tips: string[];
};

export function calculateFloorPlan(input: FloorPlanInput): FloorPlanResult {
  const guests = Math.max(20, Math.min(1500, input.guestCount));

  // 1. Cálculo de Mesas e Capacidades
  let honorTableCapacity = 0;
  let remainingGuests = guests;
  let regularTableCount = 0;
  let seatsPerTable = 10;

  if (input.tableFormat === "round_12") {
    seatsPerTable = 12;
  } else if (input.tableFormat === "imperial_long") {
    seatsPerTable = 16; // Módulo duplo imperial
  } else {
    seatsPerTable = 10;
  }

  if (input.hasHonorTable) {
    honorTableCapacity = input.tableFormat === "hybrid_royal" ? 24 : 12;
    remainingGuests = Math.max(0, guests - honorTableCapacity);
  }

  if (input.tableFormat === "hybrid_royal") {
    seatsPerTable = 10;
    regularTableCount = Math.ceil(remainingGuests / seatsPerTable);
  } else {
    regularTableCount = Math.ceil(remainingGuests / seatsPerTable);
  }

  const totalTables = regularTableCount + (input.hasHonorTable ? 1 : 0);

  // 2. Coeficiente de área por convidado para refeição (m²)
  let areaPerGuestDining = 1.6;
  if (input.serviceComfortLevel === "comfort") {
    areaPerGuestDining = input.tableFormat === "imperial_long" ? 1.9 : 2.0;
  } else if (input.serviceComfortLevel === "compact") {
    areaPerGuestDining = 1.35;
  } else {
    areaPerGuestDining = 1.6;
  }

  const diningAreaSqM = Math.round(guests * areaPerGuestDining);

  // 3. Pista de Dança (estima-se 40% a 50% dos convidados na pista em simultâneo a 0.5m² por pessoa)
  let danceFloorSqM = 0;
  let danceFloorDimension = "Sem pista dedicada";
  if (input.hasDanceFloor) {
    const activeDancers = Math.round(guests * 0.45);
    danceFloorSqM = Math.max(30, Math.round(activeDancers * 0.55));
    const side = Math.round(Math.sqrt(danceFloorSqM) * 10) / 10;
    danceFloorDimension = `${side}m x ${side}m (${danceFloorSqM} m²)`;
  }

  // 4. Palco / Banda / DJ
  let stageAreaSqM = 0;
  if (input.hasStageBanda) {
    stageAreaSqM = guests > 300 ? 35 : 24;
  }

  // 5. Estações de Buffet
  let buffetAreaSqM = 0;
  if (input.hasBuffetStations) {
    const stationCount = Math.max(2, Math.ceil(guests / 120));
    buffetAreaSqM = stationCount * 18;
  }

  // 6. Bar de Cocktails
  let barAreaSqM = 0;
  if (input.hasOpenBarStation) {
    barAreaSqM = guests > 300 ? 25 : 18;
  }

  // 7. Lounge & Chill-out
  let loungeAreaSqM = 0;
  if (input.hasLoungeArea) {
    loungeAreaSqM = guests > 300 ? 40 : 25;
  }

  // 8. Espaço de Circulação e Segurança (corredores principais de 1.8m a 2.4m)
  const subtotalFeatures =
    diningAreaSqM + danceFloorSqM + stageAreaSqM + buffetAreaSqM + barAreaSqM + loungeAreaSqM;
  const circulationBufferSqM = Math.round(subtotalFeatures * 0.12);

  const minTotalAreaSqM = subtotalFeatures + circulationBufferSqM;
  const recommendedTotalAreaSqM = Math.round(minTotalAreaSqM * 1.12);

  // Sugestão de dimensões do salão (relação clássica 1:1.5 ou 1:1.6 de largura/comprimento)
  const widthM = Math.round(Math.sqrt(recommendedTotalAreaSqM / 1.5));
  const lengthM = Math.round(recommendedTotalAreaSqM / widthM);
  const suggestedRoomDimensions = `${widthM}m x ${lengthM}m (~${recommendedTotalAreaSqM} m²)`;

  // 9. Gerar Disposição Visual de Mesas (Grid 2D representativo)
  const visualTables: TableVisualItem[] = [];

  if (input.hasStageBanda) {
    visualTables.push({
      id: "stage-1",
      name: "Palco Banda / DJ",
      type: "stage",
      capacity: 0,
      seats: 0,
    });
  }

  if (input.hasHonorTable) {
    visualTables.push({
      id: "honor-table",
      name: "Mesa Presidencial dos Noivos & Padrinhos",
      type: "honor",
      capacity: honorTableCapacity,
      seats: honorTableCapacity,
    });
  }

  if (input.hasDanceFloor) {
    visualTables.push({
      id: "dancefloor-1",
      name: `Pista de Dança Central (${danceFloorDimension})`,
      type: "dancefloor",
      capacity: 0,
      seats: 0,
    });
  }

  for (let i = 1; i <= regularTableCount; i++) {
    visualTables.push({
      id: `table-${i}`,
      name: `Mesa ${i}`,
      type: input.tableFormat === "imperial_long" ? "imperial" : "round",
      capacity: seatsPerTable,
      seats: seatsPerTable,
    });
  }

  if (input.hasBuffetStations) {
    visualTables.push({
      id: "buffet-1",
      name: "Estação de Buffet Principal",
      type: "buffet",
      capacity: 0,
      seats: 0,
    });
  }

  if (input.hasOpenBarStation) {
    visualTables.push({
      id: "bar-1",
      name: "Bar de Cocktails & Mixologia",
      type: "bar",
      capacity: 0,
      seats: 0,
    });
  }

  if (input.hasLoungeArea) {
    visualTables.push({
      id: "lounge-1",
      name: "Zona Lounge & Sofás VIP",
      type: "lounge",
      capacity: 0,
      seats: 0,
    });
  }

  // Dicas editoriais para Moçambique
  const tips = [
    `Para ${guests} convidados, mantenha um corredor central livre de no mínimo 1.80m para a Entrada Triunfal dos noivos.`,
    "Em salões com ar condicionado em Maputo, evite colocar as mesas de pessoas idosas diretamente sob as saídas de vento frio.",
    input.hasBuffetStations
      ? "Preveja pelo menos 2 pontos de acesso simétricos ao buffet para evitar filas com mais de 8 minutos."
      : "No serviço empratado à mesa, o rácio recomendado é de 1 garçom para cada 2 mesas de 10 convidados.",
    "A pista de dança central entre a mesa dos noivos e os convidados maximiza a energia e o envolvimento visual durante a primeira dança.",
  ];

  return {
    input,
    totalTables,
    honorTableCapacity,
    regularTableCount,
    diningAreaSqM,
    danceFloorSqM,
    danceFloorDimension,
    stageAreaSqM,
    buffetAreaSqM,
    barAreaSqM,
    loungeAreaSqM,
    circulationBufferSqM,
    minTotalAreaSqM,
    recommendedTotalAreaSqM,
    suggestedRoomDimensions,
    visualTables,
    tips,
  };
}

/**
 * Formata o resumo do layout para partilha técnica no WhatsApp
 */
export function formatFloorPlanWhatsAppMessage(result: FloorPlanResult): string {
  const couple = result.input.coupleNames ? `Casamento de ${result.input.coupleNames}` : "Simulação de Layout de Salão";
  const venue = result.input.venueName ? ` 🏛️ ${result.input.venueName}` : "";

  const lines = [
    `🍽️ *FICHA TÉCNICA DE LAYOUT & SALÃO (HAXR SIGNATURE)*`,
    `✨ *${couple.toUpperCase()}*${venue}`,
    `──────────────────────────`,
    `👥 Total de Convidados: *${result.input.guestCount} pessoas*`,
    `📐 Área Mínima de Salão: *${result.minTotalAreaSqM} m²*`,
    `💎 Área Ideal Recomendada: *${result.recommendedTotalAreaSqM} m² (${result.suggestedRoomDimensions})*`,
    `──────────────────────────`,
    `📋 *DISPOSIÇÃO DE MESAS:*`,
    `• Total de Mesas: *${result.totalTables} mesas*`,
    result.input.hasHonorTable ? `• Mesa Presidencial de Honra: *${result.honorTableCapacity} lugares*` : "",
    `• Mesas de Convidados: *${result.regularTableCount} mesas (${result.visualTables[3]?.capacity || 10} lugares/mesa)*`,
    `──────────────────────────`,
    `🎪 *ÁREAS ESPECÍFICAS:*`,
    `• Espaço de Refeição: *${result.diningAreaSqM} m²*`,
    result.danceFloorSqM > 0 ? `• Pista de Dança: *${result.danceFloorDimension}*` : "",
    result.stageAreaSqM > 0 ? `• Palco / Banda / DJ: *${result.stageAreaSqM} m²*` : "",
    result.buffetAreaSqM > 0 ? `• Estações de Buffet: *${result.buffetAreaSqM} m²*` : "",
    result.barAreaSqM > 0 ? `• Bar de Cocktails: *${result.barAreaSqM} m²*` : "",
    result.loungeAreaSqM > 0 ? `• Zona Lounge: *${result.loungeAreaSqM} m²*` : "",
    `──────────────────────────`,
    `💡 *Recomendação de Circulação:* ${result.tips[0]}`,
    `📲 Gerado via HAXR Signature — Planeamento de Alto Padrão.`,
  ];

  return lines.filter(Boolean).join("\n");
}
