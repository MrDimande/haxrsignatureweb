import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCanonicalAdminAlerts,
  buildAdminAlerts,
  buildAdminAttentionFeed,
} from "./admin-alerts.service";
import type { InvoiceDocument } from "@/lib/admin/types";
import type { ContactInquiry } from "@/lib/contact/types";

function createInquiry(id: string, name: string, status: ContactInquiry["status"] = "new"): ContactInquiry {
  return {
    id,
    name,
    email: `${id}@example.com`,
    projectType: "Casamento",
    packageLabel: "Silver",
    intent: "Convites",
    message: "Gostaria de proposta",
    status,
    marketingOptIn: true,
    source: "website_contact_form",
    createdAt: "2026-08-19T10:00:00Z",
    updatedAt: "2026-08-19T10:00:00Z",
    brevoLeadWelcomeAt: null,
    brevoPortfolioSentAt: null,
    brevoExperiencesSentAt: null,
    brevoMeetingSentAt: null,
    brevoLastCallSentAt: null,
    brevoNewsletterWelcomeAt: null,
  };
}

function createInvoiceDocument(
  id: string,
  overrides?: Partial<InvoiceDocument>
): InvoiceDocument {
  return {
    id,
    documentNumber: `INV-${id}`,
    documentType: "invoice",
    businessId: "haxr-signature",
    status: "sent",
    currency: "MZN",
    clientId: "cli-1",
    clientType: "individual",
    clientName: `Cliente ${id}`,
    companyName: "",
    clientNuit: "123456789",
    clientEmail: `cliente${id}@example.com`,
    clientPhone: "+258840000000",
    clientAddress: "Maputo",
    event: {
      eventId: null,
      eventType: null,
      eventName: "",
      eventDate: null,
      eventLocation: "",
    },
    issueDate: "2026-07-01",
    expiryDate: "2099-12-31",
    notes: "",
    lineItems: [],
    totals: {
      subtotal: 100000,
      vatRate: 0,
      vatAmount: 0,
      grandTotal: 100000,
      includeVat: false,
      currency: "MZN",
    },
    issuerSignatureId: null,
    issuerName: "HAXR",
    issuerRole: "Director",
    issuerSignatureImage: "",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    pdfGeneratedAt: null,
    convertedFromDocumentId: null,
    emailSentAt: null,
    whatsappSharedAt: null,
    clientApprovalStatus: null,
    clientApprovedAt: null,
    clientApprovalNote: null,
    ...overrides,
  };
}

describe("admin-alerts.service (canonical alerts vs header feed)", () => {
  it("A. 5 new leads exist: Header shows capped subset (3), Attention sees all 5", () => {
    const inquiries = [
      createInquiry("1", "Lead 1"),
      createInquiry("2", "Lead 2"),
      createInquiry("3", "Lead 3"),
      createInquiry("4", "Lead 4"),
      createInquiry("5", "Lead 5"),
    ];

    const headerAlerts = buildAdminAlerts({
      inquiries,
      documents: [],
      conciergePending: 0,
      pendingProofs: 0,
    });
    const attentionAlerts = buildCanonicalAdminAlerts({
      inquiries,
      documents: [],
      conciergePending: 0,
      pendingProofs: 0,
    });

    const headerLeadAlerts = headerAlerts.filter((a) => a.source === "commercial");
    const attentionLeadAlerts = attentionAlerts.filter((a) => a.source === "commercial");

    assert.equal(headerLeadAlerts.length, 3);
    assert.equal(attentionLeadAlerts.length, 5);
  });

  it("B. 5 overdue documents exist: Attention does not silently truncate to 3 before ranking", () => {
    const documents = [
      createInvoiceDocument("1", { expiryDate: "2026-01-01" }),
      createInvoiceDocument("2", { expiryDate: "2026-01-02" }),
      createInvoiceDocument("3", { expiryDate: "2026-01-03" }),
      createInvoiceDocument("4", { expiryDate: "2026-01-04" }),
      createInvoiceDocument("5", { expiryDate: "2026-01-05" }),
    ];

    const headerAlerts = buildAdminAlerts({
      inquiries: [],
      documents,
      conciergePending: 0,
      pendingProofs: 0,
    });
    const attentionAlerts = buildCanonicalAdminAlerts({
      inquiries: [],
      documents,
      conciergePending: 0,
      pendingProofs: 0,
    });

    const headerOverdueAlerts = headerAlerts.filter((a) => a.source === "finance" && a.id.startsWith("overdue-"));
    const attentionOverdueAlerts = attentionAlerts.filter((a) => a.source === "finance" && a.id.startsWith("overdue-"));

    assert.equal(headerOverdueAlerts.length, 3);
    assert.equal(attentionOverdueAlerts.length, 5);
  });

  it("C. More than 4 actionable portal responses exist: Attention considers all of them", () => {
    const documents = [
      createInvoiceDocument("p1", {
        documentType: "proforma",
        clientApprovalStatus: "changes_requested",
        clientApprovedAt: "2026-08-19T10:00:00Z",
      }),
      createInvoiceDocument("p2", {
        documentType: "proforma",
        clientApprovalStatus: "changes_requested",
        clientApprovedAt: "2026-08-19T09:00:00Z",
      }),
      createInvoiceDocument("p3", {
        documentType: "proforma",
        clientApprovalStatus: "changes_requested",
        clientApprovedAt: "2026-08-19T08:00:00Z",
      }),
      createInvoiceDocument("p4", {
        documentType: "proforma",
        clientApprovalStatus: "changes_requested",
        clientApprovedAt: "2026-08-19T07:00:00Z",
      }),
      createInvoiceDocument("p5", {
        documentType: "proforma",
        clientApprovalStatus: "changes_requested",
        clientApprovedAt: "2026-08-19T06:00:00Z",
      }),
    ];

    const headerAlerts = buildAdminAlerts({
      inquiries: [],
      documents,
      conciergePending: 0,
      pendingProofs: 0,
    });
    const attentionAlerts = buildCanonicalAdminAlerts({
      inquiries: [],
      documents,
      conciergePending: 0,
      pendingProofs: 0,
    });

    const headerPortalAlerts = headerAlerts.filter((a) => a.source === "portal");
    const attentionPortalAlerts = attentionAlerts.filter((a) => a.source === "portal");

    assert.equal(headerPortalAlerts.length, 4);
    assert.equal(attentionPortalAlerts.length, 5);
  });

  it("D. requiresAction=false items (converted proformas) never consume an Attention slot", () => {
    const documents = [
      createInvoiceDocument("prof-1", {
        documentType: "proforma",
        clientApprovalStatus: "approved",
        clientApprovedAt: "2026-08-19T10:00:00Z",
      }),
      createInvoiceDocument("inv-1", {
        documentType: "invoice",
        convertedFromDocumentId: "prof-1",
      }),
      createInvoiceDocument("prof-2", {
        documentType: "proforma",
        clientApprovalStatus: "approved",
        clientApprovedAt: "2026-08-19T09:00:00Z",
      }),
    ];

    const alerts = buildCanonicalAdminAlerts({
      inquiries: [],
      documents,
      conciergePending: 0,
      pendingProofs: 0,
    });

    const actionableAlerts = alerts.filter((a) => a.requiresAction);
    assert.equal(actionableAlerts.length, 1);
    assert.equal(actionableAlerts[0].id, "portal-approved-prof-2");
  });

  it("E. With more actionable items than display limit: high priority items rank before normal priority items", () => {
    const inquiries = [
      createInquiry("1", "Lead 1"),
      createInquiry("2", "Lead 2"),
    ];
    const documents = [
      createInvoiceDocument("1", { expiryDate: "2026-01-01" }),
    ];

    const alerts = buildCanonicalAdminAlerts({
      inquiries,
      documents,
      conciergePending: 5, // normal priority
      pendingProofs: 1, // high priority
    });

    const priorityOrder = { high: 0, normal: 1 } as const;
    const ranked = alerts
      .filter((a) => a.requiresAction)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const highPriorityCount = ranked.filter((a) => a.priority === "high").length;
    // 2 leads + 1 overdue + 1 proof = 4 high priority items
    assert.equal(highPriorityCount, 4);
    assert.equal(ranked[0].priority, "high");
    assert.equal(ranked[1].priority, "high");
    assert.equal(ranked[2].priority, "high");
    assert.equal(ranked[3].priority, "high");
    assert.equal(ranked[4].priority, "normal");
    assert.equal(ranked[4].id, "concierge-pending");
  });

  it("F. Source objects are not mutated during construction", () => {
    const inquiry = createInquiry("1", "Original Lead");
    const inquiryClone = { ...inquiry };
    const doc = createInvoiceDocument("1", { expiryDate: "2026-01-01" });
    const docClone = { ...doc };

    buildCanonicalAdminAlerts({
      inquiries: [inquiry],
      documents: [doc],
      conciergePending: 1,
      pendingProofs: 1,
    });

    assert.deepEqual(inquiry, inquiryClone);
    assert.deepEqual(doc, docClone);
  });

  it("G. buildAdminAttentionFeed with fixed now produces deterministic relative times", () => {
    const fixedNow = new Date("2026-08-19T12:00:00Z");
    const inquiryRecent = createInquiry("1", "Lead Recente");
    inquiryRecent.createdAt = "2026-08-19T11:45:00Z"; // 15 min ago

    const inquiryOlder = createInquiry("2", "Lead Antigo");
    inquiryOlder.createdAt = "2026-08-19T09:00:00Z"; // 3 hours ago

    const feed = buildAdminAttentionFeed(
      {
        inquiries: [inquiryRecent, inquiryOlder],
        documents: [],
        conciergePending: 0,
        pendingProofs: 0,
      },
      8,
      { now: fixedNow }
    );

    assert.equal(feed.length, 2);
    assert.equal(feed[0].time, "Há 15 min");
    assert.equal(feed[1].time, "Há 3 h");
  });

  it("H. overdue days use the injected now timestamp", () => {
    const fixedNow = new Date("2026-08-19T12:00:00Z");
    const doc = createInvoiceDocument("1", {
      expiryDate: "2026-08-10",
      status: "sent",
      documentType: "invoice",
    });

    const feed = buildAdminAttentionFeed(
      {
        inquiries: [],
        documents: [doc],
        conciergePending: 0,
        pendingProofs: 0,
      },
      8,
      { now: fixedNow }
    );

    assert.equal(feed.length, 1);
    assert.equal(feed[0].id, "overdue-1");
    assert.match(feed[0].text, /9 dias/);
    assert.equal(feed[0].time, "Há 9 dias");
  });

  it("I. default no-now callers remain fully supported", () => {
    const inquiry = createInquiry("1", "Lead Default");
    const doc = createInvoiceDocument("1", {
      expiryDate: "2026-01-01",
      status: "sent",
    });

    const alerts = buildCanonicalAdminAlerts({
      inquiries: [inquiry],
      documents: [doc],
      conciergePending: 0,
      pendingProofs: 0,
    });
    assert.equal(alerts.length, 2);

    const feed = buildAdminAttentionFeed({
      inquiries: [inquiry],
      documents: [doc],
      conciergePending: 0,
      pendingProofs: 0,
    });
    assert.equal(feed.length, 2);

    const header = buildAdminAlerts({
      inquiries: [inquiry],
      documents: [doc],
      conciergePending: 0,
      pendingProofs: 0,
    });
    assert.equal(header.length, 2);
  });
});
