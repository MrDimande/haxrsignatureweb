import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GuestCheckinPublicView from "@/components/events/GuestCheckinPublicView";
import { lookupCheckin } from "@/lib/events/services/checkin.service";
import { buildPrivateEventMetadata } from "@/lib/seo";

type CheckinPageProps = {
  params: Promise<{ eventId: string; token: string }>;
};

export async function generateMetadata({
  params,
}: CheckinPageProps): Promise<Metadata> {
  const { eventId, token } = await params;
  const lookup = await lookupCheckin(eventId, token);
  const eventName =
    lookup.ok && lookup.event?.name ? lookup.event.name : "Evento";

  return buildPrivateEventMetadata(`Check-in · ${eventName}`);
}

export default async function GuestCheckinPage({ params }: CheckinPageProps) {
  const { eventId, token } = await params;
  const lookup = await lookupCheckin(eventId, token);

  if (!lookup.ok && lookup.error === "event_not_found") {
    notFound();
  }

  return (
    <GuestCheckinPublicView
      eventId={eventId}
      token={token}
      initial={lookup}
    />
  );
}
