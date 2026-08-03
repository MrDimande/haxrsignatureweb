import type { EventSeat } from "@/lib/events/types";

export type FloorPlanTableShape =
  | "round"
  | "rectangle"
  | "square"
  | "imperial"
  | "sweetheart";

export type FloorPlanElementKind =
  | "entrance"
  | "exit"
  | "stage"
  | "dance-floor"
  | "buffet"
  | "bar"
  | "dj"
  | "cake"
  | "photo"
  | "wc"
  | "wall"
  | "column"
  | "reserved"
  | "text";

export type FloorPlanPrintTemplate =
  | "technical"
  | "client"
  | "staff"
  | "seating-chart";

export interface FloorPlanRoom {
  width: number;
  length: number;
  gridSize: number;
  unit: "m";
}

export interface FloorPlanGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
}

export interface FloorPlanTableItem extends FloorPlanGeometry {
  id: string;
  kind: "table";
  tableKey: string;
  sourceTableName: string;
  shape: FloorPlanTableShape;
}

export interface FloorPlanGenericItem extends FloorPlanGeometry {
  id: string;
  kind: "element";
  elementKind: FloorPlanElementKind;
  label: string;
}

export type FloorPlanItem = FloorPlanTableItem | FloorPlanGenericItem;

export interface FloorPlanPrintPreferences {
  format: "A4" | "A3";
  orientation: "portrait" | "landscape";
  template: FloorPlanPrintTemplate;
  showGuestNames: boolean;
}

export interface EventFloorPlan {
  eventId: string;
  room: FloorPlanRoom;
  items: FloorPlanItem[];
  printPreferences: FloorPlanPrintPreferences;
  version: number;
  updatedAt: string | null;
}

export interface FloorPlanTableSource {
  tableKey: string;
  tableName: string;
  seats: EventSeat[];
  capacity: number;
  occupied: number;
  available: number;
  guestNames: string[];
}

export interface FloorPlanSnapshot {
  room: FloorPlanRoom;
  items: FloorPlanItem[];
  printPreferences: FloorPlanPrintPreferences;
}

export interface FloorPlanHistory {
  past: FloorPlanSnapshot[];
  present: FloorPlanSnapshot;
  future: FloorPlanSnapshot[];
}

export interface FloorPlanExportContext {
  eventName: string;
  eventDate: string | null;
  eventLocation: string;
  plan: EventFloorPlan;
  tables: FloorPlanTableSource[];
}
