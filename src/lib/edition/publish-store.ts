/**
 * In-process publish ledger for Edition invites.
 * Records publishedAt + version; supports atomic commit / rollback without DB migrations.
 */

import { PUBLISH_HEALTH_VERSION } from "@/lib/edition/publish-config";

export type EditionInvitePublishRecord = {
  registryKey: string;
  status: "draft" | "published";
  version: string;
  publishedAt: string | null;
  publicSlug: string | null;
  inviteUrl: string | null;
  lastHealthOverall: "healthy" | "warning" | "blocked" | null;
};

const publishLedger = new Map<string, EditionInvitePublishRecord>();

export function resetEditionPublishLedger(): void {
  publishLedger.clear();
}

export function getEditionInvitePublishRecord(
  registryKey: string
): EditionInvitePublishRecord | null {
  return publishLedger.get(registryKey) ?? null;
}

export function snapshotEditionInvitePublishRecord(
  registryKey: string
): EditionInvitePublishRecord | null {
  const current = publishLedger.get(registryKey);
  return current ? { ...current } : null;
}

export function writeEditionInvitePublishRecord(
  record: EditionInvitePublishRecord
): void {
  publishLedger.set(record.registryKey, { ...record });
}

export function restoreEditionInvitePublishRecord(
  snapshot: EditionInvitePublishRecord | null,
  registryKey: string
): void {
  if (snapshot) {
    publishLedger.set(registryKey, { ...snapshot });
    return;
  }
  publishLedger.delete(registryKey);
}

export function markEditionInvitePublished(input: {
  registryKey: string;
  publicSlug: string;
  inviteUrl: string;
  overall: "healthy" | "warning";
  publishedAt?: string;
}): EditionInvitePublishRecord {
  const record: EditionInvitePublishRecord = {
    registryKey: input.registryKey,
    status: "published",
    version: PUBLISH_HEALTH_VERSION,
    publishedAt: input.publishedAt ?? new Date().toISOString(),
    publicSlug: input.publicSlug,
    inviteUrl: input.inviteUrl,
    lastHealthOverall: input.overall,
  };
  writeEditionInvitePublishRecord(record);
  return record;
}

export function markEditionInviteDraft(input: {
  registryKey: string;
  publicSlug?: string | null;
  inviteUrl?: string | null;
}): EditionInvitePublishRecord {
  const record: EditionInvitePublishRecord = {
    registryKey: input.registryKey,
    status: "draft",
    version: PUBLISH_HEALTH_VERSION,
    publishedAt: null,
    publicSlug: input.publicSlug ?? null,
    inviteUrl: input.inviteUrl ?? null,
    lastHealthOverall: null,
  };
  writeEditionInvitePublishRecord(record);
  return record;
}

export function isEditionInvitePubliclyPublished(
  registryKey: string
): boolean {
  return publishLedger.get(registryKey)?.status === "published";
}
