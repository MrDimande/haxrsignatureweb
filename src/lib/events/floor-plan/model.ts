import type { EventSeat } from "@/lib/events/types";
import type {
  EventFloorPlan,
  FloorPlanGeometry,
  FloorPlanHistory,
  FloorPlanItem,
  FloorPlanSnapshot,
  FloorPlanTableItem,
  FloorPlanTableSource,
} from "@/lib/events/floor-plan/types";

export const DEFAULT_FLOOR_PLAN: Omit<EventFloorPlan, "eventId"> = {
  room: { width: 20, length: 14, gridSize: 0.5, unit: "m" },
  items: [],
  printPreferences: {
    format: "A4",
    orientation: "landscape",
    template: "technical",
    showGuestNames: false,
  },
  version: 1,
  updatedAt: null,
};

export function tableKeyFromName(tableName: string): string {
  return tableName.trim().toLocaleLowerCase("pt-MZ").replace(/\s+/g, " ");
}

export function buildFloorPlanTables(seats: EventSeat[]): FloorPlanTableSource[] {
  const grouped = new Map<string, EventSeat[]>();
  for (const seat of seats) {
    const key = tableKeyFromName(seat.tableName);
    grouped.set(key, [...(grouped.get(key) ?? []), seat]);
  }

  return [...grouped.entries()]
    .map(([tableKey, tableSeats]) => {
      const ordered = [...tableSeats].sort((a, b) => a.seatNumber - b.seatNumber);
      const guestNames = ordered.flatMap((seat) =>
        seat.guestName ? [seat.guestName] : []
      );
      return {
        tableKey,
        tableName: ordered[0]?.tableName ?? tableKey,
        seats: ordered,
        capacity: ordered.length,
        occupied: guestNames.length,
        available: ordered.length - guestNames.length,
        guestNames,
      };
    })
    .sort((a, b) => a.tableName.localeCompare(b.tableName, "pt"));
}

export function reconcileFloorPlanTables(
  items: FloorPlanItem[],
  tables: FloorPlanTableSource[]
): {
  items: FloorPlanItem[];
  unpositioned: FloorPlanTableSource[];
  removed: FloorPlanTableItem[];
} {
  const sourceByKey = new Map(tables.map((table) => [table.tableKey, table]));
  const positioned = new Set<string>();
  const active: FloorPlanItem[] = [];
  const removed: FloorPlanTableItem[] = [];

  for (const item of items) {
    if (item.kind === "element") {
      active.push(item);
      continue;
    }
    const source = sourceByKey.get(item.tableKey);
    if (!source) {
      removed.push(item);
      continue;
    }
    positioned.add(item.tableKey);
    active.push({ ...item, sourceTableName: source.tableName });
  }

  return {
    items: active,
    unpositioned: tables.filter((table) => !positioned.has(table.tableKey)),
    removed,
  };
}

export function createTableItem(
  table: FloorPlanTableSource,
  x: number,
  y: number
): FloorPlanTableItem {
  return {
    id: `table:${table.tableKey}`,
    kind: "table",
    tableKey: table.tableKey,
    sourceTableName: table.tableName,
    shape: "round",
    x,
    y,
    width: 2.4,
    height: 2.4,
    rotation: 0,
    locked: false,
  };
}

export function snapValue(value: number, gridSize: number): number {
  if (gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function updateItemGeometry(
  item: FloorPlanItem,
  patch: Partial<FloorPlanGeometry>,
  gridSize: number
): FloorPlanItem {
  if (item.locked && patch.locked === undefined) return item;
  return {
    ...item,
    ...patch,
    x: patch.x === undefined ? item.x : snapValue(patch.x, gridSize),
    y: patch.y === undefined ? item.y : snapValue(patch.y, gridSize),
    width:
      patch.width === undefined
        ? item.width
        : Math.max(gridSize, snapValue(patch.width, gridSize)),
    height:
      patch.height === undefined
        ? item.height
        : Math.max(gridSize, snapValue(patch.height, gridSize)),
    rotation:
      patch.rotation === undefined
        ? item.rotation
        : ((patch.rotation % 360) + 360) % 360,
  };
}

export function itemsOverlap(a: FloorPlanItem, b: FloorPlanItem): boolean {
  if (a.id === b.id) return false;
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function overlappingItemIds(items: FloorPlanItem[]): Set<string> {
  const result = new Set<string>();
  for (let index = 0; index < items.length; index += 1) {
    for (let other = index + 1; other < items.length; other += 1) {
      if (itemsOverlap(items[index], items[other])) {
        result.add(items[index].id);
        result.add(items[other].id);
      }
    }
  }
  return result;
}

export function createHistory(snapshot: FloorPlanSnapshot): FloorPlanHistory {
  return { past: [], present: snapshot, future: [] };
}

export function pushHistory(
  history: FloorPlanHistory,
  next: FloorPlanSnapshot
): FloorPlanHistory {
  return {
    past: [...history.past.slice(-49), history.present],
    present: next,
    future: [],
  };
}

export function undoHistory(history: FloorPlanHistory): FloorPlanHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory(history: FloorPlanHistory): FloorPlanHistory {
  const next = history.future[0];
  if (!next) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}
