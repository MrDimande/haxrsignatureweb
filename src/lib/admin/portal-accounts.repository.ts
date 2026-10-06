import "server-only";

import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import type { PortalAccountStatus } from "@/lib/portal-auth/credentials";

type PortalAccountRow = {
  account_id: string;
  profile_id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  has_live_activation: boolean;
};

export type AdminPortalAccount = {
  accountId: string;
  profileId: string;
  fullName: string | null;
  email: string | null;
  status: PortalAccountStatus;
  hasLiveActivation: boolean;
};

const PORTAL_ACCOUNT_STATUSES: readonly PortalAccountStatus[] = [
  "PENDING_ACTIVATION",
  "ACTIVE",
  "SUSPENDED",
  "PENDING_IDENTITY_RESOLUTION",
];

const portalAccountColumns = `
  a.id AS account_id,
  a.profile_id,
  p.full_name,
  a.email,
  a.status::text AS status,
  EXISTS (
    SELECT 1
      FROM public.portal_account_tokens t
     WHERE t.account_id = a.id
       AND t.purpose = 'activation'::public.portal_token_purpose
       AND t.expires_at > now()
       AND t.consumed_at IS NULL
       AND t.invalidated_at IS NULL
  ) AS has_live_activation`;

function mapPortalAccount(row: PortalAccountRow): AdminPortalAccount {
  if (!PORTAL_ACCOUNT_STATUSES.includes(row.status as PortalAccountStatus)) {
    throw new Error("O registo da conta do Portal contém um estado inválido.");
  }

  return {
    accountId: row.account_id,
    profileId: row.profile_id,
    fullName: row.full_name,
    email: row.email,
    status: row.status as PortalAccountStatus,
    hasLiveActivation: row.has_live_activation,
  };
}

export async function listPortalAccountsForAdmin(): Promise<AdminPortalAccount[]> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("A gestão de contas do Portal requer a ligação Neon configurada.");
  }

  const result = await neonQuery<PortalAccountRow>(
    `SELECT ${portalAccountColumns}
       FROM public.portal_accounts a
       JOIN public.profiles p ON p.id = a.profile_id
      ORDER BY a.updated_at DESC
      LIMIT 100`,
  );

  return result.rows.map(mapPortalAccount);
}

export async function findPortalAccountForAdminActivation(
  accountId: string,
): Promise<AdminPortalAccount | null> {
  if (!shouldUseNeonServerDatabase()) {
    throw new Error("A gestão de contas do Portal requer a ligação Neon configurada.");
  }

  const result = await neonQuery<PortalAccountRow>(
    `SELECT ${portalAccountColumns}
       FROM public.portal_accounts a
       JOIN public.profiles p ON p.id = a.profile_id
      WHERE a.id = $1::uuid
      LIMIT 1`,
    [accountId],
  );

  const row = result.rows[0];
  return row ? mapPortalAccount(row) : null;
}
