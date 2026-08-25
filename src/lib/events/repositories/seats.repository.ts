import type { EventSeat, SeatFormData } from "@/lib/events/types";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import {
  createSeat as createSeatNeon,
  createSeatsBulk as createSeatsBulkNeon,
  deleteSeat as deleteSeatNeon,
  generateTableSeats as generateTableSeatsNeon,
  listSeatsByEvent as listSeatsByEventNeon,
} from "@/lib/events/repositories/seats.neon.repository";
import {
  createSeat as createSeatSupabase,
  createSeatsBulk as createSeatsBulkSupabase,
  deleteSeat as deleteSeatSupabase,
  generateTableSeats as generateTableSeatsSupabase,
  listSeatsByEvent as listSeatsByEventSupabase,
} from "@/lib/events/repositories/seats.supabase.repository";

export function listSeatsByEvent(eventId: string): Promise<EventSeat[]> {
  return shouldUseNeonServerDatabase()
    ? listSeatsByEventNeon(eventId)
    : listSeatsByEventSupabase(eventId);
}

export function createSeat(
  eventId: string,
  data: SeatFormData,
): Promise<EventSeat> {
  return shouldUseNeonServerDatabase()
    ? createSeatNeon(eventId, data)
    : createSeatSupabase(eventId, data);
}

export function createSeatsBulk(
  eventId: string,
  seats: SeatFormData[],
): Promise<EventSeat[]> {
  return shouldUseNeonServerDatabase()
    ? createSeatsBulkNeon(eventId, seats)
    : createSeatsBulkSupabase(eventId, seats);
}

export function deleteSeat(seatId: string): Promise<void> {
  return shouldUseNeonServerDatabase()
    ? deleteSeatNeon(seatId)
    : deleteSeatSupabase(seatId);
}

export function generateTableSeats(
  eventId: string,
  tableName: string,
  seatCount: number,
): Promise<EventSeat[]> {
  return shouldUseNeonServerDatabase()
    ? generateTableSeatsNeon(eventId, tableName, seatCount)
    : generateTableSeatsSupabase(eventId, tableName, seatCount);
}
