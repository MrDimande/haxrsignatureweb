"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  CupSoda,
  FileText,
  GlassWater,
  Info,
  MessageCircle,
  PartyPopper,
  Percent,
  Printer,
  Crown,
  Utensils,
  Wine,
  Users,
} from "lucide-react";
import MarketingToolBanner from "@/components/marketing/MarketingToolBanner";
import ToolProductionCta from "@/components/marketing/ToolProductionCta";
import {
  calculateDrinksAndCatering,
  buildWhatsAppVendorMessage,
  DEFAULT_CALCULATOR_INPUTS,
  type CalculatorInputs,
  type EventStyle,
  type ConsumptionProfile,
} from "@/lib/tools/drinks-catering-calculator";

export default function CalculadoraBebidasCateringPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_CALCULATOR_INPUTS);
  const [savedToBudget, setSavedToBudget] = useState(false);

  const results = useMemo(() => {
    return calculateDrinksAndCatering(inputs);
  }, [inputs]);

  const updateInput = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setSavedToBudget(false);
  };

  const handleSaveToBudget = () => {
    try {
      const existingRaw = localStorage.getItem("haxr_budget_expenses");
      const existing = existingRaw ? JSON.parse(existingRaw) : [];

      const newExpense = {
        id: `drinks-catering-${Date.now()}`,
        name: `Bebidas & Catering (${results.totals.totalGuests} convidados)`,
        category: "Gastronomia & Bebidas",
        planned: results.totals.totalEstimatedBudgetMzn,
        paid: 0,
        status: "Pendente",
      };

      const updated = [newExpense, ...existing];
      localStorage.setItem("haxr_budget_expenses", JSON.stringify(updated));
      setSavedToBudget(true);
      window.dispatchEvent(new Event("haxr:budget-updated"));
    } catch {
      setSavedToBudget(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsappMessage = useMemo(() => {
    return buildWhatsAppVendorMessage(results);
  }, [results]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-brand-text-dark font-sans selection:bg-brand-gold/20 selection:text-brand-black">
      {/* ── Top Header Banner ── */}
      <MarketingToolBanner title="Calculadora de Bebidas & Catering" />

      <main className="site-container-wide py-12 md:py-16 space-y-12">
        {/* ── Grid Principal: Configurações (Esquerda) + Resultados (Direita) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ══════════════════════════════════════════════════
              COLUNA ESQUERDA: PARÂMETROS DO EVENTO
             ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-6 sm:p-7 shadow-xs space-y-6">
              <div className="border-b border-brand-champagne/30 pb-4">
                <h2 className="font-serif text-xl sm:text-2xl font-light text-brand-text-dark">
                  Configuração do Evento
                </h2>
                <p className="font-sans text-xs text-brand-text-dark/60 font-light mt-1">
                  Ajuste o número de pessoas, perfil de consumo e duração.
                </p>
              </div>

              {/* 1. Número de Adultos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs uppercase tracking-wider text-brand-text-dark/70 font-semibold">
                    Adultos ({inputs.adults})
                  </label>
                  <span className="font-mono text-xs text-brand-gold font-bold">
                    {inputs.adults} pessoas
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="800"
                  step="10"
                  value={inputs.adults}
                  onChange={(e) => updateInput("adults", Number(e.target.value))}
                  className="w-full accent-brand-gold cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-brand-text-dark/40">
                  <span>30</span>
                  <span>250</span>
                  <span>500</span>
                  <span>800</span>
                </div>
              </div>

              {/* 2. Número de Crianças */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs uppercase tracking-wider text-brand-text-dark/70 font-semibold">
                    Crianças / Não-Consumidores ({inputs.children})
                  </label>
                  <span className="font-mono text-xs text-brand-gold font-bold">
                    {inputs.children} crianças
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={inputs.children}
                  onChange={(e) => updateInput("children", Number(e.target.value))}
                  className="w-full accent-brand-gold cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-brand-text-dark/40">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                  <span>150</span>
                </div>
              </div>

              {/* 3. Estilo e Horário do Evento */}
              <div className="space-y-2.5">
                <label className="font-mono text-xs uppercase tracking-wider text-brand-text-dark/70 font-semibold block">
                  Estilo & Duração
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "lunch" as EventStyle, label: "Almoço", hours: 5 },
                    { id: "dinner" as EventStyle, label: "Jantar", hours: 7 },
                    { id: "full_party" as EventStyle, label: "Até Madrugada", hours: 10 },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        updateInput("eventStyle", style.id);
                        updateInput("durationHours", style.hours);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        inputs.eventStyle === style.id
                          ? "border-brand-gold bg-[#fbf9f6] text-brand-gold shadow-2xs font-medium"
                          : "border-brand-champagne/35 bg-white text-brand-text-dark/70 hover:border-brand-gold/40"
                      }`}
                    >
                      <span className="block text-xs font-serif">{style.label}</span>
                      <span className="block font-mono text-[9px] text-brand-text-dark/45 mt-0.5">
                        ~{style.hours} horas
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Perfil de Consumo de Álcool */}
              <div className="space-y-2.5">
                <label className="font-mono text-xs uppercase tracking-wider text-brand-text-dark/70 font-semibold block">
                  Perfil de Consumo Alcoólico
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "moderate" as ConsumptionProfile,
                      title: "Moderado / Clássico",
                      desc: "Foco em vinhos e cervejas, consumo leve de destilados.",
                    },
                    {
                      id: "standard" as ConsumptionProfile,
                      title: "Equilibrado (Padrão Moçambique)",
                      desc: "Consumo animado com cervejas, vinhos e bar aberto.",
                    },
                    {
                      id: "high" as ConsumptionProfile,
                      title: "Festeiro / Alto Consumo",
                      desc: "Fluxo contínuo de cocktails, whisky, gin e cervejas até tarde.",
                    },
                  ].map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => updateInput("consumptionProfile", prof.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        inputs.consumptionProfile === prof.id
                          ? "border-brand-gold bg-[#fbf9f6]"
                          : "border-brand-champagne/30 bg-white hover:border-brand-gold/30"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          inputs.consumptionProfile === prof.id
                            ? "border-brand-gold bg-brand-gold text-white"
                            : "border-brand-champagne/60"
                        }`}
                      >
                        {inputs.consumptionProfile === prof.id && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-serif text-sm font-medium text-brand-text-dark">
                          {prof.title}
                        </p>
                        <p className="font-sans text-xs text-brand-text-dark/60 font-light">
                          {prof.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Inclusões do Bar & Confeitaria */}
              <div className="space-y-3 pt-2 border-t border-brand-champagne/30">
                <label className="font-mono text-xs uppercase tracking-wider text-brand-text-dark/70 font-semibold block">
                  Itens do Bar & Catering
                </label>
                <div className="space-y-2">
                  {[
                    { key: "includeChampagneToast" as const, label: "Brinde com Champanhe / Espumante", icon: PartyPopper },
                    { key: "includeWhisky" as const, label: "Bar de Whisky 12 Anos / Premium", icon: Wine },
                    { key: "includeGinBar" as const, label: "Estação de Gin & Tónicas", icon: CupSoda },
                    { key: "includeWeddingCake" as const, label: "Bolo de Noiva Artístico", icon: Crown },
                    { key: "includeDesserts" as const, label: "Mesa de Sobremesas & Doces Finos", icon: Utensils },
                  ].map((item) => {
                    const Icon = item.icon;
                    const checked = inputs[item.key];
                    return (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-3 rounded-xl border border-brand-champagne/25 bg-brand-ivory/40 hover:bg-white transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-brand-gold" />
                          <span className="font-sans text-xs font-light text-brand-text-dark">
                            {item.label}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => updateInput(item.key, e.target.checked)}
                          className="h-4 w-4 rounded accent-brand-gold cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Banner Informativo Local */}
            <div className="p-5 rounded-2xl border border-brand-gold/30 bg-brand-gold/5 space-y-2">
              <div className="flex items-center gap-2 text-brand-gold">
                <Info className="h-4 w-4 shrink-0" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  Curadoria do Mercado de Maputo
                </p>
              </div>
              <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                As estimativas consideram a climatologia de Maputo (temperaturas tropicais que exigem mais água e gelo) e a duração tradicional de casamentos moçambicanos.
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              COLUNA DIREITA: RESULTADOS & QUANTIDADES CALCULADAS
             ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {/* ── Big Metric Totals ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl border border-brand-champagne/45 bg-white shadow-xs space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 block">
                  Total Convidados
                </span>
                <p className="font-serif text-2xl font-medium text-brand-text-dark">
                  {results.totals.totalGuests}
                </p>
                <span className="font-mono text-[9px] text-brand-gold block">
                  {inputs.adults} adultos · {inputs.children} crianças
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-brand-champagne/45 bg-white shadow-xs space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 block">
                  Garrafas Alcoólicas
                </span>
                <p className="font-serif text-2xl font-medium text-brand-gold">
                  {results.totals.totalBottlesAlcohol}
                </p>
                <span className="font-mono text-[9px] text-brand-text-dark/50 block">
                  Vinho, Whisky & Brinde
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-brand-champagne/45 bg-white shadow-xs space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 block">
                  Águas & Sumos
                </span>
                <p className="font-serif text-2xl font-medium text-brand-text-dark">
                  ~{results.totals.totalLitersNonAlcoholic} L
                </p>
                <span className="font-mono text-[9px] text-brand-text-dark/50 block">
                  {results.totals.totalIceKg} kg de gelo
                </span>
              </div>

              <div className="p-4 rounded-2xl border border-brand-champagne/45 bg-white shadow-xs space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 block">
                  Entradas / Salgados
                </span>
                <p className="font-serif text-2xl font-medium text-brand-text-dark">
                  {results.totals.totalCanapes}
                </p>
                <span className="font-mono text-[9px] text-brand-text-dark/50 block">
                  unidades finas
                </span>
              </div>
            </div>

            {/* ── Estimativa de Orçamento Geral ── */}
            <div className="rounded-2xl border border-brand-gold/40 bg-gradient-to-r from-[#181614] to-[#0c0a09] text-white p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-brand-gold">
                  Estimativa Global Sugerida
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl font-light text-white">
                  {results.totals.totalEstimatedBudgetMzn.toLocaleString("pt-MZ")}{" "}
                  <span className="text-xl text-brand-gold">MT</span>
                </h3>
                <p className="font-mono text-[10px] text-white/50">
                  ~${Math.round(results.totals.totalEstimatedBudgetMzn * 0.0156).toLocaleString()} USD · ~R
                  {Math.round(results.totals.totalEstimatedBudgetMzn * 0.285).toLocaleString()} ZAR
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveToBudget}
                  className={`px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer inline-flex items-center justify-center gap-2 ${
                    savedToBudget
                      ? "bg-emerald-600 text-white"
                      : "bg-brand-gold hover:bg-brand-gold-light text-brand-black"
                  }`}
                >
                  {savedToBudget ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Guardado no Orçamento!</span>
                    </>
                  ) : (
                    <>
                      <Coins className="h-3.5 w-3.5" />
                      <span>Guardar no Meu Orçamento</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Lista Detalhada de Bebidas ── */}
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-champagne/20 text-brand-gold">
                    <Wine className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                      Quantidades de Bebidas Recomendadas
                    </h3>
                    <p className="font-sans text-xs text-brand-text-dark/50 font-light">
                      Vinhos, destilados, cervejas, sumos, água e gelo
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-brand-gold">
                  ~{results.totals.estimatedBeverageBudgetMzn.toLocaleString("pt-MZ")} MT
                </span>
              </div>

              <div className="space-y-3">
                {results.beverages.map((bev) => (
                  <div
                    key={bev.id}
                    className="p-4 rounded-xl border border-brand-champagne/25 bg-[#faf8f5] hover:bg-white transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm sm:text-base font-medium text-brand-text-dark">
                          {bev.name}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-brand-text-dark/65 font-light">
                        {bev.detail}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-mono text-base font-bold text-brand-text-dark">
                        {bev.quantity.toLocaleString("pt-MZ")}{" "}
                        <span className="text-xs font-normal text-brand-text-dark/60 font-sans">
                          {bev.unit}
                        </span>
                      </p>
                      <p className="font-mono text-[10px] text-brand-gold">
                        ~{bev.estimatedCostMzn.toLocaleString("pt-MZ")} MT
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Lista Detalhada de Catering & Comida ── */}
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-brand-champagne/30 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-champagne/20 text-brand-gold">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                      Quantidades de Gastronomia & Catering
                    </h3>
                    <p className="font-sans text-xs text-brand-text-dark/50 font-light">
                      Canapés, buffet completo, bolo de noiva e mesa de sobremesas
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-brand-gold">
                  ~{results.totals.estimatedFoodBudgetMzn.toLocaleString("pt-MZ")} MT
                </span>
              </div>

              <div className="space-y-3">
                {results.food.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-brand-champagne/25 bg-[#faf8f5] hover:bg-white transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <span className="font-serif text-sm sm:text-base font-medium text-brand-text-dark">
                        {item.name}
                      </span>
                      <p className="font-sans text-xs text-brand-text-dark/65 font-light">
                        {item.detail}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-mono text-base font-bold text-brand-text-dark">
                        {item.quantity.toLocaleString("pt-MZ")}{" "}
                        <span className="text-xs font-normal text-brand-text-dark/60 font-sans">
                          {item.unit}
                        </span>
                      </p>
                      <p className="font-mono text-[10px] text-brand-gold">
                        ~{item.estimatedCostMzn.toLocaleString("pt-MZ")} MT
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Painel de Ações & Fornecedores ── */}
            <div className="p-6 rounded-2xl border border-brand-champagne/45 bg-white shadow-xs space-y-4">
              <h4 className="font-serif text-base font-medium text-brand-text-dark">
                Ações Recomendadas com Este Relatório:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. WhatsApp Fornecedor */}
                <a
                  href={`https://wa.me/258870883428?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors font-mono text-[10px] font-bold uppercase tracking-wider"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>Pedir Cotação por WhatsApp</span>
                </a>

                {/* 2. Imprimir / Salvar PDF */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-brand-champagne/50 bg-brand-ivory/50 text-brand-text-dark hover:bg-brand-champagne/20 transition-colors font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-brand-gold" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
              </div>

              <div className="pt-3 border-t border-brand-champagne/30 flex items-center justify-between">
                <Link
                  href="/fornecedores?category=catering"
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-brand-gold-light hover:underline"
                >
                  <span>Ver Fornecedores de Catering & Bebidas em Maputo</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/tools/budget-tracker"
                  className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-brand-text-dark/50 hover:text-brand-gold"
                >
                  <span>Abrir Gestor de Orçamento →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Perguntas Frequentes sobre Bebidas em Casamentos ── */}
        <section className="rounded-3xl border border-brand-champagne/45 bg-white p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-gold font-bold">
              Conselhos do Atelier HAXR
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
              Perguntas Frequentes sobre Bebidas & Catering
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-5 rounded-2xl border border-brand-champagne/25 bg-[#faf8f5] space-y-2">
              <h4 className="font-serif text-base font-medium text-brand-text-dark">
                Como funciona a taxa de rolha nos salões de Maputo?
              </h4>
              <p className="font-sans text-xs font-light text-brand-text-dark/75 leading-relaxed">
                Muitos espaços em Maputo cobram taxa de rolha caso os noivos tragam bebidas de fora. Ao negociar o salão, verifique se a taxa é por garrafa ou se está isenta caso contrate o catering do próprio local.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-brand-champagne/25 bg-[#faf8f5] space-y-2">
              <h4 className="font-serif text-base font-medium text-brand-text-dark">
                Por que a quantidade de gelo recomendada é de 1.4kg a 1.5kg por pessoa?
              </h4>
              <p className="font-sans text-xs font-light text-brand-text-dark/75 leading-relaxed">
                Em climas quentes como o de Moçambique, metade do gelo é utilizado para resfriamento contínuo nas caixas térmicas e tinas antes do serviço, enquanto a outra metade abastece os copos e cocktails do bar.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-brand-champagne/25 bg-[#faf8f5] space-y-2">
              <h4 className="font-serif text-base font-medium text-brand-text-dark">
                Quantas fatias rende um bolo de casamento de 3 andares?
              </h4>
              <p className="font-sans text-xs font-light text-brand-text-dark/75 leading-relaxed">
                Um bolo de 25 kg a 28 kg de alta confeitaria rende aproximadamente 250 a 300 fatias generosas (de 85g a 95g cada), perfeito para um casamento de médio a grande porte.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-brand-champagne/25 bg-[#faf8f5] space-y-2">
              <h4 className="font-serif text-base font-medium text-brand-text-dark">
                Posso exportar este relatório para a minha equipa de assessoria?
              </h4>
              <p className="font-sans text-xs font-light text-brand-text-dark/75 leading-relaxed">
                Sim! Pode usar o botão &ldquo;Imprimir / Salvar PDF&rdquo; ou partilhar diretamente por WhatsApp com a sua organizadora ou com a equipa da HAXR Signature.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA Final de Produção ── */}
        <ToolProductionCta
          headline="Quer a HAXR a Coordenar o Bar e Catering do Seu Casamento?"
          packageHref="/contacto"
        />
      </main>
    </div>
  );
}
