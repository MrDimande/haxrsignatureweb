"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, HelpCircle, ArrowRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

type OptionId = 1 | 2 | 3 | 4 | 5 | 6;

interface FinderOption {
  id: OptionId;
  question: string;
  recommendedService: string;
  explanation: string;
  whatsappMessage: string;
}

const finderOptions: FinderOption[] = [
  {
    id: 1,
    question: "Estou a começar a planear o casamento",
    recommendedService: "Assessoria Completa",
    explanation: "Do conceito inicial à coordenação do grande dia. Cuidamos do orçamento, da contratação de fornecedores e da logística integral para libertar o vosso tempo.",
    whatsappMessage: "Olá HAXR Signature, estou a começar a planear o meu casamento e gostaria de saber mais sobre a Assessoria Completa.",
  },
  {
    id: 2,
    question: "Já tenho parte do casamento organizado",
    recommendedService: "Assessoria Parcial",
    explanation: "Orientação especializada para organizar as fases em falta, supervisionar contratos já existentes e assumir a coordenação e segurança operacional no dia.",
    whatsappMessage: "Olá HAXR Signature, já tenho parte do meu casamento organizado e gostaria de saber mais sobre a Assessoria Parcial.",
  },
  {
    id: 3,
    question: "Quero um convite digital elegante",
    recommendedService: "Convites Digitais",
    explanation: "Experiências digitais interativas premium com música, galeria, contagem decrescente e design editorial sofisticado para surpreender os vossos convidados.",
    whatsappMessage: "Olá HAXR Signature, gostava de obter uma proposta para um Convite Digital elegante.",
  },
  {
    id: 4,
    question: "Quero confirmar convidados",
    recommendedService: "RSVP",
    explanation: "Gestão inteligente de presenças com controlo de acompanhantes e dashboard em tempo real, eliminando planilhas desorganizadas e incertezas.",
    whatsappMessage: "Olá HAXR Signature, gostaria de saber mais sobre o serviço de RSVP e confirmação de convidados.",
  },
  {
    id: 5,
    question: "Quero um website para o casamento",
    recommendedService: "Website de Casamento",
    explanation: "Uma plataforma digital completa para o vosso casamento, reunindo lista de presentes, mapas interativos, dress code, cronograma e fotos do casal.",
    whatsappMessage: "Olá HAXR Signature, pretendo um website para o meu casamento e gostaria de mais informações.",
  },
  {
    id: 6,
    question: "Quero uma identidade visual completa",
    recommendedService: "Identidade Visual para Eventos",
    explanation: "Direção artística de assinaturas, monogramas, paleta de cores e tipografia aplicados harmoniosamente ao ambiente físico e digital do evento.",
    whatsappMessage: "Olá HAXR Signature, gostaria de obter mais informações sobre a Identidade Visual completa para o meu evento.",
  },
];

export default function ServiceFinder() {
  const [selectedOption, setSelectedOption] = useState<FinderOption>(finderOptions[0]);

  const handleSelect = (option: FinderOption) => {
    setSelectedOption(option);
  };

  const getWhatsAppLink = (message: string) => {
    return `https://wa.me/258870883428?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="descobrir-servico" className="relative py-24 md:py-32">
      <div className="site-container mx-auto">
        <div className="max-w-3xl mb-16 md:mb-20">
          <RevealOnScroll>
            <h2 className="section-label mb-6">Orientação</h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <p className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-brand-text-dark leading-relaxed mb-6">
              Qual serviço combina consigo?
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p className="font-sans text-sm text-brand-text-dark/75 leading-relaxed font-light">
              Escolha a opção que melhor descreve o vosso estado atual para que possamos orientar a vossa jornada.
            </p>
          </RevealOnScroll>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Opções de Escolha */}
          <div className="lg:col-span-6 space-y-4">
            {finderOptions.map((option, idx) => {
              const isSelected = selectedOption.id === option.id;
              return (
                <RevealOnScroll key={option.id} delay={idx * 0.04}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left p-6 border rounded-sm transition-all duration-500 flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-brand-champagne/40 border-brand-gold shadow-md"
                        : "bg-brand-champagne/10 border-brand-champagne/40 hover:border-brand-gold/60"
                    }`}
                  >
                    <span className="font-serif text-base md:text-lg font-light text-brand-text-dark pr-4 flex items-center gap-4">
                      <span className={`text-[10px] font-mono tracking-wider ${isSelected ? 'text-brand-gold font-bold' : 'text-brand-text-dark/40'}`}>
                        0{option.id}
                      </span>
                      {option.question}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 text-brand-gold shrink-0 transition-transform duration-500 ${
                        isSelected ? "translate-x-1" : "group-hover:translate-x-0.5 opacity-60"
                      }`}
                    />
                  </button>
                </RevealOnScroll>
              );
            })}
          </div>

          {/* Cartão de Recomendação */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedOption.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.25, 0, 0.1, 1] }}
                className="bg-brand-black text-brand-ivory border border-brand-gold/30 p-8 md:p-12 rounded-sm shadow-xl flex flex-col justify-between min-h-[350px]"
              >
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <HelpCircle className="w-4 h-4 text-brand-gold" />
                    <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-brand-gold/60">
                      Recomendamos
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-ivory mb-5 tracking-wide">
                    {selectedOption.recommendedService}
                  </h3>

                  <p className="font-sans text-sm text-brand-ivory/80 leading-relaxed font-light mb-10">
                    {selectedOption.explanation}
                  </p>
                </div>

                <div>
                  <a
                    href={getWhatsAppLink(selectedOption.whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-editorial btn-editorial--solid inline-flex items-center gap-3 w-full sm:w-auto"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[1.25]" />
                    <span>Iniciar conversa</span>
                  </a>
                  <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-brand-ivory/40 mt-3 text-center sm:text-left">
                    WhatsApp +258 870 883 428
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
