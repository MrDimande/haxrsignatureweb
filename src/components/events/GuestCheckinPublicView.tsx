"use client";

import { useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import { GUEST_STATUS_LABELS } from "@/lib/events/constants";
import type { CheckinLookup } from "@/lib/events/types";

type GuestCheckinPublicViewProps = {
  eventId: string;
  token: string;
  initial: CheckinLookup;
};

function formatEventDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

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
      <main className="min-h-screen bg-black flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg border border-grey-dark/80 bg-black-soft/50 px-8 py-12 text-center">
          <p className="font-serif text-xl text-white/85">Convite não encontrado</p>
          <p className="text-sm text-grey/55 mt-3">
            Verifique o código QR ou dirija-se à recepção.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="border border-grey-dark/80 bg-black-soft/50">
          <div className="px-8 pt-10 pb-8 border-b border-grey-dark/60 text-center">
            <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-gold/50 mb-6">
              HAXR Signature
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-white/95 mb-2">
              Check-in
            </h1>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-grey/50">
              {EVENT_TYPE_LABELS[lookup.event.type]}
            </p>
            <p className="font-serif text-lg font-light text-white/75 mt-4">
              {lookup.event.name}
            </p>
            {lookup.event.date ? (
              <p className="text-sm text-grey/60 mt-2">
                {formatEventDate(lookup.event.date)}
              </p>
            ) : null}
          </div>

          <div className="px-8 py-8 space-y-6 text-center">
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

            {lookup.event.location ? (
              <p className="inline-flex items-center gap-2 text-xs text-grey/50">
                <MapPin className="w-3.5 h-3.5" />
                {lookup.event.location}
              </p>
            ) : null}

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

          <div className="px-8 py-5 border-t border-grey-dark/60 text-center">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/35">
              Recepção · HAXR Signature
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
