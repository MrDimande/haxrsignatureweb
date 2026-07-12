"use client";

import { useState } from "react";
import { MessageCircle, Star, Info } from "lucide-react";

interface StickyReservationCardProps {
  serviceTitle: string;
  basePrice: string;
  priceNumeric: number;
}

export default function StickyReservationCard({
  serviceTitle,
  basePrice,
  priceNumeric,
}: StickyReservationCardProps) {
  const [guests, setGuests] = useState("100-250");
  const [dateEstimate, setDateEstimate] = useState("Ainda sem data");

  const techFee = 0;

  // Cálculo de estimativa simples
  const getMultiplier = () => {
    if (guests === "< 100") return 0.85;
    if (guests === "250+") return 1.3;
    return 1.0;
  };

  const estimatedTotal = priceNumeric > 0
    ? Math.round(priceNumeric * getMultiplier())
    : 0;

  const getWhatsAppLink = () => {
    const message = `Olá HAXR Signature, gostaria de agendar uma sessão de diagnóstico para o serviço "${serviceTitle}".\n- Data Estimada: ${dateEstimate}\n- Convidados: ${guests}\n- Estimativa: ${estimatedTotal > 0 ? `${estimatedTotal} €` : "Sob consulta"}`;
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="bg-white border border-brand-champagne/60 rounded-3xl p-6 shadow-xl sticky top-28 pointer-events-auto">
      {/* Header Preço */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="font-serif text-2xl font-light text-brand-text-dark">
            {priceNumeric > 0 ? `${basePrice}` : "Sob consulta"}
          </span>
          {priceNumeric > 0 && (
            <span className="font-sans text-xs text-brand-text-dark/50 font-light"> / base</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-brand-text-dark/95">
          <Star className="w-3 h-3 text-brand-gold fill-brand-gold" />
          <span className="font-mono text-[10px] font-bold">5.0</span>
          <span className="text-brand-text-dark/40 font-light">· Exclusivo</span>
        </div>
      </div>

      {/* Caixa de Inputs */}
      <div className="border border-brand-champagne/60 rounded-2xl overflow-hidden mb-6">
        <div className="grid grid-cols-1 divide-y divide-brand-champagne/45 bg-white">
          {/* Período */}
          <div className="p-3 text-left">
            <label htmlFor="period-select" className="block font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-1">
              Período Estimado
            </label>
            <select
              id="period-select"
              value={dateEstimate}
              onChange={(e) => setDateEstimate(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-sans text-brand-text-dark/80 font-medium p-0 outline-none cursor-pointer"
            >
              <option value="Ainda sem data">Ainda sem data definida</option>
              <option value="Época Alta 2026">Época Alta 2026 (Maio - Out)</option>
              <option value="Época Baixa 2026">Época Baixa 2026 (Nov - Abr)</option>
              <option value="Época Alta 2027">Época Alta 2027 (Maio - Out)</option>
              <option value="Época Baixa 2027">Época Baixa 2027 (Nov - Abr)</option>
            </select>
          </div>

          {/* Convidados */}
          <div className="p-3 text-left">
            <label htmlFor="guest-select" className="block font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-1">
              Convidados
            </label>
            <select
              id="guest-select"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-sans text-brand-text-dark/80 font-medium p-0 outline-none cursor-pointer"
            >
              <option value="< 100">Menos de 100 convidados</option>
              <option value="100-250">100 a 250 convidados</option>
              <option value="250+">Mais de 250 convidados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botão Principal Dourado */}
      <a
        href={getWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-editorial btn-editorial--solid w-full flex items-center justify-center gap-3 py-4 text-center mb-6"
      >
        <MessageCircle className="w-4.5 h-4.5 stroke-[1.25]" />
        <span>Reservar Diagnóstico</span>
      </a>

      <p className="text-[10px] text-brand-text-dark/40 font-light text-center mb-6 font-sans">
        Não cobramos qualquer taxa de simulação.
      </p>

      {/* Detalhamento de Custos */}
      {priceNumeric > 0 ? (
        <div className="space-y-3.5 border-t border-brand-champagne/45 pt-6 text-xs text-brand-text-dark/70 font-light">
          <div className="flex justify-between">
            <span className="underline decoration-brand-champagne/80 decoration-dotted">Serviço de assessoria base</span>
            <span>{Math.round(priceNumeric * getMultiplier())} €</span>
          </div>
          <div className="flex justify-between">
            <span className="underline decoration-brand-champagne/80 decoration-dotted">Taxa de plataforma digital</span>
            <span className="text-green-600 font-medium">Incluído</span>
          </div>

          <div className="border-t border-brand-champagne/45 pt-4 flex justify-between text-sm text-brand-text-dark font-medium">
            <span>Total estimado</span>
            <span>{estimatedTotal} €</span>
          </div>

          <div className="bg-brand-champagne/10 rounded-xl p-3 flex gap-2.5 items-start mt-4 border border-brand-champagne/20">
            <Info className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
            <p className="text-[9px] text-brand-text-dark/60 font-sans leading-relaxed">
              O preço final será formalizado após a avaliação da dimensão, complexidade e logística do local.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-brand-champagne/10 rounded-xl p-4 flex gap-2.5 items-start border border-brand-champagne/20">
          <Info className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
          <p className="text-[10px] text-brand-text-dark/65 font-sans leading-relaxed">
            Este serviço de luxo é desenhado inteiramente sob medida. A sessão de diagnóstico serve para analisar a vossa visão e preparar uma proposta fechada.
          </p>
        </div>
      )}
    </div>
  );
}
