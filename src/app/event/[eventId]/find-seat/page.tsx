import { notFound } from "next/navigation";
import type { Metadata } from "next";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import FindSeatPublicView from "@/components/events/FindSeatPublicView";

type FindSeatPageProps = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({
  params,
}: FindSeatPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await eventsRepo.getEventPublicInfo(eventId);
  return {
    title: event
      ? `Find Your Seat · ${event.name}`
      : "Find Your Seat · HAXR Signature",
    robots: { index: false, follow: false },
  };
}

export default async function FindSeatPage({ params }: FindSeatPageProps) {
  const { eventId } = await params;
  const event = await eventsRepo.getEventPublicInfo(eventId);
  if (!event) notFound();

  return <FindSeatPublicView event={event} />;
}
