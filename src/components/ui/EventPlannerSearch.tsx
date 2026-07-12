"use client";

import { useState } from "react";
import { Search, Calendar, Users, HelpCircle, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type StepName = "celebracao" | "servico" | "convidados" | null;

interface MatchResult {
  title: string;
  category: string;
  description: string;
  message: string;
}

export default function EventPlannerSearch() {
  const [activeStep, setActiveStep] = useState<StepName>(null);
  const [celebration, setCelebration] = useState("Casamento");
  const [service, setService] = useState("Assessoria Completa");
  const [guests, setGuests] = useState("100 - 250");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveStep(null);

    // Lógica inteligente de recomendação (Matching Algorithm)
    let matchedTitle = "Assessoria Completa";
    let matchedCategory = "Assessoria de Eventos";
    let matchedDescription = "A solução ideal para organizar o vosso evento do início ao fim, cuidando do orçamento, fornecedores e execução operacional com perfeição.";

    if (service === "Convites & Identidade") {
      matchedTitle = "Convites & Identidade Visual";
      matchedCategory = "Design e Identidade";
      matchedDescription = "Desenvolvemos convites digitais e identidade visual personalizada para criar a primeira impressão memorável do vosso evento.";
    } else if (service === "RSVP & Website") {
      matchedTitle = "Website de Casamento & RSVP";
      matchedCategory = "Plataforma Tecnológica";
      matchedDescription = "Criação de plataforma digital exclusiva com lista de presentes, mapas interativos e controlo inteligente de confirmações (RSVP).";
    } else if (guests === "Até 100" && service === "Assessoria Completa") {
      matchedTitle = "Assessoria Parcial & Coordenação";
      matchedCategory = "Assessoria de Eventos";
      matchedDescription = "Perfeito para celebrações intimistas. Focamos no alinhamento final e na coordenação perfeita de todos os detalhes no grande dia.";
    }

    const whatsappMessage = `Olá HAXR Signature, simulei uma proposta no vosso planeador de eventos:\n- Evento: ${celebration}\n- Serviço Desejado: ${service}\n- Convidados: ${guests}\n\nRecomendaram-me o serviço "${matchedTitle}". Gostaria de falar com um especialista sobre esta opção.`;

    setResult({
      title: matchedTitle,
      category: matchedCategory,
      description: matchedDescription,
      message: whatsappMessage,
    });
    setShowResult(true);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto z-30 pointer-events-auto">
      {/* Barra Estilo Airbnb */}
      <div className="bg-white rounded-full border border-brand-champagne/60 shadow-[0_8px_32px_rgba(184,138,42,0.1)] p-1.5 flex flex-col md:flex-row items-center justify-between gap-1 md:gap-0 relative">

        {/* Passo 1: Celebração */}
        <button
          type="button"
          onClick={() => setActiveStep(activeStep === "celebracao" ? null : "celebracao")}
          className={`w-full md:w-1/3 text-left px-6 py-2.5 rounded-full transition-all duration-300 cursor-pointer ${
            activeStep === "celebracao" ? "bg-brand-champagne/20 shadow-inner" : "hover:bg-brand-champagne/10"
          }`}
        >
          <p className="font-mono text-[9px] tracking-widest text-brand-gold uppercase font-bold">Celebração</p>
          <p className="font-sans text-xs text-brand-text-dark/80 font-medium truncate mt-0.5">{celebration}</p>
        </button>

        <div className="hidden md:block w-px h-8 bg-brand-champagne/40" />

        {/* Passo 2: Serviço */}
        <button
          type="button"
          onClick={() => setActiveStep(activeStep === "servico" ? null : "servico")}
          className={`w-full md:w-1/3 text-left px-6 py-2.5 rounded-full transition-all duration-300 cursor-pointer ${
            activeStep === "servico" ? "bg-brand-champagne/20 shadow-inner" : "hover:bg-brand-champagne/10"
          }`}
        >
          <p className="font-mono text-[9px] tracking-widest text-brand-gold uppercase font-bold">Serviço</p>
          <p className="font-sans text-xs text-brand-text-dark/80 font-medium truncate mt-0.5">{service}</p>
        </button>

        <div className="hidden md:block w-px h-8 bg-brand-champagne/40" />

        {/* Passo 3: Convidados */}
        <button
          type="button"
          onClick={() => setActiveStep(activeStep === "convidados" ? null : "convidados")}
          className={`w-full md:w-1/4 text-left px-6 py-2.5 rounded-full transition-all duration-300 cursor-pointer ${
            activeStep === "convidados" ? "bg-brand-champagne/20 shadow-inner" : "hover:bg-brand-champagne/10"
          }`}
        >
          <p className="font-mono text-[9px] tracking-widest text-brand-gold uppercase font-bold">Convidados</p>
          <p className="font-sans text-xs text-brand-text-dark/80 font-medium truncate mt-0.5">{guests} convidados</p>
        </button>

        {/* Botão Pesquisar */}
        <button
          onClick={handleSearch}
          className="w-full md:w-auto bg-brand-gold hover:bg-brand-gold-light text-brand-black w-full md:w-12 h-12 rounded-full flex items-center justify-center gap-2 md:gap-0 px-6 md:px-0 transition-all duration-300 md:mr-1 group cursor-pointer shadow-md"
          aria-label="Pesquisar proposta"
        >
          <Search className="w-4 h-4 shrink-0 transition-transform duration-500 group-hover:scale-110" />
          <span className="md:hidden font-mono text-[10px] tracking-widest uppercase font-bold">Simular Proposta</span>
        </button>

        {/* Painéis Suspensos (Dropdowns) */}
        <AnimatePresence>
          {activeStep === "celebracao" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-4 md:left-2 top-full mt-3 bg-white border border-brand-champagne/45 rounded-2xl p-4 shadow-xl z-50 w-[280px]"
            >
              <p className="font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-3">Qual é o tipo de evento?</p>
              <div className="space-y-1.5">
                {["Casamento", "Save the Date", "Evento Social", "Evento Privado"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCelebration(item);
                      setActiveStep("servico"); // Avança automaticamente
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                      celebration === item ? "bg-brand-champagne/30 text-brand-text-dark font-medium" : "hover:bg-brand-champagne/10 text-brand-text-dark/80"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeStep === "servico" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-4 md:left-[30%] top-full mt-3 bg-white border border-brand-champagne/45 rounded-2xl p-4 shadow-xl z-50 w-[280px]"
            >
              <p className="font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-3">Que serviço procura?</p>
              <div className="space-y-1.5">
                {["Assessoria Completa", "Convites & Identidade", "RSVP & Website"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setService(item);
                      setActiveStep("convidados"); // Avança automaticamente
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                      service === item ? "bg-brand-champagne/30 text-brand-text-dark font-medium" : "hover:bg-brand-champagne/10 text-brand-text-dark/80"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeStep === "convidados" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-4 md:right-16 top-full mt-3 bg-white border border-brand-champagne/45 rounded-2xl p-4 shadow-xl z-50 w-[280px]"
            >
              <p className="font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold mb-3">Volume de convidados</p>
              <div className="space-y-1.5">
                {["Até 100", "100 - 250", "Mais de 250"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setGuests(item);
                      setActiveStep(null); // Fecha ao terminar
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                      guests === item ? "bg-brand-champagne/30 text-brand-text-dark font-medium" : "hover:bg-brand-champagne/10 text-brand-text-dark/80"
                    }`}
                  >
                    {item} convidados
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clique fora para fechar */}
      {activeStep && (
        <div
          onClick={() => setActiveStep(null)}
          className="fixed inset-0 z-20 pointer-events-auto"
          aria-hidden="true"
        />
      )}

      {/* Modal de Proposta Recomendada (Airbnb Style) */}
      <AnimatePresence>
        {showResult && result && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResult(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 pointer-events-auto cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 md:max-w-lg mx-auto bg-brand-ivory text-brand-text-dark rounded-3xl p-8 md:p-10 shadow-2xl z-50 pointer-events-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <HelpCircle className="w-4 h-4 text-brand-gold" />
                    <span className="font-mono text-[9px] tracking-widest uppercase text-brand-gold font-bold">Proposta Recomendada</span>
                  </div>
                  <h3 className="font-serif text-2xl font-light text-brand-text-dark">{result.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResult(false)}
                  className="p-1.5 hover:bg-brand-champagne/20 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-brand-text-dark/60" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <p className="font-sans text-xs text-brand-text-dark/50 uppercase font-mono tracking-wider">{result.category}</p>
                <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light">{result.description}</p>

                <div className="bg-brand-champagne/15 border border-brand-champagne/30 rounded-xl p-4 space-y-2 mt-4">
                  <p className="font-mono text-[8px] tracking-wider text-brand-gold uppercase font-bold">Os vossos inputs:</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-sans text-brand-text-dark/70 font-light">
                    <div className="bg-white/80 py-1.5 rounded border border-brand-champagne/20">
                      <span className="block text-brand-gold/70 font-mono text-[7px] tracking-widest uppercase font-bold">Festa</span>
                      {celebration}
                    </div>
                    <div className="bg-white/80 py-1.5 rounded border border-brand-champagne/20">
                      <span className="block text-brand-gold/70 font-mono text-[7px] tracking-widest uppercase font-bold">Serviço</span>
                      {service.split(" ")[0]}
                    </div>
                    <div className="bg-white/80 py-1.5 rounded border border-brand-champagne/20">
                      <span className="block text-brand-gold/70 font-mono text-[7px] tracking-widest uppercase font-bold">Pessoas</span>
                      {guests}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={result.message ? `https://wa.me/258870883428?text=${encodeURIComponent(result.message)}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-editorial btn-editorial--solid w-full flex items-center justify-center gap-3 py-4 text-center"
                >
                  <MessageCircle className="w-4.5 h-4.5 stroke-[1.25]" />
                  <span>Obter Proposta</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowResult(false)}
                  className="w-full text-center py-2 text-xs font-mono tracking-widest uppercase text-brand-text-dark/50 hover:text-brand-text-dark transition-colors cursor-pointer"
                >
                  Fechar planeador
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
