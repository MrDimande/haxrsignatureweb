"use client";

import { useState } from "react";
import { Check, Loader2, MapPin, QrCode, Search } from "lucide-react";
import EventPublicShell from "@/components/events/EventPublicShell";
import FloorPlanSvg from "@/components/events/floor-plan/FloorPlanSvg";
import {
  FIND_SEAT_MAX_CODE_LENGTH,
  FIND_SEAT_MIN_NAME_LENGTH,
  normalizeFindSeatCode,
} from "@/lib/events/find-seat-code";
import { tableKeyFromName } from "@/lib/events/floor-plan/model";
import type {
  EventPublicInfo,
  FindSeatResult,
  PublicFloorPlan,
} from "@/lib/events/types";

type FindSeatPublicViewProps = {
  eventId: string;
  initialAccessCode?: string;
};

type SuccessfulFindSeatResponse = {
  ok: true;
  event: EventPublicInfo;
  results: FindSeatResult[];
  floorPlan?: PublicFloorPlan | null;
};

const GENERIC_ERROR =
  "Código ou nome incorrectos. Verifique os dados ou dirija-se à recepção.";

function SeatJourney({ complete }: { complete: boolean }) {
  const steps = [
    { label: "Digitalizar", icon: QrCode, complete: true },
    { label: "Pesquisar", icon: Search, complete },
    { label: "Sentar", icon: Check, complete },
  ];

  return (
    <ol
      className="mb-8 grid grid-cols-3 gap-2"
      aria-label="Como encontrar o seu lugar"
    >
      {steps.map(({ label, icon: Icon, complete: stepComplete }, index) => (
        <li
          key={label}
          className={`rounded border px-2 py-3 text-center transition-colors ${
            stepComplete
              ? "border-gold/35 bg-gold/5 text-gold/85"
              : "border-grey-dark/70 text-grey/45"
          }`}
        >
          <Icon className="mx-auto h-4 w-4" aria-hidden />
          <span className="mt-2 block font-mono text-[7px] uppercase tracking-[0.2em]">
            {index + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function SeatResultCard({
  result,
  floorPlan,
}: {
  result: FindSeatResult;
  floorPlan: PublicFloorPlan | null;
}) {
  const seatLabel = result.seat?.label || result.seat?.seatNumber;
  const highlightedTableKey = result.seat
    ? result.seat.tableKey ?? tableKeyFromName(result.seat.tableName)
    : null;

  return (
    <div className="space-y-7 py-2 text-center animate-in fade-in duration-700">
      <div className="space-y-2">
        <p className="font-serif text-2xl font-light text-white/92 md:text-3xl">
          Olá, {result.name}
        </p>
        <p className="text-sm tracking-wide text-grey/60">
          O seu lugar foi localizado.
        </p>
      </div>

      {result.seat ? (
        <div className="border-y border-grey-dark/50 py-6">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.4em] text-gold/55">
            Mesa
          </p>
          <p className="font-serif text-4xl font-light text-gold/90 md:text-5xl">
            {result.seat.tableName}
          </p>
          {seatLabel ? (
            <p className="mt-4 font-mono text-sm uppercase tracking-[0.2em] text-white/65">
              Lugar {seatLabel}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="border-y border-grey-dark/50 py-6">
          <p className="font-serif text-lg font-light italic text-white/50">
            Lugar a confirmar na recepção
          </p>
        </div>
      )}

      {floorPlan && highlightedTableKey ? (
        <section className="overflow-hidden rounded-lg border border-gold/25 bg-[#FBF8F3] text-left shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between border-b border-[#D4B87A]/30 bg-white/75 px-4 py-3">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.35em] text-[#9A7B3C]">
                O seu percurso
              </p>
              <p className="mt-1 font-serif text-lg text-[#1C1814]">
                Mesa destacada no Croqui
              </p>
            </div>
            <MapPin className="h-5 w-5 text-[#B88A2A]" aria-hidden />
          </div>
          <div className="aspect-[4/3] min-h-[280px] p-3 sm:min-h-[360px] sm:p-5">
            <FloorPlanSvg
              room={floorPlan.room}
              items={floorPlan.items}
              tables={[]}
              template="client"
              highlightedTableKey={highlightedTableKey}
            />
          </div>
          <p className="border-t border-[#D4B87A]/25 bg-white/70 px-4 py-3 text-center text-xs text-[#6B5E4A]">
            Procure a marca dourada. Em caso de dúvida, mostre este ecrã à
            recepção.
          </p>
        </section>
      ) : null}

      <p className="font-serif text-base italic leading-relaxed text-white/55">
        Desejamos-lhe uma excelente celebração.
      </p>
    </div>
  );
}

export default function FindSeatPublicView({
  eventId,
  initialAccessCode = "",
}: FindSeatPublicViewProps) {
  const [accessCode, setAccessCode] = useState(initialAccessCode);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FindSeatResult[] | null>(null);
  const [selected, setSelected] = useState<FindSeatResult | null>(null);
  const [event, setEvent] = useState<EventPublicInfo | null>(null);
  const [floorPlan, setFloorPlan] = useState<PublicFloorPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(submitEvent: React.FormEvent) {
    submitEvent.preventDefault();
    const trimmedName = query.trim();
    const trimmedCode = normalizeFindSeatCode(accessCode);

    if (trimmedCode.length < 4) {
      setError("Introduza o código indicado no convite ou no código QR.");
      return;
    }

    if (trimmedName.length < FIND_SEAT_MIN_NAME_LENGTH) {
      setError(
        `Escreva o seu nome completo com pelo menos ${FIND_SEAT_MIN_NAME_LENGTH} letras.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSelected(null);
    setEvent(null);
    setFloorPlan(null);

    try {
      const response = await fetch("/api/events/find-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          eventId,
          query: trimmedName,
          accessCode: trimmedCode,
        }),
      });
      const data = (await response.json()) as
        | SuccessfulFindSeatResponse
        | { ok: false };

      if (!response.ok || !data.ok) {
        setError(GENERIC_ERROR);
        return;
      }

      const matches = data.results ?? [];
      setEvent(data.event);
      setFloorPlan(data.floorPlan ?? null);

      if (matches.length === 1) {
        setSelected(matches[0]);
      } else {
        setResults(matches);
      }
    } catch {
      setError("Serviço temporariamente indisponível. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setSelected(null);
    setResults(null);
    setEvent(null);
    setFloorPlan(null);
    setQuery("");
    setError(null);
  }

  return (
    <EventPublicShell
      title="Find Your Seat"
      subtitle="Introduza o código do evento e o seu nome completo."
      eventName={event?.name}
      eventType={event?.type}
      eventDate={event?.date}
      eventLocation={event?.location}
      footer="Find Your Seat · HAXR Signature"
      wide
    >
      <SeatJourney complete={Boolean(selected)} />

      {!selected ? (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="space-y-5">
            <div>
              <label
                htmlFor="event-code"
                className="mb-2 block font-mono text-[8px] uppercase tracking-[0.35em] text-grey/45"
              >
                Código do evento
              </label>
              <input
                id="event-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={FIND_SEAT_MAX_CODE_LENGTH}
                value={accessCode}
                onChange={(changeEvent) =>
                  setAccessCode(changeEvent.target.value.toUpperCase())
                }
                placeholder="Código indicado no convite"
                disabled={loading}
                className="w-full border-b border-grey/30 bg-transparent py-3 font-mono text-sm uppercase tracking-[0.14em] text-white outline-none transition-colors placeholder:text-grey/40 focus:border-gold/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="guest-search"
                className="mb-2 block font-mono text-[8px] uppercase tracking-[0.35em] text-grey/45"
              >
                O seu nome completo
              </label>
              <input
                id="guest-search"
                type="search"
                value={query}
                onChange={(changeEvent) => setQuery(changeEvent.target.value)}
                placeholder="Nome completo como aparece no convite"
                autoComplete="name"
                maxLength={80}
                disabled={loading}
                className="w-full border-b border-grey/30 bg-transparent py-3 font-sans text-base text-white outline-none transition-colors placeholder:text-grey/40 focus:border-gold/50 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 border border-gold-dim px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-gold transition-all duration-500 hover:border-gold hover:bg-gold/5 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )}
              {loading ? "A pesquisar…" : "Localizar lugar"}
            </button>
          </form>

          <div aria-live="polite" aria-atomic="true">
            {loading ? (
              <p className="text-center font-mono text-sm tracking-wider text-grey/50">
                A localizar o seu lugar…
              </p>
            ) : null}
          </div>

          {results && results.length > 1 ? (
            <div
              className="space-y-2"
              role="listbox"
              aria-label="Seleccionar lugar"
            >
              <p className="mb-4 text-center font-mono text-[8px] uppercase tracking-[0.35em] text-grey/45">
                Existem homónimos — seleccione o seu lugar
              </p>
              {results.map((result) => (
                <button
                  key={`${result.name}-${result.seat?.tableName ?? "none"}-${result.seat?.seatNumber ?? 0}`}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => setSelected(result)}
                  className="w-full border border-grey-dark/80 px-4 py-3 text-left transition-colors hover:border-gold-dim/40"
                >
                  <span className="text-white/85">{result.name}</span>
                  {result.seat ? (
                    <span className="mt-1 block text-xs text-grey/50">
                      {result.seat.tableName}
                      {result.seat.label || result.seat.seatNumber
                        ? ` · Lugar ${result.seat.label || result.seat.seatNumber}`
                        : ""}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <SeatResultCard result={selected} floorPlan={floorPlan} />
          <button
            type="button"
            onClick={resetSearch}
            className="w-full font-mono text-[10px] uppercase tracking-[0.2em] text-grey/50 transition-colors hover:text-gold/70"
          >
            Nova pesquisa
          </button>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-6 text-center text-sm leading-relaxed text-red-400/70"
        >
          {error}
        </p>
      ) : null}
    </EventPublicShell>
  );
}
