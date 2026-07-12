import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PORTAL_NAV_ITEMS } from "@/lib/portal/portal-routes";

describe("portal-routes concierge", () => {
  it("inclui secção Concierge na navegação", () => {
    const concierge = PORTAL_NAV_ITEMS.find((item) => item.id === "concierge");
    assert.ok(concierge);
    assert.equal(concierge?.segment, "concierge");
  });
});
