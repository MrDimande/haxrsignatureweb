import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminUpcomingAgenda,
  type BuildAdminUpcomingAgendaSource,
} from "./admin-upcoming-agenda.service";
import type { ManagedEvent } from "@/lib/events/types";
import type { PortalTimelineItem } from "@/lib/portal/portal-premium.types";

const REFERENCE_NOW = new Date("2026-08-19T12:00:00.000Z");

function createEvent(id: string, overrides?: Partial<ManagedEvent>): ManagedEvent {
  return {
    id,
    businessId: "haxr-signature",
    clientId: `cli-${id}`,
    clientName: `Cliente ${id}`,
    name: `Evento ${id}`,
    type: "wedding",
    date: "2026-12-20",
    location: "Maputo",
    notes: "",
    isActive: true,
    googleSheetUrl: "",
    googleSheetGid: "0",
    sheetsLastSyncedAt: null,
    sheetsSyncSummary: "",
    sheetsSyncMode: "master",
    findSeatCode: `EVT${id}`,
    editionRegistryKey: `key-${id}`,
    postEventReportSentAt: null,
    dateHoldUntil: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function createTimelineItem(
  id: string,
  eventId: string,
  overrides?: Partial<PortalTimelineItem>
): PortalTimelineItem {
  return {
    id,
    eventId,
    clientId: `cli-${eventId}`,
    title: `Marco ${id}`,
    description: null,
    startsAt: "2026-08-22T10:00:00.000Z", // 3 days after reference now
    endsAt: null,
    category: "milestone",
    visibility: "client",
    status: "scheduled",
    sortOrder: 10,
    createdAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("admin-upcoming-agenda.service (Master Operational Agenda)", () => {
  it("B. available=false is distinct from empty available=true", () => {
    const events = [createEvent("evt-1")];
    const sourceUnavailable: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: false,
        items: [createTimelineItem("t-1", "evt-1")],
      },
    };
    const resultUnavailable = buildAdminUpcomingAgenda(sourceUnavailable, { now: REFERENCE_NOW });
    assert.equal(resultUnavailable.available, false);
    assert.deepEqual(resultUnavailable.items, []);

    const sourceEmpty: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: true,
        items: [],
      },
    };
    const resultEmpty = buildAdminUpcomingAgenda(sourceEmpty, { now: REFERENCE_NOW });
    assert.equal(resultEmpty.available, true);
    assert.deepEqual(resultEmpty.items, []);
  });

  it("C & D. scheduled and delayed items inside 14-day window are included", () => {
    const events = [createEvent("evt-1")];
    const source: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-1", "evt-1", { status: "scheduled", startsAt: "2026-08-20T10:00:00.000Z" }),
          createTimelineItem("t-2", "evt-1", { status: "delayed", startsAt: "2026-08-25T14:00:00.000Z" }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW });
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].id, "t-1");
    assert.equal(result.items[0].status, "scheduled");
    assert.equal(result.items[1].id, "t-2");
    assert.equal(result.items[1].status, "delayed");
  });

  it("E & F. done and skipped items are excluded from the upcoming agenda", () => {
    const events = [createEvent("evt-1")];
    const source: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-done", "evt-1", { status: "done", startsAt: "2026-08-20T10:00:00.000Z" }),
          createTimelineItem("t-skipped", "evt-1", { status: "skipped", startsAt: "2026-08-21T10:00:00.000Z" }),
          createTimelineItem("t-scheduled", "evt-1", { status: "scheduled", startsAt: "2026-08-22T10:00:00.000Z" }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, "t-scheduled");
  });

  it("G & H. items before now or after 14-day boundary are excluded", () => {
    const events = [createEvent("evt-1")];
    const beforeNow = new Date(REFERENCE_NOW.getTime() - 1000).toISOString();
    const insideWindow = new Date(REFERENCE_NOW.getTime() + 7 * 86400000).toISOString();
    const after14Days = new Date(REFERENCE_NOW.getTime() + 15 * 86400000).toISOString();

    const source: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-past", "evt-1", { startsAt: beforeNow }),
          createTimelineItem("t-inside", "evt-1", { startsAt: insideWindow }),
          createTimelineItem("t-future", "evt-1", { startsAt: after14Days }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW, days: 14 });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, "t-inside");
  });

  it("I & J. items exactly at now and exactly at window boundary are included", () => {
    const events = [createEvent("evt-1")];
    const exactNow = REFERENCE_NOW.toISOString();
    const exact14Days = new Date(REFERENCE_NOW.getTime() + 14 * 86400000).toISOString();

    const source: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-now", "evt-1", { startsAt: exactNow }),
          createTimelineItem("t-boundary", "evt-1", { startsAt: exact14Days }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW, days: 14 });
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].id, "t-now");
    assert.equal(result.items[1].id, "t-boundary");
  });

  it("K, L, M. completed events are excluded; planning and active events are allowed", () => {
    const activeEvent = createEvent("evt-active", { date: "2026-10-01" });
    const planningEvent = createEvent("evt-planning", { date: null });
    const completedEvent = createEvent("evt-completed", { date: "2026-08-01" });

    const source: BuildAdminUpcomingAgendaSource = {
      events: [activeEvent, planningEvent, completedEvent],
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-active", "evt-active", { startsAt: "2026-08-20T10:00:00.000Z" }),
          createTimelineItem("t-planning", "evt-planning", { startsAt: "2026-08-21T10:00:00.000Z" }),
          createTimelineItem("t-completed", "evt-completed", { startsAt: "2026-08-22T10:00:00.000Z" }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW });
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].id, "t-active");
    assert.equal(result.items[1].id, "t-planning");
  });

  it("N. client-visible and internal items are both included in admin agenda", () => {
    const events = [createEvent("evt-1")];
    const source: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-client", "evt-1", { visibility: "client", startsAt: "2026-08-20T10:00:00.000Z" }),
          createTimelineItem("t-internal", "evt-1", { visibility: "internal", startsAt: "2026-08-20T12:00:00.000Z" }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW });
    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].visibility, "client");
    assert.equal(result.items[1].visibility, "internal");
  });

  it("O. unknown eventId timeline rows are ignored safely", () => {
    const events = [createEvent("evt-1")];
    const source: BuildAdminUpcomingAgendaSource = {
      events,
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-known", "evt-1", { startsAt: "2026-08-20T10:00:00.000Z" }),
          createTimelineItem("t-orphan", "evt-unknown-999", { startsAt: "2026-08-20T10:00:00.000Z" }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW });
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].id, "t-known");
  });

  it("P. sorting is deterministic: startsAt ascending, eventName, title, id", () => {
    const evtA = createEvent("evt-a", { name: "Casamento A" });
    const evtB = createEvent("evt-b", { name: "Casamento B" });

    const source: BuildAdminUpcomingAgendaSource = {
      events: [evtA, evtB],
      timeline: {
        available: true,
        items: [
          createTimelineItem("t-late", "evt-a", { title: "Z", startsAt: "2026-08-25T10:00:00.000Z" }),
          createTimelineItem("t-early-b", "evt-b", { title: "Briefing", startsAt: "2026-08-20T10:00:00.000Z" }),
          createTimelineItem("t-early-a", "evt-a", { title: "Briefing", startsAt: "2026-08-20T10:00:00.000Z" }),
        ],
      },
    };

    const result = buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW });
    assert.equal(result.items.length, 3);
    assert.equal(result.items[0].id, "t-early-a"); // startsAt 20th, Casamento A
    assert.equal(result.items[1].id, "t-early-b"); // startsAt 20th, Casamento B
    assert.equal(result.items[2].id, "t-late"); // startsAt 25th
  });

  it("Q. inputs are not mutated", () => {
    const event = createEvent("evt-1");
    const item = createTimelineItem("t-1", "evt-1");
    const eventClone = JSON.parse(JSON.stringify(event));
    const itemClone = JSON.parse(JSON.stringify(item));

    const source: BuildAdminUpcomingAgendaSource = {
      events: [event],
      timeline: {
        available: true,
        items: [item],
      },
    };

    buildAdminUpcomingAgenda(source, { now: REFERENCE_NOW });
    assert.deepEqual(event, eventClone);
    assert.deepEqual(item, itemClone);
  });
});
