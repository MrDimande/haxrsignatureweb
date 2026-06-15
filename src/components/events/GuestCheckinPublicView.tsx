"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import EventPublicShell from "@/components/events/EventPublicShell";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import type { CheckinLookup } from "@/lib/events/types";

type GuestCheckinPublicViewProps = {
  eventId: string;
  token: string;
  initial: CheckinLookup;
};

export default function GuestCheckinPublicView({
  eventId,
  token,
  initial,
}: GuestCheckinPublicViewProps) {
  const [lookup, setLookup] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCheckedIn =
    lookup.alreadyCheckedIn ||
    lookup.checkedIn ||
    lookup.guest?.status === "checked_in";

  async function handleCheckin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/events/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, token }),
      });
      const data = (await res.json()) as CheckinLookup;

      if (!res.ok || !data.ok) {
        setError("Não foi possível registar a entrada. Dirija-se à recepção.");
        return;
      }

      setLookup(data);
    } catch {
      setError("Serviço temporariamente indisponível. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!lookup.ok || !lookup.guest || !lookup.event) {
    return (
      <EventPublicShell title="Convite não encontrado">
        <div className="text-center py-4">
          <p className="font-serif text-xl text-white/85">Link inválido</p>
          <p className="text-sm text-grey/55 mt-3 leading-relaxed">
            Verifique o código QR ou dirija-se à recepção.
          </p>
        </div>
      </EventPublicShell>
    );
  }

  return (
    <EventPublicShell
      title="Check-in"
      subtitle="Apresente-se na recepção ou registe a sua entrada abaixo."
      eventName={lookup.event.name}
      eventType={lookup.event.type}
      eventDate={lookup.event.date}
      eventLocation={lookup.event.location}
      footer="Recepção · HAXR Signature"
    >
      <div className="space-y-6 text-center">
        <div>
          <p className="font-serif text-2xl font-light text-white/90">
            {lookup.guest.name}
          </p>
          <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey/45 mt-3">
            {GUEST_STATUS_LABELS[lookup.guest.status]}
          </p>
        </div>

        {lookup.seat ? (
          <div className="py-4 border-y border-grey-dark/50">
            <p className="font-serif text-3xl font-light text-gold/90">
              {lookup.seat.tableName}
            </p>
            <p className="font-mono text-sm tracking-[0.25em] uppercase text-white/70 mt-2">
              Lugar {lookup.seat.label || lookup.seat.seatNumber}
            </p>
          </div>
        ) : (
          <p className="text-sm text-grey/55 italic">
            Lugar a confirmar na recepção
          </p>
        )}

        {isCheckedIn ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80" />
            <p className="font-serif text-lg text-emerald-300/90">
              Entrada registada
            </p>
            <p className="text-sm text-grey/55">Bem-vindo ao evento.</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCheckin}
            disabled={loading}
            className="w-full border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-6 py-4 hover:border-gold hover:bg-gold/5 transition-all duration-500 disabled:opacity-50"
          >
            {loading ? "A registar..." : "Registar entrada"}
          </button>
        )}

        {error ? (
          <p className="text-sm text-red-400/70 leading-relaxed">{error}</p>
        ) : null}
      </div>
    </EventPublicShell>
  );
}
