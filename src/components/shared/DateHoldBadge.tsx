import {
  daysUntilDateHold,
  formatDateHoldUntil,
  isDateHoldActive,
} from "@/lib/portal/date-hold";

type DateHoldBadgeProps = {
  holdUntil: string | null | undefined;
  variant?: "admin" | "portal";
};

export default function DateHoldBadge({
  holdUntil,
  variant = "portal",
}: DateHoldBadgeProps) {
  if (!isDateHoldActive(holdUntil)) return null;

  const daysLeft = daysUntilDateHold(holdUntil!);
  const label = formatDateHoldUntil(holdUntil!);
  const urgent = daysLeft <= 2;

  const classes =
    variant === "admin"
      ? `inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] ${
          urgent
            ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
            : "border-admin-gold/30 bg-admin-gold/10 text-admin-gold"
        }`
      : `inline-flex items-center gap-2 border rounded-sm px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] ${
          urgent
            ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
            : "border-admin-gold/25 bg-admin-gold/10 text-admin-gold"
        }`;

  return (
    <span className={classes} title="Reserva de data após aprovação da proposta">
      Data reservada até {label}
      {daysLeft <= 7 ? ` · ${daysLeft}d` : ""}
    </span>
  );
}
