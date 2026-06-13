"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { CheckinLookup } from "@/lib/events/types";

type GuestRsvpPublicViewProps = {
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

export default function GuestRsvpPublicView({
  eventId,
  token,
  initial,
}: GuestRsvpPublicViewProps) {
  const [lookup, setLookup] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed =
    lookup.confirmedRsvp ||
    lookup.alreadyConfirmed ||
    lookup.guest?.status === "confirmed" ||
    lookup.guest?.status === "checked_in";

  const isCheckedIn =
    lookup.alreadyCheckedIn || lookup.guest?.status === "checked_in";

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, token }),
      });
      const data = (await res.json()) as CheckinLookup;

      if (!res.ok || !data.ok) {
        setError("Não foi possível confirmar a presença. Tente novamente.");
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
            Verifique o link recebido ou contacte os noivos.
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
              Confirmar presença
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
            {lookup.event.location ? (
              <p className="text-sm text-grey/50 mt-1">{lookup.event.location}</p>
            ) : null}
          </div>

          <div className="px-8 py-8 space-y-6 text-center">
            <p className="font-serif text-2xl font-light text-white/90">
              Olá, {lookup.guest.name}
            </p>

            {isCheckedIn ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/80" />
                <p className="font-serif text-lg text-emerald-300/90">
                  Já registado no evento
                </p>
              </div>
            ) : isConfirmed ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/80" />
                <p className="font-serif text-lg text-emerald-300/90">
                  Presença confirmada
                </p>
                <p className="text-sm text-grey/55">
                  Aguardamos por si no dia do evento.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-grey/60 leading-relaxed">
                  Confirme a sua presença para ajudar na organização do evento.
                </p>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-6 py-4 hover:border-gold hover:bg-gold/5 transition-all duration-500 disabled:opacity-50"
                >
                  {loading ? "A confirmar..." : "Confirmo a minha presença"}
                </button>
              </>
            )}

            {error ? (
              <p className="text-sm text-red-400/70 leading-relaxed">{error}</p>
            ) : null}
          </div>

          <div className="px-8 py-5 border-t border-grey-dark/60 text-center">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/35">
              RSVP · HAXR Signature
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
