/**
 * HAXR Signature — Venue Card Editorial Component (Phase E.2)
 *
 * Apresentação sofisticada e factual de cada espaço no Guia HAXR.
 *
 * Guardrails de Confiança Absolutos:
 * - ZERO badges de HAXR Verified;
 * - ZERO badges de Visitado pela HAXR;
 * - ZERO badges de Parceiro HAXR;
 * - ZERO classificações com estrelas ou contagens de avaliação fabricadas;
 * - ZERO termos técnicos internos vazados para a interface;
 * - Apenas imagens autorizadas ou o placeholder editorial neutro intencional.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, Building, ArrowRight, Phone, Globe } from "lucide-react";
import type { PublicVenueCard } from "@/lib/venues/types";
import VenuePlaceholderImage from "./VenuePlaceholderImage";

interface VenueCardProps {
  venue: PublicVenueCard;
}

export default function VenueCard({ venue }: VenueCardProps) {
  const isIndependent = venue.isIndependent;

  return (
    <article
      className={`group relative overflow-hidden transition-all duration-300 flex flex-col ${
        isIndependent
          ? "bg-[#FAF8F5] border border-brand-champagne/45 rounded-3xl hover:border-brand-gold/60 shadow-sm"
          : "bg-[#FAF8F5] border border-brand-champagne/25 rounded-2xl hover:border-brand-gold/40 shadow-xs"
      }`}
    >
      {/* Visual Header: Imagem Autorizada ou Placeholder Editorial Neutro */}
      <div
        className={`relative w-full overflow-hidden bg-brand-black/5 ${
          isIndependent ? "aspect-[16/10] sm:aspect-[16/9]" : "aspect-[16/10]"
        }`}
      >
        {venue.hasDedicatedImage && venue.imageUrl ? (
          <Image
            src={venue.imageUrl}
            alt={venue.imageAlt || venue.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            className="object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
          />
        ) : (
          <VenuePlaceholderImage
            venueName={venue.name}
            venueTypeLabel={venue.venueTypeLabel}
            isIndependent={isIndependent}
            categoryTier={venue.categoryTier}
          />
        )}

        {/* Tag de Tipologia com Distinção de Categoria */}
        <div className="absolute top-4 left-4 z-10">
          <span
            className={`px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest ${
              isIndependent
                ? "bg-brand-black/85 backdrop-blur-xs border border-brand-gold/30 text-brand-gold font-semibold shadow-xs"
                : "bg-brand-black/70 backdrop-blur-xs border border-white/10 text-brand-ivory font-medium"
            }`}
          >
            {venue.venueTypeLabel}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div
        className={`flex-1 flex flex-col justify-between ${
          isIndependent ? "p-7 sm:p-9 space-y-6" : "p-6 sm:p-7 space-y-5"
        }`}
      >
        <div className="space-y-4">
          {/* Localização e Nome com Hierarquia Tipográfica Nobre */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-brand-gold">
              <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span className="font-mono text-[10px] uppercase tracking-widest font-semibold">
                {venue.locationLabel}
              </span>
            </div>
            <h3
              className={`font-serif font-light text-brand-text-dark leading-snug ${
                isIndependent
                  ? "text-2xl sm:text-3xl lg:text-[1.85rem]"
                  : "text-xl sm:text-2xl"
              }`}
            >
              {venue.name}
            </h3>
          </div>

          {/* Resumo Editorial HAXR */}
          <p
            className={`font-sans text-brand-text-dark/80 leading-relaxed font-light ${
              isIndependent
                ? "text-sm sm:text-[14.5px] line-clamp-4"
                : "text-sm text-brand-text-dark/75 line-clamp-3"
            }`}
          >
            {venue.editorialSummary}
          </p>

          {/* Especificações Práticas de Capacidade e Ambientes */}
          <div className="pt-2 border-t border-brand-champagne/20 space-y-3">
            {/* Capacidade */}
            <div className="flex items-start gap-2.5 text-xs text-brand-text-dark">
              <Users className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="space-y-0.5">
                <p className="font-medium text-brand-text-dark">
                  {venue.capacityDisplay.label}
                </p>
                {venue.capacityDisplay.detail && (
                  <p className="text-[11px] text-brand-text-dark/60 font-light">
                    {venue.capacityDisplay.detail}
                  </p>
                )}
              </div>
            </div>

            {/* Ambientes e Espaços */}
            <div className="flex items-start gap-2.5 text-xs text-brand-text-dark">
              <Building className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-medium text-brand-text-dark">Ambientes: </span>
                <span className="text-brand-text-dark/70 font-light">
                  {venue.spacesSummary}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer: Canais Disponíveis & Ação de Assessoria */}
        <div className="pt-4 border-t border-brand-champagne/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[11px] text-brand-text-dark/60">
            {venue.contactAvailability.hasPhone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3 text-brand-gold" strokeWidth={1.5} />
                Contacto verificado
              </span>
            )}
            {venue.contactAvailability.hasWebsite && (
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3 h-3 text-brand-gold" strokeWidth={1.5} />
                Portal institucional
              </span>
            )}
          </div>

          <Link
            href={`/contacto?assunto=seleccao-local&espaco=${encodeURIComponent(venue.slug)}`}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-sans text-xs font-medium transition-colors duration-200 ${
              isIndependent
                ? "px-5 py-2.5 bg-brand-black text-brand-ivory hover:bg-brand-gold hover:text-brand-black shadow-xs"
                : "px-4 py-2.5 bg-brand-black text-brand-ivory hover:bg-brand-gold transition-colors duration-200"
            }`}
          >
            <span>Consultar Assessoria</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </article>
  );
}
