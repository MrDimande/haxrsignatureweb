/**
 * HAXR Signature — Venue Editorial Neutral Placeholder (Phase E.2)
 *
 * Em estrita conformidade com a política de direitos de imagem HAXR:
 * Sem autorização expressa e correspondência de identidade confirmada,
 * não se utilizam imagens externas ou não autorizadas.
 * Este componente apresenta um visual arquitectónico sóbrio, intencional
 * e sofisticado, alinhado com o padrão de Alta-Costura Digital.
 */

import React from "react";

interface VenuePlaceholderImageProps {
  venueName: string;
  venueTypeLabel: string;
  isIndependent?: boolean;
  categoryTier?: "primary" | "secondary" | "tertiary";
  className?: string;
}

/**
 * Mapeamento e derivação de monogramas editoriais nobres a partir do nome canónico do espaço.
 */
function deriveVenueMonogram(name: string): string {
  const canonicalMonograms: Record<string, string> = {
    "Salão de Eventos Evelyn": "SE",
    "Vila Verde Banquetes": "VB",
    "The Venue MZ": "TV",
    "Complexo Aliança": "CA",
    "Polana Serena Hotel": "PS",
    "Southern Sun Maputo": "SS",
    "Hotel Glória & CCJC": "HG",
    "Radisson Blu Hotel & Residence Maputo": "RB",
  };

  if (canonicalMonograms[name]) {
    return canonicalMonograms[name];
  }

  const words = name
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !["dos", "das", "para", "hotel", "residence"].includes(w.toLowerCase())
    );
  const first = words[0]?.[0] || "";
  const second = words[1]?.[0] || words[0]?.[1] || "H";
  return (first + second).toUpperCase();
}

export default function VenuePlaceholderImage({
  venueName,
  venueTypeLabel,
  isIndependent = false,
  categoryTier = "tertiary",
  className = "",
}: VenuePlaceholderImageProps) {
  const monogram = deriveVenueMonogram(venueName);

  return (
    <div
      className={`relative w-full h-full min-h-[260px] sm:min-h-[300px] bg-gradient-to-br from-[#181413] via-[#0f0d0c] to-[#080706] text-white flex flex-col items-center justify-center p-8 overflow-hidden select-none border border-brand-champagne/15 ${className}`}
      role="img"
      aria-label={`Identidade editorial do ${venueName}`}
    >
      {/* Moldura Geométrica Fina de Alta-Costura */}
      <div
        className="absolute inset-3.5 border border-brand-champagne/10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className={`absolute inset-5 border ${
          isIndependent ? "border-brand-gold/20" : "border-brand-gold/10"
        } pointer-events-none`}
        aria-hidden="true"
      />

      {/* Gradiente Radial Subtil de Ouro Champanhe */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background: isIndependent
            ? "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(184,138,42,0.24), transparent 75%)"
            : "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(184,138,42,0.16), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Marca de Luxo Central */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Monograma com Distinção de Alta-Costura */}
        <div
          className={`rounded-full flex items-center justify-center backdrop-blur-xs shadow-inner transition-all duration-300 ${
            isIndependent
              ? "w-16 h-16 border-2 border-brand-gold/50 bg-brand-black/75 shadow-brand-gold/10"
              : "w-14 h-14 border border-brand-gold/30 bg-brand-black/60"
          }`}
        >
          <span
            className={`font-serif tracking-widest text-brand-gold font-light ${
              isIndependent ? "text-xl font-normal" : "text-lg"
            }`}
          >
            {monogram}
          </span>
        </div>

        {/* Tipografia Editorial do Espaço */}
        <div className="space-y-1 max-w-[240px]">
          <p
            className={`font-mono uppercase tracking-[0.3em] font-semibold ${
              isIndependent
                ? "text-[9px] text-brand-gold"
                : "text-[8.5px] text-brand-champagne/60"
            }`}
          >
            {venueTypeLabel}
          </p>
          <h4
            className={`font-serif font-light text-brand-ivory leading-snug line-clamp-2 ${
              isIndependent ? "text-lg sm:text-xl" : "text-base"
            }`}
          >
            {venueName}
          </h4>
        </div>

        {/* Tag Discreta de Governação Factual */}
        <div className="pt-2">
          <span
            className={`inline-block px-3 py-1 rounded-full border font-mono text-[8px] uppercase tracking-widest ${
              isIndependent
                ? "border-brand-gold/25 bg-brand-gold/10 text-brand-gold"
                : "border-brand-champagne/15 bg-white/5 text-brand-champagne/70"
            }`}
          >
            {categoryTier === "primary"
              ? "Salão Dedicado · Identidade Editorial"
              : categoryTier === "secondary"
              ? "Quinta & Jardim · Identidade Editorial"
              : "Hotelaria · Identidade Editorial"}
          </span>
        </div>
      </div>
    </div>
  );
}
