export type VendorSeasonality = {
  status: "open" | "limited" | "closing_soon";
  statusBadge: string;
  seasonAlert: string;
  recommendedAdvance: string;
  peakSeasonMonths: string;
  availableYears: string[];
};

export const DEFAULT_VENDOR_SEASONALITY: VendorSeasonality = {
  status: "open",
  statusBadge: "Agenda 2025/2026 Aberta",
  seasonAlert: "Datas de Outubro a Dezembro com 75% de ocupação em Maputo e arredores.",
  recommendedAdvance: "6 a 9 meses de antecedência recomendados",
  peakSeasonMonths: "Setembro a Dezembro (Época Alta em Moçambique)",
  availableYears: ["2025", "2026"],
};
