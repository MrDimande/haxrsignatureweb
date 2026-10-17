import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/actions/auth";
import * as eventsRepo from "@/lib/events/repositories/events.repository";
import * as guestsRepo from "@/lib/events/repositories/guests.repository";
import ReceptionScannerClient from "./ReceptionScannerClient";

type ScannerPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ScannerPageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await eventsRepo.getEventById(id);
  const name = event?.name ?? "Evento";
  return {
    title: `Scanner de Recepção · ${name} · HAXR Signature`,
    robots: { index: false, follow: false },
  };
}

export default async function ReceptionScannerPage({ params }: ScannerPageProps) {
  await requireAdmin();
  const { id } = await params;
  const event = await eventsRepo.getEventById(id);
  if (!event) notFound();

  const stats = await guestsRepo.getEventStats(id);

  return (
    <ReceptionScannerClient
      event={event}
      initialStats={stats}
    />
  );
}
