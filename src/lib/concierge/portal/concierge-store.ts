import type { ConciergeModuleData } from "./types";
import { createInitialConciergeModuleData } from "./mock-concierge-data";

type ConciergeStore = {
  events: Map<string, ConciergeModuleData>;
};

const globalKey = "__haxrConciergePortalStore__";

function getStore(): ConciergeStore {
  const g = globalThis as typeof globalThis & { [globalKey]?: ConciergeStore };
  if (!g[globalKey]) {
    g[globalKey] = { events: new Map() };
  }
  return g[globalKey];
}

function cloneModuleData(data: ConciergeModuleData): ConciergeModuleData {
  return structuredClone(data);
}

export function getOrInitConciergeData(eventId: string): ConciergeModuleData {
  const store = getStore();
  const existing = store.events.get(eventId);
  if (existing) {
    return cloneModuleData(existing);
  }
  const initial = createInitialConciergeModuleData(eventId);
  store.events.set(eventId, cloneModuleData(initial));
  return cloneModuleData(initial);
}

export function saveConciergeData(eventId: string, data: ConciergeModuleData): void {
  const store = getStore();
  store.events.set(eventId, cloneModuleData(data));
}

export function resetConciergeData(eventId: string): ConciergeModuleData {
  const initial = createInitialConciergeModuleData(eventId);
  saveConciergeData(eventId, initial);
  return cloneModuleData(initial);
}
