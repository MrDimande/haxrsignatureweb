import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSameOriginMutation,
  mapSupplierFavoriteError,
  supplierFavoriteSchema,
} from "./favorites";

describe("supplier favorites", () => {
  it("validates UUID payloads", () => {
    assert.equal(
      supplierFavoriteSchema.safeParse({
        supplierId: "fcbb6b4a-1f97-4c41-a0d5-b8041fbc0eaa",
      }).success,
      true,
    );
    assert.equal(supplierFavoriteSchema.safeParse({ supplierId: "../admin" }).success, false);
  });

  it("blocks cross-origin browser mutations", () => {
    assert.equal(
      isSameOriginMutation(
        new Request("https://haxrsignature.com/api/vendors/favorites", {
          headers: { Origin: "https://evil.example" },
        }),
      ),
      false,
    );
  });

  it("treats duplicate saves as idempotent", () => {
    assert.deepEqual(mapSupplierFavoriteError({ code: "23505" }), {
      status: 200,
      message: "Fornecedor já estava guardado.",
    });
  });
});
