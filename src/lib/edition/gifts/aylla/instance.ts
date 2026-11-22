import { createCoreAyllaGiftService } from "./service";
import { createSyntheticDeliveryBarrier } from "./delivery-barrier";
import { createNeonAyllaGiftStore } from "./store";
import type { CoreGiftStore } from "./types";

let testStoreOverride: CoreGiftStore | null = null;
let defaultService: ReturnType<typeof createCoreAyllaGiftService> | null = null;

function readPepper(): string {
  const pepper = process.env.HAXR_AYLLA_GIFT_PEPPER?.trim();
  if (!pepper) throw new Error("HAXR_AYLLA_GIFT_PEPPER is required.");
  return pepper;
}

function resolveSyntheticDeliveryProvider() {
  if (process.env.HAXR_AYLLA_GIFT_SYNTHETIC_DELIVERY?.trim().toLowerCase() !== "true") {
    return undefined;
  }
  return createSyntheticDeliveryBarrier().provider;
}

export function setCoreAyllaGiftStoreForTesting(store: CoreGiftStore | null): void {
  testStoreOverride = store;
  defaultService = null;
}

export function getCoreAyllaGiftService(customStore?: CoreGiftStore) {
  if (customStore) {
    return createCoreAyllaGiftService({
      store: customStore,
      pepper: readPepper(),
    });
  }

  if (testStoreOverride) {
    return createCoreAyllaGiftService({
      store: testStoreOverride,
      pepper: readPepper(),
    });
  }

  if (!defaultService) {
    const store = createNeonAyllaGiftStore();
    defaultService = createCoreAyllaGiftService({
      store,
      pepper: readPepper(),
      deliveryProvider: resolveSyntheticDeliveryProvider(),
    });
  }

  return defaultService;
}
