import {
  buildCoupleDisplayName,
  readOnboardingData,
  type OnboardingRawData,
  type OnboardingStorageReader,
} from "@/lib/auth/onboarding-storage";
import { isOnboardingComplete, POST_LOGIN_DASHBOARD } from "@/lib/auth/onboarding-status";
import {
  CLIENT_SIGN_IN_PATH,
  isSafeClientReturnPath,
  readStashedPostAuthReturn,
} from "@/lib/auth/client-app-middleware";
import type { CreateClientEventInput } from "@/lib/events/create-event-validation";
import {
  buildStableOnboardingFingerprintMaterial,
  normalizeMozambiquePhone,
} from "@/lib/events/onboarding-payload-shared";
import type { CreateEventApiResponseBody } from "@/lib/events/create-event-api";

export const ONBOARDING_SYNC_KEYS = {
  localFingerprint: "haxr_onboarding_local_fingerprint",
  syncedEventId: "haxr_onboarding_synced_event_id",
  syncedAt: "haxr_onboarding_synced_at",
  syncStatus: "haxr_onboarding_sync_status",
} as const;

export type OnboardingSyncStatus =
  | "synced"
  | "syncing"
  | "existing_active_event"
  | "validation_error"
  | "failed"
  | "unauthorized";

export type OnboardingSyncState = {
  localFingerprint: string | null;
  syncedEventId: string | null;
  syncedAt: string | null;
  syncStatus: OnboardingSyncStatus | null;
};

export type OnboardingSyncUiState =
  | { kind: "idle" }
  | { kind: "syncing" }
  | {
      kind: "error";
      message: string;
      retryable: boolean;
      status: OnboardingSyncStatus;
    };

export type OnboardingSyncSkipReason =
  | "incomplete_onboarding"
  | "already_synced"
  | "sync_in_progress"
  | "sync_requires_retry"
  | "url_event_hydrated"
  | "url_event_present";

export type OnboardingSyncResult =
  | { action: "skipped"; reason: OnboardingSyncSkipReason }
  | { action: "redirect"; url: string }
  | { action: "success"; eventId: string; created: boolean }
  | { action: "error"; status: OnboardingSyncStatus; message: string; retryable: boolean };

export type OnboardingSyncDeps = {
  store?: OnboardingStorageReader & { setItem(key: string, value: string): void };
  searchParams?: URLSearchParams;
  fetchFn?: typeof fetch;
  hashFingerprint?: (material: string) => Promise<string> | string;
  redirect?: (url: string) => void;
  onStatus?: (state: OnboardingSyncUiState) => void;
};

const CONFIG_ERROR_MESSAGE =
  "Configuração do servidor indisponível. Tente novamente mais tarde ou contacte o suporte.";

function getDefaultStore(): (OnboardingStorageReader & {
  setItem(key: string, value: string): void;
}) | null {
  if (typeof window === "undefined") return null;
  return localStorage;
}

export function readOnboardingSyncState(
  store: OnboardingStorageReader,
): OnboardingSyncState {
  return {
    localFingerprint: store.getItem(ONBOARDING_SYNC_KEYS.localFingerprint),
    syncedEventId: store.getItem(ONBOARDING_SYNC_KEYS.syncedEventId),
    syncedAt: store.getItem(ONBOARDING_SYNC_KEYS.syncedAt),
    syncStatus: store.getItem(ONBOARDING_SYNC_KEYS.syncStatus) as OnboardingSyncStatus | null,
  };
}

export function writeOnboardingSyncState(
  store: OnboardingStorageReader & { setItem(key: string, value: string): void },
  patch: Partial<OnboardingSyncState>,
): void {
  if (patch.localFingerprint !== undefined) {
    if (patch.localFingerprint) {
      store.setItem(ONBOARDING_SYNC_KEYS.localFingerprint, patch.localFingerprint);
    } else {
      store.removeItem(ONBOARDING_SYNC_KEYS.localFingerprint);
    }
  }

  if (patch.syncedEventId !== undefined) {
    if (patch.syncedEventId) {
      store.setItem(ONBOARDING_SYNC_KEYS.syncedEventId, patch.syncedEventId);
    } else {
      store.removeItem(ONBOARDING_SYNC_KEYS.syncedEventId);
    }
  }

  if (patch.syncedAt !== undefined) {
    if (patch.syncedAt) {
      store.setItem(ONBOARDING_SYNC_KEYS.syncedAt, patch.syncedAt);
    } else {
      store.removeItem(ONBOARDING_SYNC_KEYS.syncedAt);
    }
  }

  if (patch.syncStatus !== undefined) {
    if (patch.syncStatus) {
      store.setItem(ONBOARDING_SYNC_KEYS.syncStatus, patch.syncStatus);
    } else {
      store.removeItem(ONBOARDING_SYNC_KEYS.syncStatus);
    }
  }
}
export function mapOnboardingRoleToEventType(
  role: OnboardingRawData["role"],
): CreateClientEventInput["eventType"] {
  return role === "consultor" ? "other" : "wedding";
}

export function buildOnboardingEventPayload(
  data: OnboardingRawData,
  localFingerprint: string,
): CreateClientEventInput {
  const eventType = mapOnboardingRoleToEventType(data.role);
  const phone = normalizeMozambiquePhone(data.phone);

  return {
    eventType,
    eventName: buildCoupleDisplayName(data),
    brideName: data.brideName,
    groomName: data.groomName,
    eventDate: data.eventDateIso,
    eventLocation: data.location,
    estimatedGuests: data.guestsCount,
    budgetMin: null,
    budgetMax: data.estimatedBudget ?? null,
    servicesInterested: [],
    phone,
    source: "onboarding",
    plannerRole: data.role === "consultor" ? "consultor" : "noiva",
    localFingerprint,
  };
}

export function resolvePostOnboardingCompletionRedirect(isAuthenticated: boolean): string {
  const stashedReturn = readStashedPostAuthReturn();
  const returnPath =
    stashedReturn && isSafeClientReturnPath(stashedReturn)
      ? stashedReturn
      : POST_LOGIN_DASHBOARD;

  if (isAuthenticated) {
    return returnPath;
  }

  return `${CLIENT_SIGN_IN_PATH}?from=${encodeURIComponent(returnPath)}`;
}

export function shouldAttemptOnboardingSync(input: {
  store: OnboardingStorageReader;
  searchParams?: URLSearchParams;
}): { attempt: true } | { attempt: false; reason: OnboardingSyncSkipReason } {
  if (!isOnboardingComplete(input.store)) {
    return { attempt: false, reason: "incomplete_onboarding" };
  }

  const syncState = readOnboardingSyncState(input.store);
  const urlEventId = input.searchParams?.get("eventId")?.trim() ?? null;

  if (syncState.syncedEventId) {
    return { attempt: false, reason: "already_synced" };
  }

  if (syncState.syncStatus === "syncing") {
    return { attempt: false, reason: "sync_in_progress" };
  }

  if (
    syncState.syncStatus === "failed" ||
    syncState.syncStatus === "validation_error"
  ) {
    return { attempt: false, reason: "sync_requires_retry" };
  }

  if (urlEventId) {
    return { attempt: false, reason: "url_event_present" };
  }

  return { attempt: true };
}

export function hydrateOnboardingSyncFromUrlEventId(
  store: OnboardingStorageReader & { setItem(key: string, value: string): void },
  searchParams?: URLSearchParams,
): { hydrated: true; eventId: string } | { hydrated: false } {
  const syncState = readOnboardingSyncState(store);
  if (syncState.syncedEventId) {
    return { hydrated: false };
  }

  const urlEventId = searchParams?.get("eventId")?.trim();
  if (!urlEventId) {
    return { hydrated: false };
  }

  writeOnboardingSyncState(store, {
    syncedEventId: urlEventId,
    syncedAt: new Date().toISOString(),
    syncStatus: "synced",
  });

  return { hydrated: true, eventId: urlEventId };
}

async function defaultHashFingerprint(material: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  throw new Error("crypto.subtle indisponível para gerar fingerprint.");
}

export async function resolveOrCreateLocalFingerprint(
  store: OnboardingStorageReader & { setItem(key: string, value: string): void },
  payload: CreateClientEventInput,
  hashFingerprint: (material: string) => Promise<string> | string = defaultHashFingerprint,
): Promise<string> {
  const existing = store.getItem(ONBOARDING_SYNC_KEYS.localFingerprint)?.trim();
  if (existing) {
    return existing;
  }

  const material = buildStableOnboardingFingerprintMaterial(payload);
  const fingerprint = await hashFingerprint(material);
  store.setItem(ONBOARDING_SYNC_KEYS.localFingerprint, fingerprint);
  return fingerprint;
}

function buildDashboardRedirect(eventId: string): string {
  return `/app/dashboard?eventId=${encodeURIComponent(eventId)}`;
}

function buildSignInRedirect(): string {
  return `${CLIENT_SIGN_IN_PATH}?from=${encodeURIComponent(POST_LOGIN_DASHBOARD)}`;
}

function markSyncSuccess(
  store: OnboardingStorageReader & { setItem(key: string, value: string): void },
  eventId: string,
  localFingerprint: string,
): void {
  writeOnboardingSyncState(store, {
    localFingerprint,
    syncedEventId: eventId,
    syncedAt: new Date().toISOString(),
    syncStatus: "synced",
  });
}

function markSyncFailure(
  store: OnboardingStorageReader & { setItem(key: string, value: string): void },
  status: OnboardingSyncStatus,
): void {
  writeOnboardingSyncState(store, {
    syncStatus: status,
  });
}

function clearSyncingStatus(
  store: OnboardingStorageReader & { setItem(key: string, value: string): void },
): void {
  const current = readOnboardingSyncState(store);
  if (current.syncStatus === "syncing") {
    store.removeItem(ONBOARDING_SYNC_KEYS.syncStatus);
  }
}
export async function performOnboardingSync(
  deps: OnboardingSyncDeps = {},
): Promise<OnboardingSyncResult> {
  const store = deps.store ?? getDefaultStore();
  if (!store) {
    return {
      action: "error",
      status: "failed",
      message: "Armazenamento local indisponível.",
      retryable: false,
    };
  }

  const searchParams = deps.searchParams;
  const fetchFn = deps.fetchFn ?? fetch;
  const hashFingerprint = deps.hashFingerprint ?? defaultHashFingerprint;
  const redirect = deps.redirect;
  const onStatus = deps.onStatus;

  const hydrated = hydrateOnboardingSyncFromUrlEventId(store, searchParams);
  if (hydrated.hydrated) {
    return { action: "skipped", reason: "url_event_hydrated" };
  }

  const gate = shouldAttemptOnboardingSync({ store, searchParams });
  if (!gate.attempt) {
    return { action: "skipped", reason: gate.reason };
  }

  const onboardingData = readOnboardingData(store);
  if (!onboardingData) {
    return { action: "skipped", reason: "incomplete_onboarding" };
  }

  const payload = buildOnboardingEventPayload(
    onboardingData,
    store.getItem(ONBOARDING_SYNC_KEYS.localFingerprint)?.trim() ?? "pending",
  );
  const localFingerprint = await resolveOrCreateLocalFingerprint(store, payload, hashFingerprint);
  const requestPayload = { ...payload, localFingerprint };

  writeOnboardingSyncState(store, { syncStatus: "syncing", localFingerprint });
  onStatus?.({ kind: "syncing" });

  try {
    const response = await fetchFn("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    const body = (await response.json()) as CreateEventApiResponseBody;

    if (response.status === 201 || response.status === 200) {
      if (!body.ok) {
        markSyncFailure(store, "failed");
        onStatus?.({
          kind: "error",
          message: "Resposta inesperada ao sincronizar o evento.",
          retryable: true,
          status: "failed",
        });
        return {
          action: "error",
          status: "failed",
          message: "Resposta inesperada ao sincronizar o evento.",
          retryable: true,
        };
      }

      const eventId = body.data.eventId;
      markSyncSuccess(store, eventId, localFingerprint);
      onStatus?.({ kind: "idle" });

      const redirectUrl = body.data.redirectTo || buildDashboardRedirect(eventId);
      redirect?.(redirectUrl);

      return {
        action: "success",
        eventId,
        created: body.created,
      };
    }

    if (response.status === 409 && !body.ok) {
      const existingEventId = body.existingEventId;
      if (!existingEventId) {
        markSyncFailure(store, "failed");
        onStatus?.({
          kind: "error",
          message: body.message || "Já existe um evento activo.",
          retryable: false,
          status: "failed",
        });
        return {
          action: "error",
          status: "failed",
          message: body.message || "Já existe um evento activo.",
          retryable: false,
        };
      }

      writeOnboardingSyncState(store, {
        localFingerprint,
        syncedEventId: existingEventId,
        syncedAt: new Date().toISOString(),
        syncStatus: "existing_active_event",
      });
      onStatus?.({ kind: "idle" });

      const redirectUrl = body.redirectTo || buildDashboardRedirect(existingEventId);
      redirect?.(redirectUrl);

      return { action: "redirect", url: redirectUrl };
    }

    if (response.status === 400 && !body.ok) {
      markSyncFailure(store, "validation_error");
      onStatus?.({
        kind: "error",
        message: body.message || "Dados do onboarding inválidos.",
        retryable: false,
        status: "validation_error",
      });
      return {
        action: "error",
        status: "validation_error",
        message: body.message || "Dados do onboarding inválidos.",
        retryable: false,
      };
    }

    if (response.status === 401) {
      markSyncFailure(store, "unauthorized");
      const signInUrl = buildSignInRedirect();
      redirect?.(signInUrl);
      onStatus?.({ kind: "idle" });
      return { action: "redirect", url: signInUrl };
    }

    if (response.status === 503 && !body.ok) {
      markSyncFailure(store, "failed");
      onStatus?.({
        kind: "error",
        message: CONFIG_ERROR_MESSAGE,
        retryable: false,
        status: "failed",
      });
      return {
        action: "error",
        status: "failed",
        message: CONFIG_ERROR_MESSAGE,
        retryable: false,
      };
    }

    markSyncFailure(store, "failed");
    const fallbackMessage =
      !body.ok && body.message ? body.message : "Não foi possível sincronizar o evento.";
    onStatus?.({
      kind: "error",
      message: fallbackMessage,
      retryable: true,
      status: "failed",
    });
    return {
      action: "error",
      status: "failed",
      message: fallbackMessage,
      retryable: true,
    };
  } catch {
    clearSyncingStatus(store);
    markSyncFailure(store, "failed");
    onStatus?.({
      kind: "error",
      message: "Falha de rede ao sincronizar o evento.",
      retryable: true,
      status: "failed",
    });
    return {
      action: "error",
      status: "failed",
      message: "Falha de rede ao sincronizar o evento.",
      retryable: true,
    };
  }
}
