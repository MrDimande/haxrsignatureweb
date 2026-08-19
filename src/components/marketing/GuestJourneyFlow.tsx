"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  UserPlus,
  MailCheck,
  LayoutGrid,
  Search,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";

export const guestPhases = [
  {
    step: "01",
    label: "CONVIDADO",
    title: "A Intenção Inicial & Estruturação",
    desc: "A base de convidados é organizada com rigor desde o primeiro momento. Mapeamento de grupos familiares, núcleos protocolares e contactos directos.",
    icon: UserPlus,
    deliverable: "Base organizada · Redução de atrito",
  },
  {
    step: "02",
    label: "CONFIRMAÇÃO",
    title: "RSVP Digital com Calor Humano",
    desc: "Cada convidado acede a uma experiência personalizada de confirmação no telemóvel, declarando acompanhantes e eventuais preferências gastronómicas.",
    icon: MailCheck,
    deliverable: "Resposta nominal · Alertas dietéticos",
  },
  {
    step: "03",
    label: "LUGAR",
    title: "Arquitectura de Mesas & Seating Plan",
    desc: "Distribuição harmoniosa dos convidados pelas mesas do salão, articulando afinidades pessoais, visão estética e requisitos operacionais do catering.",
    icon: LayoutGrid,
    deliverable: "Arquitectura de sala · Equilíbrio de mesas",
  },
  {
    step: "04",
    label: "CHEGADA",
    title: "O Lugar Certo, Logo à Chegada",
    desc: "À chegada ao espaço, o convidado aponta a câmara para o QR Code e descobre rapidamente a sua mesa com o Find Your Seat.",
    icon: Search,
    deliverable: "Acesso por QR · Recepção mais fluida",
  },
  {
    step: "05",
    label: "ACOLHIMENTO",
    title: "Recepção Serena & Check-in Invisível",
    desc: "A equipa de bastidores regista as entradas em tempo real no tablet ou telemóvel, garantindo acolhimento discreto e visibilidade de presenças.",
    icon: HeartHandshake,
    deliverable: "Check-in em tempo real · Acolhimento sereno",
  },
] as const;

export default function GuestJourneyFlow() {
  return (
    <section className="relative py-20 md:py-28 bg-white border-b border-brand-champagne/30">
      <div className="site-container mx-auto space-y-16">
        {/* Section Header */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                02 · The Guest Journey
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-text-dark leading-tight">
              Da Lista ao Acolhimento
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light leading-relaxed">
              Uma coreografia de bastidores onde cada detalhe foi antecipado — para que o convidado
              viva apenas a celebração e a sensação imediata de ser bem-vindo.
            </p>
          </div>
        </RevealOnScroll>

        {/* 5-Phase Choreography Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {guestPhases.map((phase, idx) => {
            const Icon = phase.icon;
            return (
              <RevealOnScroll key={phase.step} delay={idx * 0.08}>
                <div className="bg-brand-ivory/50 border border-brand-champagne/40 rounded-2xl p-6 h-full flex flex-col justify-between space-y-6 hover:border-brand-gold/60 transition-all duration-300 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-gold">
                        {phase.step}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-brand-text-dark/45 font-semibold block">
                        {phase.label}
                      </span>
                      <h3 className="font-serif text-base font-light text-brand-text-dark leading-snug">
                        {phase.title}
                      </h3>
                    </div>

                    <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                      {phase.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-brand-champagne/30 flex items-center gap-1.5 text-[8.5px] font-mono text-brand-gold font-medium">
                    <CheckCircle2 className="w-3 h-3 text-brand-gold shrink-0" />
                    <span>{phase.deliverable}</span>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
