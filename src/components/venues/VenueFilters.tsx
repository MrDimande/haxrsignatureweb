/**
 * HAXR Signature — Venue Filters Component (Phase E.2)
 *
 * Filtros de Alta-Costura Digital com foco estrito em Mobile-First:
 * - Desktop: Barra horizontal refinada com selecção segmentada;
 * - Mobile: Botão de acção com contagem de filtros + Gaveta Retráctil (Bottom Sheet)
 *   acessível por toque e teclado.
 *
 * Dimensões restritas a dados verificados e estáveis:
 * - Localização (Maputo, Matola)
 * - Ambiente (Interior, Exterior, Interior + Exterior)
 * - Celebração (Casamento, Lobolo, Recepção, Cerimónia)
 */

"use client";

import React, { useState, useEffect } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";

export type VenueFilterState = {
  city: string; // "todas" | "Maputo" | "Matola"
  environment: string; // "todos" | "Interior" | "Exterior" | "Interior + Exterior"
  celebration: string; // "todas" | "Casamentos" | "Lobolos" | "Recepções" | "Cerimónias"
};

interface VenueFiltersProps {
  filters: VenueFilterState;
  onFilterChange: (newFilters: VenueFilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export default function VenueFilters({
  filters,
  onFilterChange,
  onReset,
  totalResults,
}: VenueFiltersProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Conta filtros activos diferentes do padrão
  const activeFilterCount =
    (filters.city !== "todas" ? 1 : 0) +
    (filters.environment !== "todos" ? 1 : 0) +
    (filters.celebration !== "todas" ? 1 : 0);

  // Bloqueia scroll de fundo quando a gaveta mobile está aberta
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  // Fecha gaveta com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  const cities = [
    { id: "todas", label: "Todas as Cidades" },
    { id: "Maputo", label: "Maputo" },
    { id: "Matola", label: "Matola" },
  ];

  const environments = [
    { id: "todos", label: "Todos os Ambientes" },
    { id: "Interior", label: "Interior" },
    { id: "Exterior", label: "Exterior" },
    { id: "Interior + Exterior", label: "Interior + Exterior" },
  ];

  const celebrations = [
    { id: "todas", label: "Todas as Celebrações" },
    { id: "Casamentos", label: "Casamento" },
    { id: "Lobolos", label: "Lobolo" },
    { id: "Recepções", label: "Recepção" },
    { id: "Cerimónias", label: "Cerimónia" },
  ];

  return (
    <div className="w-full">
      {/* ── Visualização Desktop (>= 768px) ─────────────────────────────────── */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-4 py-4 px-6 bg-[#FAF8F5] border border-brand-champagne/30 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-brand-gold font-semibold mr-1">
            Filtrar:
          </span>

          {/* Filtro de Cidade */}
          <div className="relative">
            <select
              aria-label="Filtrar por localização"
              value={filters.city}
              onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
              className="px-3.5 py-2 text-xs rounded-full border border-brand-champagne/40 bg-white text-brand-text-dark font-sans appearance-none pr-8 hover:border-brand-gold/50 focus:border-brand-gold focus:outline-hidden transition-colors cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-brand-text-dark/50">
              ▼
            </div>
          </div>

          {/* Filtro de Ambiente */}
          <div className="relative">
            <select
              aria-label="Filtrar por ambiente"
              value={filters.environment}
              onChange={(e) =>
                onFilterChange({ ...filters, environment: e.target.value })
              }
              className="px-3.5 py-2 text-xs rounded-full border border-brand-champagne/40 bg-white text-brand-text-dark font-sans appearance-none pr-8 hover:border-brand-gold/50 focus:border-brand-gold focus:outline-hidden transition-colors cursor-pointer"
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-brand-text-dark/50">
              ▼
            </div>
          </div>

          {/* Filtro de Celebração */}
          <div className="relative">
            <select
              aria-label="Filtrar por tipo de celebração"
              value={filters.celebration}
              onChange={(e) =>
                onFilterChange({ ...filters, celebration: e.target.value })
              }
              className="px-3.5 py-2 text-xs rounded-full border border-brand-champagne/40 bg-white text-brand-text-dark font-sans appearance-none pr-8 hover:border-brand-gold/50 focus:border-brand-gold focus:outline-hidden transition-colors cursor-pointer"
            >
              {celebrations.map((cel) => (
                <option key={cel.id} value={cel.id}>
                  {cel.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-brand-text-dark/50">
              ▼
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-text-dark/60 hover:text-brand-text-dark transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Contagem de Resultados */}
        <div className="text-right">
          <span className="font-mono text-xs text-brand-text-dark/60">
            {totalResults === 1 ? "1 espaço disponível" : `${totalResults} espaços disponíveis`}
          </span>
        </div>
      </div>

      {/* ── Visualização Mobile (< 768px) ────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between gap-3 p-3.5 bg-[#FAF8F5] border border-brand-champagne/30 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-expanded={mobileDrawerOpen}
          aria-label="Abrir filtros de espaços"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-black text-brand-ivory text-xs font-medium cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-gold" />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-brand-gold text-brand-black text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <span className="font-mono text-[11px] text-brand-text-dark/60">
          {totalResults === 1 ? "1 espaço" : `${totalResults} espaços`}
        </span>
      </div>

      {/* ── Gaveta Retráctil Mobile (Drawer Modal) ───────────────────────────── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros de pesquisa de espaços"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-full bg-[#FCFBF9] rounded-t-3xl border-t border-brand-champagne/30 p-6 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho da Gaveta */}
            <div className="flex items-center justify-between border-b border-brand-champagne/20 pb-4">
              <div className="flex items-center gap-2 text-brand-text-dark">
                <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
                <h3 className="font-serif text-lg font-light text-brand-text-dark">
                  Filtrar Espaços
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Fechar gaveta de filtros"
                className="w-8 h-8 rounded-full border border-brand-champagne/30 flex items-center justify-center text-brand-text-dark hover:bg-brand-champagne/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grupo 1: Localização */}
            <div className="space-y-2.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-brand-gold font-bold">
                Localização
              </label>
              <div className="grid grid-cols-3 gap-2">
                {cities.map((c) => {
                  const selected = filters.city === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onFilterChange({ ...filters, city: c.id })}
                      className={`px-3 py-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                        selected
                          ? "bg-brand-black text-brand-ivory border-brand-black font-medium"
                          : "bg-white text-brand-text-dark/80 border-brand-champagne/30"
                      }`}
                    >
                      {c.label.replace("Todas as Cidades", "Todas")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grupo 2: Ambiente */}
            <div className="space-y-2.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-brand-gold font-bold">
                Ambiente / Formato
              </label>
              <div className="grid grid-cols-2 gap-2">
                {environments.map((env) => {
                  const selected = filters.environment === env.id;
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() =>
                        onFilterChange({ ...filters, environment: env.id })
                      }
                      className={`px-3 py-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                        selected
                          ? "bg-brand-black text-brand-ivory border-brand-black font-medium"
                          : "bg-white text-brand-text-dark/80 border-brand-champagne/30"
                      }`}
                    >
                      {env.label.replace("Todos os Ambientes", "Todos")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grupo 3: Celebração */}
            <div className="space-y-2.5">
              <label className="font-mono text-[10px] uppercase tracking-widest text-brand-gold font-bold">
                Celebração
              </label>
              <div className="grid grid-cols-2 gap-2">
                {celebrations.map((cel) => {
                  const selected = filters.celebration === cel.id;
                  return (
                    <button
                      key={cel.id}
                      type="button"
                      onClick={() =>
                        onFilterChange({ ...filters, celebration: cel.id })
                      }
                      className={`px-3 py-2 text-xs rounded-xl border text-center transition-all cursor-pointer ${
                        selected
                          ? "bg-brand-black text-brand-ivory border-brand-black font-medium"
                          : "bg-white text-brand-text-dark/80 border-brand-champagne/30"
                      }`}
                    >
                      {cel.label.replace("Todas as Celebrações", "Todas")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações da Gaveta */}
            <div className="pt-4 border-t border-brand-champagne/20 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setMobileDrawerOpen(false);
                }}
                className="flex-1 py-3 text-xs rounded-full border border-brand-champagne/40 text-brand-text-dark hover:bg-brand-champagne/10 font-medium transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 py-3 text-xs rounded-full bg-brand-black text-brand-ivory font-medium hover:bg-brand-gold transition-colors cursor-pointer"
              >
                Ver {totalResults} {totalResults === 1 ? "Espaço" : "Espaços"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
