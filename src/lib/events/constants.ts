import type { GuestStatus, GuestLabel } from "@/lib/events/types";

export const GUEST_STATUS_LABELS: Record<GuestStatus, string> = {
  invited: "Convidado",
  confirmed: "Confirmado",
  checked_in: "Check-in",
};

export const GUEST_STATUS_STYLES: Record<GuestStatus, string> = {
  invited: "bg-grey/10 text-grey/70 border-grey/25",
  confirmed: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  checked_in: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};

export const GUEST_STATUSES: GuestStatus[] = [
  "invited",
  "confirmed",
  "checked_in",
];

export const GUEST_LABEL_LABELS: Record<GuestLabel, string> = {
  none: "—",
  vip: "VIP",
  family: "Família",
  wedding_party: "Padrinho/Madrinha",
  corporate: "Corporativo",
  other: "Outro",
};

export const GUEST_LABEL_STYLES: Record<GuestLabel, string> = {
  none: "",
  vip: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  family: "bg-purple-500/10 text-purple-300 border-purple-500/25",
  wedding_party: "bg-rose-500/10 text-rose-300 border-rose-500/25",
  corporate: "bg-sky-500/10 text-sky-300 border-sky-500/25",
  other: "bg-grey/10 text-grey/70 border-grey/25",
};

export const GUEST_LABELS: GuestLabel[] = [
  "none",
  "vip",
  "family",
  "wedding_party",
  "corporate",
  "other",
];
