import { getCurrentAppSession } from "@/lib/auth/app-session";
import {
  shouldUseNeonAuthForAppSession,
  shouldUseNeonServerDatabase,
  validateNeonServerEnvironment,
} from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import {
  validateClientAppAuthEnvironment as validateSupabaseAuthEnvironment,
  validateClientAppServiceRoleEnvironment as validateSupabaseServiceRoleEnvironment,
  type ClientAppAuthEnvCheck,
} from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createSupabaseServerAuthClient,
  resolveAuthenticatedSupabaseClient,
} from "@/lib/supabase/server-auth";

type QueryError = { message: string; code?: string } | null;
type QueryResult<T> = { data: T | null; error: QueryError };

type ClientEventReadTable = "client_events" | "event_members";
type FilterValue = string | boolean;

type Filter = {
  column: string;
  value: FilterValue;
};

const ALLOWED_FILTERS: Record<ClientEventReadTable, ReadonlySet<string>> = {
  client_events: new Set([
    "id",
    "owner_user_id",
    "onboarding_fingerprint",
    "is_active",
  ]),
  event_members: new Set(["id", "client_event_id", "user_id"]),
};

class NeonReadQuery<T> {
  private readonly filters: Filter[] = [];

  constructor(
    private readonly table: ClientEventReadTable,
    private readonly columns: string,
  ) {}

  eq(column: string, value: FilterValue): this {
    if (!ALLOWED_FILTERS[this.table].has(column)) {
      throw new Error(`Filtro não permitido no acesso client-event: ${this.table}.${column}`);
    }
    this.filters.push({ column, value });
    return this;
  }

  async maybeSingle(): Promise<QueryResult<T>> {
    try {
      const values = this.filters.map((filter) => filter.value);
      const where = this.filters.length
        ? ` WHERE ${this.filters
            .map((filter, index) => `"${filter.column}" = $${index + 1}`)
            .join(" AND ")}`
        : "";
      const projection = this.table === "event_members" && this.columns.trim() === "id"
        ? "id"
        : "*";

      const result = await neonQuery<Record<string, unknown>>(
        `SELECT ${projection} FROM public.${this.table}${where} LIMIT 1`,
        values,
      );

      return {
        data: (result.rows[0] as T | undefined) ?? null,
        error: null,
      };
    } catch (cause) {
      return {
        data: null,
        error: {
          message: cause instanceof Error ? cause.message : "Falha ao consultar Neon.",
        },
      };
    }
  }
}

class NeonClientEventReadClient {
  from(table: ClientEventReadTable) {
    return {
      select: <T = Record<string, unknown>>(columns: string) =>
        new NeonReadQuery<T>(table, columns),
    };
  }
}

const NEON_OPERATIONAL_RPCS = {
  get_client_event_guests: "get_client_event_guests",
  get_client_event_payments: "get_client_event_payments",
  get_client_event_checklist: "get_client_event_checklist",
  get_client_event_documents: "get_client_event_documents",
  get_client_event_vendors: "get_client_event_vendors",
} as const;

type NeonOperationalRpcName = keyof typeof NEON_OPERATIONAL_RPCS;

class NeonClientEventOperationalRpcClient {
  async rpc(
    fn: NeonOperationalRpcName,
    args: { p_client_event_id: string },
  ): Promise<QueryResult<unknown>> {
    const sqlFunction = NEON_OPERATIONAL_RPCS[fn];
    if (!sqlFunction) {
      return {
        data: null,
        error: { message: `RPC operacional não permitida: ${String(fn)}` },
      };
    }

    try {
      const result = await neonQuery<{ payload: unknown }>(
        `SELECT public.${sqlFunction}($1::uuid) AS payload`,
        [args.p_client_event_id],
      );
      return { data: result.rows[0]?.payload ?? null, error: null };
    } catch (cause) {
      return {
        data: null,
        error: {
          message: cause instanceof Error ? cause.message : "Falha ao executar RPC Neon.",
        },
      };
    }
  }
}

function validateNeonAsClientAppEnvironment(): ClientAppAuthEnvCheck {
  const neon = validateNeonServerEnvironment();
  if (!neon.ok) {
    return { ok: false, message: neon.message };
  }
  return { ok: true, projectRef: "neon" };
}

/**
 * Auth/session boundary for the client-event application.
 * Production remains Supabase until HAXR_AUTH_PROVIDER=neon is explicitly enabled.
 */
export function validateClientEventAuthEnvironment(): ClientAppAuthEnvCheck {
  return shouldUseNeonAuthForAppSession()
    ? validateNeonAsClientAppEnvironment()
    : validateSupabaseAuthEnvironment();
}

/**
 * Privileged operational reads can move to Neon independently of the Auth cutover.
 * In migration Preview this follows the existing Neon database provider switch.
 */
export function validateClientEventOperationalEnvironment(): ClientAppAuthEnvCheck {
  return shouldUseNeonServerDatabase()
    ? validateNeonAsClientAppEnvironment()
    : validateSupabaseServiceRoleEnvironment();
}

export async function createClientEventReadAuthClient<T>(): Promise<T | null> {
  const envCheck = validateClientEventAuthEnvironment();
  if (!envCheck.ok) return null;

  if (shouldUseNeonAuthForAppSession()) {
    return new NeonClientEventReadClient() as unknown as T;
  }

  return (await createSupabaseServerAuthClient()) as unknown as T;
}

export function createClientEventOperationalRpcClient<T>(): T {
  if (shouldUseNeonServerDatabase()) {
    return new NeonClientEventOperationalRpcClient() as unknown as T;
  }

  return createAdminClient() as unknown as T;
}

export async function resolveClientEventReadRequestAuth<T>(request: Request): Promise<{
  user: { id: string } | null;
  profile: Awaited<ReturnType<typeof getCurrentAppSession>>["profile"];
  authClient: T | null;
}> {
  const session = await getCurrentAppSession();
  const envCheck = validateClientEventAuthEnvironment();
  if (!envCheck.ok) {
    return { user: null, profile: session.profile, authClient: null };
  }

  if (shouldUseNeonAuthForAppSession()) {
    return {
      user: session.user,
      profile: session.profile,
      authClient: new NeonClientEventReadClient() as unknown as T,
    };
  }

  const resolved = await resolveAuthenticatedSupabaseClient(request);
  return {
    user: resolved.user ?? session.user,
    profile: session.profile,
    authClient: resolved.supabase as unknown as T,
  };
}
