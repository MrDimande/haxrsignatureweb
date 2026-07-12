import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPostEventReportPreviewHeader,
  buildPostEventReportPreviewSubject,
} from "@/lib/events/services/post-event-report.service";
import type { ManagedEvent } from "@/lib/events/types";

const sampleEvent: ManagedEvent = {
  id: "evt-1",
  businessId: "haxr",
  clientId: "client-1",
  clientName: "Maria Silva",
  name: "Casamento Silva",
  type: "wedding",
  date: "2026-06-15",
  location: "Maputo",
  notes: "",
  isActive: true,
  googleSheetUrl: "",
  googleSheetGid: "0",
  sheetsLastSyncedAt: null,
  sheetsSyncSummary: "",
  sheetsSyncMode: "master",
  findSeatCode: "ABC123",
  editionRegistryKey: "",
  postEventReportSentAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("post-event-report.service", () => {
  it("gera subject e header de preview", () => {
    assert.match(
      buildPostEventReportPreviewSubject(sampleEvent),
      /Casamento Silva/
    );
    assert.match(buildPostEventReportPreviewHeader(sampleEvent), /Casamento Silva/);
  });
});
