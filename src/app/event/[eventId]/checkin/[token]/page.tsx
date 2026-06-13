import { notFound } from "next/navigation";
import GuestCheckinPublicView from "@/components/events/GuestCheckinPublicView";
import { lookupCheckin } from "@/lib/events/services/checkin.service";

type CheckinPageProps = {
  params: Promise<{ eventId: string; token: string }>;
};

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
