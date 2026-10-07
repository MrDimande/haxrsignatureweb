import "server-only";

import { neonQuery } from "@/lib/neon/server-db";
import type {
  ClientEventChecklistRpcItemRow,
  ClientEventChecklistRpcPayload,
  ClientEventChecklistRpcTaskRef,
} from "@/lib/checklist/client-event-checklist-rpc";
import type {
  ClientEventDocumentsRpcItemRow,
  ClientEventDocumentsRpcPayload,
} from "@/lib/documents/client-event-documents-rpc";
import type {
  ClientEventPaymentsRpcPaymentRow,
  ClientEventPaymentsRpcPayload,
} from "@/lib/payments/client-event-payments-rpc";
import type {
  ClientEventVendorsRpcPayload,
  ClientEventVendorsRpcVendorRow,
} from "@/lib/vendors/client-event-vendors-rpc";

export type OperationalGuestSeatRow = {
  table_name: string;
  seat_number: number;
  label: string;
};

export type OperationalGuestRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  plus_ones: number | null;
  seat_id: string | null;
  invite_sent?: boolean;
  updated_at?: string;
  seats?: OperationalGuestSeatRow | null;
  guest_groups?: { name: string } | null;
  checkins?: { checkin_time: string } | null;
};

export type ClientEventOperationalReader = {
  listGuests(operationalEventId: string): Promise<{
    guests: OperationalGuestRow[];
    tablesTotal: number;
  }>;
  listChecklist(operationalEventId: string): Promise<ClientEventChecklistRpcPayload>;
  listPayments(operationalEventId: string): Promise<ClientEventPaymentsRpcPayload>;
  listVendors(operationalEventId: string): Promise<ClientEventVendorsRpcPayload>;
  listDocuments(operationalEventId: string): Promise<ClientEventDocumentsRpcPayload>;
};

type GuestDatabaseRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  plus_ones: number | string | null;
  seat_id: string | null;
  invite_sent: boolean;
  updated_at: string;
  table_name: string | null;
  seat_number: number | string | null;
  seat_label: string | null;
  group_name: string | null;
  checkin_time: string | null;
};

type CountRow = { count: number | string };

type ChecklistDatabaseRow = ClientEventChecklistRpcItemRow;
type PaymentDatabaseRow = Omit<ClientEventPaymentsRpcPaymentRow, "document"> & {
  document_number: string | null;
  document_client_name: string | null;
};
type VendorDatabaseRow = ClientEventVendorsRpcVendorRow;
type DocumentDatabaseRow = ClientEventDocumentsRpcItemRow;

function numberValue(value: number | string | null | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function isCompletedChecklistStatus(status: string): boolean {
  const normalized = normalizeToken(status);
  return normalized === "completed" || normalized === "done" || normalized === "concluido";
}

function isPendingVendorStatus(status: string): boolean {
  const normalized = normalizeToken(status);
  return (
    normalized.includes("analise") ||
    normalized.includes("pend") ||
    normalized.includes("aguard") ||
    normalized.includes("revis")
  );
}

function isActiveVendorStatus(status: string): boolean {
  const normalized = normalizeToken(status);
  return !normalized.includes("rejeit") && !normalized.includes("cancel");
}

function isApprovedVendorStatus(status: string): boolean {
  const normalized = normalizeToken(status);
  return normalized.includes("aprov") || normalized.includes("contrat") || normalized.includes("assin");
}

function isOverdueChecklistTask(row: ClientEventChecklistRpcItemRow): boolean {
  if (isCompletedChecklistStatus(row.status) || !row.due_date) return false;
  const due = new Date(`${row.due_date}T23:59:59Z`);
  return !Number.isNaN(due.getTime()) && due.getTime() < Date.now();
}

function taskRef(row: ClientEventChecklistRpcItemRow): ClientEventChecklistRpcTaskRef {
  return {
    id: row.id,
    title: row.title,
    due_date: row.due_date,
    priority: row.priority,
    status: row.status,
    created_at: row.created_at,
  };
}

class NeonClientEventOperationalReader implements ClientEventOperationalReader {
  async listGuests(operationalEventId: string) {
    const [guestResult, seatCountResult] = await Promise.all([
      neonQuery<GuestDatabaseRow>(
        `
          SELECT
            g.id,
            g.name,
            g.email,
            g.phone,
            g.status::text AS status,
            g.plus_ones,
            g.seat_id,
            g.invite_sent_at IS NOT NULL AS invite_sent,
            g.updated_at::text AS updated_at,
            s.table_name,
            s.seat_number,
            s.label AS seat_label,
            gg.name AS group_name,
            c.checkin_time::text AS checkin_time
          FROM public.guests g
          LEFT JOIN public.seats s ON s.id = g.seat_id
          LEFT JOIN public.guest_groups gg ON gg.id = g.group_id
          LEFT JOIN public.checkins c ON c.guest_id = g.id
          WHERE g.event_id = $1::uuid
            AND g.deleted_at IS NULL
            AND g.archived_at IS NULL
            AND g.is_incorrect IS NOT TRUE
          ORDER BY g.created_at ASC, g.id ASC
        `,
        [operationalEventId],
      ),
      neonQuery<CountRow>(
        "SELECT count(*)::int AS count FROM public.seats WHERE event_id = $1::uuid",
        [operationalEventId],
      ),
    ]);

    return {
      guests: guestResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        plus_ones: numberValue(row.plus_ones),
        seat_id: row.seat_id,
        invite_sent: row.invite_sent,
        updated_at: row.updated_at,
        seats:
          row.table_name && row.seat_number !== null
            ? {
                table_name: row.table_name,
                seat_number: numberValue(row.seat_number),
                label: row.seat_label ?? "",
              }
            : null,
        guest_groups: row.group_name ? { name: row.group_name } : null,
        checkins: row.checkin_time ? { checkin_time: row.checkin_time } : null,
      })),
      tablesTotal: numberValue(seatCountResult.rows[0]?.count),
    };
  }

  async listChecklist(operationalEventId: string): Promise<ClientEventChecklistRpcPayload> {
    const result = await neonQuery<ChecklistDatabaseRow>(
      `
        SELECT
          id,
          title,
          due_date::text AS due_date,
          priority,
          status,
          created_at::text AS created_at,
          updated_at::text AS updated_at
        FROM public.event_checklist_items
        WHERE event_id = $1::uuid
        ORDER BY due_date ASC NULLS LAST, created_at ASC, id ASC
      `,
      [operationalEventId],
    );
    const items = result.rows;
    const completed = items.filter((item) => isCompletedChecklistStatus(item.status)).length;
    const overdue = items.filter(isOverdueChecklistTask).length;
    const openItems = items.filter((item) => !isCompletedChecklistStatus(item.status));
    const urgentTasks = openItems.filter((item) => normalizeToken(item.priority).includes("alta")).map(taskRef);

    return {
      items,
      summary: {
        totalTasks: items.length,
        completedTasks: completed,
        pendingTasks: items.length - completed,
        overdueTasks: overdue,
        completionRate: items.length ? (completed / items.length) * 100 : 0,
        categories: Array.from(new Set(items.map((item) => item.priority).filter(Boolean))),
        nextTask: openItems[0] ? taskRef(openItems[0]) : null,
        urgentTasks,
      },
    };
  }

  async listPayments(operationalEventId: string): Promise<ClientEventPaymentsRpcPayload> {
    const result = await neonQuery<PaymentDatabaseRow>(
      `
        SELECT
          p.id,
          p.amount::float8 AS amount,
          p.currency::text AS currency,
          p.payment_method::text AS payment_method,
          p.reference,
          p.notes,
          p.paid_at::text AS paid_at,
          p.created_at::text AS created_at,
          p.vendor_id,
          p.contract_id,
          d.document_number AS document_number,
          d.client_name AS document_client_name
        FROM public.payments p
        LEFT JOIN public.documents d ON d.id = p.document_id
        WHERE p.event_id = $1::uuid
        ORDER BY p.paid_at DESC, p.created_at DESC, p.id DESC
      `,
      [operationalEventId],
    );
    const payments = result.rows.map((row) => ({
      id: row.id,
      amount: numberValue(row.amount),
      currency: row.currency,
      payment_method: row.payment_method,
      reference: row.reference,
      notes: row.notes,
      paid_at: row.paid_at,
      created_at: row.created_at,
      vendor_id: row.vendor_id,
      contract_id: row.contract_id,
      document:
        row.document_number
          ? { number: row.document_number, client_name: row.document_client_name }
          : null,
    }));
    const totalPaid = payments.reduce((total, payment) => total + payment.amount, 0);
    const lastPayment = payments[0]
      ? {
          id: payments[0].id,
          amount: payments[0].amount,
          currency: payments[0].currency,
          payment_method: payments[0].payment_method,
          reference: payments[0].reference,
          paid_at: payments[0].paid_at,
        }
      : null;

    return {
      payments,
      summary: {
        paymentCount: payments.length,
        totalPayments: totalPaid,
        totalPaid,
        pendingAmount: 0,
        currency: payments[0]?.currency ?? "MZN",
        budgetMin: null,
        budgetMax: null,
        budgetRange: null,
        lastPayment,
      },
    };
  }

  async listVendors(operationalEventId: string): Promise<ClientEventVendorsRpcPayload> {
    const result = await neonQuery<VendorDatabaseRow>(
      `
        SELECT
          id,
          name,
          service_category,
          contact_email,
          contact_phone,
          proposed_amount::float8 AS proposed_amount,
          contracted_amount::float8 AS contracted_amount,
          contract_signed,
          currency,
          payment_terms,
          deadline::text AS deadline,
          notes,
          status,
          created_at::text AS created_at,
          updated_at::text AS updated_at
        FROM public.event_vendors
        WHERE event_id = $1::uuid
        ORDER BY created_at DESC, id DESC
      `,
      [operationalEventId],
    );
    const vendors = result.rows;

    return {
      vendors,
      summary: {
        vendorCount: vendors.length,
        activeVendors: vendors.filter((vendor) => isActiveVendorStatus(vendor.status)).length,
        pendingVendors: vendors.filter((vendor) => isPendingVendorStatus(vendor.status)).length,
        approvedVendors: vendors.filter((vendor) => isApprovedVendorStatus(vendor.status)).length,
        totalEstimated: vendors.reduce((total, vendor) => total + numberValue(vendor.proposed_amount), 0),
        totalContracted: vendors.reduce((total, vendor) => total + numberValue(vendor.contracted_amount), 0),
        categories: Array.from(
          new Set(vendors.map((vendor) => vendor.service_category).filter((value): value is string => Boolean(value))),
        ),
        latestVendor: vendors[0]
          ? {
              id: vendors[0].id,
              name: vendors[0].name,
              service_category: vendors[0].service_category,
              status: vendors[0].status,
              proposed_amount: vendors[0].proposed_amount,
              currency: vendors[0].currency,
              created_at: vendors[0].created_at,
            }
          : null,
      },
    };
  }

  async listDocuments(operationalEventId: string): Promise<ClientEventDocumentsRpcPayload> {
    const result = await neonQuery<DocumentDatabaseRow>(
      `
        SELECT
          d.id,
          'operational'::text AS source,
          coalesce(nullif(d.document_number, ''), nullif(d.event_name, ''), 'Documento') AS title,
          coalesce(nullif(d.document_number, ''), 'documento') AS file_name,
          NULL::text AS storage_path,
          NULL::text AS mime_type,
          0::int AS size_bytes,
          d.status::text AS status,
          d.document_type::text AS category,
          d.document_type::text AS document_type,
          coalesce(nullif(d.event_name, ''), 'Evento') AS associated_with,
          coalesce(nullif(d.issuer_name, ''), 'Equipa HAXR') AS uploaded_by,
          NULL::text AS suggested_destination,
          d.created_at::text AS created_at,
          d.updated_at::text AS updated_at
        FROM public.documents d
        WHERE d.event_id = $1::uuid
        ORDER BY d.updated_at DESC, d.id DESC
      `,
      [operationalEventId],
    );
    const items = result.rows;
    const pendingReviewCount = items.filter((item) => {
      const status = normalizeToken(item.status);
      return status.includes("draft") || status.includes("sent") || status.includes("pending");
    }).length;
    const approvedCount = items.filter((item) => normalizeToken(item.status).includes("paid")).length;

    return {
      items,
      summary: {
        documentCount: items.length,
        uploadCount: 0,
        reviewItemCount: 0,
        portalItemCount: items.length,
        pendingReviewCount,
        approvedCount,
        latestDocument: items[0]
          ? {
              id: items[0].id,
              title: items[0].title,
              source: items[0].source,
              status: items[0].status,
              created_at: items[0].created_at,
            }
          : null,
        categories: Array.from(new Set(items.map((item) => item.category).filter(Boolean))),
        totalSize: 0,
        totalItems: items.length,
      },
    };
  }
}

export function createClientEventOperationalReader(): ClientEventOperationalReader {
  return new NeonClientEventOperationalReader();
}
