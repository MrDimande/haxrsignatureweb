import "server-only";

import { headers } from "next/headers";
import { recordAdminAudit } from "@/lib/admin/admin-audit.repository";
import { requireOwnerAdminIdentity } from "@/lib/admin/admin-identity.server";
import type { AdminActionResult } from "@/lib/admin/actions/admin-users.actions";
import type { AdminIdentity } from "@/lib/admin/admin-user";
import {
  findPortalAccountForAdminActivation,
  type AdminPortalAccount,
} from "@/lib/admin/portal-accounts.repository";
import { sendPortalActivationEmail } from "@/lib/email/portal-activation";
import {
  invalidatePortalAccountToken,
  issuePortalAccountToken,
} from "@/lib/portal-auth/portal-auth.server";

export type PortalActivationActionData = {
  delivery: "sent";
  auditRecorded: boolean;
};

export type PortalActivationDependencies = {
  requireOwner: () => Promise<AdminIdentity>;
  findAccount: (accountId: string) => Promise<AdminPortalAccount | null>;
  issueToken: (input: {
    accountId: string;
    purpose: "activation";
    expectedAccountStatus: "PENDING_ACTIVATION";
  }) => Promise<{ token: string; expiresAt: Date }>;
  sendEmail: (input: {
    email: string;
    token: string;
    expiresAt: Date;
    origin: string;
  }) => Promise<{ delivery: "sent" | "not_configured" | "failed" }>;
  invalidateToken: (input: {
    accountId: string;
    purpose: "activation";
    token: string;
  }) => Promise<boolean>;
  recordAudit: (input: {
    actorUserId: string;
    targetUserId: null;
    action: "portal_activation_sent";
    details: { account_id: string; profile_id: string };
  }) => Promise<void>;
  getOrigin: () => Promise<string>;
};

class PortalActivationError extends Error {}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseHttpsOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

async function getTrustedActivationOrigin(): Promise<string> {
  if (process.env.VERCEL_ENV === "preview") {
    const previewHost = process.env.VERCEL_BRANCH_URL?.trim() || process.env.VERCEL_URL?.trim();
    const previewOrigin = previewHost ? parseHttpsOrigin(`https://${previewHost}`) : null;
    if (!previewOrigin) throw new PortalActivationError("preview_origin_unavailable");
    return previewOrigin;
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = configuredOrigin ? parseHttpsOrigin(configuredOrigin) : null;
  if (origin) return origin;

  if (process.env.NODE_ENV !== "production") {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");
    if (host && /^localhost(?::\d+)?$/i.test(host)) return `http://${host}`;
  }

  throw new PortalActivationError("activation_origin_unavailable");
}

const defaultDependencies: PortalActivationDependencies = {
  requireOwner: requireOwnerAdminIdentity,
  findAccount: findPortalAccountForAdminActivation,
  issueToken: issuePortalAccountToken,
  sendEmail: sendPortalActivationEmail,
  invalidateToken: invalidatePortalAccountToken,
  recordAudit: recordAdminAudit,
  getOrigin: getTrustedActivationOrigin,
};

/**
 * Server-only orchestration. The raw token remains local to the email transport
 * and is invalidated when delivery is not confirmed.
 */
export async function executePortalActivation(
  input: { accountId: unknown },
  dependencies: PortalActivationDependencies = defaultDependencies,
): Promise<AdminActionResult<PortalActivationActionData>> {
  try {
    const owner = await dependencies.requireOwner();
    if (!isUuid(input?.accountId)) {
      return { success: false, error: "Conta do Portal inválida." };
    }

    const account = await dependencies.findAccount(input.accountId);
    if (!account) {
      return { success: false, error: "Conta do Portal não encontrada." };
    }
    if (!account.email) {
      return { success: false, error: "A conta do Portal não tem um email reconciliado." };
    }
    if (account.status !== "PENDING_ACTIVATION") {
      return { success: false, error: "A activação só está disponível para contas pendentes." };
    }

    const origin = await dependencies.getOrigin();
    const issued = await dependencies.issueToken({
      accountId: account.accountId,
      purpose: "activation",
      expectedAccountStatus: "PENDING_ACTIVATION",
    });
    const delivery = await dependencies.sendEmail({
      email: account.email,
      token: issued.token,
      expiresAt: issued.expiresAt,
      origin,
    });

    if (delivery.delivery !== "sent") {
      const invalidated = await dependencies.invalidateToken({
        accountId: account.accountId,
        purpose: "activation",
        token: issued.token,
      });
      if (!invalidated) throw new PortalActivationError("activation_token_invalidation_failed");
      return { success: false, error: "Não foi possível enviar a activação. A conta permanece pendente." };
    }

    try {
      await dependencies.recordAudit({
        actorUserId: owner.id,
        targetUserId: null,
        action: "portal_activation_sent",
        details: { account_id: account.accountId, profile_id: account.profileId },
      });
      return { success: true, data: { delivery: "sent", auditRecorded: true } };
    } catch {
      return { success: true, data: { delivery: "sent", auditRecorded: false } };
    }
  } catch {
    return { success: false, error: "Não foi possível enviar a activação. A conta permanece pendente." };
  }
}
