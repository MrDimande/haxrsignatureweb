import { mapSeat } from "@/lib/events/db/mappers";
import type { EventSeat, SeatFormData } from "@/lib/events/types";
import type { Tables } from "@/lib/supabase/database.types";
import { neonQuery } from "@/lib/neon/server-db";

type SeatRow = Tables<"seats">;
type NeonSeatJsonRow = {
  row: SeatRow;
  guest_id: string | null;
  guest_name: string | null;
};
type NeonSeatOnlyRow = { row: SeatRow };

export async function listSeatsByEvent(eventId: string): Promise<EventSeat[]> {
  const result = await neonQuery<NeonSeatJsonRow>(
    `
      SELECT
        to_jsonb(s) AS row,
        g.id AS guest_id,
        g.name AS guest_name
      FROM public.seats s
      LEFT JOIN public.guests g
        ON g.seat_id = s.id
       AND g.event_id = s.event_id
      WHERE s.event_id = $1::uuid
      ORDER BY s.table_name, s.seat_number
    `,
    [eventId],
  );

  return result.rows.map(({ row, guest_id, guest_name }) =>
    mapSeat(
      row,
      guest_id && guest_name ? { id: guest_id, name: guest_name } : null,
    ),
  );
}

export async function createSeat(
  eventId: string,
  data: SeatFormData,
): Promise<EventSeat> {
  const result = await neonQuery<NeonSeatOnlyRow>(
    `
      WITH saved AS (
        INSERT INTO public.seats (event_id, table_name, seat_number, label)
        VALUES ($1::uuid, $2, $3, $4)
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row FROM saved
    `,
    [eventId, data.tableName.trim(), data.seatNumber, data.label.trim()],
  );

  const row = result.rows[0]?.row;
  if (!row) throw new Error("Falha ao criar lugar.");
  return mapSeat(row);
}

export async function createSeatsBulk(
  eventId: string,
  seats: SeatFormData[],
): Promise<EventSeat[]> {
  if (!seats.length) return [];

  const payload = seats.map((seat, inputOrder) => ({
    table_name: seat.tableName.trim(),
    seat_number: seat.seatNumber,
    label: seat.label.trim(),
    input_order: inputOrder,
  }));

  const result = await neonQuery<NeonSeatOnlyRow>(
    `
      WITH input AS (
        SELECT *
        FROM jsonb_to_recordset($2::jsonb) AS x(
          table_name text,
          seat_number integer,
          label text,
          input_order integer
        )
      ), saved AS (
        INSERT INTO public.seats (event_id, table_name, seat_number, label)
        SELECT $1::uuid, table_name, seat_number, label
        FROM input
        ORDER BY input_order
        RETURNING *
      )
      SELECT to_jsonb(saved) AS row
      FROM saved
      ORDER BY (to_jsonb(saved)->>'table_name'),
               ((to_jsonb(saved)->>'seat_number')::integer)
    `,
    [eventId, JSON.stringify(payload)],
  );

  return result.rows.map(({ row }) => mapSeat(row));
}

export async function deleteSeat(seatId: string): Promise<void> {
  await neonQuery("DELETE FROM public.seats WHERE id = $1::uuid", [seatId]);
}

export async function generateTableSeats(
  eventId: string,
  tableName: string,
  seatCount: number,
): Promise<EventSeat[]> {
  const seats: SeatFormData[] = Array.from({ length: seatCount }, (_, index) => ({
    tableName,
    seatNumber: index + 1,
    label: "",
  }));
  return createSeatsBulk(eventId, seats);
}
