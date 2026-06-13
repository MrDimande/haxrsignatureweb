"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type {
  EventPublicInfo,
  FindSeatResult,
} from "@/lib/events/types";

type FindSeatPublicViewProps = {
  event: EventPublicInfo;
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

function SeatDisplay({ result }: { result: FindSeatResult }) {
  return (
    <div className="text-center space-y-3 py-6">
      <p className="font-serif text-2xl font-light text-white/90">{result.name}</p>
      {result.seat ? (
        <div>
          <p className="font-serif text-4xl md:text-5xl font-light text-gold/90">
            {result.seat.tableName}
          </p>
          <p className="font-mono text-sm tracking-[0.25em] uppercase text-white/70 mt-3">
            Lugar {result.seat.label || result.seat.seatNumber}
          </p>
        </div>
      ) : (
        <p className="font-serif text-lg font-light italic text-white/45">
          Lugar a confirmar na recepção
        </p>
      )}
    </div>
  );
}

export default function FindSeatPublicView({ event }: FindSeatPublicViewProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FindSeatResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FindSeatResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setError("Escreva pelo menos 2 letras do seu nome.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSelected(null);

    try {
      const res = await fetch("/api/events/find-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, query: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError("Não encontrámos esse nome. Verifique a ortografia ou dirija-se à recepção.");
        return;
      }

      const matches = (data.results ?? []) as FindSeatResult[];

      if (!matches.length) {
        setError("Nenhum convidado encontrado com esse nome.");
        return;
      }

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

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <div className="border border-grey-dark/80 bg-black-soft/50">
          <div className="px-8 pt-10 pb-8 border-b border-grey-dark/60 text-center">
            <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-gold/50 mb-6">
              HAXR Signature
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-white/95 mb-2">
              Find Your Seat
            </h1>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-grey/50">
              {EVENT_TYPE_LABELS[event.type]}
            </p>
            <p className="font-serif text-lg font-light text-white/75 mt-4">
              {event.name}
            </p>
            {event.date ? (
              <p className="text-sm text-grey/60 mt-2">{formatEventDate(event.date)}</p>
            ) : null}
            {event.location ? (
              <p className="text-sm text-grey/50 mt-1">{event.location}</p>
            ) : null}
          </div>

          <div className="px-8 py-8 space-y-6">
            {!selected ? (
              <>
                <form onSubmit={handleSearch} className="space-y-4">
                  <label htmlFor="guest-search" className="sr-only">
                    Pesquisar pelo seu nome
                  </label>
                  <input
                    id="guest-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Escreva o seu nome"
                    autoComplete="name"
                    className="w-full bg-transparent border-b border-grey/30 focus:border-gold/50 text-white font-sans text-base py-3 outline-none placeholder:text-grey/40 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-6 py-4 hover:border-gold hover:bg-gold/5 transition-all duration-500 disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    {loading ? "A procurar..." : "Encontrar o meu lugar"}
                  </button>
                </form>

                {results && results.length > 1 ? (
                  <div className="space-y-2">
                    <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45 text-center mb-4">
                      Seleccione o seu nome
                    </p>
                    {results.map((result) => (
                      <button
                        key={result.name}
                        type="button"
                        onClick={() => setSelected(result)}
                        className="w-full text-left px-4 py-3 border border-grey-dark/80 hover:border-gold-dim/40 transition-colors"
                      >
                        <span className="text-white/85">{result.name}</span>
                        {result.seat ? (
                          <span className="block text-xs text-grey/50 mt-1">
                            {result.seat.tableName} · Lugar{" "}
                            {result.seat.label || result.seat.seatNumber}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="space-y-6">
                <SeatDisplay result={selected} />
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setResults(null);
                    setQuery("");
                  }}
                  className="w-full text-[10px] font-mono tracking-[0.2em] uppercase text-grey/50 hover:text-gold/70 transition-colors"
                >
                  Nova pesquisa
                </button>
              </div>
            )}

            {error ? (
              <p className="text-sm text-red-400/70 text-center leading-relaxed">
                {error}
              </p>
            ) : null}
          </div>

          <div className="px-8 py-5 border-t border-grey-dark/60 text-center">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/35">
              Maputo · Moçambique
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
