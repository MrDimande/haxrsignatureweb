"use client";

import { useState } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { CTABand } from "@/components/marketing/PageHero";
import { siteContact } from "@/lib/site-config";

const GUEST_SCALES = [
  { id: "scale-100-200", label: "100 a 200 Convidados", sub: "Celebração Íntima & Média" },
  { id: "scale-200-350", label: "200 a 350 Convidados", sub: "Casamento Signature Padrão" },
  { id: "scale-350-500", label: "350 a 500 Convidados", sub: "Grande Recepção" },
  { id: "scale-500-plus", label: "500+ Convidados", sub: "Operação de Alta Complexidade" },
];

const SERVICE_SCOPES = [
  {
    id: "full-assessoria",
    title: "Integrado na Assessoria HAXR",
    desc: "Gestão completa de convidados, RSVP, seating e check-in incluídos na condução integral do evento.",
  },
  {
    id: "dedicated-reception",
    title: "Operação Dedicada de Recepção & Check-in",
    desc: "Equipa de hostesses HAXR, Find Your Seat e controlo de entrada no dia para eventos com assessoria externa.",
  },
  {
    id: "digital-ecosystem",
    title: "Ecossistema Digital Completo",
    desc: "Convites digitais, RSVP nominal, Seating Plan, Find Your Seat e placas de mesa interactivas.",
  },
];

export default function GuestDiagnosticSection() {
  const [selectedScale, setSelectedScale] = useState(GUEST_SCALES[1].id);
  const [selectedScope, setSelectedScope] = useState(SERVICE_SCOPES[0].id);

  const currentScale = GUEST_SCALES.find((s) => s.id === selectedScale) || GUEST_SCALES[1];
  const currentScope = SERVICE_SCOPES.find((s) => s.id === selectedScope) || SERVICE_SCOPES[0];

  const whatsappMessage = encodeURIComponent(
    `Olá HAXR Signature. Gostaria de solicitar um diagnóstico para a Gestão de Convidados & Recepção do meu evento.\n\n• Escala: ${currentScale.label}\n• Âmbito: ${currentScope.title}\n\nPodemos agendar uma sessão privada?`
  );

  const whatsappUrl = `${siteContact.whatsapp.href}?text=${whatsappMessage}`;

  return (
    <>
      <section
        id="diagnostico-convidados"
        className="relative py-20 md:py-32 bg-white border-t border-brand-champagne/30 text-brand-text-dark pointer-events-auto"
      >
        <div className="site-container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Side: Consultation Narrative */}
            <div className="lg:col-span-7 space-y-10 text-left">
              <RevealOnScroll>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-brand-gold" />
                    <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                      07 · Diagnóstico Privado
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
                    Estruture a Hospitalidade do Seu Evento
                  </h2>

                  <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
                    A primeira conversa é confidencial e orientada a resultados. Avaliamos a escala
                    de convidados, o perfil de acesso ao espaço e os requisitos protocolares para desenhar
                    a operação ideal de recepção.
                  </p>
                </div>
              </RevealOnScroll>

              {/* 3 Step Protocol */}
              <div className="space-y-6 pt-2">
                <div className="border-t border-brand-champagne/35 pt-5 flex gap-4 items-start">
                  <span className="font-mono text-sm text-brand-gold font-bold">01</span>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base text-brand-text-dark font-light">
                      Mapeamento da Lista & Famílias
                    </h4>
                    <p className="font-sans text-xs text-brand-text-dark/70 leading-relaxed font-light">
                      Análise do número de convidados, grupos VIP, núcleos familiares e canais de confirmação.
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-champagne/35 pt-5 flex gap-4 items-start">
                  <span className="font-mono text-sm text-brand-gold font-bold">02</span>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base text-brand-text-dark font-light">
                      Definição do Fluxo de Entrada & Salão
                    </h4>
                    <p className="font-sans text-xs text-brand-text-dark/70 leading-relaxed font-light">
                      Estruturação do ponto de chegada: recepção com QR Code, hostesses dedicadas e sinalética física.
                    </p>
                  </div>
                </div>

                <div className="border-t border-brand-champagne/35 pt-5 flex gap-4 items-start">
                  <span className="font-mono text-sm text-brand-gold font-bold">03</span>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base text-brand-text-dark font-light">
                      Proposta à Medida & Cronograma
                    </h4>
                    <p className="font-sans text-xs text-brand-text-dark/70 leading-relaxed font-light">
                      Apresentação de proposta fechada e transparente para integração na assessoria ou serviço dedicado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Interactive Diagnostic Card */}
            <div className="lg:col-span-5">
              <RevealOnScroll delay={0.15}>
                <div className="bg-[#151312] border border-brand-champagne/35 rounded-3xl p-6 md:p-8 text-brand-ivory shadow-2xl space-y-6 text-left">
                  {/* Card Header */}
                  <div className="border-b border-brand-champagne/20 pb-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">
                        DIAGNÓSTICO DE HOSPITALIDADE
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <h3 className="font-serif text-xl font-light text-brand-ivory">
                      Simular Configuração de Recepção
                    </h3>
                  </div>

                  {/* 1. Scale Selector */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono uppercase text-brand-ivory/60">
                      Escala Estimada de Convidados:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {GUEST_SCALES.map((scale) => (
                        <button
                          key={scale.id}
                          onClick={() => setSelectedScale(scale.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selectedScale === scale.id
                              ? "bg-brand-gold/15 border-brand-gold text-brand-ivory"
                              : "bg-white/[0.03] border-brand-champagne/20 text-brand-ivory/60 hover:bg-white/[0.06]"
                          }`}
                        >
                          <p className="text-xs font-medium text-brand-ivory">{scale.label}</p>
                          <p className="text-[8px] text-brand-ivory/40 font-mono mt-0.5">{scale.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Scope Selector */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono uppercase text-brand-ivory/60">
                      Formato de Acompanhamento:
                    </label>
                    <div className="space-y-2">
                      {SERVICE_SCOPES.map((scope) => (
                        <button
                          key={scope.id}
                          onClick={() => setSelectedScope(scope.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all ${
                            selectedScope === scope.id
                              ? "bg-brand-gold/15 border-brand-gold text-brand-ivory"
                              : "bg-white/[0.03] border-brand-champagne/20 text-brand-ivory/60 hover:bg-white/[0.06]"
                          }`}
                        >
                          <p className="text-xs font-medium text-brand-ivory">{scope.title}</p>
                          <p className="text-[9px] text-brand-ivory/50 font-light mt-0.5 leading-snug">
                            {scope.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CTA Trigger */}
                  <div className="pt-2 space-y-3">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl bg-brand-gold text-brand-black font-mono text-[9.5px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-brand-champagne transition-all shadow-lg shadow-brand-gold/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Agendar Diagnóstico Privado</span>
                    </a>

                    <div className="flex items-center justify-center gap-2 text-[8px] font-mono text-brand-ivory/40">
                      <ShieldCheck className="w-3 h-3 text-brand-gold" />
                      <span>CONSULTA CONFIDENCIAL · ATENDIMENTO EM MAPUTO</span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Global CTA Band */}
      <CTABand
        headline="Pronto para proporcionar uma recepção memorável aos seus convidados?"
        description="Agende uma sessão privada. Desenhamos juntos a estratégia de confirmações, lugares e acolhimento para a sua celebração."
        secondaryHref="/portfolio"
        secondaryLabel="Explorar arquivo de celebrações"
      />
    </>
  );
}
