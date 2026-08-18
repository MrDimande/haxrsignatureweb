"use client";

import { useState } from "react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { FileText, Table, Users, LayoutDashboard, Shield, CheckCircle2 } from "lucide-react";

export default function AssessoriaTechEcosystem() {
  const [activeTab, setActiveTab] = useState<"portal" | "report" | "book" | "rsvp">("portal");

  const tabs = [
    {
      id: "portal",
      label: "Portal Privado",
      sub: "Hub de Acompanhamento",
      icon: LayoutDashboard,
      title: "Private Client Portal",
      description:
        "O casal acompanha o progresso de cada fase do casamento em tempo real. Cronograma de tarefas, fornecedores aprovados e decisões partilhadas num único ambiente seguro e confidencial.",
      highlight: "Acesso reservado aos noivos em qualquer dispositivo.",
    },
    {
      id: "report",
      label: "Financial Report PDF",
      sub: "Relatório Executivo",
      icon: FileText,
      title: "The Wedding Financial Report (.pdf)",
      description:
        "Documento editorial emitido a qualquer momento da assessoria. Apresenta o sumário consolidado de capital, detalhe do master budget por fornecedor e histórico de liquidações.",
      highlight: "Reconciliação e consolidação financeira em formato editorial.",
    },
    {
      id: "book",
      label: "Financial Book XLSX",
      sub: "Master Financial Workbook",
      icon: Table,
      title: "The Wedding Financial Book (.xlsx)",
      description:
        "Livro financeiro operacional gerado via motor ExcelJS com fórmulas nativas e 9 áreas financeiras especializadas. Transparência de cada metical contractado, liquidado e saldo a pagar.",
      highlight: "9 áreas financeiras especializadas · uma única fonte financeira canónica.",
    },
    {
      id: "rsvp",
      label: "RSVP & Concierge",
      sub: "Gestão de Convidados",
      icon: Users,
      title: "Live RSVP & Guest Concierge",
      description:
        "Confirmação de presenças automatizada com recolha de restrições alimentares, alojamento e marcação de lugares interactiva. A equipa sabe ao segundo quem confirmou e quem foi acolhido.",
      highlight: "Recepção fluida no grande dia sem filas ou constrangimentos.",
    },
  ] as const;

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section className="relative py-16 md:py-24 bg-[#0a0908] text-brand-ivory overflow-hidden border-b border-brand-champagne/20">
      {/* Subtle Luxury Gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,rgba(184,138,42,0.15),transparent_70%)]" />

      <div className="site-container mx-auto relative z-10 space-y-16">
        {/* Section Header */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                05 · HAXR Private Client Ecosystem
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-ivory leading-tight">
              Tecnologia nos Bastidores
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-ivory/70 font-light leading-relaxed">
              A tecnologia da HAXR Signature não substitui a sensibilidade humana nem a curadoria estética.
              Existe para blindar a operação nos bastidores — garantindo controlo de capital, rigor de prazos
              e visibilidade executiva permanente para o casal.
            </p>
          </div>
        </RevealOnScroll>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-white/10 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between gap-3 cursor-pointer ${
                  isActive
                    ? "bg-brand-gold/15 border-brand-gold/60 text-brand-ivory"
                    : "bg-white/[0.02] border-white/5 text-brand-ivory/60 hover:border-white/20 hover:text-brand-ivory"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-gold" : "text-brand-ivory/40"}`} />
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_8px_rgba(184,138,42,0.8)]" />
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-wider uppercase">
                    {tab.label}
                  </p>
                  <p className="text-[9px] font-sans font-light text-brand-ivory/50">
                    {tab.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Showcase Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/[0.02] border border-brand-champagne/25 rounded-3xl p-6 md:p-10 relative overflow-hidden">
          {/* Left Column: Tab Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold font-bold">
                Activo do Ecossistema
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-brand-ivory">
                {currentTab.title}
              </h3>
            </div>

            <p className="font-sans text-xs md:text-sm text-brand-ivory/75 font-light leading-relaxed">
              {currentTab.description}
            </p>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-gold/10 border border-brand-gold/30">
              <Shield className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
              <p className="text-xs font-sans text-brand-ivory/90 font-light">
                {currentTab.highlight}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-6 text-[10px] font-mono text-brand-ivory/40">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-brand-gold" />
                ACESSO PRIVADO
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-brand-gold" />
                DADOS CONSOLIDADOS
              </span>
            </div>
          </div>

          {/* Right Column: iPad Mockup Screen */}
          <div className="lg:col-span-7">
            <div className="w-full aspect-[16/10] bg-[#141210] border border-brand-champagne/30 rounded-2xl overflow-hidden p-4 md:p-5 relative font-sans flex flex-col justify-between shadow-2xl">
              {/* Screen Top Bar */}
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5 text-[6px] md:text-[8.5px] text-brand-ivory/50 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-gold/80 inline-block" />
                  <span>HAXR SIGNATURE · PRIVATE ENGINE</span>
                </div>
                <span className="text-brand-gold font-bold">PAINEL DE ACOMPANHAMENTO</span>
              </div>

              {/* Dynamic Screen Content Based on Tab */}
              {activeTab === "portal" && (
                <div className="flex-1 grid grid-cols-12 gap-3 py-3 overflow-hidden text-left">
                  <div className="col-span-5 bg-white/5 rounded-xl border border-white/5 p-3 flex flex-col justify-between">
                    <p className="font-mono text-[6px] text-brand-gold uppercase font-bold">Posição Financeira</p>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[5px] text-brand-ivory/50">Teto Orçamental</p>
                        <p className="text-[10px] font-serif font-light text-brand-ivory">1.200.000 MT</p>
                      </div>
                      <div>
                        <p className="text-[5px] text-brand-ivory/50">Total Contractado</p>
                        <p className="text-[10px] font-serif font-light text-brand-gold">1.170.000 MT</p>
                      </div>
                      <div>
                        <p className="text-[5px] text-brand-ivory/50">Total Liquidado</p>
                        <p className="text-[10px] font-serif font-light text-brand-champagne">525.000 MT</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-7 flex flex-col gap-2">
                    <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-3 space-y-1.5">
                      <p className="font-mono text-[6px] text-brand-gold uppercase font-bold">Marcos em Progresso</p>
                      <div className="space-y-1 text-[6.5px] text-brand-ivory/80">
                        <p className="flex items-center gap-1.5">
                          <span className="text-brand-gold">✓</span>
                          <span className="line-through text-brand-ivory/40">Aprovação de conceito e moodboard</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-brand-gold">✓</span>
                          <span className="line-through text-brand-ivory/40">Contractação de catering e espaço</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-brand-gold">⚡</span>
                          <span>Envio do Save the Date digital & RSVP</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-brand-ivory/40">○</span>
                          <span>Degustação e prova de styling de mesa</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl border border-white/5 px-3 py-1.5 flex justify-between items-center text-[6px] font-mono">
                      <span className="text-brand-ivory/60">FORNECEDORES ACTIVOS:</span>
                      <span className="text-brand-gold font-bold">4 CONTRACTOS REGISTADOS</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "report" && (
                <div className="flex-1 bg-white/[0.04] rounded-xl border border-white/10 p-3 my-2 flex flex-col justify-between text-left">
                  <div className="border-b border-white/10 pb-1.5 flex justify-between items-center">
                    <span className="font-serif text-[9px] text-brand-ivory font-light">THE WEDDING FINANCIAL REPORT</span>
                    <span className="font-mono text-[6px] text-brand-gold">EMISSÃO OFICIAL PDF</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-2">
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[5px] text-brand-ivory/50 font-mono">TOTAL CONTRACTADO</p>
                      <p className="font-serif text-[10px] text-brand-gold">1.170.000 MT</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[5px] text-brand-ivory/50 font-mono">TOTAL LIQUIDADO</p>
                      <p className="font-serif text-[10px] text-brand-ivory">525.000 MT</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[5px] text-brand-ivory/50 font-mono">SALDO CONTRACTUAL</p>
                      <p className="font-serif text-[10px] text-brand-champagne">645.000 MT</p>
                    </div>
                  </div>
                  <p className="text-[6px] font-mono text-brand-ivory/40 text-center">
                    Documento executivo privado com reconciliação da posição financeira do evento
                  </p>
                </div>
              )}

              {activeTab === "book" && (
                <div className="flex-1 bg-white/[0.04] rounded-xl border border-white/10 p-3 my-2 flex flex-col justify-between text-left font-mono">
                  <div className="border-b border-white/10 pb-1.5 flex justify-between items-center text-[6px]">
                    <span className="text-brand-ivory font-bold">HAXR_Wedding_Financial_Book.xlsx</span>
                    <span className="text-brand-gold">9 ÁREAS ESPECIALIZADAS</span>
                  </div>
                  <div className="space-y-1 text-[6px] text-brand-ivory/70 py-1">
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>01_Executive_Dashboard</span>
                      <span className="text-brand-gold">Consolidado</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>02_Master_Budget</span>
                      <span className="text-brand-gold">Reconciliado</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-0.5">
                      <span>03_Payment_Schedule</span>
                      <span className="text-brand-gold">Em dia</span>
                    </div>
                    <div className="flex justify-between">
                      <span>04_Vendors_Contracts</span>
                      <span className="text-brand-gold">Registado</span>
                    </div>
                  </div>
                  <p className="text-[5.5px] text-brand-ivory/40 text-center">
                    Livro operacional com fórmulas nativas e zero distorções manuais
                  </p>
                </div>
              )}

              {activeTab === "rsvp" && (
                <div className="flex-1 bg-white/[0.04] rounded-xl border border-white/10 p-3 my-2 flex flex-col justify-between text-left">
                  <div className="border-b border-white/10 pb-1.5 flex justify-between items-center font-mono text-[6px]">
                    <span className="text-brand-ivory font-bold">LIVE GUEST RSVP CONCIERGE</span>
                    <span className="text-brand-gold">200 CONVIDADOS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center py-2">
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[5px] text-brand-ivory/50 font-mono">CONFIRMADOS</p>
                      <p className="font-serif text-[10px] text-brand-gold">164</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[5px] text-brand-ivory/50 font-mono">PENDENTES</p>
                      <p className="font-serif text-[10px] text-brand-ivory">36</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg">
                      <p className="text-[5px] text-brand-ivory/50 font-mono">DIETAS ESPECIAIS</p>
                      <p className="font-serif text-[10px] text-brand-champagne">12 Registadas</p>
                    </div>
                  </div>
                  <p className="text-[6px] font-mono text-brand-ivory/40 text-center">
                    Seating plan automático e recepção inteligente no dia do evento
                  </p>
                </div>
              )}

              {/* Screen Footer */}
              <div className="border-t border-white/10 pt-2 flex justify-between items-center text-[5.5px] md:text-[7px] text-brand-ivory/40 font-mono">
                <span>DEMONSTRAÇÃO DO ECOSSISTEMA PRIVADO</span>
                <span className="text-brand-gold">DISPONÍVEL EM TODOS OS PLANOS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
