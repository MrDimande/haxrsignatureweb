import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPublishedSupplierProfileBySlug,
  listPublishedSupplierProfiles,
  SupplierMarketplaceUnavailableError,
} from "./marketplace-repository";
import type { SupplierProfileRow } from "./marketplace";
import type { neonQuery } from "@/lib/neon/server-db";

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

function createQuery(input: {
  rows?: SupplierProfileRow[];
  error?: string;
}): typeof neonQuery {
  return (async <T>() => {
    const typeWitness: T | undefined = undefined;
    void typeWitness;
    if (input.error) throw new Error(input.error);
    return { rows: input.rows ?? [] } as never;
  }) as typeof neonQuery;
}

describe("supplier marketplace repository", () => {
  it("returns only rows supplied by the published query", async () => {
    const suppliers = await listPublishedSupplierProfiles(
      createQuery({ rows: [row] }),
    );
    assert.equal(suppliers.length, 1);
    assert.equal(suppliers[0]?.name, "Fornecedor Aprovado");
  });

  it("returns an empty directory without placeholder suppliers", async () => {
    const suppliers = await listPublishedSupplierProfiles(createQuery({ rows: [] }));
    assert.deepEqual(suppliers, []);
  });

  it("rejects invalid slugs without querying a profile", async () => {
    const supplier = await getPublishedSupplierProfileBySlug(
      "../admin",
    );
    assert.equal(supplier, null);
  });

  it("maps query failures to an unavailable error", async () => {
    await assert.rejects(
      listPublishedSupplierProfiles(createQuery({ error: "permission denied" })),
      SupplierMarketplaceUnavailableError,
    );
  });
});
