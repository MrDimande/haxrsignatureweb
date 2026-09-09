/**
 * HAXR Signature — Venue Guide Interactive Client Component (Phase E.2)
 *
 * Gere o estado reactivo dos filtros estáveis e a renderização responsiva
 * da grelha de cartões editoriais do Guia HAXR.
 */

"use client";

import React, { useState, useMemo } from "react";
import type { PublicVenueCard } from "@/lib/venues/types";
import VenueFilters, { type VenueFilterState } from "./VenueFilters";
import VenueCard from "./VenueCard";
import { RotateCcw } from "lucide-react";

interface VenueGuideClientProps {
  initialVenues: PublicVenueCard[];
}

const DEFAULT_FILTERS: VenueFilterState = {
  city: "todas",
  environment: "todos",
  celebration: "todas",
};

export default function VenueGuideClient({ initialVenues }: VenueGuideClientProps) {
  const [filters, setFilters] = useState<VenueFilterState>(DEFAULT_FILTERS);

  // Aplicação estrita dos filtros sobre dados verificados
  const filteredVenues = useMemo(() => {
    return initialVenues.filter((venue) => {
      // 1. Filtro de Cidade
      if (filters.city !== "todas" && venue.city !== filters.city) {
        return false;
      }

      // 2. Filtro de Ambiente / Formato
      if (
        filters.environment !== "todos" &&
        !venue.environments.includes(
          filters.environment as (typeof venue.environments)[number]
        )
      ) {
        return false;
      }

      // 3. Filtro de Celebração
      if (
        filters.celebration !== "todas" &&
        !venue.celebrationsSupported.includes(filters.celebration)
      ) {
        return false;
      }

      return true;
    });
  }, [initialVenues, filters]);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-10 md:space-y-12">
      {/* Barra de Filtros */}
      <VenueFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleReset}
        totalResults={filteredVenues.length}
      />

      {/* Grelha Editorial de Locais */}
      {filteredVenues.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {filteredVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      ) : (
        /* Estado Vazio Elegante */
        <div className="py-20 px-6 text-center bg-[#FAF8F5] border border-brand-champagne/20 rounded-3xl space-y-5 max-w-lg mx-auto">
          <div className="space-y-2">
            <h4 className="font-serif text-2xl font-light text-brand-text-dark">
              Nenhum espaço encontrado
            </h4>
            <p className="font-sans text-sm text-brand-text-dark/70 font-light leading-relaxed">
              Não existem espaços que correspondam a todos os critérios de filtro
              seleccionados. Tente ajustar os parâmetros ou reiniciar a pesquisa.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-black text-brand-ivory text-xs font-medium hover:bg-brand-gold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restabelecer Filtros</span>
          </button>
        </div>
      )}
    </div>
  );
}
