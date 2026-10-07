import { getCurrentAppSession } from "@/lib/auth/app-session";
import {
  validateNeonServerEnvironment,
} from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import {
  normalizeClientEventRow,
} from "@/lib/events/client-event-row-normalizer";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";

export type ClientAppAuthEnvCheck =
  | { ok: true; projectRef: string }
  | { ok: false; message: string };

type QueryError = { message: string; code?: string } | null;
export type ClientEventReadQueryResult<T> = { data: T | null; error: QueryError };

type ClientEventReadTable = "client_events" | "event_members";
type FilterValue = string | boolean;
type ClientEventMemberRow = { id: string };

type Filter = {
  column: string;
  value: FilterValue;
};

export type ClientEventReadQuery<T> = {
  eq(column: string, value: FilterValue): ClientEventReadQuery<T>;
  maybeSingle(): Promise<ClientEventReadQueryResult<T>>;
};

type ClientEventReadTableClient<T> = {
  select(columns: string): ClientEventReadQuery<T>;
};

export type ClientEventReadAuthClient = {
  from(table: "client_events"): ClientEventReadTableClient<ClientEventRow>;
  from(table: "event_members"): ClientEventReadTableClient<ClientEventMemberRow>;
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

class NeonReadQuery<T> implements ClientEventReadQuery<T> {
  private readonly filters: Filter[] = [];

  constructor(
    private readonly table: ClientEventReadTable,
    private readonly columns: string,
    private readonly normalizeRow: (row: Record<string, unknown>) => T,
  ) {}

  eq(column: string, value: FilterValue): this {
    if (!ALLOWED_FILTERS[this.table].has(column)) {
      throw new Error(`Filtro não permitido no acesso client-event: ${this.table}.${column}`);
    }
    this.filters.push({ column, value });
    return this;
  }

  async maybeSingle(): Promise<ClientEventReadQueryResult<T>> {
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
        data: result.rows[0] ? this.normalizeRow(result.rows[0]) : null,
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

function normalizeEventMemberRow(row: Record<string, unknown>): ClientEventMemberRow {
  if (typeof row.id !== "string" || !row.id.trim()) {
    throw new Error("event_member_row_invalid:id");
  }
  return { id: row.id };
}

class NeonClientEventReadClient implements ClientEventReadAuthClient {
  from(table: "client_events"): ClientEventReadTableClient<ClientEventRow>;
  from(table: "event_members"): ClientEventReadTableClient<ClientEventMemberRow>;
  from(
    table: ClientEventReadTable,
  ): ClientEventReadTableClient<ClientEventRow> | ClientEventReadTableClient<ClientEventMemberRow> {
    if (table === "client_events") {
      return {
        select: (columns: string) =>
          new NeonReadQuery(table, columns, normalizeClientEventRow),
      };
    }

    return {
      select: (columns: string) =>
        new NeonReadQuery(table, columns, normalizeEventMemberRow),
    };
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
 * Identity comes only from the HAXR-owned portal session.
 */
export function validateClientEventAuthEnvironment(): ClientAppAuthEnvCheck {
  return validateNeonAsClientAppEnvironment();
}

/**
 * Privileged operational reads can move to Neon independently of the Auth cutover.
 * In migration Preview this follows the existing Neon database provider switch.
 */
export function validateClientEventOperationalEnvironment(): ClientAppAuthEnvCheck {
  return validateNeonAsClientAppEnvironment();
}

export async function createClientEventReadAuthClient(): Promise<ClientEventReadAuthClient | null> {
  const envCheck = validateClientEventAuthEnvironment();
  if (!envCheck.ok) return null;

  return new NeonClientEventReadClient();
}

export async function resolveClientEventReadRequestAuth(request: Request): Promise<{
  user: { id: string } | null;
  profile: Awaited<ReturnType<typeof getCurrentAppSession>>["profile"];
  authClient: ClientEventReadAuthClient | null;
}> {
  void request;
  const session = await getCurrentAppSession();
  const envCheck = validateClientEventAuthEnvironment();
  if (!envCheck.ok) {
    return { user: null, profile: session.profile, authClient: null };
  }

  return {
    user: session.user,
    profile: session.profile,
    authClient: new NeonClientEventReadClient(),
  };
}
