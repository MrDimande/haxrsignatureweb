import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminClientDecisions,
  type BuildAdminClientDecisionsInput,
} from "./admin-client-decisions.service";
import type { AdminOperationalDocument } from "@/lib/admin/types";
import type { ManagedEvent } from "@/lib/events/types";
import type {
  PortalCreativeApproval,
  PortalPaymentProof,
} from "@/lib/portal/portal-premium.types";

function createDoc(
  id: string,
  overrides?: Partial<AdminOperationalDocument>
): AdminOperationalDocument {
  return {
    id,
    documentType: "proforma",
    documentNumber: `PRF-${id}`,
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: `client-${id}`,
    clientName: `Cliente ${id}`,
    event: {
      eventId: `event-${id}`,
      eventType: "wedding",
      eventName: `Casamento ${id}`,
      eventDate: "2026-10-10",
      eventLocation: "Maputo",
    },
    issueDate: "2026-08-19",
    expiryDate: "2026-08-25",
    totals: {
      subtotal: 100000,
      vatRate: 0.16,
      vatAmount: 16000,
      grandTotal: 116000,
      includeVat: true,
      currency: "MZN",
    },
    convertedFromDocumentId: null,
    clientApprovalStatus: "pending",
    clientApprovedAt: null,
    clientApprovalNote: null,
    createdAt: "2026-08-19T10:00:00Z",
    updatedAt: "2026-08-19T10:00:00Z",
    emailSentAt: "2026-08-19T10:05:00Z",
    ...overrides,
  };
}

function createEvent(
  id: string,
  overrides?: Partial<ManagedEvent>
): ManagedEvent {
  return {
    id,
    businessId: "haxr-signature",
    clientId: `client-${id}`,
    clientName: `Cliente ${id}`,
    name: `Evento ${id}`,
    type: "wedding",
    date: "2026-12-15",
    location: "Maputo",
    notes: "",
    isActive: true,
    googleSheetUrl: "https://docs.google.com/spreadsheets/d/abc",
    googleSheetGid: "0",
    sheetsLastSyncedAt: "2026-08-19T10:00:00Z",
    sheetsSyncSummary: "Sincronizado",
    sheetsSyncMode: "master",
    findSeatCode: `EVT${id}`,
    editionRegistryKey: `edition-${id}`,
    postEventReportSentAt: null,
    dateHoldUntil: null,
    createdAt: "2026-08-19T10:00:00Z",
    updatedAt: "2026-08-19T10:00:00Z",
    ...overrides,
  };
}

function createApproval(
  id: string,
  overrides?: Partial<PortalCreativeApproval>
): PortalCreativeApproval {
  return {
    id,
    eventId: `event-${id}`,
    clientId: `client-${id}`,
    approvalType: "invite",
    title: `Convite Digital ${id}`,
    description: "Layout final para aprovação",
    status: "pending",
    dueAt: "2026-08-22T18:00:00Z",
    decidedAt: null,
    decidedNote: null,
    attachmentUrl: null,
    createdAt: "2026-08-19T10:00:00Z",
    ...overrides,
  };
}

function createProof(
  id: string,
  overrides?: Partial<PortalPaymentProof>
): PortalPaymentProof {
  return {
    id,
    clientId: `client-${id}`,
    eventId: `event-${id}`,
    documentId: null,
    amount: 50000,
    currency: "MZN",
    paymentMethod: "transfer",
    reference: `TRX-${id}`,
    notes: "Pagamento de sinal",
    fileName: `comprovativo-${id}.pdf`,
    status: "pending_review",
    createdAt: "2026-08-19T11:00:00Z",
    ...overrides,
  };
}

describe("admin-client-decisions.service (Canonical Handoff Queue)", () => {
  const defaultNow = new Date("2026-08-19T12:00:00Z");

  it("A. sent pending proforma -> awaitingClient", () => {
    const doc = createDoc("1", {
      status: "sent",
      clientApprovalStatus: "pending",
    });

    const result = buildAdminClientDecisions({
      documents: [doc],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingClient.length, 1);
    assert.equal(result.awaitingClient[0].id, "proforma-approval-1");
    assert.equal(result.awaitingClient[0].owner, "client");
    assert.equal(result.awaitingClient[0].kind, "proforma_approval");
    assert.equal(result.awaitingHaxr.length, 0);
  });

  it("B. changes_requested proforma -> awaitingHaxr", () => {
    const doc = createDoc("1", {
      status: "sent",
      clientApprovalStatus: "changes_requested",
      clientApprovedAt: "2026-08-19T11:30:00Z",
      clientApprovalNote: "Ajustar número de convites",
    });

    const result = buildAdminClientDecisions({
      documents: [doc],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].id, "proforma-changes-1");
    assert.equal(result.awaitingHaxr[0].owner, "haxr");
    assert.equal(result.awaitingHaxr[0].kind, "proforma_changes");
    assert.equal(result.awaitingHaxr[0].detail, "Ajustar número de convites");
    assert.equal(result.awaitingClient.length, 0);
  });

  it("C. approved proforma + converted invoice -> no decision", () => {
    const proforma = createDoc("1", {
      status: "sent",
      clientApprovalStatus: "approved",
      clientApprovedAt: "2026-08-19T11:00:00Z",
    });
    const invoice = createDoc("2", {
      documentType: "invoice",
      convertedFromDocumentId: "1",
    });

    const result = buildAdminClientDecisions({
      documents: [proforma, invoice],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingClient.length, 0);
    assert.equal(result.awaitingHaxr.length, 0);
  });

  it("D. approved proforma + no converted invoice -> awaitingHaxr", () => {
    const proforma = createDoc("1", {
      status: "sent",
      clientApprovalStatus: "approved",
      clientApprovedAt: "2026-08-19T11:00:00Z",
    });

    const result = buildAdminClientDecisions({
      documents: [proforma],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].id, "proforma-conversion-1");
    assert.equal(result.awaitingHaxr[0].owner, "haxr");
    assert.equal(result.awaitingHaxr[0].kind, "proforma_conversion");
  });

  it("E. creative pending -> awaitingClient", () => {
    const approval = createApproval("1", { status: "pending" });
    const event = createEvent("1", { id: "event-1" });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [event],
      creativeApprovals: { available: true, items: [approval] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingClient.length, 1);
    assert.equal(result.awaitingClient[0].id, "creative-approval-1");
    assert.equal(result.awaitingClient[0].kind, "creative_approval");
    assert.equal(result.awaitingClient[0].owner, "client");
  });

  it("F. creative changes_requested -> awaitingHaxr", () => {
    const approval = createApproval("1", {
      status: "changes_requested",
      decidedAt: "2026-08-19T11:45:00Z",
      decidedNote: "Mudar cor da fonte",
    });
    const event = createEvent("1", { id: "event-1" });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [event],
      creativeApprovals: { available: true, items: [approval] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].id, "creative-changes-1");
    assert.equal(result.awaitingHaxr[0].kind, "creative_changes");
    assert.equal(result.awaitingHaxr[0].detail, "Mudar cor da fonte");
  });

  it("G. creative approved -> excluded", () => {
    const approval = createApproval("1", { status: "approved" });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [],
      creativeApprovals: { available: true, items: [approval] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingClient.length, 0);
    assert.equal(result.awaitingHaxr.length, 0);
  });

  it("H. pending payment proof -> awaitingHaxr", () => {
    const proof = createProof("1", { status: "pending_review" });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [proof] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].id, "payment-proof-1");
    assert.equal(result.awaitingHaxr[0].kind, "payment_proof");
    assert.equal(result.awaitingHaxr[0].owner, "haxr");
  });

  it("I. active date hold with no pending proof -> awaitingClient", () => {
    const event = createEvent("1", {
      id: "event-1",
      dateHoldUntil: "2026-08-25T23:59:59Z",
    });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [event],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingClient.length, 1);
    assert.equal(result.awaitingClient[0].id, "date-hold-event-1");
    assert.equal(result.awaitingClient[0].kind, "date_hold");
    assert.equal(result.awaitingClient[0].owner, "client");
  });

  it("J. active date hold + pending proof explicitly linked to same event -> date hold suppressed, proof awaitingHaxr remains", () => {
    const event = createEvent("1", {
      id: "event-1",
      dateHoldUntil: "2026-08-25T23:59:59Z",
    });
    const proof = createProof("1", {
      eventId: "event-1",
      status: "pending_review",
    });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [event],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [proof] },
      options: { now: defaultNow },
    });

    // Date hold is suppressed from awaitingClient
    assert.equal(result.awaitingClient.length, 0);
    // Proof is awaiting HAXR
    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].id, "payment-proof-1");
  });

  it("K. pending proof with eventId=null but documentId resolving to event -> event resolved factually; matching date hold suppressed", () => {
    const event = createEvent("1", {
      id: "event-1",
      dateHoldUntil: "2026-08-25T23:59:59Z",
    });
    const doc = createDoc("10", {
      event: {
        eventId: "event-1",
        eventType: "wedding",
        eventName: "Casamento 1",
        eventDate: "2026-10-10",
        eventLocation: "Maputo",
      },
    });
    const proof = createProof("1", {
      eventId: null,
      documentId: "10",
      status: "pending_review",
    });

    const result = buildAdminClientDecisions({
      documents: [doc],
      events: [event],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [proof] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].eventId, "event-1");
    // Date hold on event-1 is suppressed
    assert.equal(result.awaitingClient.filter((i) => i.kind === "date_hold").length, 0);
  });

  it("L. proof with no eventId and no resolvable document -> no event guessed from clientId", () => {
    const proof = createProof("1", {
      clientId: "client-99",
      eventId: null,
      documentId: null,
      status: "pending_review",
    });
    const event = createEvent("1", {
      id: "event-1",
      clientId: "client-99",
    });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [event],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [proof] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].eventId, null);
    assert.equal(result.awaitingHaxr[0].href, "/admin/cash");
  });

  it("M. completed/past event with a still-pending decision -> decision remains visible", () => {
    const event = createEvent("past", {
      id: "event-past",
      date: "2026-01-01",
    });
    const approval = createApproval("1", {
      eventId: "event-past",
      status: "changes_requested",
    });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [event],
      creativeApprovals: { available: true, items: [approval] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 1);
    assert.equal(result.awaitingHaxr[0].eventId, "event-past");
  });

  it("N, O. unavailable sources reflect partial coverage correctly", () => {
    const resultCreativeUnavailable = buildAdminClientDecisions({
      documents: [],
      events: [],
      creativeApprovals: { available: false, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(resultCreativeUnavailable.coverage.complete, false);
    assert.equal(resultCreativeUnavailable.coverage.creativeApprovals, false);
    assert.equal(resultCreativeUnavailable.coverage.paymentProofs, true);

    const resultProofsUnavailable = buildAdminClientDecisions({
      documents: [],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: false, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(resultProofsUnavailable.coverage.complete, false);
    assert.equal(resultProofsUnavailable.coverage.creativeApprovals, true);
    assert.equal(resultProofsUnavailable.coverage.paymentProofs, false);
  });

  it("P. no pending items + complete coverage -> safe empty state contract", () => {
    const result = buildAdminClientDecisions({
      documents: [],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.summary.total, 0);
    assert.equal(result.summary.awaitingClient, 0);
    assert.equal(result.summary.awaitingHaxr, 0);
    assert.equal(result.coverage.complete, true);
    assert.deepEqual(result.awaitingClient, []);
    assert.deepEqual(result.awaitingHaxr, []);
  });

  it("Q. no pending items + partial coverage -> never claims full completeness", () => {
    const result = buildAdminClientDecisions({
      documents: [],
      events: [],
      creativeApprovals: { available: false, items: [] },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.summary.total, 0);
    assert.equal(result.coverage.complete, false);
  });

  it("R. summary counts full canonical set", () => {
    const doc1 = createDoc("1", { status: "sent", clientApprovalStatus: "pending" });
    const doc2 = createDoc("2", { status: "sent", clientApprovalStatus: "changes_requested" });
    const proof = createProof("1", { status: "pending_review" });

    const result = buildAdminClientDecisions({
      documents: [doc1, doc2],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: { available: true, items: [proof] },
      options: { now: defaultNow },
    });

    assert.equal(result.summary.total, 3);
    assert.equal(result.summary.awaitingClient, 1);
    assert.equal(result.summary.awaitingHaxr, 2);
  });

  it("S. awaiting HAXR sorting is deterministic (occurredAt DESC, id ASC)", () => {
    const proofEarly = createProof("early", {
      createdAt: "2026-08-19T08:00:00Z",
    });
    const proofLate = createProof("late", {
      createdAt: "2026-08-19T14:00:00Z",
    });
    const proofMid = createProof("mid", {
      createdAt: "2026-08-19T11:00:00Z",
    });

    const result = buildAdminClientDecisions({
      documents: [],
      events: [],
      creativeApprovals: { available: true, items: [] },
      paymentProofs: {
        available: true,
        items: [proofEarly, proofLate, proofMid],
      },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingHaxr.length, 3);
    assert.equal(result.awaitingHaxr[0].id, "payment-proof-late");
    assert.equal(result.awaitingHaxr[1].id, "payment-proof-mid");
    assert.equal(result.awaitingHaxr[2].id, "payment-proof-early");
  });

  it("T. awaiting Client sorting is deterministic (items with dueAt first by dueAt ASC, then items without dueAt by occurredAt DESC, id ASC)", () => {
    const approvalDueSoon = createApproval("soon", {
      id: "app-soon",
      dueAt: "2026-08-20T10:00:00Z",
      createdAt: "2026-08-18T10:00:00Z",
    });
    const approvalDueLater = createApproval("later", {
      id: "app-later",
      dueAt: "2026-08-25T10:00:00Z",
      createdAt: "2026-08-19T10:00:00Z",
    });
    const docNoDue = createDoc("nodue", {
      id: "doc-nodue",
      status: "sent",
      clientApprovalStatus: "pending",
      expiryDate: "",
      emailSentAt: "2026-08-19T15:00:00Z",
    });

    const result = buildAdminClientDecisions({
      documents: [docNoDue],
      events: [],
      creativeApprovals: {
        available: true,
        items: [approvalDueLater, approvalDueSoon],
      },
      paymentProofs: { available: true, items: [] },
      options: { now: defaultNow },
    });

    assert.equal(result.awaitingClient.length, 3);
    // Items with dueAt first (ASC)
    assert.equal(result.awaitingClient[0].id, "creative-approval-app-soon");
    assert.equal(result.awaitingClient[1].id, "creative-approval-app-later");
    // Items without dueAt after (DESC)
    assert.equal(result.awaitingClient[2].id, "proforma-approval-doc-nodue");
  });

  it("U. source inputs are not mutated", () => {
    const docs = [createDoc("1")];
    const events = [createEvent("1")];
    const approvals = [createApproval("1")];
    const proofs = [createProof("1")];

    const cloneDocs = JSON.parse(JSON.stringify(docs));
    const cloneEvents = JSON.parse(JSON.stringify(events));
    const cloneApprovals = JSON.parse(JSON.stringify(approvals));
    const cloneProofs = JSON.parse(JSON.stringify(proofs));

    buildAdminClientDecisions({
      documents: docs,
      events,
      creativeApprovals: { available: true, items: approvals },
      paymentProofs: { available: true, items: proofs },
      options: { now: defaultNow },
    });

    assert.deepEqual(docs, cloneDocs);
    assert.deepEqual(events, cloneEvents);
    assert.deepEqual(approvals, cloneApprovals);
    assert.deepEqual(proofs, cloneProofs);
  });
});
