import { notFound } from "next/navigation";
import type { Metadata } from "next";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import FindSeatPublicView from "@/components/events/FindSeatPublicView";
import { buildPrivateEventMetadata } from "@/lib/seo";

type FindSeatPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({
  params,
}: FindSeatPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await eventsRepo.getEventPublicInfo(eventId);
  return buildPrivateEventMetadata(
    event ? `Find Your Seat · ${event.name}` : "Find Your Seat · HAXR Signature"
  );
}

export default async function FindSeatPage({
  params,
  searchParams,
}: FindSeatPageProps) {
  const { eventId } = await params;
  const { code } = await searchParams;
  const event = await eventsRepo.getEventPublicInfo(eventId);
  if (!event) notFound();

  return (
    <FindSeatPublicView event={event} initialAccessCode={code?.trim() ?? ""} />
  );
}
