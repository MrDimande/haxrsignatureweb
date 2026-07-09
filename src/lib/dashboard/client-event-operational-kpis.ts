/**
 * Operational KPI aggregates for client dashboard (events.* schema).
 * Loaded server-side via service role after ACL check — operational tables
 * have RLS without authenticated policies (migration 006).
 */

export type ClientEventOperationalKpis = {
  guestsTotal: number;
  guestsConfirmed: number;
  guestsPending: number;
  guestsDeclined: number;
  guestsPlusOnes: number;
  tablesAssigned: number;
  tablesTotal: number;
  paymentsCount: number;
  paymentsTotal: number;
  documentsCount: number;
  vendorsCount: number;
  checklistTotal: number;
  checklistCompleted: number;
  moodboardCount: number;
  conciergeUploadsCount: number;
  conciergeReviewItemsCount: number;
  conciergePortalItemsCount: number;
  contactProfilesCount: number;
};

export const EMPTY_OPERATIONAL_KPIS: ClientEventOperationalKpis = {
  guestsTotal: 0,
  guestsConfirmed: 0,
  guestsPending: 0,
  guestsDeclined: 0,
  guestsPlusOnes: 0,
  tablesAssigned: 0,
  tablesTotal: 0,
  paymentsCount: 0,
  paymentsTotal: 0,
  documentsCount: 0,
  vendorsCount: 0,
  checklistTotal: 0,
  checklistCompleted: 0,
  moodboardCount: 0,
  conciergeUploadsCount: 0,
  conciergeReviewItemsCount: 0,
  conciergePortalItemsCount: 0,
  contactProfilesCount: 0,
};

type GuestRow = {
  status: string;
  plus_ones: number | null;
  seat_id: string | null;
};

type PaymentRow = {
  amount: number | string | null;
};

type VendorRow = {
  id: string;
  name: string;
  service_category: string;
  status: string;
};

type ChecklistRow = {
  status: string;
};

type CountQuery = {
  select(
    columns: string,
    options?: { count: "exact"; head: boolean },
  ): {
    eq(column: string, value: string): Promise<{
      count: number | null;
      error: { message: string } | null;
    }>;
    in(column: string, values: string[]): Promise<{
      count: number | null;
      error: { message: string } | null;
    }>;
  };
};

type ListQuery<T> = {
  select(columns: string): {
    eq(column: string, value: string): {
      limit?(n: number): {
        order(
          column: string,
          options: { ascending: boolean },
        ): Promise<{
          data: T[] | null;
          error: { message: string } | null;
        }>;
      };
      order?(
        column: string,
        options: { ascending: boolean },
      ): {
        limit(n: number): Promise<{
          data: T[] | null;
          error: { message: string } | null;
        }>;
      };
    } & Promise<{
      data: T[] | null;
      error: { message: string } | null;
    }>;
    in(column: string, values: string[]): Promise<{
      data: T[] | null;
      error: { message: string } | null;
    }>;
  };
};

type CountTable =
  | "documents"
  | "event_moodboard_items"
  | "concierge_uploads"
  | "concierge_review_items"
  | "event_contact_profiles"
  | "seats";

export type OperationalKpisAdminClient = {
  from(table: "guests"): ListQuery<GuestRow>;
  from(table: "payments"): ListQuery<PaymentRow>;
  from(table: CountTable): CountQuery;
  from(table: "event_vendors"): ListQuery<VendorRow>;
  from(table: "event_checklist_items"): ListQuery<ChecklistRow>;
  from(table: "concierge_portal_items"): CountQuery;
};

export type OperationalPortalScope = {
  clientEventId: string;
  slug: string;
};

export function aggregateGuestMetrics(rows: GuestRow[]): Pick<
  ClientEventOperationalKpis,
  | "guestsTotal"
  | "guestsConfirmed"
  | "guestsPending"
  | "guestsDeclined"
  | "guestsPlusOnes"
  | "tablesAssigned"
> {
  let guestsConfirmed = 0;
  let guestsPending = 0;
  let guestsDeclined = 0;
  let guestsPlusOnes = 0;
  let tablesAssigned = 0;

  for (const row of rows) {
    guestsPlusOnes += row.plus_ones ?? 0;
    if (row.seat_id) {
      tablesAssigned += 1;
    }

    switch (row.status) {
      case "confirmed":
      case "checked_in":
        guestsConfirmed += 1;
        break;
      case "declined":
        guestsDeclined += 1;
        break;
      case "invited":
        guestsPending += 1;
        break;
      default:
        guestsPending += 1;
        break;
    }
  }

  return {
    guestsTotal: rows.length,
    guestsConfirmed,
    guestsPending,
    guestsDeclined,
    guestsPlusOnes,
    tablesAssigned,
  };
}

function isChecklistCompleted(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "completed" ||
    normalized === "done" ||
    normalized === "concluido" ||
    normalized === "concluída"
  );
}

function sumPayments(rows: PaymentRow[]): { count: number; total: number } {
  let total = 0;
  for (const row of rows) {
    const amount = Number(row.amount ?? 0);
    if (Number.isFinite(amount)) {
      total += amount;
    }
  }
  return { count: rows.length, total };
}

async function countByEventId(
  client: OperationalKpisAdminClient,
  table: CountTable,
  eventId: string,
): Promise<number> {
  const { count, error } = await client.from(table).select("id", { count: "exact", head: true }).eq(
    "event_id",
    eventId,
  );
  if (error) {
    return 0;
  }
  return count ?? 0;
}

async function countPortalItems(
  client: OperationalKpisAdminClient,
  scope: OperationalPortalScope,
): Promise<number> {
  const keys = Array.from(new Set([scope.clientEventId, scope.slug]));
  const { count, error } = await client
    .from("concierge_portal_items")
    .select("id", { count: "exact", head: true })
    .in("event_id", keys);
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function fetchOperationalKpis(
  operationalEventId: string,
  portalScope: OperationalPortalScope,
  adminClient: OperationalKpisAdminClient,
): Promise<ClientEventOperationalKpis> {
  const [
    guestsResult,
    paymentsResult,
    vendorsResult,
    checklistResult,
    documentsCount,
    moodboardCount,
    conciergeUploadsCount,
    conciergeReviewItemsCount,
    contactProfilesCount,
    tablesTotal,
    conciergePortalItemsCount,
  ] = await Promise.all([
    adminClient.from("guests").select("status, plus_ones, seat_id").eq("event_id", operationalEventId),
    adminClient.from("payments").select("amount").eq("event_id", operationalEventId),
    adminClient
      .from("event_vendors")
      .select("id, name, service_category, status")
      .eq("event_id", operationalEventId),
    adminClient.from("event_checklist_items").select("status").eq("event_id", operationalEventId),
    countByEventId(adminClient, "documents", operationalEventId),
    countByEventId(adminClient, "event_moodboard_items", operationalEventId),
    countByEventId(adminClient, "concierge_uploads", operationalEventId),
    countByEventId(adminClient, "concierge_review_items", operationalEventId),
    countByEventId(adminClient, "event_contact_profiles", operationalEventId),
    countByEventId(adminClient, "seats", operationalEventId),
    countPortalItems(adminClient, portalScope),
  ]);

  const guestMetrics =
    guestsResult.error || !guestsResult.data
      ? {
          guestsTotal: 0,
          guestsConfirmed: 0,
          guestsPending: 0,
          guestsDeclined: 0,
          guestsPlusOnes: 0,
          tablesAssigned: 0,
        }
      : aggregateGuestMetrics(guestsResult.data);

  const paymentMetrics =
    paymentsResult.error || !paymentsResult.data
      ? { count: 0, total: 0 }
      : sumPayments(paymentsResult.data);

  const checklistRows = checklistResult.error ? [] : (checklistResult.data ?? []);
  const checklistTotal = checklistRows.length;
  const checklistCompleted = checklistRows.filter((row) =>
    isChecklistCompleted(row.status),
  ).length;

  const vendorsRows = vendorsResult.error ? [] : (vendorsResult.data ?? []);

  return {
    ...guestMetrics,
    tablesTotal,
    paymentsCount: paymentMetrics.count,
    paymentsTotal: paymentMetrics.total,
    documentsCount,
    vendorsCount: vendorsRows.length,
    checklistTotal,
    checklistCompleted,
    moodboardCount,
    conciergeUploadsCount,
    conciergeReviewItemsCount,
    conciergePortalItemsCount,
    contactProfilesCount,
  };
}

export async function listOperationalVendors(
  operationalEventId: string,
  adminClient: OperationalKpisAdminClient,
  limit = 5,
): Promise<VendorRow[]> {
  const client = adminClient as unknown as {
    from(table: "event_vendors"): {
      select(columns: string): {
        eq(
          column: "event_id",
          value: string,
        ): {
          order(
            column: string,
            options: { ascending: boolean },
          ): {
            limit(n: number): Promise<{
              data: VendorRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };

  const { data, error } = await client
    .from("event_vendors")
    .select("id, name, service_category, status")
    .eq("event_id", operationalEventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data;
}

export function mapVendorStatusLabel(status: string): "Em revisão" | "Pendente" | "Assinado" | "Aguardando" {
  const normalized = status.trim().toLowerCase();
  if (normalized.includes("assin") || normalized === "signed") {
    return "Assinado";
  }
  if (normalized.includes("pend")) {
    return "Pendente";
  }
  if (normalized.includes("aguard")) {
    return "Aguardando";
  }
  return "Em revisão";
}
