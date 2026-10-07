import type {
  ClientEventRow,
  ClientEventSource,
  ClientEventStatus,
  ClientEventType,
} from "@/lib/events/client-app-database.types";

const CLIENT_EVENT_TYPES = [
  "wedding",
  "birthday",
  "corporate",
  "baby_shower",
  "graduation",
  "other",
] as const;

const CLIENT_EVENT_STATUSES = ["planning", "active", "completed", "archived"] as const;
const CLIENT_EVENT_SOURCES = ["onboarding", "manual", "import"] as const;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ClientEventRowNormalizationError extends Error {
  constructor(field: string, reason: string) {
    super(`client_event_row_invalid:${field}:${reason}`);
    this.name = "ClientEventRowNormalizationError";
  }
}

function fail(field: string, reason: string): never {
  throw new ClientEventRowNormalizationError(field, reason);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(row: Record<string, unknown>, field: string): string {
  const value = row[field];
  if (typeof value !== "string") fail(field, "expected_string");
  return value;
}

function readNullableString(row: Record<string, unknown>, field: string): string | null {
  const value = row[field];
  if (value === null) return null;
  if (typeof value !== "string") fail(field, "expected_nullable_string");
  return value;
}

function readUuid(row: Record<string, unknown>, field: string): string {
  const value = readRequiredString(row, field);
  if (!UUID_PATTERN.test(value)) fail(field, "expected_uuid");
  return value;
}

function readNullableUuid(row: Record<string, unknown>, field: string): string | null {
  const value = readNullableString(row, field);
  if (value !== null && !UUID_PATTERN.test(value)) fail(field, "expected_nullable_uuid");
  return value;
}

function readStringArray(row: Record<string, unknown>, field: string): string[] {
  const value = row[field];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    fail(field, "expected_string_array");
  }
  return value;
}

function readBoolean(row: Record<string, unknown>, field: string): boolean {
  const value = row[field];
  if (typeof value !== "boolean") fail(field, "expected_boolean");
  return value;
}

function readEnum<T extends string>(
  row: Record<string, unknown>,
  field: string,
  values: readonly T[],
): T {
  const value = readRequiredString(row, field);
  const matched = values.find((candidate) => candidate === value);
  if (!matched) fail(field, "unexpected_enum_value");
  return matched;
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}

function normalizeDateOnly(value: unknown, field: string): string | null {
  if (value === null) return null;

  if (value instanceof Date) {
    if (!isValidDate(value)) fail(field, "invalid_date");
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) {
    fail(field, "expected_date_only");
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!isValidDate(parsed) || parsed.toISOString().slice(0, 10) !== value) {
    fail(field, "invalid_date");
  }
  return value;
}

function normalizeTimestamp(value: unknown, field: string): string {
  const parsed = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
  if (!parsed || !isValidDate(parsed)) fail(field, "expected_timestamp");
  return parsed.toISOString();
}

function readNonNegativeInteger(row: Record<string, unknown>, field: string): number {
  const value = row[field];
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    fail(field, "expected_non_negative_integer");
  }
  return value;
}

function normalizeBudget(value: unknown, field: string): number | null {
  if (value === null) return null;

  let numeric: number;
  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "bigint") {
    numeric = Number(value);
  } else if (typeof value === "string" && /^-?\d+$/.test(value)) {
    numeric = Number(value);
  } else {
    fail(field, "expected_nullable_bigint");
  }

  if (!Number.isSafeInteger(numeric)) fail(field, "unsafe_integer");
  return numeric;
}

/**
 * Converts the node-postgres representation of public.client_events into the
 * application contract before it reaches feature services.
 */
export function normalizeClientEventRow(raw: unknown): ClientEventRow {
  if (!isRecord(raw)) fail("row", "expected_record");

  return {
    id: readUuid(raw, "id"),
    owner_user_id: readUuid(raw, "owner_user_id"),
    slug: readRequiredString(raw, "slug"),
    event_name: readRequiredString(raw, "event_name"),
    event_type: readEnum<ClientEventType>(raw, "event_type", CLIENT_EVENT_TYPES),
    bride_name: readRequiredString(raw, "bride_name"),
    groom_name: readRequiredString(raw, "groom_name"),
    event_date: normalizeDateOnly(raw.event_date, "event_date"),
    event_location: readRequiredString(raw, "event_location"),
    estimated_guests: readNonNegativeInteger(raw, "estimated_guests"),
    budget_min: normalizeBudget(raw.budget_min, "budget_min"),
    budget_max: normalizeBudget(raw.budget_max, "budget_max"),
    status: readEnum<ClientEventStatus>(raw, "status", CLIENT_EVENT_STATUSES),
    source: readEnum<ClientEventSource>(raw, "source", CLIENT_EVENT_SOURCES),
    services_interested: readStringArray(raw, "services_interested"),
    phone: readNullableString(raw, "phone"),
    operational_event_id: readNullableUuid(raw, "operational_event_id"),
    is_active: readBoolean(raw, "is_active"),
    onboarding_fingerprint: readNullableString(raw, "onboarding_fingerprint"),
    created_at: normalizeTimestamp(raw.created_at, "created_at"),
    updated_at: normalizeTimestamp(raw.updated_at, "updated_at"),
  };
}
