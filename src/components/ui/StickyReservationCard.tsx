"use client";

import { useState, useEffect } from "react";
import { MessageCircle, ShieldCheck, Info } from "lucide-react";

interface StickyReservationCardProps {
  serviceTitle?: string;
  selectedScopeId?: string;
  basePrice?: string;
  priceNumeric?: number;
}

const SCOPES_OPTIONS = [
  { id: "full-service", label: "Nível I · Assessoria Completa & Direção Criativa" },
  { id: "spatial-design", label: "Nível II · Direção Criativa & Gestão de Produção" },
  { id: "run-of-show", label: "Nível III · Coordenação Executiva (Reta Final & Dia-D)" },
];

export default function StickyReservationCard({
  serviceTitle = "Assessoria de Eventos Signature",
  selectedScopeId,
  basePrice = "120.000 MT",
}: StickyReservationCardProps) {
  const [scope, setScope] = useState(selectedScopeId || "full-service");
  const [dateEstimate, setDateEstimate] = useState("Ainda sem data");
  const [guests, setGuests] = useState("100-250");
  const [location, setLocation] = useState("Maputo / Matola");

  useEffect(() => {
    if (selectedScopeId) {
      setScope(selectedScopeId);
    }
  }, [selectedScopeId]);

  const currentScopeObj = SCOPES_OPTIONS.find((s) => s.id === scope) || SCOPES_OPTIONS[0];

  const getWhatsAppLink = () => {
    const message = `Olá HAXR Signature, gostaria de agendar uma sessão de diagnóstico privado para o meu casamento.\n- Âmbito Pretendido: ${currentScopeObj.label}\n- Período Estimado: ${dateEstimate}\n- Convidados: ${guests}\n- Localização: ${location}`;
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  return (
    <div id="reservation-card-anchor" className="bg-white border border-brand-champagne/60 rounded-3xl p-6 md:p-7 shadow-xl sticky top-28 pointer-events-auto">
      {/* Header Preço de Referência */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-brand-champagne/40">
        <div>
          <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold font-bold block mb-1">
            Investimento de Referência
          </span>
          <span className="font-serif text-2xl font-light text-brand-text-dark">
            A partir de {basePrice}
          </span>
          <span className="font-sans text-[10px] text-brand-text-dark/50 block font-light mt-0.5">
            Proposta final formalizada após diagnóstico
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-brand-gold bg-brand-gold/10 px-2.5 py-1 rounded-full border border-brand-gold/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono text-[8.5px] font-bold uppercase tracking-wider">Padrão HAXR</span>
        </div>
      </div>

      {/* Caixa de Inputs */}
      <div className="border border-brand-champagne/60 rounded-2xl overflow-hidden mb-6">
        <div className="grid grid-cols-1 divide-y divide-brand-champagne/45 bg-white">
          {/* Âmbito de Assessoria */}
          <div className="p-3 text-left">
            <label htmlFor="scope-select" className="block font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-1">
              Âmbito de Assessoria
            </label>
            <select
              id="scope-select"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-sans text-brand-text-dark/85 font-medium p-0 outline-none cursor-pointer"
            >
              {SCOPES_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div className="p-3 text-left">
            <label htmlFor="period-select" className="block font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-1">
              Período Estimado
            </label>
            <select
              id="period-select"
              value={dateEstimate}
              onChange={(e) => setDateEstimate(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-sans text-brand-text-dark/85 font-medium p-0 outline-none cursor-pointer"
            >
              <option value="Ainda sem data definida">Ainda sem data definida</option>
              <option value="Época Alta 2026 (Maio - Out)">Época Alta 2026 (Maio - Out)</option>
              <option value="Época Baixa 2026 (Nov - Abr)">Época Baixa 2026 (Nov - Abr)</option>
              <option value="Época Alta 2027 (Maio - Out)">Época Alta 2027 (Maio - Out)</option>
              <option value="Época Baixa 2027 (Nov - Abr)">Época Baixa 2027 (Nov - Abr)</option>
            </select>
          </div>

          {/* Convidados */}
          <div className="p-3 text-left">
            <label htmlFor="guest-select" className="block font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-1">
              Escala de Convidados
            </label>
            <select
              id="guest-select"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-sans text-brand-text-dark/85 font-medium p-0 outline-none cursor-pointer"
            >
              <option value="Menos de 100 convidados">Menos de 100 convidados</option>
              <option value="100 a 250 convidados">100 a 250 convidados</option>
              <option value="Mais de 250 convidados">Mais de 250 convidados</option>
            </select>
          </div>

          {/* Localização */}
          <div className="p-3 text-left">
            <label htmlFor="location-select" className="block font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-1">
              Localização Prevista
            </label>
            <select
              id="location-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-sans text-brand-text-dark/85 font-medium p-0 outline-none cursor-pointer"
            >
              <option value="Maputo / Matola">Maputo / Matola</option>
              <option value="Bilene / Gaza">Bilene / Gaza</option>
              <option value="Inhambane / Vilankulo">Inhambane / Vilankulo</option>
              <option value="Ponta do Ouro">Ponta do Ouro</option>
              <option value="Outro Destino em Moçambique">Outro Destino em Moçambique</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botão Principal Dourado */}
      <a
        href={getWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-editorial btn-editorial--solid w-full flex items-center justify-center gap-3 py-4 text-center mb-4"
      >
        <MessageCircle className="w-4.5 h-4.5 stroke-[1.25]" />
        <span>Agendar Diagnóstico Privado</span>
      </a>

      <p className="text-[9.5px] text-brand-text-dark/45 font-light text-center mb-6 font-sans">
        Sessão confidencial para alinhamento de visão e diagnóstico do evento.
      </p>

      {/* Nota de Governança */}
      <div className="bg-brand-champagne/15 rounded-xl p-3.5 flex gap-2.5 items-start border border-brand-champagne/30 text-left">
        <Info className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-mono text-[8px] tracking-wider uppercase font-bold text-brand-gold">
            Consulta Sem Compromisso
          </p>
          <p className="text-[9.5px] text-brand-text-dark/70 font-sans leading-relaxed">
            Avaliamos a escala, complexidade técnica e perfil de fornecedores para apresentar uma proposta transparente e alinhada às expectativas do casal.
          </p>
        </div>
      </div>
    </div>
  );
}
