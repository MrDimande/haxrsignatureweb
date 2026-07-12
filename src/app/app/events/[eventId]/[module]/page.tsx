import { notFound } from "next/navigation";
import ComingSoonModule from "@/components/app/modules/ComingSoonModule";

const PLANNED_MODULES = [
  "timeline",
  "moodboard",
  "invitations",
  "seating",
  "check-in",
  "photo-wall",
  "contracts",
  "payments",
] as const;

type PlannedModule = (typeof PLANNED_MODULES)[number];

const LABELS: Record<PlannedModule, string> = {
  timeline: "Timeline do Evento",
  moodboard: "Moodboard",
  invitations: "Convites Digitais",
  seating: "Seating & Mesas",
  "check-in": "QR Check-in",
  "photo-wall": "Photo Wall",
  contracts: "Contratos",
  payments: "Pagamentos",
};

function isPlannedModule(value: string): value is PlannedModule {
  return (PLANNED_MODULES as readonly string[]).includes(value);
}

type PageProps = { params: Promise<{ eventId: string; module: string }> };

export default async function PlannedEventModulePage({ params }: PageProps) {
  const { module } = await params;
  if (!isPlannedModule(module)) notFound();
  return <ComingSoonModule title={LABELS[module]} />;
}
