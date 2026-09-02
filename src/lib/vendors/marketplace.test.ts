import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSupplierInitials,
  filterSupplierProfiles,
  mapSupplierProfileRow,
  normalizeSupplierCategory,
  type PublicSupplierProfile,
} from "./marketplace";

const supplier: PublicSupplierProfile = {
  id: "a8fdc2a4-df9c-4f62-a6bc-0ccb59b6c841",
  slug: "studio-real",
  name: "Studio Real",
  category: "photographers",
  categoryLabel: "Fotografia",
  city: "Maputo",
  description: "Fotografia documental",
  about: "",
  email: null,
  phone: null,
  websiteUrl: null,
  instagramUrl: null,
  serviceLevel: null,
  services: ["Casamentos"],
  verified: true,
  publishedAt: "2026-08-03T10:00:00.000Z",
  avatarUrl: null,
  coverImageUrl: "/images/suppliers/default-cover.webp",
  portfolioImages: [],
  priceRange: "Sob Consulta",
  experienceYears: 5,
  featuredBadge: "Curadoria HAXR",
  responseTime: "Responde em menos de 2h",
  satisfactionRate: 98,
  memberSince: "2025",
  styles: ["editorial"],
  seasonality: {
    status: "open",
    statusBadge: "Agenda Aberta",
    seasonAlert: "Época Alta",
    recommendedAdvance: "6 meses",
    peakSeasonMonths: "Set-Dez",
    availableYears: ["2025", "2026"],
  },
};

describe("supplier marketplace", () => {
  it("normalizes Portuguese category aliases", () => {
    assert.equal(normalizeSupplierCategory("Salão"), "venues");
    assert.equal(normalizeSupplierCategory("Fotografia"), "photographers");
    assert.equal(normalizeSupplierCategory("Catering"), "caterers");
  });

  it("maps database rows without inventing ratings or media", () => {
    const mapped = mapSupplierProfileRow({
      id: supplier.id,
      slug: supplier.slug,
      business_name: supplier.name,
      category: "Fotografia",
      city: "Maputo",
      short_description: "Fotografia documental",
      about: null,
      public_email: null,
      public_phone: null,
      website_url: "javascript:alert(1)",
      instagram_url: null,
      service_level: null,
      services: ["Casamentos"],
      is_verified: true,
      published_at: supplier.publishedAt,
    });

    assert.equal(mapped.category, "photographers");
    assert.equal(mapped.websiteUrl, null);
    assert.equal("rating" in mapped, false);
  });

  it("filters by category, location and free text", () => {
    assert.equal(
      filterSupplierProfiles([supplier], {
        query: "documental",
        category: "photographers",
        city: "map",
      }).length,
      1,
    );
    assert.equal(
      filterSupplierProfiles([supplier], { category: "caterers" }).length,
      0,
    );
  });

  it("builds neutral initials for profiles without approved media", () => {
    assert.equal(buildSupplierInitials("Studio Real"), "SR");
    assert.equal(buildSupplierInitials(""), "FS");
  });
});
