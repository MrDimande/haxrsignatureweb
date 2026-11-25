import { createCoreAyllaGiftService } from "./service";
import { createSyntheticDeliveryBarrier } from "./delivery-barrier";
import {
  createProductionAyllaOtpDeliveryProvider,
  normalizeAyllaContactForLookup,
} from "./otp-delivery";
import { createNeonAyllaGiftStore } from "./store";
import { isAyllaTestActivationEnabled } from "./test-activation";
import type { CoreDeliveryProvider, CoreGiftStore } from "./types";

type AyllaCoreInstanceState = {
  testStoreOverride: CoreGiftStore | null;
  defaultService: ReturnType<typeof createCoreAyllaGiftService> | null;
  syntheticBarrierSingleton: ReturnType<typeof createSyntheticDeliveryBarrier> | null;
};

const AYLLA_INSTANCE_STATE_KEY = "__haxrAyllaCoreInstanceState" as const;

type GlobalWithAyllaInstanceState = typeof globalThis & {
  [AYLLA_INSTANCE_STATE_KEY]?: AyllaCoreInstanceState;
};

function getAyllaInstanceState(): AyllaCoreInstanceState {
  const globalHolder = globalThis as GlobalWithAyllaInstanceState;
  if (!globalHolder[AYLLA_INSTANCE_STATE_KEY]) {
    globalHolder[AYLLA_INSTANCE_STATE_KEY] = {
      testStoreOverride: null,
      defaultService: null,
      syntheticBarrierSingleton: null,
    };
  }
  return globalHolder[AYLLA_INSTANCE_STATE_KEY];
}

function readPepper(): string {
  const pepper = process.env.HAXR_AYLLA_GIFT_PEPPER?.trim();
  if (!pepper) throw new Error("HAXR_AYLLA_GIFT_PEPPER is required.");
  return pepper;
}

function getOrCreateSyntheticBarrier() {
  const state = getAyllaInstanceState();
  if (!state.syntheticBarrierSingleton) {
    state.syntheticBarrierSingleton = createSyntheticDeliveryBarrier();
  }
  return state.syntheticBarrierSingleton;
}

function resolveDeliveryProvider(): CoreDeliveryProvider {
  if (isAyllaTestActivationEnabled()) {
    return getOrCreateSyntheticBarrier().provider;
  }
  return createProductionAyllaOtpDeliveryProvider();
}

export function setCoreAyllaGiftStoreForTesting(store: CoreGiftStore | null): void {
  const state = getAyllaInstanceState();
  state.testStoreOverride = store;
  state.defaultService = null;
  state.syntheticBarrierSingleton = null;
}

export function getAyllaSyntheticOutboxMessagesForTesting(contact?: string) {
  if (!isAyllaTestActivationEnabled()) {
    return null;
  }
  const trapped = getOrCreateSyntheticBarrier().getTrappedMessages();
  if (!contact) return trapped;
  const normalized = normalizeAyllaContactForLookup(contact);
  return trapped.filter(
    (entry) => normalizeAyllaContactForLookup(entry.contact) === normalized
  );
}

function buildStoreRateLimiter(store: CoreGiftStore) {
  if (!store.checkRateLimit) return undefined;
  return {
    async check(key: string, limit: number, windowMs: number) {
      const allowed = await store.checkRateLimit!(key, limit, windowMs);
      return { allowed, remaining: allowed ? 1 : 0 };
    },
  };
}

export function getCoreAyllaGiftService(customStore?: CoreGiftStore) {
  const state = getAyllaInstanceState();

  if (customStore) {
    return createCoreAyllaGiftService({
      store: customStore,
      pepper: readPepper(),
      rateLimiter: buildStoreRateLimiter(customStore),
      deliveryProvider: resolveDeliveryProvider(),
    });
  }

  if (state.testStoreOverride) {
    return createCoreAyllaGiftService({
      store: state.testStoreOverride,
      pepper: readPepper(),
      rateLimiter: buildStoreRateLimiter(state.testStoreOverride),
      deliveryProvider: resolveDeliveryProvider(),
    });
  }

  if (!state.defaultService) {
    const store = createNeonAyllaGiftStore();
    state.defaultService = createCoreAyllaGiftService({
      store,
      pepper: readPepper(),
      rateLimiter: buildStoreRateLimiter(store),
      deliveryProvider: resolveDeliveryProvider(),
    });
  }

  return state.defaultService;
}
