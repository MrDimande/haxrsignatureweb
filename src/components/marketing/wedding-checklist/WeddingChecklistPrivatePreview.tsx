"use client";

import { ArrowRight, ArrowUpRight, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function WeddingChecklistPrivatePreview() {
  return (
    <section className="relative mt-20 pt-16 border-t border-brand-champagne/35 space-y-12">
      {/* Eyebrow & Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 text-brand-gold">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] font-bold">
            PRIVATE CLIENT SYSTEM
          </span>
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-text-dark leading-tight">
          A versão pública é apenas o início.
        </h2>
        <p className="font-sans text-xs md:text-sm text-brand-text-dark/70 font-light leading-relaxed">
          Esta demonstração permite explorar a lógica da Checklist HAXR directamente no navegador. No Private Client System, a checklist torna-se parte do projecto real do evento, com responsáveis, prazos, prioridades, estados, tarefas em atraso e ligação às restantes áreas operacionais.
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Public Tool Card */}
        <div className="bg-white border border-brand-champagne/40 rounded-sm p-6 md:p-8 space-y-6">
          <div className="space-y-1 border-b border-brand-champagne/20 pb-4">
            <span className="font-mono text-[8px] uppercase tracking-widest text-brand-text-dark/40 font-bold">
              MODO PÚBLICO · DEMONSTRAÇÃO
            </span>
            <h3 className="font-serif text-lg font-light text-brand-text-dark">
              Planeamento no Navegador
            </h3>
          </div>

          <ul className="space-y-3 font-sans text-xs text-brand-text-dark/75 font-light">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>7 Fases canónicas cronológicas</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>Banco de tarefas adaptadas à jornada</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>Acompanhamento de progresso percentual</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>Criação de tarefas personalizadas locais</span>
            </li>
          </ul>

          <div className="pt-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 bg-brand-champagne/10 px-2.5 py-1 rounded-xs">
              Estado Local · Sem Registo
            </span>
          </div>
        </div>

        {/* Private Client System Card */}
        <div className="bg-gradient-to-br from-[#151312] to-[#0C0B0A] text-brand-ivory border border-brand-gold/40 rounded-sm p-6 md:p-8 space-y-6 shadow-md relative overflow-hidden">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold">
                PRIVATE CLIENT SYSTEM
              </span>
              <Lock className="w-3.5 h-3.5 text-brand-gold/60" />
            </div>
            <h3 className="font-serif text-lg font-light text-white">
              Gestão Real & Integrada
            </h3>
          </div>

          <ul className="space-y-3 font-sans text-xs text-brand-ivory/80 font-light">
            <li className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
              <span>Responsáveis nominais por cada tarefa</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
              <span>Prazos dinâmicos e alerta de tarefas em atraso</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
              <span>Níveis de prioridade e criticidade de execução</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
              <span>Ligação directa a Orçamento, Convidados e Fornecedores</span>
            </li>
            <li className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
              <span>Validação e acompanhamento pela equipa HAXR</span>
            </li>
          </ul>

          <div className="pt-2">
            <p className="font-mono text-[8px] uppercase tracking-wider text-brand-gold/80">
              Disponível para clientes com acesso ao Private Client System.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href="/area-cliente"
          className="w-full sm:w-auto btn-editorial btn-editorial--solid px-8 py-3.5 font-mono text-[9px] uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Aceder à Experiência Completa</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/plataforma-eventos"
          className="w-full sm:w-auto btn-editorial btn-editorial--outline px-8 py-3.5 font-mono text-[9px] uppercase tracking-widest font-bold inline-flex items-center justify-center gap-2"
        >
          <span>Conhecer o Ecossistema HAXR</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
