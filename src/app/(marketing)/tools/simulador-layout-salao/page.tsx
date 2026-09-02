"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Crown,
  Grid,
  Heart,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Maximize2,
  MessageCircle,
  Music,
  Printer,
  Save,
  ShieldCheck,
  Users,
  Utensils,
  Wine,
} from "lucide-react";
import {
  calculateFloorPlan,
  formatFloorPlanWhatsAppMessage,
  type FloorPlanInput,
  type ServiceComfortLevel,
  type TableFormat,
} from "@/lib/tools/floor-plan-calculator";

const FORMAT_CHOICES: { id: TableFormat; label: string; desc: string; seats: string }[] = [
  {
    id: "round_10",
    label: "Mesas Redondas de 10",
    desc: "O padrão de ouro dos casamentos clássicos — excelente contacto visual entre convidados.",
    seats: "10 pessoas / mesa (Ø 1.80m)",
  },
  {
    id: "round_12",
    label: "Mesas Redondas de 12",
    desc: "Maior capacidade por mesa, ideal para famílias grandes e grupos unidos.",
    seats: "12 pessoas / mesa (Ø 2.00m)",
  },
  {
    id: "imperial_long",
    label: "Mesas Imperiais Longas",
    desc: "Estilo banquete aristocrático europeu — visual contínuo com caminhos florais e velas.",
    seats: "16 a 24 pessoas / bloco",
  },
  {
    id: "hybrid_royal",
    label: "Layout Híbrido Royal",
    desc: "Mesa imperial presidencial de honra para 24 pessoas + Mesas redondas para convidados.",
    seats: "Mesa de Honra + Redondas de 10",
  },
];

const COMFORT_CHOICES: { id: ServiceComfortLevel; label: string; sqM: string; desc: string }[] = [
  {
    id: "comfort",
    label: "Alto Luxo (Espaçoso)",
    sqM: "1.9 – 2.2 m² / pessoa",
    desc: "Corredores amplos, passagem fácil para vestidos compridos e garçons.",
  },
  {
    id: "standard",
    label: "Padrão de Salão",
    sqM: "1.5 – 1.7 m² / pessoa",
    desc: "Equilíbrio ideal entre capacidade e conforto de circulação.",
  },
  {
    id: "compact",
    label: "Capacidade Máxima",
    sqM: "1.3 – 1.4 m² / pessoa",
    desc: "Para salões com espaço contido ou celebrações mais íntimas.",
  },
];

export default function FloorPlanSimulatorPage() {
  const [guestCount, setGuestCount] = useState<number>(350);
  const [tableFormat, setTableFormat] = useState<TableFormat>("round_10");
  const [serviceComfortLevel, setServiceComfortLevel] =
    useState<ServiceComfortLevel>("standard");
  const [hasDanceFloor, setHasDanceFloor] = useState<boolean>(true);
  const [hasStageBanda, setHasStageBanda] = useState<boolean>(true);
  const [hasBuffetStations, setHasBuffetStations] = useState<boolean>(true);
  const [hasOpenBarStation, setHasOpenBarStation] = useState<boolean>(true);
  const [hasHonorTable, setHasHonorTable] = useState<boolean>(true);
  const [hasLoungeArea, setHasLoungeArea] = useState<boolean>(true);
  const [coupleNames, setCoupleNames] = useState<string>("Jessica & Samuel");
  const [venueName, setVenueName] = useState<string>("Evelyn Eventos, Maputo");

  const [copied, setCopied] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Carregar dados guardados do localStorage se existirem
  useEffect(() => {
    try {
      const stored = localStorage.getItem("haxr_floor_plan_input");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.guestCount) setGuestCount(parsed.guestCount);
        if (parsed.tableFormat) setTableFormat(parsed.tableFormat);
        if (parsed.serviceComfortLevel) setServiceComfortLevel(parsed.serviceComfortLevel);
        if (parsed.hasDanceFloor !== undefined) setHasDanceFloor(parsed.hasDanceFloor);
        if (parsed.hasStageBanda !== undefined) setHasStageBanda(parsed.hasStageBanda);
        if (parsed.hasBuffetStations !== undefined) setHasBuffetStations(parsed.hasBuffetStations);
        if (parsed.hasOpenBarStation !== undefined) setHasOpenBarStation(parsed.hasOpenBarStation);
        if (parsed.hasHonorTable !== undefined) setHasHonorTable(parsed.hasHonorTable);
        if (parsed.hasLoungeArea !== undefined) setHasLoungeArea(parsed.hasLoungeArea);
        if (parsed.coupleNames) setCoupleNames(parsed.coupleNames);
        if (parsed.venueName) setVenueName(parsed.venueName);
      }
    } catch {
      // Ignorar se storage inacessível
    }
  }, []);

  const input: FloorPlanInput = useMemo(
    () => ({
      guestCount,
      tableFormat,
      serviceComfortLevel,
      hasDanceFloor,
      hasStageBanda,
      hasBuffetStations,
      hasOpenBarStation,
      hasHonorTable,
      hasLoungeArea,
      coupleNames,
      venueName,
    }),
    [
      guestCount,
      tableFormat,
      serviceComfortLevel,
      hasDanceFloor,
      hasStageBanda,
      hasBuffetStations,
      hasOpenBarStation,
      hasHonorTable,
      hasLoungeArea,
      coupleNames,
      venueName,
    ],
  );

  const result = useMemo(() => calculateFloorPlan(input), [input]);

  const handleCopy = () => {
    const text = formatFloorPlanWhatsAppMessage(result);
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem("haxr_floor_plan_input", JSON.stringify(input));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    formatFloorPlanWhatsAppMessage(result),
  )}`;

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-24 pt-24 md:pt-28 text-brand-text-dark font-sans">
      <div className="site-container-wide mx-auto space-y-8">
        {/* ── Breadcrumb & Topo ── */}
        <div className="flex items-center justify-between no-print">
          <Link
            href="/ferramentas"
            className="inline-flex items-center gap-2 font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/55 transition hover:text-brand-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar às Ferramentas</span>
          </Link>

          <span className="font-mono text-[9px] uppercase tracking-widest text-brand-gold font-bold">
            Arquitectura & Espaço HAXR
          </span>
        </div>

        {/* ── Header Editorial ── */}
        <header className="border-b border-brand-champagne/35 pb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-gold/15 border border-brand-gold/30 px-3 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              Simulador Espacial de Salão
            </span>
            <span className="rounded-full bg-stone-900 text-white px-3 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em]">
              Normas de Alto Luxo
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-light text-brand-text-dark leading-tight">
            Simulador de Disposição de Mesas & Layout de Salão
          </h1>

          <p className="font-sans text-sm sm:text-base font-light text-brand-text-dark/70 max-w-3xl leading-relaxed">
            Calcule a área exata necessária em m² para o vosso número de convidados, o número de
            mesas, dimensões da pista de dança, palco e corredores de circulação. Crie a ficha
            técnica perfeita para o decorador e a gerência do espaço em Moçambique.
          </p>
        </header>

        {/* ── Grid Principal: Parâmetros (Esquerda) + Blueprint Visual & Ficha (Direita) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── COLUNA ESQUERDA: PARÂMETROS E CONFIGURAÇÕES ── */}
          <div className="lg:col-span-5 space-y-6 no-print">
            <div className="rounded-3xl border border-brand-champagne/45 bg-white p-6 sm:p-7 shadow-[0_12px_40px_rgba(28,26,23,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-brand-champagne/25 pb-4">
                <div className="flex items-center gap-2 text-brand-gold">
                  <Grid className="h-4 w-4" />
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]">
                    Parâmetros do Salão
                  </h2>
                </div>
                <span className="font-mono text-[9px] text-brand-gold font-bold">
                  {guestCount} Convidados
                </span>
              </div>

              {/* 1. Nome dos Noivos e Espaço */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/65">
                    Nome dos Noivos
                  </span>
                  <input
                    value={coupleNames}
                    onChange={(e) => setCoupleNames(e.target.value)}
                    placeholder="Ex: Jessica & Samuel"
                    className="w-full rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-3.5 py-2.5 text-xs outline-none transition focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/15"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/65">
                    Nome do Salão / Quinta
                  </span>
                  <input
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Ex: Evelyn Eventos, Maputo"
                    className="w-full rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-3.5 py-2.5 text-xs outline-none transition focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/15"
                  />
                </label>
              </div>

              {/* 2. Número de Convidados */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                    Total de Convidados
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={30}
                      max={1500}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value) || 50)}
                      className="w-20 text-right rounded-lg border border-brand-champagne/45 bg-[#faf8f5] px-2 py-1 font-mono text-xs font-bold text-brand-gold outline-none"
                    />
                    <span className="text-xs text-brand-text-dark/60 font-light">pessoas</span>
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[100, 150, 200, 250, 300, 350, 450, 600, 800].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGuestCount(preset)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[9px] transition-all cursor-pointer ${
                        guestCount === preset
                          ? "bg-brand-black text-white font-bold"
                          : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/70 hover:border-brand-gold"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Formato de Mesas */}
              <div className="space-y-2.5">
                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                  Formato Principal das Mesas
                </span>
                <div className="space-y-2">
                  {FORMAT_CHOICES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTableFormat(opt.id)}
                      className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        tableFormat === opt.id
                          ? "border border-brand-gold bg-brand-gold/10 text-brand-black shadow-2xs"
                          : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/75 hover:border-brand-gold/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-serif text-xs font-medium">{opt.label}</p>
                        <span className="font-mono text-[8px] text-brand-gold font-bold">
                          {opt.seats}
                        </span>
                      </div>
                      <p className="font-sans text-[10px] text-brand-text-dark/60 font-light mt-1 leading-tight">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Nível de Conforto & Espaçamento */}
              <div className="space-y-2">
                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                  Espaçamento & Conforto de Circulação
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {COMFORT_CHOICES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setServiceComfortLevel(opt.id)}
                      className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        serviceComfortLevel === opt.id
                          ? "bg-brand-black text-white shadow-2xs"
                          : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/70 hover:border-brand-gold/40"
                      }`}
                    >
                      <p className="font-sans text-xs font-medium">{opt.label}</p>
                      <p className="font-mono text-[8px] opacity-75">{opt.sqM}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Zonas & Estruturas do Salão */}
              <div className="pt-2 border-t border-brand-champagne/25 space-y-3">
                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                  Estruturas & Áreas Específicas
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-champagne/35 bg-[#faf8f5] cursor-pointer hover:border-brand-gold/30">
                    <input
                      type="checkbox"
                      checked={hasDanceFloor}
                      onChange={(e) => setHasDanceFloor(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold"
                    />
                    <span>Pista de Dança Central</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-champagne/35 bg-[#faf8f5] cursor-pointer hover:border-brand-gold/30">
                    <input
                      type="checkbox"
                      checked={hasStageBanda}
                      onChange={(e) => setHasStageBanda(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold"
                    />
                    <span>Palco Banda / DJ</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-champagne/35 bg-[#faf8f5] cursor-pointer hover:border-brand-gold/30">
                    <input
                      type="checkbox"
                      checked={hasBuffetStations}
                      onChange={(e) => setHasBuffetStations(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold"
                    />
                    <span>Estações de Buffet</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-champagne/35 bg-[#faf8f5] cursor-pointer hover:border-brand-gold/30">
                    <input
                      type="checkbox"
                      checked={hasOpenBarStation}
                      onChange={(e) => setHasOpenBarStation(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold"
                    />
                    <span>Bar de Cocktails Dedicado</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-champagne/35 bg-[#faf8f5] cursor-pointer hover:border-brand-gold/30">
                    <input
                      type="checkbox"
                      checked={hasHonorTable}
                      onChange={(e) => setHasHonorTable(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold"
                    />
                    <span>Mesa Presidencial de Honra</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-brand-champagne/35 bg-[#faf8f5] cursor-pointer hover:border-brand-gold/30">
                    <input
                      type="checkbox"
                      checked={hasLoungeArea}
                      onChange={(e) => setHasLoungeArea(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold"
                    />
                    <span>Zona Lounge & Sofás VIP</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Dica Técnica */}
            <div className="rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-white to-brand-gold/5 p-5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-brand-gold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                  Regra de Ouro HAXR
                </span>
              </div>
              <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                {result.tips[0]}
              </p>
            </div>
          </div>

          {/* ── COLUNA DIREITA: BLUEPRINT VISUAL & FICHA TÉCNICA ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Barra de Ações Rápidas */}
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-gold">
                  Ficha Técnica Pronta
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-champagne/45 bg-[#faf8f5] hover:bg-white hover:border-brand-gold px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-brand-text-dark/50" />
                      <span>Copiar Ficha</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveToLocalStorage}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-champagne/45 bg-[#faf8f5] hover:bg-white hover:border-brand-gold px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark transition cursor-pointer"
                >
                  {saved ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Salvo!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 text-brand-text-dark/50" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-champagne/45 bg-[#faf8f5] hover:bg-white hover:border-brand-gold px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-brand-text-dark/50" />
                  <span>Imprimir / PDF</span>
                </button>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Enviar ao Decorador / Quinta</span>
                </a>
              </div>
            </div>

            {/* 2. KPIs de Área & Mesas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50 block">
                  Total de Mesas
                </span>
                <p className="font-serif text-2xl font-medium text-brand-text-dark">
                  {result.totalTables}{" "}
                  <span className="text-xs font-normal text-brand-text-dark/60">mesas</span>
                </p>
              </div>

              <div className="rounded-2xl border border-brand-gold/40 bg-gradient-to-br from-white to-brand-gold/10 p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold block">
                  Área Mínima Total
                </span>
                <p className="font-serif text-2xl font-medium text-brand-gold">
                  {result.minTotalAreaSqM}{" "}
                  <span className="text-xs font-normal text-brand-gold">m²</span>
                </p>
              </div>

              <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50 block">
                  Área Ideal Recomendada
                </span>
                <p className="font-serif text-2xl font-light text-brand-text-dark">
                  {result.recommendedTotalAreaSqM}{" "}
                  <span className="text-xs font-normal text-brand-text-dark/60">m²</span>
                </p>
              </div>

              <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50 block">
                  Pista de Dança
                </span>
                <p className="font-serif text-2xl font-light text-brand-text-dark">
                  {result.danceFloorSqM > 0 ? `${result.danceFloorSqM} m²` : "—"}
                </p>
              </div>
            </div>

            {/* 3. Blueprint Visual 2D do Salão */}
            <div className="rounded-3xl border border-brand-champagne/45 bg-white p-6 shadow-[0_12px_40px_rgba(28,26,23,0.04)] space-y-5">
              <div className="flex items-center justify-between border-b border-brand-champagne/25 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                    Blueprint de Layout & Disposição Espacial
                  </h3>
                  <p className="font-mono text-[8px] text-brand-text-dark/50 uppercase tracking-wider mt-0.5">
                    Dimensões sugeridas: {result.suggestedRoomDimensions}
                  </p>
                </div>
                <span className="rounded-full bg-[#faf8f5] border border-brand-champagne/40 px-3 py-1 font-mono text-[8px] uppercase tracking-wider text-brand-gold font-bold">
                  Proporção 1:1.5
                </span>
              </div>

              {/* Área do Diagrama */}
              <div className="rounded-2xl border-2 border-dashed border-brand-champagne/60 bg-[#faf8f5] p-5 sm:p-6 space-y-5">
                {/* 1. Topo: Palco & Mesa de Honra */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hasStageBanda && (
                    <div className="rounded-xl border border-stone-800 bg-stone-900 text-white p-3.5 text-center flex items-center justify-center gap-2 shadow-xs">
                      <Music className="h-4 w-4 text-brand-gold" />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                        Palco Banda & DJ ({result.stageAreaSqM} m²)
                      </span>
                    </div>
                  )}

                  {hasHonorTable && (
                    <div className="rounded-xl border-2 border-brand-gold bg-gradient-to-r from-brand-gold/20 via-brand-gold/10 to-brand-gold/20 p-3.5 text-center flex items-center justify-center gap-2 shadow-xs">
                      <Crown className="h-4 w-4 text-brand-gold" />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-black">
                        Mesa Presidencial dos Noivos ({result.honorTableCapacity} Lugares)
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Centro: Pista de Dança Central */}
                {hasDanceFloor && (
                  <div className="mx-auto max-w-md rounded-2xl border-2 border-brand-gold/40 bg-gradient-to-br from-white via-[#faf8f5] to-brand-gold/5 p-6 text-center shadow-xs">
                    <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-brand-gold font-bold block mb-1">
                      Espaço Central
                    </span>
                    <h4 className="font-serif text-base font-medium text-brand-text-dark">
                      Pista de Dança Central LED
                    </h4>
                    <p className="font-mono text-[10px] text-brand-text-dark/60 mt-0.5">
                      {result.danceFloorDimension}
                    </p>
                  </div>
                )}

                {/* 3. Grid de Mesas de Convidados */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-wider text-brand-text-dark/50">
                    <span>Área de Mesas de Convidados ({result.regularTableCount} mesas)</span>
                    <span>Corredor Central Livre: ≥ 1.80m</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {Array.from({ length: result.regularTableCount }).map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-brand-champagne/50 bg-white p-2 text-center shadow-2xs space-y-0.5"
                      >
                        <span className="font-mono text-[8px] text-brand-gold font-bold block">
                          M{idx + 1}
                        </span>
                        <span className="font-sans text-[10px] text-brand-text-dark/75 block">
                          {tableFormat === "round_12" ? "12 lugares" : "10 lugares"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Base: Buffet, Bar e Lounge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-brand-champagne/30">
                  {hasBuffetStations && (
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-2.5 text-center flex items-center justify-center gap-1.5 text-emerald-800">
                      <Utensils className="h-3.5 w-3.5" />
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider">
                        Buffet ({result.buffetAreaSqM} m²)
                      </span>
                    </div>
                  )}

                  {hasOpenBarStation && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-2.5 text-center flex items-center justify-center gap-1.5 text-amber-900">
                      <Wine className="h-3.5 w-3.5" />
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider">
                        Bar ({result.barAreaSqM} m²)
                      </span>
                    </div>
                  )}

                  {hasLoungeArea && (
                    <div className="rounded-xl border border-purple-300 bg-purple-50/70 p-2.5 text-center flex items-center justify-center gap-1.5 text-purple-900">
                      <Layers className="h-3.5 w-3.5" />
                      <span className="font-mono text-[8px] font-bold uppercase tracking-wider">
                        Lounge ({result.loungeAreaSqM} m²)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Ficha Técnica Discriminada */}
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-6 space-y-4 shadow-sm">
              <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                Ficha Técnica Discriminada de Áreas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-brand-champagne/30">
                  <span className="text-brand-text-dark/70">Área de Mesas & Refeição:</span>
                  <span className="font-mono font-bold text-brand-text-dark">
                    {result.diningAreaSqM} m²
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-brand-champagne/30">
                  <span className="text-brand-text-dark/70">Pista de Dança:</span>
                  <span className="font-mono font-bold text-brand-text-dark">
                    {result.danceFloorSqM} m²
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-brand-champagne/30">
                  <span className="text-brand-text-dark/70">Palco Banda / DJ:</span>
                  <span className="font-mono font-bold text-brand-text-dark">
                    {result.stageAreaSqM} m²
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-brand-champagne/30">
                  <span className="text-brand-text-dark/70">Estações de Buffet:</span>
                  <span className="font-mono font-bold text-brand-text-dark">
                    {result.buffetAreaSqM} m²
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-brand-champagne/30">
                  <span className="text-brand-text-dark/70">Bar & Mixologia:</span>
                  <span className="font-mono font-bold text-brand-text-dark">
                    {result.barAreaSqM} m²
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] border border-brand-champagne/30">
                  <span className="text-brand-text-dark/70">Corredores de Segurança & Margem:</span>
                  <span className="font-mono font-bold text-brand-text-dark">
                    {result.circulationBufferSqM} m²
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé com Link para Espaços */}
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-6 text-center space-y-3 shadow-sm no-print">
              <h4 className="font-serif text-lg font-medium text-brand-text-dark">
                À Procura do Espaço Ideal para o vosso Casamento?
              </h4>
              <p className="text-xs font-light text-brand-text-dark/65 max-w-lg mx-auto leading-relaxed">
                Descubra as quintas, salões e resorts aprovados com capacidade certificada para{" "}
                {guestCount} convidados no Directório Oficial HAXR.
              </p>
              <div className="pt-1">
                <Link
                  href="/fornecedores?category=venues"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-black hover:bg-brand-gold px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-white transition-colors shadow-xs"
                >
                  <span>Ver Espaços & Quintas Aprovadas</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
