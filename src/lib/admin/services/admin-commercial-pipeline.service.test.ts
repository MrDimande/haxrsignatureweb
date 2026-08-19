import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminCommercialPipeline,
  type AdminCommercialPipeline,
  type AdminActiveCommercialStage,
} from "./admin-commercial-pipeline.service";
import type { ContactInquiry } from "@/lib/contact/types";

function createInquiry(
  id: string,
  overrides?: Partial<ContactInquiry>
): ContactInquiry {
  return {
    id,
    name: `Lead ${id}`,
    email: `lead${id}@example.com`,
    projectType: "Casamento",
    packageLabel: "Silver",
    intent: "Convites e website",
    message: "Gostaria de saber mais",
    status: "new",
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
    ...overrides,
  };
}

describe("admin-commercial-pipeline.service (Commercial Lead Pipeline)", () => {
  it("A. operational item status type is strictly restricted to 'new' | 'contacted'", () => {
    const inquiries: ContactInquiry[] = [
      createInquiry("1", { status: "new" }),
      createInquiry("2", { status: "contacted" }),
    ];

    const result = buildAdminCommercialPipeline(inquiries);

    for (const item of result.items) {
      const stage: AdminActiveCommercialStage = item.status;
      assert(stage === "new" || stage === "contacted");
    }
  });

  it("B, C. converted and archived inquiries never enter operational items, but summary counts them globally", () => {
    const inquiries: ContactInquiry[] = [
      createInquiry("1", { status: "new" }),
      createInquiry("2", { status: "contacted" }),
      createInquiry("3", { status: "converted" }),
      createInquiry("4", { status: "archived" }),
    ];

    const result = buildAdminCommercialPipeline(inquiries);

    assert.equal(result.items.length, 2);
    assert.equal(result.items.some((i) => i.id === "3"), false);
    assert.equal(result.items.some((i) => i.id === "4"), false);
    assert.equal(result.summary.converted, 1);
    assert.equal(result.summary.archived, 1);
    assert.equal(result.summary.total, 4);
    assert.equal(result.summary.active, 2);
  });

  it("D. 'new' leads rank strictly before 'contacted' leads", () => {
    const inquiries: ContactInquiry[] = [
      createInquiry("1", { status: "contacted", updatedAt: "2026-08-19T15:00:00Z" }),
      createInquiry("2", { status: "new", updatedAt: "2026-08-19T10:00:00Z" }),
    ];

    const result = buildAdminCommercialPipeline(inquiries);

    assert.equal(result.items.length, 2);
    assert.equal(result.items[0].id, "2"); // new
    assert.equal(result.items[1].id, "1"); // contacted
  });

  it("E. within the same stage, newer updatedAt ranks first", () => {
    const inquiries: ContactInquiry[] = [
      createInquiry("early", { status: "new", updatedAt: "2026-08-19T08:00:00Z" }),
      createInquiry("late", { status: "new", updatedAt: "2026-08-19T14:00:00Z" }),
      createInquiry("mid", { status: "new", updatedAt: "2026-08-19T11:00:00Z" }),
    ];

    const result: AdminCommercialPipeline = buildAdminCommercialPipeline(inquiries);

    assert.equal(result.items.length, 3);
    assert.equal(result.items[0].id, "late");
    assert.equal(result.items[1].id, "mid");
    assert.equal(result.items[2].id, "early");
  });

  it("F. input inquiries array and objects are not mutated", () => {
    const original = [
      createInquiry("1", { status: "contacted" }),
      createInquiry("2", { status: "new" }),
    ];
    const clone = JSON.parse(JSON.stringify(original));

    buildAdminCommercialPipeline(original);

    assert.deepEqual(original, clone);
  });

  it("G. historical converted rows do not require linked client or event data", () => {
    const inquiries: ContactInquiry[] = [
      createInquiry("hist-1", { status: "converted" }),
      createInquiry("hist-2", { status: "converted" }),
    ];

    const result = buildAdminCommercialPipeline(inquiries);

    assert.equal(result.summary.converted, 2);
    assert.equal(result.summary.active, 0);
    assert.equal(result.items.length, 0);
  });

  it("handles empty inquiries list safely", () => {
    const result = buildAdminCommercialPipeline([]);

    assert.equal(result.summary.total, 0);
    assert.equal(result.summary.active, 0);
    assert.equal(result.summary.new, 0);
    assert.equal(result.summary.contacted, 0);
    assert.equal(result.summary.converted, 0);
    assert.equal(result.summary.archived, 0);
    assert.deepEqual(result.items, []);
  });
});
