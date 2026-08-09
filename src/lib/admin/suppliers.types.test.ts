import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  supplierProfileInputSchema,
  supplierReviewInputSchema,
  supplierUatRemovalInputSchema,
  suggestSupplierSlug,
} from "./suppliers.types";

const baseProfile = {
  profileId: "a8fdc2a4-df9c-4f62-a6bc-0ccb59b6c841",
  slug: "studio-real",
  businessName: "Studio Real",
  category: "photographers",
  city: "Maputo",
  shortDescription: "",
  about: "",
  publicEmail: null,
  publicPhone: null,
  websiteUrl: null,
  instagramUrl: null,
  serviceLevel: null,
  services: [],
  publicationStatus: "draft" as const,
  isVerified: false,
};

describe("supplier backoffice input contracts", () => {
  it("creates stable URL-safe slugs from Portuguese names", () => {
    assert.equal(suggestSupplierSlug(" Salão São José "), "salao-sao-jose");
    assert.equal(suggestSupplierSlug("***"), "");
  });

  it("requires an explicit valid slug to approve an application", () => {
    const result = supplierReviewInputSchema.safeParse({
      applicationId: "4f08bd58-a9c7-47dd-a7c0-1d9437d2de7f",
      status: "approved",
      reviewNotes: null,
      slug: null,
      isTestRecord: false,
    });
    assert.equal(result.success, false);
  });

  it("keeps incomplete profiles private", () => {
    assert.equal(supplierProfileInputSchema.safeParse(baseProfile).success, true);
    assert.equal(
      supplierProfileInputSchema.safeParse({
        ...baseProfile,
        publicationStatus: "published",
      }).success,
      false,
    );
  });

  it("accepts a complete explicit publication", () => {
    const result = supplierProfileInputSchema.safeParse({
      ...baseProfile,
      shortDescription: "Fotografia documental para celebrações elegantes.",
      about:
        "Uma equipa experiente que acompanha cada casal com atenção e discrição.",
      publicationStatus: "published",
    });
    assert.equal(result.success, true);
  });

  it("requires an exact non-empty supplier name for guarded UAT removal", () => {
    assert.equal(
      supplierUatRemovalInputSchema.safeParse({
        applicationId: "4f08bd58-a9c7-47dd-a7c0-1d9437d2de7f",
        expectedSupplierName: "",
      }).success,
      false,
    );
  });
});
