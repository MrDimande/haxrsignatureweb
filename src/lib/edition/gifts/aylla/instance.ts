import { createCoreAyllaGiftService } from "./service";
import { createSyntheticDeliveryBarrier } from "./delivery-barrier";
import {
  createProductionAyllaOtpDeliveryProvider,
  getAyllaOtpSupportedChannels,
  normalizeAyllaContactForLookup,
} from "./otp-delivery";
import { createNeonAyllaGiftStore } from "./store";
import { isAyllaTestActivationEnabled } from "./test-activation";
import type { AyllaOtpChannelCapabilities, CoreDeliveryProvider, CoreGiftStore } from "./types";

type AyllaCoreInstanceState = {
  testStoreOverride: CoreGiftStore | null;
  defaultService: ReturnType<typeof createCoreAyllaGiftService> | null;
  defaultServiceSignature: string | null;
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
      defaultServiceSignature: null,
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

function resolveSupportedChannels(): AyllaOtpChannelCapabilities {
  if (isAyllaTestActivationEnabled()) {
    const explicitlyEmailOnly =
      process.env.HAXR_AYLLA_OTP_WHATSAPP_ENABLED?.trim().toLowerCase() === "false" &&
      process.env.HAXR_AYLLA_OTP_SMS_ENABLED?.trim().toLowerCase() === "false";
    return {
      email: true,
      phone: !explicitlyEmailOnly,
    };
  }
  return getAyllaOtpSupportedChannels();
}

function computeDefaultServiceSignature(channels: AyllaOtpChannelCapabilities): string {
  return `${Number(isAyllaTestActivationEnabled())}:${Number(channels.email)}:${Number(channels.phone)}`;
}

export function setCoreAyllaGiftStoreForTesting(store: CoreGiftStore | null): void {
  const state = getAyllaInstanceState();
  state.testStoreOverride = store;
  state.defaultService = null;
  state.defaultServiceSignature = null;
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
  const supportedChannels = resolveSupportedChannels();

  if (customStore) {
    return createCoreAyllaGiftService({
      store: customStore,
      pepper: readPepper(),
      rateLimiter: buildStoreRateLimiter(customStore),
      deliveryProvider: resolveDeliveryProvider(),
      supportedChannels,
    });
  }

  if (state.testStoreOverride) {
    return createCoreAyllaGiftService({
      store: state.testStoreOverride,
      pepper: readPepper(),
      rateLimiter: buildStoreRateLimiter(state.testStoreOverride),
      deliveryProvider: resolveDeliveryProvider(),
      supportedChannels,
    });
  }

  const signature = computeDefaultServiceSignature(supportedChannels);
  if (!state.defaultService || state.defaultServiceSignature !== signature) {
    const store = createNeonAyllaGiftStore();
    state.defaultService = createCoreAyllaGiftService({
      store,
      pepper: readPepper(),
      rateLimiter: buildStoreRateLimiter(store),
      deliveryProvider: resolveDeliveryProvider(),
      supportedChannels,
    });
    state.defaultServiceSignature = signature;
  }

  return state.defaultService;
}
