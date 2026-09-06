import { mapPayment } from "@/lib/finance/db/mappers";
import type { PaymentRecord, RegisterPaymentInput } from "@/lib/finance/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery } from "@/lib/neon/server-db";

type PaymentRow = Tables<"payments">;
type NeonPaymentRow = { row: PaymentRow };
type SumRow = { total: string | number | null };

export type PaymentsBatchResult = {
  available: boolean;
  items: PaymentRecord[];
};

function mapRows(rows: NeonPaymentRow[]): PaymentRecord[] {
  return rows.map(({ row }) => mapPayment(row));
}

export async function listPaymentsBatch(): Promise<PaymentsBatchResult> {
  try {
    const result = await neonQuery<NeonPaymentRow>(`
      SELECT to_jsonb(p) AS row
      FROM public.payments p
      ORDER BY p.paid_at DESC
    `);
    return { available: true, items: mapRows(result.rows) };
  } catch {
    return { available: false, items: [] };
  }
}

export async function listPaymentsByClientId(
  clientId: string,
  limit = 100,
): Promise<PaymentRecord[]> {
  const result = await neonQuery<NeonPaymentRow>(
    `
      SELECT to_jsonb(p) AS row
      FROM public.payments p
      WHERE p.client_id = $1::uuid
      ORDER BY p.paid_at DESC
      LIMIT $2
    `,
    [clientId, limit],
  );
  return mapRows(result.rows);
}

export async function listPaymentsByEventId(
  eventId: string,
  limit = 50,
): Promise<PaymentRecord[]> {
  const result = await neonQuery<NeonPaymentRow>(
    `
      SELECT to_jsonb(p) AS row
      FROM public.payments p
      WHERE p.event_id = $1::uuid
      ORDER BY p.paid_at DESC
      LIMIT $2
    `,
    [eventId, limit],
  );
  return mapRows(result.rows);
}

export async function listPayments(limit = 100): Promise<PaymentRecord[]> {
  const result = await neonQuery<NeonPaymentRow>(
    `
      SELECT to_jsonb(p) AS row
      FROM public.payments p
      ORDER BY p.paid_at DESC
      LIMIT $1
    `,
    [limit],
  );
  return mapRows(result.rows);
}

export async function createPayment(
  input: Omit<RegisterPaymentInput, "generateReceipt"> & {
    documentId?: string | null;
    clientName?: string;
    eventName?: string;
    documentNumber?: string | null;
    sourceDocumentNumber?: string | null;
  },
): Promise<PaymentRecord> {
  const result = await neonQuery<NeonPaymentRow>(
    `
      WITH saved AS (
        INSERT INTO public.payments (
          business_id,
          client_id,
          event_id,
          document_id,
          source_document_id,
          amount,
          currency,
          payment_method,
          reference,
          notes,
          paid_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6,
          $7::public.currency_code,
          $8::public.payment_method,
          $9,
          $10,
          $11::timestamptz
        )
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
    `,
    [
      input.businessId,
      input.clientId ?? null,
      input.eventId ?? null,
      input.documentId ?? null,
      input.sourceDocumentId ?? null,
      input.amount,
      input.currency,
      input.paymentMethod,
      input.reference?.trim() ?? "",
      input.notes?.trim() ?? "",
      input.paidAt ?? new Date().toISOString(),
    ],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao registar pagamento.");

  return mapPayment(row, {
    clientName: input.clientName,
    eventName: input.eventName,
    documentNumber: input.documentNumber ?? null,
    sourceDocumentNumber: input.sourceDocumentNumber ?? null,
  });
}

export async function sumPaymentsForSourceDocument(
  sourceDocumentId: string,
): Promise<number> {
  const result = await neonQuery<SumRow>(
    `
      SELECT COALESCE(sum(amount), 0) AS total
      FROM public.payments
      WHERE source_document_id = $1::uuid
    `,
    [sourceDocumentId],
  );
  return Number(result.rows[0]?.total ?? 0);
}
