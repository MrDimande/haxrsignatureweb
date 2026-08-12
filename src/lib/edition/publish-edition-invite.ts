/**
 * Atomic Edition invite publish orchestration.
 * Blocks on any critical health check; rolls back ledger on failure.
 * Admin event id is the only client input — edition event_id is server-resolved.
 */

import {
  ensureEditionInviteBootstrap,
  type EditionInvitePublishConfig,
} from "@/lib/edition/publish-config";
import {
  getEditionPublishHealthReport,
  toClientPublishHealthReport,
  type PublishHealthReport,
} from "@/lib/edition/registry-health";
import {
  markEditionInviteDraft,
  markEditionInvitePublished,
  restoreEditionInvitePublishRecord,
  snapshotEditionInvitePublishRecord,
  type EditionInvitePublishRecord,
} from "@/lib/edition/publish-store";

export type AdminEventForPublish = {
  id: string;
  editionRegistryKey: string;
  isActive: boolean;
  date: string | null;
  name: string;
};

export type PublishEditionInviteDeps = {
  loadAdminEvent: (adminEventId: string) => Promise<AdminEventForPublish | null>;
  countGuests: (adminEventId: string) => Promise<number>;
  /** Injected for tests — simulate mid-publish failure after ledger write. */
  afterLedgerWrite?: (record: EditionInvitePublishRecord) => void;
};

export type PublishEditionInviteResult =
  | {
      ok: true;
      registryKey: string;
      publishedAt: string;
      version: string;
      report: Omit<PublishHealthReport, "_server">;
      record: EditionInvitePublishRecord;
    }
  | {
      ok: false;
      code:
        | "admin_event_not_found"
        | "missing_registry"
        | "health_blocked"
        | "publish_failed_rolled_back";
      error: string;
      registryKey?: string;
      report?: Omit<PublishHealthReport, "_server">;
      record?: EditionInvitePublishRecord | null;
    };

export type EvaluatePublishHealthResult =
  | {
      ok: true;
      registryKey: string;
      report: Omit<PublishHealthReport, "_server">;
    }
  | {
      ok: false;
      code: "admin_event_not_found" | "missing_registry";
      error: string;
    };

function applyEventSchedule(
  registryKey: string,
  event: AdminEventForPublish,
  configOverrides?: Partial<EditionInvitePublishConfig>
): EditionInvitePublishConfig | null {
  return ensureEditionInviteBootstrap(registryKey, {
    scheduleValue: event.date,
    scheduleRequired: Boolean(event.date) ? false : true,
    status: "active",
    ...configOverrides,
  });
}

export async function evaluateEditionPublishHealthForAdminEvent(
  adminEventId: string,
  deps: PublishEditionInviteDeps,
  configOverrides?: Partial<EditionInvitePublishConfig>
): Promise<EvaluatePublishHealthResult> {
  const event = await deps.loadAdminEvent(adminEventId);
  if (!event) {
    return {
      ok: false,
      code: "admin_event_not_found",
      error: "Evento Admin não encontrado.",
    };
  }

  const registryKey = event.editionRegistryKey?.trim() ?? "";
  if (!registryKey) {
    return {
      ok: false,
      code: "missing_registry",
      error: "Evento sem edition_registry_key — associe um convite Edition.",
    };
  }

  const config = applyEventSchedule(registryKey, event, configOverrides);
  const guestCount = await deps.countGuests(adminEventId);
  const report = getEditionPublishHealthReport({
    registryKey,
    config,
    guestCount,
  });

  return {
    ok: true,
    registryKey,
    report: toClientPublishHealthReport(report),
  };
}

/**
 * Runs the health gate and publishes atomically.
 * Never trusts edition event_id from the browser.
 */
export async function publishEditionInvite(
  adminEventId: string,
  deps: PublishEditionInviteDeps,
  configOverrides?: Partial<EditionInvitePublishConfig>
): Promise<PublishEditionInviteResult> {
  const event = await deps.loadAdminEvent(adminEventId);
  if (!event) {
    return {
      ok: false,
      code: "admin_event_not_found",
      error: "Evento Admin não encontrado.",
    };
  }

  const registryKey = event.editionRegistryKey?.trim() ?? "";
  if (!registryKey) {
    return {
      ok: false,
      code: "missing_registry",
      error: "Evento sem edition_registry_key — associe um convite Edition.",
    };
  }

  const config = applyEventSchedule(registryKey, event, configOverrides);
  const guestCount = await deps.countGuests(adminEventId);
  const fullReport = getEditionPublishHealthReport({
    registryKey,
    config,
    guestCount,
  });
  const report = toClientPublishHealthReport(fullReport);

  if (!fullReport.canPublish) {
    // Keep draft / non-public — no partial publish.
    markEditionInviteDraft({
      registryKey,
      publicSlug: fullReport.publicSlug,
      inviteUrl: null,
    });
    return {
      ok: false,
      code: "health_blocked",
      error: "Publicação bloqueada pelo health gate.",
      registryKey,
      report,
      record: snapshotEditionInvitePublishRecord(registryKey),
    };
  }

  if (!fullReport.publicSlug || !fullReport.inviteUrl) {
    return {
      ok: false,
      code: "health_blocked",
      error: "URL pública inconsistente — publicação abortada.",
      registryKey,
      report,
    };
  }

  const previous = snapshotEditionInvitePublishRecord(registryKey);

  try {
    const record = markEditionInvitePublished({
      registryKey,
      publicSlug: fullReport.publicSlug,
      inviteUrl: fullReport.inviteUrl,
      overall: fullReport.overall === "warning" ? "warning" : "healthy",
    });

    deps.afterLedgerWrite?.(record);

    return {
      ok: true,
      registryKey,
      publishedAt: record.publishedAt!,
      version: record.version,
      report,
      record,
    };
  } catch (err) {
    restoreEditionInvitePublishRecord(previous, registryKey);
    const message =
      err instanceof Error ? err.message : "Falha inesperada na publicação.";
    return {
      ok: false,
      code: "publish_failed_rolled_back",
      error: message,
      registryKey,
      report,
      record: snapshotEditionInvitePublishRecord(registryKey),
    };
  }
}
