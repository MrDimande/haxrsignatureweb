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
  className?: string;
}

export default function VenuePlaceholderImage({
  venueName,
  venueTypeLabel,
  className = "",
}: VenuePlaceholderImageProps) {
  // Extrai as iniciais do nome do espaço (até 2 caracteres)
  const initials = venueName
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["dos", "das", "para"].includes(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`relative w-full h-full min-h-[260px] sm:min-h-[300px] bg-gradient-to-br from-[#181413] via-[#0f0d0c] to-[#080706] text-white flex flex-col items-center justify-center p-8 overflow-hidden select-none border border-brand-champagne/15 ${className}`}
      role="img"
      aria-label={`Representação editorial de ${venueName}`}
    >
      {/* Moldura Geométrica Fina de Alta-Costura */}
      <div
        className="absolute inset-3.5 border border-brand-champagne/10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-5 border border-brand-gold/10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Gradiente Radial Subtil de Ouro Champanhe */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(184,138,42,0.18), transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Marca de Luxo Central */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Monograma ou Ícone Geométrico Discreto */}
        <div className="w-14 h-14 rounded-full border border-brand-gold/30 bg-brand-black/60 flex items-center justify-center backdrop-blur-xs shadow-inner">
          <span className="font-serif text-lg tracking-widest text-brand-gold font-light">
            {initials || "HX"}
          </span>
        </div>

        {/* Tipografia Editorial do Espaço */}
        <div className="space-y-1 max-w-[220px]">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.3em] text-brand-champagne/60 font-semibold">
            {venueTypeLabel}
          </p>
          <h4 className="font-serif text-base font-light text-brand-ivory leading-snug line-clamp-2">
            {venueName}
          </h4>
        </div>

        {/* Tag Discreta de Governação Factual */}
        <div className="pt-2">
          <span className="inline-block px-3 py-1 rounded-full border border-brand-champagne/15 bg-white/5 font-mono text-[8px] uppercase tracking-widest text-brand-champagne/70">
            Fotografia sob curadoria
          </span>
        </div>
      </div>
    </div>
  );
}
