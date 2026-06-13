import { notFound } from "next/navigation";
import GuestRsvpPublicView from "@/components/events/GuestRsvpPublicView";
import { lookupCheckin } from "@/lib/events/services/checkin.service";

type RsvpPageProps = {
  params: Promise<{ eventId: string; token: string }>;
};

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
