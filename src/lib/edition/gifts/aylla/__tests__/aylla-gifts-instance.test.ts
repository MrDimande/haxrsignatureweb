import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getCoreAyllaGiftService, setCoreAyllaGiftStoreForTesting } from "../instance";
import { createInMemoryAyllaGiftStore } from "../store";

const previousPepper = process.env.HAXR_AYLLA_GIFT_PEPPER;
const previousSecurityPepper = process.env.HAXR_SECURITY_PEPPER;

afterEach(() => {
  setCoreAyllaGiftStoreForTesting(null);
  if (previousPepper === undefined) delete process.env.HAXR_AYLLA_GIFT_PEPPER;
  else process.env.HAXR_AYLLA_GIFT_PEPPER = previousPepper;
  if (previousSecurityPepper === undefined) delete process.env.HAXR_SECURITY_PEPPER;
  else process.env.HAXR_SECURITY_PEPPER = previousSecurityPepper;
});

describe("Baby Aylla Gift Registry service configuration", () => {
  it("fails closed without an explicitly configured pepper", () => {
    delete process.env.HAXR_AYLLA_GIFT_PEPPER;
    delete process.env.HAXR_SECURITY_PEPPER;
    assert.throws(() => getCoreAyllaGiftService(createInMemoryAyllaGiftStore()), /HAXR_AYLLA_GIFT_PEPPER/);
  });

  it("accepts an explicitly configured pepper", () => {
    process.env.HAXR_AYLLA_GIFT_PEPPER = "synthetic-test-pepper-32-bytes-minimum";
    assert.ok(getCoreAyllaGiftService(createInMemoryAyllaGiftStore()));
  });
});
