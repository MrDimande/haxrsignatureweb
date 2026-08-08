import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createSupplierApplication,
  type SupplierApplicationClient,
} from "./supplier-application";

function createClient(input: {
  data?: { id: string; status: string } | null;
  error?: { code?: string; message: string } | null;
  capture?: (values: Record<string, unknown>) => void;
}): SupplierApplicationClient {
  return {
    from() {
      return {
        insert(values) {
          input.capture?.(values);
          return {
            select() {
              return {
                async single() {
                  return {
                    data: input.data ?? null,
                    error: input.error ?? null,
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

const application = {
  applicantUserId: null,
  supplierName: "  Fornecedor Real  ",
  responsibleName: "  Ana Matola ",
  email: " ANA@EXAMPLE.COM ",
  phone: " +258 84 000 0000 ",
  category: " Catering ",
  city: " Maputo ",
  portfolioUrl: "",
  message: "",
};

describe("supplier application", () => {
  it("normalizes and persists a private pending application", async () => {
    let captured: Record<string, unknown> = {};
    const result = await createSupplierApplication(
      createClient({
        data: {
          id: "fcbb6b4a-1f97-4c41-a0d5-b8041fbc0eaa",
          status: "pending",
        },
        capture: (values) => {
          captured = values;
        },
      }),
      application,
    );

    assert.equal(result.ok, true);
    assert.equal(captured.supplier_name, "Fornecedor Real");
    assert.equal(captured.email, "ana@example.com");
    assert.equal(captured.portfolio_url, null);
  });

  it("treats a repeated open application as idempotent", async () => {
    const result = await createSupplierApplication(
      createClient({
        error: { code: "23505", message: "duplicate key" },
      }),
      application,
    );

    assert.deepEqual(result, {
      ok: true,
      id: null,
      duplicate: true,
      status: "pending",
    });
  });
});
