import type { FloorPlanElementKind, FloorPlanPrintTemplate } from "@/lib/events/floor-plan/types";

export const FLOOR_PLAN_GOLD = "#B88A2A";
export const FLOOR_PLAN_GOLD_SOFT = "#D4B87A";
export const FLOOR_PLAN_INK = "#1C1814";
export const FLOOR_PLAN_MUTED = "#6B5E4A";

export const TEMPLATE_LABELS: Record<FloorPlanPrintTemplate, string> = {
  technical: "Croqui técnico",
  client: "Planta para cliente",
  staff: "Planta operacional",
  "seating-chart": "Seating chart",
};

export type FloorPlanTheme = {
  roomFill: string;
  roomStroke: string;
  gridStroke: string;
  gridOpacity: number;
  tableFill: string;
  tableStroke: string;
  tableLabel: string;
  tableMeta: string;
  elementFill: string;
  elementStroke: string;
  elementLabel: string;
  seatOccupied: string;
  seatEmpty: string;
  seatStroke: string;
  showGrid: boolean;
  showScale: boolean;
  showNorth: boolean;
  showDimensions: boolean;
  serifLabels: boolean;
};

export function themeForTemplate(template: FloorPlanPrintTemplate): FloorPlanTheme {
  switch (template) {
    case "client":
      return {
        roomFill: "#FBF8F3",
        roomStroke: FLOOR_PLAN_GOLD,
        gridStroke: "#E8DFD0",
        gridOpacity: 0.35,
        tableFill: "#F5EDE0",
        tableStroke: "#9A7B3C",
        tableLabel: FLOOR_PLAN_INK,
        tableMeta: FLOOR_PLAN_MUTED,
        elementFill: "#F0EBE3",
        elementStroke: "#C4B59A",
        elementLabel: FLOOR_PLAN_INK,
        seatOccupied: FLOOR_PLAN_GOLD,
        seatEmpty: "#FFFCF8",
        seatStroke: "#A68942",
        showGrid: false,
        showScale: true,
        showNorth: true,
        showDimensions: false,
        serifLabels: true,
      };
    case "staff":
      return {
        roomFill: "#FFFFFF",
        roomStroke: "#2A2620",
        gridStroke: "#D9D2C6",
        gridOpacity: 0.55,
        tableFill: "#FFF9EE",
        tableStroke: "#3D362C",
        tableLabel: FLOOR_PLAN_INK,
        tableMeta: "#5C5348",
        elementFill: "#ECE8E1",
        elementStroke: "#4A4339",
        elementLabel: FLOOR_PLAN_INK,
        seatOccupied: "#2F6B4F",
        seatEmpty: "#FFFFFF",
        seatStroke: "#3D362C",
        showGrid: true,
        showScale: true,
        showNorth: true,
        showDimensions: false,
        serifLabels: false,
      };
    case "seating-chart":
      return {
        roomFill: "#FFFFFF",
        roomStroke: FLOOR_PLAN_GOLD,
        gridStroke: "#EDE6DA",
        gridOpacity: 0.25,
        tableFill: "#FAF6EF",
        tableStroke: FLOOR_PLAN_GOLD_SOFT,
        tableLabel: FLOOR_PLAN_INK,
        tableMeta: FLOOR_PLAN_MUTED,
        elementFill: "#F4F0E8",
        elementStroke: "#D8CEBC",
        elementLabel: FLOOR_PLAN_MUTED,
        seatOccupied: FLOOR_PLAN_GOLD,
        seatEmpty: "#FFFFFF",
        seatStroke: FLOOR_PLAN_GOLD_SOFT,
        showGrid: false,
        showScale: false,
        showNorth: false,
        showDimensions: false,
        serifLabels: true,
      };
    default:
      return {
        roomFill: "#FFFFFF",
        roomStroke: "#2E2922",
        gridStroke: "#D7D0C4",
        gridOpacity: 1,
        tableFill: "#F3EAD8",
        tableStroke: "#554A3C",
        tableLabel: "#29231B",
        tableMeta: "#6F604B",
        elementFill: "#E8E5DF",
        elementStroke: "#554A3C",
        elementLabel: "#29231B",
        seatOccupied: "#B89552",
        seatEmpty: "#FFFFFF",
        seatStroke: "#8B7345",
        showGrid: true,
        showScale: true,
        showNorth: true,
        showDimensions: true,
        serifLabels: false,
      };
  }
}

export const ELEMENT_ZONE_COLORS: Partial<Record<FloorPlanElementKind, string>> = {
  stage: "#E8DFD0",
  "dance-floor": "#EDE4D4",
  buffet: "#E5EBE3",
  bar: "#E3E8ED",
  dj: "#E8E3ED",
  cake: "#F5EDE8",
  photo: "#EDE8E3",
  wc: "#E8EAED",
  reserved: "#F0EBE6",
};

export function formatOccupancy(occupied: number, capacity: number): string {
  if (capacity <= 0) return "—";
  const pct = Math.round((occupied / capacity) * 100);
  return `${occupied}/${capacity} · ${pct}%`;
}
