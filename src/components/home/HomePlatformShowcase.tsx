"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar, Clock, MapPin, Wallet, Users,
  Plus, ChevronDown, Check
} from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

export default function HomePlatformShowcase() {
  const events = [
    {
      title: "Chá de Panelas",
      date: "08-11-2025",
      time: "13:00",
      location: "Polana Serena, Maputo",
      budget: "120.000 MT",
      guests: "25",
    },
    {
      title: "Jantar de Ensaio",
      date: "16-10-2026",
      time: "19:00",
      location: "Restaurante Zambi, Maputo",
      budget: "180.000 MT",
      guests: "40",
    },
    {
      title: "Grande Dia: Casamento",
      date: "10-12-2026",
      time: "14:00 GMT+2",
      location: "Vilankulos, Inhambane",
      guests: "250 Convidados"
    }
  ];

  const checklist = [
    { task: "Degustação do menu de buffet", category: "Catering", assignee: "Sofia" },
    { task: "Aprovação do layout floral", category: "Decoração", assignee: "Alberto" },
    { task: "Envio dos convites digitais", category: "RSVP", assignee: "Concierge HAXR" },
  ];

  return (
    <section
      id="plataforma"
      className="relative bg-brand-ivory overflow-hidden border-y border-brand-champagne/30"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">

        {/* Left Column: Premium Editorial Copy */}
        <div className="lg:col-span-5 px-6 py-20 md:px-12 md:py-28 lg:py-32 flex flex-col justify-center bg-brand-ivory text-brand-text-dark relative z-10">
          <RevealOnScroll className="max-w-lg mx-auto lg:mx-0 space-y-6">
            <div className="flex items-center gap-2.5 text-brand-gold">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
              </svg>
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ecossistema HAXR</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-light text-brand-text-dark leading-tight">
              O vosso Painel de Casamento Exclusivo e Inteligente
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-text-dark/75 leading-relaxed font-light">
              Planeie o vosso casamento de sonho com total tranquilidade e clareza. Comece hoje a usar o vosso gestor digital HAXR Signature — o vosso assessor de eventos virtual para acompanhar cada detalhe.
            </p>

            <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 leading-relaxed font-light">
              Da gestão orçamental e checklists detalhadas à inspiração e coordenação de fornecedores em Moçambique, simplificamos toda a organização. Esteja no início dos preparativos ou nos detalhes finais, a HAXR Signature reúne tudo num único ecossistema refinado.
            </p>

            <div className="pt-4">
              <Link
                href="/dashboard"
                className="bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[10px] tracking-widest uppercase font-bold py-4 px-8 rounded-sm shadow-md transition-colors cursor-pointer inline-block"
              >
                Configurar Painel
              </Link>
            </div>
          </RevealOnScroll>
        </div>

        {/* Right Column: Premium Silk backdrop with high-fidelity iPad Pro Mockup */}
        <div className="lg:col-span-7 relative min-h-[450px] md:min-h-[580px] flex items-center justify-center p-6 sm:p-10">

          {/* Generated Silk Backdrop Photo */}
          <Image
            src="/images/backgrounds/luxury-silk-backdrop.png"
            alt="Fundo de seda luxuosa com sombras suaves - HAXR Signature Satin"
            fill
            className="object-cover object-center"
            quality={95}
          />

          {/* Dark gradient vignette over silk backdrop for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-ivory/15 via-transparent to-black/10 z-1" />

          {/* iPad Pro Device Mockup */}
          <div className="relative z-10 w-full max-w-[520px] rounded-3xl border-[10px] md:border-[13px] border-[#080706] bg-[#080706] shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden aspect-[4/3] transform hover:scale-[1.01] transition-transform duration-500">

            {/* Screen Glass Reflection Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />

            {/* Screen Content: Loverly-style Dashboard */}
            <div className="w-full h-full bg-[#FCFAF7] p-4 md:p-6 font-sans text-brand-text-dark text-[8px] md:text-[10px] flex flex-col justify-between select-none">

              {/* Tablet Header Bar */}
              <div className="flex justify-between items-center border-b border-brand-champagne/30 pb-3 shrink-0">
                <div className="flex items-center gap-4">
                  <span className="font-serif text-[10px] md:text-sm font-bold tracking-wide text-brand-text-dark">HAXR Signature</span>
                  <div className="flex items-center gap-1.5 bg-brand-champagne/15 border border-brand-champagne/30 px-2 py-1 rounded-sm text-[6px] md:text-[8px] font-mono text-brand-text-dark/65 cursor-pointer">
                    <span>Todos os eventos</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </div>
                </div>

                <button
                  type="button"
                  className="bg-brand-text-dark hover:bg-brand-gold text-white font-mono text-[6px] md:text-[7.5px] tracking-wider uppercase font-bold py-1.5 px-3 rounded-sm flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Adicionar evento</span>
                </button>
              </div>

              {/* Event Cards Section */}
              <div className="grid grid-cols-3 gap-3 my-4 shrink-0">
                {events.map((event) => (
                  <div
                    key={event.title}
                    className="bg-white border border-brand-champagne/25 p-3 rounded-sm space-y-2 shadow-xs"
                  >
                    <h4 className="font-serif text-[8.5px] md:text-[10.5px] font-semibold text-brand-text-dark truncate">
                      {event.title}
                    </h4>

                    <div className="space-y-1.5 text-[6.5px] md:text-[8.5px] text-brand-text-dark/70 font-light">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-brand-gold shrink-0" strokeWidth={1.5} />
                        <span className="truncate">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-brand-gold shrink-0" strokeWidth={1.5} />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-brand-gold shrink-0" strokeWidth={1.5} />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3 h-3 text-brand-gold shrink-0" strokeWidth={1.5} />
                        <span className="font-medium text-brand-text-dark">{event.budget}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-brand-gold shrink-0" strokeWidth={1.5} />
                        <span>{event.guests} convidados</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checklist Section */}
              <div className="bg-white border border-brand-champagne/20 rounded-sm p-3.5 flex-1 flex flex-col justify-between overflow-hidden shadow-xs">

                {/* Title */}
                <h4 className="font-serif text-[9px] md:text-[11.5px] font-semibold text-brand-text-dark border-b border-brand-champagne/15 pb-2 mb-2 shrink-0">
                  O Meu Checklist Recente
                </h4>

                {/* Checklist Table */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[7px] md:text-[9.5px]">
                    <thead>
                      <tr className="border-b border-brand-champagne/15 text-brand-text-dark/40 font-mono text-[5.5px] md:text-[7px] uppercase tracking-wider">
                        <th className="pb-1.5 font-semibold">Tarefa</th>
                        <th className="pb-1.5 font-semibold">Categoria</th>
                        <th className="pb-1.5 font-semibold">Responsável</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-champagne/10 text-brand-text-dark/85 font-light">
                      {checklist.map((item) => (
                        <tr key={item.task} className="hover:bg-brand-champagne/5 transition-colors">
                          <td className="py-1.5 font-medium flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full border border-brand-gold/30 flex items-center justify-center shrink-0">
                              <Check className="w-2 h-2 text-brand-gold" />
                            </span>
                            <span className="truncate">{item.task}</span>
                          </td>
                          <td className="py-1.5 text-brand-text-dark/65">{item.category}</td>
                          <td className="py-1.5 text-brand-text-dark/65">{item.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
