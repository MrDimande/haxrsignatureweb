"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as seatsRepo from "@/lib/events/repositories/seats.repository";
import type { EventSeat, SeatFormData } from "@/lib/events/types";

function revalidateEvent(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
}

export async function createSeatAction(eventId: string, data: SeatFormData) {
  const result = await runAction(() => seatsRepo.createSeat(eventId, data));
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function generateTableSeatsAction(
  eventId: string,
  tableName: string,
  seatCount: number
) {
  const result = await runAction(() =>
    seatsRepo.generateTableSeats(eventId, tableName, seatCount)
  );
  if (result.success) revalidateEvent(eventId);
  return result;
}

export async function deleteSeatAction(eventId: string, seatId: string) {
  const result = await runAction(() => seatsRepo.deleteSeat(seatId));
  if (result.success) revalidateEvent(eventId);
  return result;
}

export type { EventSeat };
