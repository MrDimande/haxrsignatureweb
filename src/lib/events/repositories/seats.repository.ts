import { createAdminClient } from "@/lib/supabase/server";
import { asTableRow, asTableRows } from "@/lib/supabase/helpers";
import { mapSeat } from "@/lib/events/db/mappers";
import type { EventSeat, SeatFormData } from "@/lib/events/types";

export async function listSeatsByEvent(eventId: string): Promise<EventSeat[]> {
  const supabase = createAdminClient();

  const [{ data: seatsData, error: seatsError }, { data: guestsData, error: guestsError }] =
    await Promise.all([
      supabase
        .from("seats")
        .select("*")
        .eq("event_id", eventId)
        .order("table_name")
        .order("seat_number"),
      supabase
        .from("guests")
        .select("id, name, seat_id")
        .eq("event_id", eventId)
        .not("seat_id", "is", null),
    ]);

  if (seatsError) throw new Error(seatsError.message);
  if (guestsError) throw new Error(guestsError.message);

  const guestBySeat = new Map(
    asTableRows<"guests">(guestsData).map((guest) => [
      guest.seat_id as string,
      { id: guest.id, name: guest.name },
    ])
  );

  return asTableRows<"seats">(seatsData).map((row) =>
    mapSeat(row, guestBySeat.get(row.id) ?? null)
  );
}

export async function createSeat(
  eventId: string,
  data: SeatFormData
): Promise<EventSeat> {
  const supabase = createAdminClient();
  const { data: saved, error } = await supabase
    .from("seats")
    .insert({
      event_id: eventId,
      table_name: data.tableName.trim(),
      seat_number: data.seatNumber,
      label: data.label.trim(),
    } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const row = asTableRow<"seats">(saved);
  if (!row) throw new Error("Falha ao criar lugar.");
  return mapSeat(row);
}

export async function createSeatsBulk(
  eventId: string,
  seats: SeatFormData[]
): Promise<EventSeat[]> {
  if (!seats.length) return [];
  const supabase = createAdminClient();
  const payload = seats.map((seat) => ({
    event_id: eventId,
    table_name: seat.tableName.trim(),
    seat_number: seat.seatNumber,
    label: seat.label.trim(),
  }));

  const { data, error } = await supabase
    .from("seats")
    .insert(payload as never)
    .select("*");

  if (error) throw new Error(error.message);
  return asTableRows<"seats">(data).map((row) => mapSeat(row));
}

export async function deleteSeat(seatId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("seats").delete().eq("id", seatId);
  if (error) throw new Error(error.message);
}

export async function generateTableSeats(
  eventId: string,
  tableName: string,
  seatCount: number
): Promise<EventSeat[]> {
  const seats: SeatFormData[] = Array.from({ length: seatCount }, (_, i) => ({
    tableName,
    seatNumber: i + 1,
    label: "",
  }));
  return createSeatsBulk(eventId, seats);
}
