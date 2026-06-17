import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GuestRsvpPublicView from "@/components/events/GuestRsvpPublicView";
import { lookupCheckin } from "@/lib/events/services/checkin.service";
import { buildPrivateEventMetadata } from "@/lib/seo";

type RsvpPageProps = {
  params: Promise<{ eventId: string; token: string }>;
};

export async function generateMetadata({
  params,
}: RsvpPageProps): Promise<Metadata> {
  const { eventId, token } = await params;
  const lookup = await lookupCheckin(eventId, token);
  const eventName =
    lookup.ok && lookup.event?.name ? lookup.event.name : "Evento";

  return buildPrivateEventMetadata(`RSVP · ${eventName}`);
}

export default async function GuestRsvpPage({ params }: RsvpPageProps) {
  const { eventId, token } = await params;
  const lookup = await lookupCheckin(eventId, token);

  if (!lookup.ok && lookup.error === "event_not_found") {
    notFound();
  }

  return (
    <GuestRsvpPublicView eventId={eventId} token={token} initial={lookup} />
  );
}
