"use client";

import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { FileSpreadsheet } from "lucide-react";
import { DEMO_GUESTS, DEMO_OPERATIONS_KPIS } from "@/lib/marketing/convidados-demo";

export default function GuestOperationsConsole() {
  return (
    <section className="relative py-20 md:py-32 bg-[#080707] text-brand-ivory border-b border-brand-champagne/20 pointer-events-auto">
      <div className="site-container mx-auto space-y-16">
        {/* Section Header */}
        <RevealOnScroll>
          <div className="max-w-3xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-brand-gold" />
              <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-brand-gold font-bold">
                04 · The Operations Console
              </span>
            </div>

            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-brand-ivory leading-tight">
              A hospitalidade acontece à frente.{" "}
              <span className="italic text-brand-champagne font-normal">
                O controlo permanece nos bastidores.
              </span>
            </h2>

            <p className="font-sans text-sm md:text-base text-brand-ivory/70 font-light leading-relaxed">
              Enquanto os convidados desfrutam da recepção e do brinde, a assessoria e a equipa de
              acolhimento operam sobre uma base de dados limpa, validada e organizada.
            </p>
          </div>
        </RevealOnScroll>

        {/* 4 Operations KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {DEMO_OPERATIONS_KPIS.map((kpi, idx) => (
            <RevealOnScroll key={kpi.label} delay={idx * 0.06}>
              <div className="bg-[#12100F] border border-brand-champagne/25 rounded-2xl p-5 md:p-6 space-y-2 hover:border-brand-gold/40 transition-colors">
                <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold/80 block font-semibold">
                  {kpi.label}
                </span>
                <p className="font-serif text-3xl md:text-4xl font-light text-brand-ivory">
                  {kpi.value}
                </p>
                <p className="text-[9.5px] font-sans text-brand-ivory/50 font-light">
                  {kpi.sub}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Realistic Master Console Table View */}
        <RevealOnScroll delay={0.15}>
          <div className="bg-[#12100F] border border-brand-champagne/30 rounded-3xl overflow-hidden shadow-2xl">
            {/* Console Bar */}
            <div className="bg-[#191715] px-6 py-4 border-b border-brand-champagne/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-brand-gold" />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand-ivory font-bold">
                  PRIVATE CLIENT SYSTEM · DEMONSTRAÇÃO EDITORIAL · DADOS ILUSTRATIVOS
                </span>
              </div>
              <div className="flex items-center gap-4 text-[8px] font-mono text-brand-ivory/50">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> BASE DEMONSTRATIVA
                </span>
                <span>•</span>
                <span>MOÇAMBIQUE (+258)</span>
                <span>•</span>
                <span className="text-brand-gold">MAPUTO</span>
              </div>
            </div>

            {/* Table Representation */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-brand-champagne/15 text-[8.5px] font-mono uppercase tracking-wider text-brand-ivory/45 bg-black/20">
                    <th className="py-3.5 px-5">ID</th>
                    <th className="py-3.5 px-5">Convidado</th>
                    <th className="py-3.5 px-5">Telemóvel</th>
                    <th className="py-3.5 px-5">RSVP Status</th>
                    <th className="py-3.5 px-5">Mesa Alocada</th>
                    <th className="py-3.5 px-5">Acompanhante</th>
                    <th className="py-3.5 px-5">Restrição Alimentar</th>
                    <th className="py-3.5 px-5 text-right">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-champagne/10">
                  {DEMO_GUESTS.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5 font-mono text-[9px] text-brand-gold/70">{row.id}</td>
                      <td className="py-3 px-5 font-medium text-brand-ivory">{row.name}</td>
                      <td className="py-3 px-5 font-mono text-[10px] text-brand-ivory/60">{row.phone}</td>
                      <td className="py-3 px-5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[8px] font-mono uppercase ${
                            row.status === "Confirmado"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-brand-ivory/80">{row.table}</td>
                      <td className="py-3 px-5 text-brand-ivory/60 text-[11px]">{row.companion}</td>
                      <td className="py-3 px-5">
                        <span
                          className={`text-[10px] ${
                            row.diet !== "Sem restrições" && row.diet !== "Nenhuma"
                              ? "text-amber-200/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded"
                              : "text-brand-ivory/40"
                          }`}
                        >
                          {row.diet}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-mono text-[9px]">
                        {row.checkedIn && row.checkedInTime ? (
                          <span className="text-emerald-400 font-bold">✓ {row.checkedInTime}</span>
                        ) : (
                          <span className="text-brand-ivory/30">Pendente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Bar */}
            <div className="bg-[#161413] px-6 py-3 border-t border-brand-champagne/15 flex flex-wrap items-center justify-between text-[9px] font-mono text-brand-ivory/60">
              <span>CONTROLO EM TEMPO REAL · PROTOCOLO DE ENTRADA HAXR</span>
              <span>RESTRIÇÕES VISÍVEIS PARA COORDENAÇÃO COM O CATERING</span>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
