import type { EventSeat, SeatFormData } from "@/lib/events/types";
import {
  createSeat as createSeatNeon,
  createSeatsBulk as createSeatsBulkNeon,
  deleteSeat as deleteSeatNeon,
  generateTableSeats as generateTableSeatsNeon,
  listSeatsByEvent as listSeatsByEventNeon,
} from "@/lib/events/repositories/seats.neon.repository";

export function listSeatsByEvent(eventId: string): Promise<EventSeat[]> {
  return listSeatsByEventNeon(eventId);
}

export function createSeat(
  eventId: string,
  data: SeatFormData,
): Promise<EventSeat> {
  return createSeatNeon(eventId, data);
}

export function createSeatsBulk(
  eventId: string,
  seats: SeatFormData[],
): Promise<EventSeat[]> {
  return createSeatsBulkNeon(eventId, seats);
}

export function deleteSeat(seatId: string): Promise<void> {
  return deleteSeatNeon(seatId);
}

export function generateTableSeats(
  eventId: string,
  tableName: string,
  seatCount: number,
): Promise<EventSeat[]> {
  return generateTableSeatsNeon(eventId, tableName, seatCount);
}
