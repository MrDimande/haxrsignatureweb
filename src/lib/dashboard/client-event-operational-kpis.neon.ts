import type {
  ClientEventOperationalKpis,
  OperationalPortalScope,
} from "@/lib/dashboard/client-event-operational-kpis";
import { neonQuery } from "@/lib/neon/server-db";

type NeonOperationalKpiRow = {
  payments_count: string | number;
  payments_total: string | number;
  vendors_count: string | number;
  checklist_total: string | number;
  checklist_completed: string | number;
  documents_count: string | number;
  moodboard_count: string | number;
  concierge_uploads_count: string | number;
  concierge_review_items_count: string | number;
  contact_profiles_count: string | number;
  tables_total: string | number;
  concierge_portal_items_count: string | number;
};

export type NeonOperationalVendorRow = {
  id: string;
  name: string;
  service_category: string;
  status: string;
};

function readNumber(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Auxiliary dashboard aggregates for the Neon path.
 * The richer guest/payment/vendor/checklist/document snapshots continue to come
 * from the dedicated client-event RPCs; this query only replaces the legacy
 * service-role table counts used by the dashboard shell.
 */
export async function fetchOperationalKpisNeon(
  operationalEventId: string,
  portalScope: OperationalPortalScope,
): Promise<ClientEventOperationalKpis> {
  const portalKeys = Array.from(
    new Set([portalScope.clientEventId, portalScope.slug].filter(Boolean)),
  );

  const result = await neonQuery<NeonOperationalKpiRow>(
    `SELECT
       (SELECT count(*) FROM public.payments WHERE event_id = $1::uuid) AS payments_count,
       (SELECT coalesce(sum(amount), 0) FROM public.payments WHERE event_id = $1::uuid) AS payments_total,
       (SELECT count(*) FROM public.event_vendors WHERE event_id = $1::uuid) AS vendors_count,
       (SELECT count(*) FROM public.event_checklist_items WHERE event_id = $1::uuid) AS checklist_total,
       (
         SELECT count(*)
           FROM public.event_checklist_items
          WHERE event_id = $1::uuid
            AND lower(btrim(status::text)) IN ('completed', 'done', 'concluido', 'concluída')
       ) AS checklist_completed,
       (SELECT count(*) FROM public.documents WHERE event_id = $1::uuid) AS documents_count,
       (SELECT count(*) FROM public.event_moodboard_items WHERE event_id = $1::uuid) AS moodboard_count,
       (SELECT count(*) FROM public.concierge_uploads WHERE event_id = $1::uuid) AS concierge_uploads_count,
       (SELECT count(*) FROM public.concierge_review_items WHERE event_id = $1::uuid) AS concierge_review_items_count,
       (SELECT count(*) FROM public.event_contact_profiles WHERE event_id = $1::uuid) AS contact_profiles_count,
       (SELECT count(*) FROM public.seats WHERE event_id = $1::uuid) AS tables_total,
       (
         SELECT count(*)
           FROM public.concierge_portal_items
          WHERE event_id = ANY($2::text[])
       ) AS concierge_portal_items_count`,
    [operationalEventId, portalKeys],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Neon dashboard KPI query returned no row.");
  }

  return {
    guestsTotal: 0,
    guestsConfirmed: 0,
    guestsPending: 0,
    guestsDeclined: 0,
    guestsPlusOnes: 0,
    tablesAssigned: 0,
    tablesTotal: readNumber(row.tables_total),
    paymentsCount: readNumber(row.payments_count),
    paymentsTotal: readNumber(row.payments_total),
    documentsCount: readNumber(row.documents_count),
    vendorsCount: readNumber(row.vendors_count),
    checklistTotal: readNumber(row.checklist_total),
    checklistCompleted: readNumber(row.checklist_completed),
    moodboardCount: readNumber(row.moodboard_count),
    conciergeUploadsCount: readNumber(row.concierge_uploads_count),
    conciergeReviewItemsCount: readNumber(row.concierge_review_items_count),
    conciergePortalItemsCount: readNumber(row.concierge_portal_items_count),
    contactProfilesCount: readNumber(row.contact_profiles_count),
  };
}

export async function listOperationalVendorsNeon(
  operationalEventId: string,
  limit = 5,
): Promise<NeonOperationalVendorRow[]> {
  const safeLimit = Math.max(1, Math.min(25, Math.trunc(limit)));
  const result = await neonQuery<NeonOperationalVendorRow>(
    `SELECT id, name, service_category, status::text AS status
       FROM public.event_vendors
      WHERE event_id = $1::uuid
      ORDER BY created_at DESC
      LIMIT $2`,
    [operationalEventId, safeLimit],
  );
  return result.rows;
}
