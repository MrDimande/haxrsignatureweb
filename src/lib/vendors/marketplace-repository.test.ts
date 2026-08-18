import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPublishedSupplierProfileBySlug,
  listPublishedSupplierProfiles,
  SupplierMarketplaceUnavailableError,
  type SupplierMarketplaceQueryClient,
} from "./marketplace-repository";
import type { SupplierProfileRow } from "./marketplace";

const row: SupplierProfileRow = {
  id: "fcbb6b4a-1f97-4c41-a0d5-b8041fbc0eaa",
  slug: "fornecedor-aprovado",
  business_name: "Fornecedor Aprovado",
  category: "Catering",
  city: "Maputo",
  short_description: "Serviço aprovado",
  about: "",
  public_email: null,
  public_phone: null,
  website_url: null,
  instagram_url: null,
  service_level: null,
  services: [],
  is_verified: false,
  published_at: "2026-08-03T10:00:00.000Z",
};

function createClient(input: {
  rows?: SupplierProfileRow[];
  single?: SupplierProfileRow | null;
  error?: string;
}): SupplierMarketplaceQueryClient {
  const query = {
    eq() {
      return query;
    },
    async order() {
      return {
        data: input.rows ?? [],
        error: input.error ? { message: input.error } : null,
      };
    },
    async maybeSingle() {
      return {
        data: input.single ?? null,
        error: input.error ? { message: input.error } : null,
      };
    },
  };

  return {
    from() {
      return {
        select() {
          return query;
        },
      };
    },
  };
}

describe("supplier marketplace repository", () => {
  it("returns only rows supplied by the published query", async () => {
    const suppliers = await listPublishedSupplierProfiles(
      createClient({ rows: [row] }),
    );
    assert.equal(suppliers.length, 1);
    assert.equal(suppliers[0]?.name, "Fornecedor Aprovado");
  });

  it("returns an empty directory without placeholder suppliers", async () => {
    const suppliers = await listPublishedSupplierProfiles(createClient({ rows: [] }));
    assert.deepEqual(suppliers, []);
  });

  it("rejects invalid slugs without querying a profile", async () => {
    const supplier = await getPublishedSupplierProfileBySlug(
      createClient({ single: row }),
      "../admin",
    );
    assert.equal(supplier, null);
  });

  it("maps query failures to an unavailable error", async () => {
    await assert.rejects(
      listPublishedSupplierProfiles(createClient({ error: "permission denied" })),
      SupplierMarketplaceUnavailableError,
    );
  });
});
