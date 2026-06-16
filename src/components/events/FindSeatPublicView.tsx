"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import EventPublicShell from "@/components/events/EventPublicShell";
import type { EventPublicInfo, FindSeatResult } from "@/lib/events/types";

type FindSeatPublicViewProps = {
  event: EventPublicInfo;
};

function SeatResultCard({ result }: { result: FindSeatResult }) {
  const seatLabel = result.seat?.label || result.seat?.seatNumber;

  return (
    <div className="text-center space-y-6 py-4 animate-in fade-in duration-700">
      <div className="space-y-2">
        <p className="font-serif text-2xl md:text-3xl font-light text-white/92">
          Olá, {result.name}
        </p>
        <p className="text-sm text-grey/60 tracking-wide">
          O seu lugar foi localizado.
        </p>
      </div>

      {result.seat ? (
        <div className="py-6 border-y border-grey-dark/50">
          <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/55 mb-3">
            Mesa
          </p>
          <p className="font-serif text-4xl md:text-5xl font-light text-gold/90">
            {result.seat.tableName}
          </p>
          {seatLabel ? (
            <p className="font-mono text-sm tracking-[0.2em] uppercase text-white/65 mt-4">
              Lugar {seatLabel}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="py-6 border-y border-grey-dark/50">
          <p className="font-serif text-lg font-light italic text-white/50">
            Lugar a confirmar na recepção
          </p>
        </div>
      )}

      {result.groupMembers && result.groupMembers.length > 1 ? (
        <div className="text-left border border-grey-dark/60 px-4 py-4">
          <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45 mb-3">
            Grupo
          </p>
          <ul className="space-y-1.5">
            {result.groupMembers.map((member) => (
              <li
                key={member}
                className={`text-sm ${
                  member === result.name ? "text-gold/90" : "text-white/70"
                }`}
              >
                {member}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="font-serif text-base text-white/55 italic leading-relaxed">
        Desejamos-lhe uma excelente celebração.
      </p>
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
        setError(
          "Não encontrámos esse nome. Verifique a ortografia ou dirija-se à recepção."
        );
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

  function resetSearch() {
    setSelected(null);
    setResults(null);
    setQuery("");
    setError(null);
  }

  return (
    <EventPublicShell
      title="Find Your Seat"
      subtitle="Encontre rapidamente o seu lugar para o evento."
      eventName={event.name}
      eventType={event.type}
      eventDate={event.date}
      eventLocation={event.location}
      footer="Find Your Seat · HAXR Signature"
    >
      {!selected ? (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="space-y-5">
            <div>
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
                disabled={loading}
                className="w-full bg-transparent border-b border-grey/30 focus:border-gold/50 text-white font-sans text-base py-3 outline-none placeholder:text-grey/40 transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 border border-gold-dim text-gold text-[11px] tracking-[0.3em] uppercase px-6 py-4 hover:border-gold hover:bg-gold/5 transition-all duration-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <Search className="w-4 h-4" aria-hidden />
              )}
              {loading ? "A pesquisar…" : "Pesquisar"}
            </button>
          </form>

          {loading ? (
            <p className="text-center text-sm text-grey/50 font-mono tracking-wider">
              A localizar o seu lugar…
            </p>
          ) : null}

          {results && results.length > 1 ? (
            <div className="space-y-2" role="listbox" aria-label="Seleccionar nome">
              <p className="font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45 text-center mb-4">
                Seleccione o seu nome
              </p>
              {results.map((result) => (
                <button
                  key={`${result.name}-${result.seat?.tableName ?? "none"}`}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => setSelected(result)}
                  className="w-full text-left px-4 py-3 border border-grey-dark/80 hover:border-gold-dim/40 transition-colors"
                >
                  <span className="text-white/85">{result.name}</span>
                  {result.seat ? (
                    <span className="block text-xs text-grey/50 mt-1">
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
          <SeatResultCard result={selected} />
          <button
            type="button"
            onClick={resetSearch}
            className="w-full text-[10px] font-mono tracking-[0.2em] uppercase text-grey/50 hover:text-gold/70 transition-colors"
          >
            Nova pesquisa
          </button>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="text-sm text-red-400/70 text-center leading-relaxed mt-6"
        >
          {error}
        </p>
      ) : null}
    </EventPublicShell>
  );
}
