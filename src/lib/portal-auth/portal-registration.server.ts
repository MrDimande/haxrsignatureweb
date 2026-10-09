import "server-only";

import { headers } from "next/headers";
import { neonQuery, withNeonTransaction } from "@/lib/neon/server-db";
import { sendPortalActivationEmail } from "@/lib/email/portal-activation";
import {
  normalizePortalEmail,
  type PortalAccountStatus,
} from "@/lib/portal-auth/credentials";
import {
  invalidatePortalAccountToken,
  issuePortalAccountToken,
} from "@/lib/portal-auth/portal-auth.server";
import {
  hasSignUpFieldErrors,
  validateSignUpInput,
  type SignUpFieldErrors,
} from "@/lib/auth/sign-up-auth";

export const PORTAL_REGISTRATION_SUCCESS_MESSAGE =
  "Se este endereço puder ser utilizado para criar ou activar uma conta HAXR, receberá as instruções por email.";

export type ExistingPortalIdentity = {
  accountId: string;
  profileId: string;
  status: PortalAccountStatus;
  hasActiveEvent: boolean;
};

export type PortalRegistrationInput = {
  fullName: unknown;
  email: unknown;
  termsAccepted: unknown;
};

export type PortalRegistrationResult =
  | { success: true; message: string }
  | {
      success: false;
      error: string;
      fieldErrors?: SignUpFieldErrors;
    };

export type PortalRegistrationDependencies = {
  findAccountByEmail: (email: string) => Promise<ExistingPortalIdentity | null>;
  createProfileAndAccount: (input: {
    fullName: string;
    email: string;
  }) => Promise<{ accountId: string; profileId: string }>;
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

function parseHttpsOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

async function getTrustedRegistrationOrigin(): Promise<string> {
  if (process.env.VERCEL_ENV === "preview") {
    const previewHost = process.env.VERCEL_BRANCH_URL?.trim() || process.env.VERCEL_URL?.trim();
    const previewOrigin = previewHost ? parseHttpsOrigin(`https://${previewHost}`) : null;
    if (previewOrigin) return previewOrigin;
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = configuredOrigin ? parseHttpsOrigin(configuredOrigin) : null;
  if (origin) return origin;

  if (process.env.NODE_ENV !== "production") {
    try {
      const requestHeaders = await headers();
      const host = requestHeaders.get("host");
      if (host) {
        const proto =
          requestHeaders.get("x-forwarded-proto") ||
          (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
        return `${proto}://${host}`;
      }
    } catch {
      // Outside request context (e.g. tests)
    }
  }

  return "https://haxrsignature.com";
}

async function defaultFindAccountByEmail(email: string): Promise<ExistingPortalIdentity | null> {
  const result = await neonQuery<{
    account_id: string;
    profile_id: string;
    status: PortalAccountStatus;
    active_client_event_id: string | null;
  }>(
    `SELECT a.id AS account_id,
            a.profile_id,
            a.status::text AS status,
            p.active_client_event_id
       FROM public.portal_accounts a
       JOIN public.profiles p ON p.id = a.profile_id
      WHERE lower(a.email) = $1
      LIMIT 1`,
    [email],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    accountId: row.account_id,
    profileId: row.profile_id,
    status: row.status,
    hasActiveEvent: Boolean(row.active_client_event_id),
  };
}

async function defaultCreateProfileAndAccount(input: {
  fullName: string;
  email: string;
}): Promise<{ accountId: string; profileId: string }> {
  return withNeonTransaction(async (client) => {
    const profileId = crypto.randomUUID();
    await client.query(
      `INSERT INTO public.profiles (id, full_name, app_role)
       VALUES ($1::uuid, $2, 'client'::public.app_user_role)`,
      [profileId, input.fullName.trim()],
    );

    const accountResult = await client.query<{ id: string }>(
      `INSERT INTO public.portal_accounts (profile_id, email, status)
       VALUES ($1::uuid, $2, 'PENDING_ACTIVATION'::public.portal_account_status)
       RETURNING id`,
      [profileId, input.email],
    );

    const accountId = accountResult.rows[0]?.id;
    if (!accountId) {
      throw new Error("portal_account_creation_failed");
    }

    return { accountId, profileId };
  });
}

const defaultDependencies: PortalRegistrationDependencies = {
  findAccountByEmail: defaultFindAccountByEmail,
  createProfileAndAccount: defaultCreateProfileAndAccount,
  issueToken: issuePortalAccountToken,
  sendEmail: sendPortalActivationEmail,
  invalidateToken: invalidatePortalAccountToken,
  getOrigin: getTrustedRegistrationOrigin,
};

/**
 * Public self-service portal registration.
 *
 * Implements strict duplicate protection, neutral enumeration defense,
 * canonical 1:1 profile/account binding with status = PENDING_ACTIVATION,
 * and single-use hashed activation token issuance via email.
 */
export async function executePortalRegistration(
  input: PortalRegistrationInput,
  overrides?: Partial<PortalRegistrationDependencies>,
): Promise<PortalRegistrationResult> {
  const dependencies: PortalRegistrationDependencies = {
    ...defaultDependencies,
    ...overrides,
  };

  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const rawEmail = typeof input.email === "string" ? input.email.trim() : "";
  const termsAccepted = input.termsAccepted === true;

  const validationErrors = validateSignUpInput({
    fullName,
    email: rawEmail,
    termsAccepted,
  });

  if (hasSignUpFieldErrors(validationErrors)) {
    const firstErrorMessage =
      validationErrors.fullName ||
      validationErrors.email ||
      validationErrors.termsAccepted ||
      "Dados de registo inválidos.";
    return {
      success: false,
      error: firstErrorMessage,
      fieldErrors: validationErrors,
    };
  }

  const normalizedEmail = normalizePortalEmail(rawEmail);
  if (!normalizedEmail) {
    return {
      success: false,
      error: "Introduza um endereço de email válido.",
      fieldErrors: { email: "Introduza um endereço de email válido." },
    };
  }

  // Safe lookup for existing identity bound to this email
  const existing = await dependencies.findAccountByEmail(normalizedEmail);

  if (existing) {
    switch (existing.status) {
      case "ACTIVE": {
        // Account is already active. Do not duplicate profile, account, or event.
        // Return neutral public response to protect against enumeration.
        return { success: true, message: PORTAL_REGISTRATION_SUCCESS_MESSAGE };
      }

      case "PENDING_ACTIVATION": {
        // Account exists and is pending activation. Re-issue fresh activation token.
        try {
          const origin = await dependencies.getOrigin();
          const issued = await dependencies.issueToken({
            accountId: existing.accountId,
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
              accountId: existing.accountId,
              purpose: "activation",
              token: issued.token,
            });
          }
        } catch {
          // Fail gracefully and return neutral response
        }
        return { success: true, message: PORTAL_REGISTRATION_SUCCESS_MESSAGE };
      }

      case "SUSPENDED": {
        // Account suspended. Do not reactivate, do not issue tokens, do not leak status.
        return { success: true, message: PORTAL_REGISTRATION_SUCCESS_MESSAGE };
      }

      case "PENDING_IDENTITY_RESOLUTION": {
        // Unresolved legacy profile. Do not automatically guess or bind.
        // Requires human/admin review. Return neutral response.
        return { success: true, message: PORTAL_REGISTRATION_SUCCESS_MESSAGE };
      }
    }
  }

  // Brand-new client identity: create profile + portal_account bound 1:1
  let accountId: string;
  try {
    const created = await dependencies.createProfileAndAccount({
      fullName,
      email: normalizedEmail,
    });
    accountId = created.accountId;
  } catch (error) {
    // Unique email race condition handling (Postgres unique violation 23505)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return { success: true, message: PORTAL_REGISTRATION_SUCCESS_MESSAGE };
    }
    return {
      success: false,
      error: "O serviço de registo está temporariamente indisponível.",
    };
  }

  // Issue hashed activation token and deliver email
  try {
    const origin = await dependencies.getOrigin();
    const issued = await dependencies.issueToken({
      accountId,
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
        accountId,
        purpose: "activation",
        token: issued.token,
      });
    }
  } catch {
    // Account remains PENDING_ACTIVATION; token failure is safely handled
  }

  return { success: true, message: PORTAL_REGISTRATION_SUCCESS_MESSAGE };
}
