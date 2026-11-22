import { createCoreAyllaGiftService } from "./service";
import { createNeonAyllaGiftStore } from "./store";
import type { CoreGiftStore } from "./types";

let testStoreOverride: CoreGiftStore | null = null;
let defaultService: ReturnType<typeof createCoreAyllaGiftService> | null = null;

export function setCoreAyllaGiftStoreForTesting(store: CoreGiftStore | null): void {
  testStoreOverride = store;
  defaultService = null;
}

export function getCoreAyllaGiftService(customStore?: CoreGiftStore) {
  if (customStore) {
    return createCoreAyllaGiftService({
      store: customStore,
      pepper: process.env.HAXR_AYLLA_GIFT_PEPPER || process.env.HAXR_SECURITY_PEPPER || "haxr-core-aylla-default-pepper-phase-c3",
    });
  }

  if (testStoreOverride) {
    return createCoreAyllaGiftService({
      store: testStoreOverride,
      pepper: process.env.HAXR_AYLLA_GIFT_PEPPER || process.env.HAXR_SECURITY_PEPPER || "haxr-core-aylla-default-pepper-phase-c3",
    });
  }

  if (!defaultService) {
    const store = createNeonAyllaGiftStore();
    defaultService = createCoreAyllaGiftService({
      store,
      pepper: process.env.HAXR_AYLLA_GIFT_PEPPER || process.env.HAXR_SECURITY_PEPPER || "haxr-core-aylla-default-pepper-phase-c3",
    });
  }

  return defaultService;
}
