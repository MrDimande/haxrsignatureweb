import "server-only";

import { neonQuery } from "@/lib/neon/server-db";
import { sendPortalActivationEmail } from "@/lib/email/portal-activation";
import {
  normalizePortalEmail,
  type PortalAccountStatus,
} from "@/lib/portal-auth/credentials";
import {
  invalidatePortalAccountToken,
  issuePortalAccountToken,
} from "@/lib/portal-auth/portal-auth.server";
import { getPortalAuthBaseUrl } from "@/lib/portal-auth/portal-env.server";

export const PORTAL_RESEND_ACTIVATION_SUCCESS_MESSAGE =
  "Se este endereço estiver associado a uma conta pendente de activação, enviámos um novo link por email.";

export type ExistingActivationAccount = {
  accountId: string;
  status: PortalAccountStatus;
};

export type PortalResendActivationDependencies = {
  findAccountByEmail: (email: string) => Promise<ExistingActivationAccount | null>;
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
  getOrigin: () => Promise<string>;
};

async function defaultFindAccountByEmail(email: string): Promise<ExistingActivationAccount | null> {
  const result = await neonQuery<{ id: string; status: PortalAccountStatus }>(
    `SELECT id, status::text AS status
       FROM public.portal_accounts
      WHERE lower(email) = $1
      LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { accountId: row.id, status: row.status };
}

const defaultDependencies: PortalResendActivationDependencies = {
  findAccountByEmail: defaultFindAccountByEmail,
  issueToken: issuePortalAccountToken,
  sendEmail: sendPortalActivationEmail,
  invalidateToken: invalidatePortalAccountToken,
  getOrigin: async () => getPortalAuthBaseUrl(),
};

/**
 * Resend activation link request.
 * Strictly enforces user enumeration protection by returning an identical success response
 * whether the account exists, is already active, suspended, or nonexistent.
 */
export async function executePortalResendActivation(
  input: { email: unknown },
  overrides?: Partial<PortalResendActivationDependencies>,
): Promise<
  | { success: true; message: string }
  | { success: false; error: string }
> {
  const dependencies: PortalResendActivationDependencies = {
    ...defaultDependencies,
    ...overrides,
  };

  const rawEmail = typeof input.email === "string" ? input.email.trim() : "";
  const normalizedEmail = normalizePortalEmail(rawEmail);
  if (!normalizedEmail) {
    return {
      success: false,
      error: "Introduza um endereço de email válido.",
    };
  }

  try {
    const account = await dependencies.findAccountByEmail(normalizedEmail);

    if (account && account.status === "PENDING_ACTIVATION") {
      const origin = await dependencies.getOrigin();
      const issued = await dependencies.issueToken({
        accountId: account.accountId,
        purpose: "activation",
        expectedAccountStatus: "PENDING_ACTIVATION",
      });

      const delivery = await dependencies.sendEmail({
        email: normalizedEmail,
        token: issued.token,
        expiresAt: issued.expiresAt,
        origin,
      });

      if (delivery.delivery === "failed") {
        await dependencies.invalidateToken({
          accountId: account.accountId,
          purpose: "activation",
          token: issued.token,
        });
      }
    }
  } catch (error) {
    console.error("[portal-auth:resend-activation-error]", {
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }

  return {
    success: true,
    message: PORTAL_RESEND_ACTIVATION_SUCCESS_MESSAGE,
  };
}
