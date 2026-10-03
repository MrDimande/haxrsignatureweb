import "server-only";

import { neonQuery } from "@/lib/neon/server-db";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";

export const ADMIN_AUDIT_ACTIONS = [
  "bootstrap",
  "identity_migrated",
  "login",
  "login_success",
  "login_failed",
  "password_set",
  "password_changed",
  "password_reset_requested",
  "password_reset_completed",
  "user_invited",
  "invite_reissued",
  "invite_accepted",
  "role_updated",
  "role_changed",
  "permission_changed",
  "status_updated",
  "user_suspended",
  "user_reactivated",
  "session_revoked",
  "all_sessions_revoked",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export type RecordAdminAuditInput = {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: AdminAuditAction;
  details?: Record<string, unknown>;
};

export type AdminAuditLogEntry = {
  id: string;
  actorUserId: string | null;
  targetUserId: string | null;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
};

const FORBIDDEN_DETAIL_KEYS = new Set([
  "password",
  "password_hash",
  "passwordHash",
  "token",
  "raw_token",
  "rawToken",
  "secret",
  "cookie",
]);

function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> {
  if (!details) return {};
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (FORBIDDEN_DETAIL_KEYS.has(key.toLowerCase())) {
      continue;
    }
    // Stringify safe scalar/object values without leaking secret tokens
    if (typeof value === "string") {
      // Prevent accidental leak if key looks like token/secret
      if (/(password|secret|hash|token)/i.test(key) && !key.endsWith("_id")) {
        continue;
      }
      sanitized[key] = value.slice(0, 500);
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeDetails(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 20);
    }
  }

  return sanitized;
}

export async function recordAdminAudit(input: RecordAdminAuditInput): Promise<void> {
  if (!shouldUseNeonServerDatabase()) return;

  const sanitized = sanitizeDetails(input.details);

  await neonQuery(
    `INSERT INTO public.admin_user_audit_log (
       actor_user_id,
       target_user_id,
       action,
       details
     ) VALUES (
       $1::uuid,
       $2::uuid,
       $3,
       $4::jsonb
     )`,
    [
      input.actorUserId || null,
      input.targetUserId || null,
      input.action,
      JSON.stringify(sanitized),
    ],
  );
}

export async function listRecentAdminAuditLogs(options?: {
  targetUserId?: string;
  limit?: number;
}): Promise<AdminAuditLogEntry[]> {
  if (!shouldUseNeonServerDatabase()) return [];

  const limit = Math.min(options?.limit ?? 50, 100);
  let query = `
    SELECT id, actor_user_id, target_user_id, action, details, created_at
      FROM public.admin_user_audit_log
  `;
  const values: unknown[] = [];

  if (options?.targetUserId) {
    query += ` WHERE target_user_id = $1::uuid`;
    values.push(options.targetUserId);
  }

  query += ` ORDER BY created_at DESC LIMIT $${values.length + 1}`;
  values.push(limit);

  const result = await neonQuery<{
    id: string;
    actor_user_id: string | null;
    target_user_id: string | null;
    action: string;
    details: Record<string, unknown>;
    created_at: Date | string;
  }>(query, values);

  return result.rows.map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    targetUserId: row.target_user_id,
    action: row.action,
    details: row.details ?? {},
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  }));
}
