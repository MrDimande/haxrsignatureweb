import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapClientEventToDashboardData,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import { handleClientEventDocumentsRequest } from "@/lib/documents/client-event-documents-api";
import { mapRpcPayloadToDashboardDocumentMetrics } from "@/lib/documents/client-event-documents-dashboard";
import {
  buildDocumentsModuleContext,
  getClientEventDocumentsData,
  isDbDocumentPendingReview,
  mapDbDocumentStatusToUiStatus,
  mapRpcPayloadToDocumentModuleData,
  type ClientEventDocumentsAuthClient,
} from "@/lib/documents/client-event-documents-service";
import {
  GET_CLIENT_EVENT_DOCUMENTS_RPC,
  parseClientEventDocumentsRpcPayload,
  type ClientEventDocumentsRpcClient,
  type ClientEventDocumentsRpcPayload,
} from "@/lib/documents/client-event-documents-rpc";

const EVENT_ID = "f51ce8b2-6b5c-4692-852e-fb1dad1842e1";
const OPERATIONAL_EVENT_ID = "1251bc6e-fac7-46cd-981d-bb3e4c066ce8";
const OWNER_ID = "acd1d7b7-b679-4c8b-94e1-4d4552f1d8ee";
const OTHER_USER_ID = "00000000-0000-4000-8000-000000000099";

const baseEvent: ClientEventRow = {
  id: EVENT_ID,
  owner_user_id: OWNER_ID,
  slug: "staging-a",
  event_name: "Staging A Event",
  event_type: "wedding",
  bride_name: "Staging",
  groom_name: "A",
  event_date: "2026-12-20",
  event_location: "Maputo",
  estimated_guests: 150,
  budget_min: null,
  budget_max: 150000,
  status: "planning",
  source: "onboarding",
  services_interested: [],
  phone: "+258840000000",
  operational_event_id: OPERATIONAL_EVENT_ID,
  is_active: true,
  onboarding_fingerprint: "fp-001",
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
};

const sampleRpcPayload: ClientEventDocumentsRpcPayload = {
  items: [
    {
      id: "doc-1",
      source: "commercial_document",
      title: "PF-2026-001",
      file_name: "PF-2026-001",
      storage_path: null,
      mime_type: null,
      size_bytes: 0,
      status: "sent",
      category: "proforma",
      document_type: "proforma",
      associated_with: "Cliente Teste",
      uploaded_by: "Equipa HAXR",
      suggested_destination: null,
      created_at: "2026-07-09T10:00:00.000Z",
      updated_at: "2026-07-09T10:00:00.000Z",
    },
    {
      id: "upload-1",
      source: "concierge_upload",
      title: "comprovativo-mpesa.pdf",
      file_name: "comprovativo-mpesa.pdf",
      storage_path: "staging-a/comprovativo-mpesa.pdf",
      mime_type: "application/pdf",
      size_bytes: 245760,
      status: "pending_review",
      category: "upload",
      document_type: "other",
      associated_with: "Concierge HAXR",
      uploaded_by: "Concierge HAXR",
      suggested_destination: null,
      created_at: "2026-07-09T11:00:00.000Z",
      updated_at: "2026-07-09T11:00:00.000Z",
    },
    {
      id: "portal-1",
      source: "concierge_portal",
      title: "Proposta catering",
      file_name: "proposta-catering.pdf",
      storage_path: null,
      mime_type: "application/pdf",
      size_bytes: 102400,
      status: "novo",
      category: "proposta",
      document_type: "proposta",
      associated_with: "Portal Concierge",
      uploaded_by: "Cliente",
      suggested_destination: "fornecedores",
      created_at: "2026-07-09T12:00:00.000Z",
      updated_at: "2026-07-09T12:00:00.000Z",
    },
  ],
  summary: {
    documentCount: 1,
    uploadCount: 1,
    reviewItemCount: 0,
    portalItemCount: 1,
    pendingReviewCount: 2,
    approvedCount: 0,
    latestDocument: {
      id: "portal-1",
      title: "Proposta catering",
      source: "concierge_portal",
      status: "novo",
      created_at: "2026-07-09T12:00:00.000Z",
    },
    categories: ["proforma", "upload", "proposta"],
    totalSize: 348160,
    totalItems: 3,
  },
};

function createAuthClient(input: {
  event?: ClientEventRow | null;
  memberUserIds?: string[];
}): ClientEventDocumentsAuthClient {
  return {
    from(table: "client_events" | "event_members") {
      if (table === "client_events") {
        return {
          select() {
            return {
              eq(column: string, value: string | boolean) {
                if (column === "id" && value === EVENT_ID) {
                  return {
                    async maybeSingle() {
                      return { data: input.event ?? null, error: null };
                    },
                  };
                }
                return {
                  async maybeSingle() {
                    return { data: null, error: null };
                  },
                };
              },
            };
          },
        };
      }

      return {
        select() {
          return {
            eq(column: string, value: string) {
              const filters: Record<string, string> = { [column]: value };
              return {
                eq(nextColumn: string, nextValue: string) {
                  filters[nextColumn] = nextValue;
                  return {
                    async maybeSingle() {
                      const isMember =
                        filters.client_event_id === EVENT_ID &&
                        input.memberUserIds?.includes(filters.user_id ?? "");
                      return {
                        data: isMember ? { id: "member-1" } : null,
                        error: null,
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

function createRpcClient(payload: ClientEventDocumentsRpcPayload | null, errorMessage?: string) {
  return {
    async rpc(fn: typeof GET_CLIENT_EVENT_DOCUMENTS_RPC, args: { p_client_event_id: string }) {
      assert.equal(fn, GET_CLIENT_EVENT_DOCUMENTS_RPC);
      assert.equal(args.p_client_event_id, EVENT_ID);
      if (errorMessage) {
        return { data: null, error: { message: errorMessage } };
      }
      return { data: payload, error: null };
    },
  } satisfies ClientEventDocumentsRpcClient;
}

describe("client-event-documents-rpc", () => {
  it("parseClientEventDocumentsRpcPayload normalizes items and summary", () => {
    const parsed = parseClientEventDocumentsRpcPayload(sampleRpcPayload);
    assert.ok(parsed);
    assert.equal(parsed.items.length, 3);
    assert.equal(parsed.summary.documentCount, 1);
    assert.equal(parsed.summary.uploadCount, 1);
    assert.equal(parsed.summary.portalItemCount, 1);
    assert.equal(parsed.summary.pendingReviewCount, 2);
    assert.equal(parsed.summary.totalItems, 3);
    assert.equal(parsed.summary.latestDocument?.id, "portal-1");
  });
});

describe("client-event-documents-service", () => {
  it("buildDocumentsModuleContext maps event overview", () => {
    const context = buildDocumentsModuleContext(baseEvent);
    assert.equal(context.eventId, EVENT_ID);
    assert.equal(context.eventOverview.name, "Staging A Event");
  });

  it("mapDbDocumentStatusToUiStatus maps operational statuses", () => {
    assert.equal(mapDbDocumentStatusToUiStatus("approved"), "validado");
    assert.equal(mapDbDocumentStatusToUiStatus("pending_review"), "por_validar");
    assert.equal(mapDbDocumentStatusToUiStatus("rejected"), "rejeitado");
  });

  it("isDbDocumentPendingReview detects pending states", () => {
    assert.equal(isDbDocumentPendingReview("pending_review"), true);
    assert.equal(isDbDocumentPendingReview("approved"), false);
  });

  it("mapRpcPayloadToDocumentModuleData builds documents summary", () => {
    const data = mapRpcPayloadToDocumentModuleData(baseEvent, sampleRpcPayload);
    assert.equal(data.summary.total, 3);
    assert.equal(data.summary.proposals, 2);
    assert.equal(data.summary.pendingValidation, 2);
    assert.equal(data.documents.length, 3);
    assert.equal(data.documents[0]?.type, "proposta");
  });

  it("getClientEventDocumentsData returns not_found for missing event", async () => {
    const result = await getClientEventDocumentsData({
      authClient: createAuthClient({ event: null }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "not_found");
  });

  it("getClientEventDocumentsData returns forbidden for non-owner non-member", async () => {
    const result = await getClientEventDocumentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OTHER_USER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "forbidden");
  });

  it("getClientEventDocumentsData returns operational_not_linked without operational_event_id", async () => {
    const result = await getClientEventDocumentsData({
      authClient: createAuthClient({ event: { ...baseEvent, operational_event_id: null } }),
      rpcClient: createRpcClient(sampleRpcPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "operational_not_linked");
  });

  it("getClientEventDocumentsData calls RPC when operational_event_id exists", async () => {
    let rpcCalled = false;
    const rpcClient = {
      async rpc(fn: typeof GET_CLIENT_EVENT_DOCUMENTS_RPC) {
        assert.equal(fn, GET_CLIENT_EVENT_DOCUMENTS_RPC);
        rpcCalled = true;
        return { data: sampleRpcPayload, error: null };
      },
    } satisfies ClientEventDocumentsRpcClient;

    const result = await getClientEventDocumentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient,
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(rpcCalled, true);
    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.documents.length, 3);
    }
  });

  it("getClientEventDocumentsData returns empty list when RPC has no documents", async () => {
    const emptyPayload: ClientEventDocumentsRpcPayload = {
      items: [],
      summary: {
        documentCount: 0,
        uploadCount: 0,
        reviewItemCount: 0,
        portalItemCount: 0,
        pendingReviewCount: 0,
        approvedCount: 0,
        latestDocument: null,
        categories: [],
        totalSize: 0,
        totalItems: 0,
      },
    };

    const result = await getClientEventDocumentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(emptyPayload),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });

    assert.equal(result.kind, "ok");
    if (result.kind === "ok") {
      assert.equal(result.data.documents.length, 0);
      assert.equal(result.data.summary.total, 0);
    }
  });

  it("getClientEventDocumentsData returns unavailable when RPC fails", async () => {
    const result = await getClientEventDocumentsData({
      authClient: createAuthClient({ event: baseEvent }),
      rpcClient: createRpcClient(null, "permission denied for table concierge_uploads"),
      userId: OWNER_ID,
      eventId: EVENT_ID,
    });
    assert.equal(result.kind, "unavailable");
  });
});

describe("client-event-documents-dashboard", () => {
  it("mapRpcPayloadToDashboardDocumentMetrics maps document KPIs", () => {
    const metrics = mapRpcPayloadToDashboardDocumentMetrics(baseEvent, sampleRpcPayload);
    assert.equal(metrics.documentsTotal, 3);
    assert.equal(metrics.pendingReviewCount, 2);
    assert.equal(metrics.documentSnapshot.length, 3);
    assert.equal(metrics.documentSnapshot[0]?.title, "PF-2026-001");
  });

  it("dashboard uses document metrics for documents stat", () => {
    const metrics = mapRpcPayloadToDashboardDocumentMetrics(baseEvent, sampleRpcPayload);
    const dashboard = mapClientEventToDashboardData(
      baseEvent,
      null,
      null,
      null,
      null,
      null,
      null,
      metrics,
    );

    const documentsStat = dashboard.stats.find((s) => s.id === "documents");
    assert.equal(documentsStat?.value, 3);
    assert.equal(dashboard.documentSnapshot.length, 3);
    assert.equal(dashboard.conciergeSummary.contractsAwaiting, 2);
  });
});

describe("client-event-documents-api", () => {
  const okEnv = { ok: true as const, message: "" };
  const authClient = createAuthClient({ event: baseEvent });

  it("returns 401 without session", async () => {
    const result = await handleClientEventDocumentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: null,
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 401);
    assert.equal(result.body.error, "unauthorized");
  });

  it("returns 404 for missing event", async () => {
    const result = await handleClientEventDocumentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: null }),
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 404);
    assert.equal(result.body.error, "not_found");
  });

  it("returns 403 for foreign event", async () => {
    const result = await handleClientEventDocumentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OTHER_USER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 403);
    assert.equal(result.body.error, "forbidden");
  });

  it("returns 409 when operational event is not linked", async () => {
    const result = await handleClientEventDocumentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient: createAuthClient({ event: { ...baseEvent, operational_event_id: null } }),
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 409);
    assert.equal(result.body.error, "operational_not_linked");
  });

  it("returns 200 with documents for owner", async () => {
    const result = await handleClientEventDocumentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(sampleRpcPayload),
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    if (result.body.ok) {
      assert.equal(result.body.data.documents.length, 3);
      assert.equal(result.body.data.summary.total, 3);
    }
  });

  it("returns 503 when RPC fails", async () => {
    const result = await handleClientEventDocumentsRequest({
      envCheck: okEnv,
      serviceRoleCheck: okEnv,
      user: { id: OWNER_ID },
      eventId: EVENT_ID,
      authClient,
      rpcClient: createRpcClient(null, "permission denied for table concierge_uploads"),
    });
    assert.equal(result.status, 503);
    assert.equal(result.body.error, "unavailable");
  });
});
