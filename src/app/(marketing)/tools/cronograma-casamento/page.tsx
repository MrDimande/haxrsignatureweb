"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Clock,
  Copy,
  Crown,
  Download,
  Eye,
  Heart,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  PartyPopper,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  Timer,
  Trash2,
  Users,
  Utensils,
  Wine,
} from "lucide-react";
import {
  generateWeddingTimeline,
  formatTimelineWhatsAppMessage,
  minutesToTime,
  timeToMinutes,
  type BridalPartyCount,
  type CeremonyLocationType,
  type TimelineGeneratorInput,
  type TimelineMilestone,
  type TimelineMilestoneCategory,
  type WeddingFormat,
} from "@/lib/tools/wedding-timeline-generator";

const FORMAT_OPTIONS: { id: WeddingFormat; label: string; desc: string }[] = [
  {
    id: "afternoon_evening",
    label: "Tarde & Gala Nocturna",
    desc: "Cerimónia às 14h-15h seguida de cocktail ao pôr do sol e grande banquete nocturno.",
  },
  {
    id: "sunset_wedding",
    label: "Sunset & Festa",
    desc: "Cerimónia às 16h-17h na Golden Hour seguida de festa ao ar livre e jantar sob as estrelas.",
  },
  {
    id: "day_wedding",
    label: "Casamento Diurno & Almoço",
    desc: "Cerimónia matinal às 10h-11h com almoço de autor e festa prolongada até ao entardecer.",
  },
  {
    id: "intimate_micro",
    label: "Íntimo / Micro-Wedding",
    desc: "Cerimónia personalizada e jantar com ritmo descontraído para até 80 convidados.",
  },
];

const BRIDAL_PARTY_OPTIONS: { id: BridalPartyCount; label: string; time: string }[] = [
  { id: "bride_only", label: "Apenas a Noiva", time: "2h de beleza" },
  { id: "bride_plus_2", label: "Noiva + 2 Madrinhas", time: "3h de beleza" },
  { id: "bride_plus_4", label: "Noiva + 4 Madrinhas", time: "4h de beleza" },
  { id: "bride_plus_6", label: "Noiva + 6 Madrinhas", time: "5h de beleza" },
];

const CATEGORY_STYLES: Record<
  TimelineMilestoneCategory,
  { badge: string; label: string; border: string }
> = {
  prep: {
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    label: "Preparativos & Beleza",
    border: "border-l-rose-400",
  },
  photo_prep: {
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    label: "Fotografia & Detalhes",
    border: "border-l-purple-400",
  },
  ceremony: {
    badge: "bg-amber-50 text-amber-900 border-amber-300",
    label: "Cerimónia Nupcial",
    border: "border-l-brand-gold",
  },
  cocktail_photos: {
    badge: "bg-orange-50 text-orange-800 border-orange-200",
    label: "Cocktail & Golden Hour",
    border: "border-l-orange-400",
  },
  reception: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    label: "Salão & Banquete",
    border: "border-l-emerald-400",
  },
  protocol: {
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    label: "Protocolo & Brinde",
    border: "border-l-blue-400",
  },
  party: {
    badge: "bg-stone-900 text-amber-300 border-stone-800",
    label: "Pista de Dança & Festa",
    border: "border-l-stone-900",
  },
};

export default function WeddingTimelineGeneratorPage() {
  const [coupleNames, setCoupleNames] = useState("Jéssica & Samuel");
  const [weddingDate, setWeddingDate] = useState("18 de Outubro de 2025");
  const [ceremonyTime, setCeremonyTime] = useState("14:00");
  const [format, setFormat] = useState<WeddingFormat>("afternoon_evening");
  const [bridalPartyCount, setBridalPartyCount] = useState<BridalPartyCount>("bride_plus_4");
  const [locationType, setLocationType] = useState<CeremonyLocationType>("separate_locations");
  const [hasFirstLook, setHasFirstLook] = useState(false);
  const [partyDurationHours, setPartyDurationHours] = useState(6);

  // Custom modified milestones (permite ajustes manuais de tempo em cada marco)
  const [customAdjustments, setCustomAdjustments] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Carregar dados salvos do localStorage se existirem
  useEffect(() => {
    try {
      const stored = localStorage.getItem("haxr_wedding_timeline_input");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.coupleNames) setCoupleNames(parsed.coupleNames);
        if (parsed.weddingDate) setWeddingDate(parsed.weddingDate);
        if (parsed.ceremonyTime) setCeremonyTime(parsed.ceremonyTime);
        if (parsed.format) setFormat(parsed.format);
        if (parsed.bridalPartyCount) setBridalPartyCount(parsed.bridalPartyCount);
        if (parsed.locationType) setLocationType(parsed.locationType);
        if (parsed.hasFirstLook !== undefined) setHasFirstLook(parsed.hasFirstLook);
        if (parsed.partyDurationHours) setPartyDurationHours(parsed.partyDurationHours);
      }
    } catch {
      // Ignorar se storage inacessível
    }
  }, []);

  const timelineInput: TimelineGeneratorInput = useMemo(
    () => ({
      ceremonyTime,
      format,
      bridalPartyCount,
      locationType,
      hasFirstLook,
      partyDurationHours,
      coupleNames,
      weddingDate,
    }),
    [
      ceremonyTime,
      format,
      bridalPartyCount,
      locationType,
      hasFirstLook,
      partyDurationHours,
      coupleNames,
      weddingDate,
    ],
  );

  const baseResult = useMemo(
    () => generateWeddingTimeline(timelineInput),
    [timelineInput],
  );

  // Aplicar ajustes manuais de tempo
  const adjustedMilestones = useMemo(() => {
    return baseResult.milestones
      .map((m) => {
        const adjustment = customAdjustments[m.id] || 0;
        const newMinutes = m.timeMinutes + adjustment;
        return {
          ...m,
          timeMinutes: newMinutes,
          time: minutesToTime(newMinutes),
        };
      })
      .sort((a, b) => a.timeMinutes - b.timeMinutes);
  }, [baseResult.milestones, customAdjustments]);

  const finalResult = useMemo(() => {
    return {
      ...baseResult,
      milestones: adjustedMilestones,
    };
  }, [baseResult, adjustedMilestones]);

  const handleAdjustTime = (milestoneId: string, deltaMinutes: number) => {
    setCustomAdjustments((prev) => ({
      ...prev,
      [milestoneId]: (prev[milestoneId] || 0) + deltaMinutes,
    }));
  };

  const handleResetAdjustments = () => {
    setCustomAdjustments({});
  };

  const handleCopy = () => {
    const text = formatTimelineWhatsAppMessage(finalResult);
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveToLocalStorage = () => {
    try {
      localStorage.setItem("haxr_wedding_timeline_input", JSON.stringify(timelineInput));
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
    formatTimelineWhatsAppMessage(finalResult),
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
            Planeamento Executivo HAXR
          </span>
        </div>

        {/* ── Header Editorial ── */}
        <header className="border-b border-brand-champagne/35 pb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-gold/15 border border-brand-gold/30 px-3 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold">
              Ferramenta de Alta Precisão
            </span>
            <span className="rounded-full bg-stone-900 text-white px-3 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em]">
              Moçambique 2025/2026
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-light text-brand-text-dark leading-tight">
            Gerador de Cronograma do Grande Dia
          </h1>

          <p className="font-sans text-sm sm:text-base font-light text-brand-text-dark/70 max-w-3xl leading-relaxed">
            A ferramenta executiva utilizada pelas noivas mais exigentes e assessoras de topo em
            Moçambique. Calcule a timeline minuto a minuto — desde o despertar e maquilhagem até ao
            corte do bolo e última música na pista de dança.
          </p>
        </header>

        {/* ── Grid Principal: Painel de Parâmetros (Esquerda) + Timeline (Direita) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── COLUNA ESQUERDA: PARÂMETROS E CONTROLOS ── */}
          <div className="lg:col-span-5 space-y-6 no-print">
            <div className="rounded-3xl border border-brand-champagne/45 bg-white p-6 sm:p-7 shadow-[0_12px_40px_rgba(28,26,23,0.04)] space-y-6">
              <div className="flex items-center justify-between border-b border-brand-champagne/25 pb-4">
                <div className="flex items-center gap-2 text-brand-gold">
                  <Clock className="h-4 w-4" />
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]">
                    Parâmetros do Casamento
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleResetAdjustments}
                  className="font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 hover:text-brand-gold transition cursor-pointer"
                  title="Restaurar horários calculados pelo algoritmo"
                >
                  Restaurar Horários
                </button>
              </div>

              {/* 1. Nome dos Noivos e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/65">
                    Nome dos Noivos
                  </span>
                  <input
                    value={coupleNames}
                    onChange={(e) => setCoupleNames(e.target.value)}
                    placeholder="Ex: Vânia & Fabião"
                    className="w-full rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-3.5 py-2.5 text-xs outline-none transition focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/15"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/65">
                    Data do Evento
                  </span>
                  <input
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    placeholder="Ex: 18 de Outubro de 2025"
                    className="w-full rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-3.5 py-2.5 text-xs outline-none transition focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/15"
                  />
                </label>
              </div>

              {/* 2. Horário da Cerimónia Nupcial */}
              <div className="space-y-2">
                <label className="flex items-center justify-between">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                    Horário da Cerimónia Nupcial
                  </span>
                  <span className="font-mono text-xs font-bold text-brand-gold">
                    {ceremonyTime}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["11:00", "13:00", "14:00", "15:00", "15:30", "16:00", "16:30", "17:00"].map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCeremonyTime(t)}
                        className={`py-2 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                          ceremonyTime === t
                            ? "bg-brand-black text-white font-bold shadow-xs"
                            : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/70 hover:border-brand-gold/40 hover:text-brand-gold"
                        }`}
                      >
                        {t}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* 3. Formato do Casamento */}
              <div className="space-y-2.5">
                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                  Formato & Estilo da Celebração
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormat(opt.id)}
                      className={`p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        format === opt.id
                          ? "border border-brand-gold bg-brand-gold/10 text-brand-black shadow-2xs"
                          : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/75 hover:border-brand-gold/40"
                      }`}
                    >
                      <p className="font-serif text-xs font-medium">{opt.label}</p>
                      <p className="font-sans text-[10px] text-brand-text-dark/60 font-light mt-1 leading-tight line-clamp-2">
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Madrinhas a Maquilhar */}
              <div className="space-y-2">
                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                  Cortejo & Preparativos de Beleza
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {BRIDAL_PARTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBridalPartyCount(opt.id)}
                      className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        bridalPartyCount === opt.id
                          ? "bg-brand-black text-white shadow-2xs"
                          : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/70 hover:border-brand-gold/40"
                      }`}
                    >
                      <p className="font-sans text-xs font-medium">{opt.label}</p>
                      <p className="font-mono text-[9px] opacity-75">{opt.time}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Logística de Deslocação */}
              <div className="space-y-2">
                <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/70">
                  Logística de Espaços
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationType("separate_locations")}
                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      locationType === "separate_locations"
                        ? "border border-brand-gold bg-brand-gold/10 font-medium"
                        : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/70 hover:border-brand-gold/40"
                    }`}
                  >
                    <p className="text-xs">Locais Separados</p>
                    <p className="font-mono text-[9px] text-brand-text-dark/50">
                      Igreja + Deslocação
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationType("same_venue")}
                    className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      locationType === "same_venue"
                        ? "border border-brand-gold bg-brand-gold/10 font-medium"
                        : "border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/70 hover:border-brand-gold/40"
                    }`}
                  >
                    <p className="text-xs">Mesmo Espaço</p>
                    <p className="font-mono text-[9px] text-brand-text-dark/50">
                      Quinta / Hotel Único
                    </p>
                  </button>
                </div>
              </div>

              {/* 6. Opções Especiais: First Look & Duração da Festa */}
              <div className="pt-2 border-t border-brand-champagne/25 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="font-sans text-xs font-medium text-brand-text-dark">
                      Incluir First Look (Primeiro Olhar)
                    </span>
                    <p className="text-[10px] text-brand-text-dark/60 font-light">
                      Ensaio fotográfico dos noivos a sós antes da cerimónia
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasFirstLook}
                    onChange={(e) => setHasFirstLook(e.target.checked)}
                    className="h-4 w-4 rounded border-brand-champagne/60 text-brand-gold focus:ring-brand-gold"
                  />
                </label>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-sans text-brand-text-dark/70">
                      Duração da Pista de Dança / DJ:
                    </span>
                    <span className="font-mono font-bold text-brand-gold">
                      {partyDurationHours} horas de festa
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={10}
                    step={1}
                    value={partyDurationHours}
                    onChange={(e) => setPartyDurationHours(Number(e.target.value))}
                    className="w-full accent-brand-gold"
                  />
                </div>
              </div>
            </div>

            {/* Banner de Dicas de Assessoria HAXR */}
            <div className="rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-white to-brand-gold/5 p-5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-brand-gold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                  Dica de Protocolo HAXR
                </span>
              </div>
              <p className="font-sans text-xs text-brand-text-dark/75 font-light leading-relaxed">
                {finalResult.tips[2]}
              </p>
            </div>
          </div>

          {/* ── COLUNA DIREITA: TIMELINE INTERATIVA & EXPORTAÇÕES ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Barra de Ações Rápidas (WhatsApp, PDF, Copiar) */}
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-brand-gold">
                  {finalResult.milestones.length} Marcos Cronológicos
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Botão Copiar */}
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
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>

                {/* Botão Salvar */}
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

                {/* Botão Imprimir / PDF */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-brand-champagne/45 bg-[#faf8f5] hover:bg-white hover:border-brand-gold px-3.5 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-text-dark transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-brand-text-dark/50" />
                  <span>Imprimir / PDF</span>
                </button>

                {/* Botão WhatsApp Principal */}
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Partilhar no WhatsApp</span>
                </a>
              </div>
            </div>

            {/* 2. Barra de Métricas Chave (KPIs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50 block">
                  Despertar & Beleza
                </span>
                <p className="font-serif text-2xl font-light text-brand-text-dark">
                  {finalResult.wakeUpTime}
                </p>
              </div>

              <div className="rounded-2xl border border-brand-gold/40 bg-gradient-to-br from-white to-brand-gold/10 p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold block">
                  Cerimónia Nupcial
                </span>
                <p className="font-serif text-2xl font-medium text-brand-gold">
                  {finalResult.input.ceremonyTime}
                </p>
              </div>

              <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50 block">
                  Corte do Bolo
                </span>
                <p className="font-serif text-2xl font-light text-brand-text-dark">
                  {finalResult.milestones.find((m) => m.title.includes("Corte do Bolo"))?.time ||
                    "21:30"}
                </p>
              </div>

              <div className="rounded-2xl border border-brand-champagne/40 bg-white p-4 text-center space-y-1">
                <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50 block">
                  Última Música
                </span>
                <p className="font-serif text-2xl font-light text-brand-text-dark">
                  {finalResult.partyEndTime}
                </p>
              </div>
            </div>

            {/* 3. Lista Cronológica Interativa */}
            <div className="space-y-3">
              {finalResult.milestones.map((m, index) => {
                const style = CATEGORY_STYLES[m.category];
                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl border border-brand-champagne/40 bg-white p-5 shadow-[0_4px_20px_rgba(28,26,23,0.02)] transition-all hover:border-brand-gold/40 hover:shadow-md border-l-4 ${style.border} ${
                      m.isKeyMilestone ? "ring-1 ring-brand-gold/20" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Horário em destaque */}
                          <span className="font-mono text-base font-bold text-brand-text-dark tracking-tight">
                            {m.time}
                          </span>

                          {/* Categoria */}
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[7px] font-bold uppercase tracking-wider border ${style.badge}`}
                          >
                            {style.label}
                          </span>

                          {m.isKeyMilestone && (
                            <span className="rounded-full bg-brand-gold text-brand-black px-2 py-0.5 font-mono text-[7px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Crown className="h-2.5 w-2.5" />
                              <span>Momento Chave</span>
                            </span>
                          )}
                        </div>

                        {/* Título */}
                        <h3 className="font-serif text-base font-medium text-brand-text-dark">
                          {m.title}
                        </h3>

                        {/* Descrição */}
                        <p className="font-sans text-xs font-light text-brand-text-dark/75 leading-relaxed">
                          {m.description}
                        </p>

                        {/* Responsáveis */}
                        <div className="flex flex-wrap items-center gap-1 pt-1.5">
                          <span className="font-mono text-[7px] text-brand-text-dark/45 uppercase tracking-wider mr-1">
                            Intervenientes:
                          </span>
                          {m.responsibleParties.map((party, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-[#faf8f5] border border-brand-champagne/40 px-2 py-0.5 font-mono text-[8px] text-brand-text-dark/70"
                            >
                              {party}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Ajustadores de tempo (+/- 15min) */}
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-start no-print pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleAdjustTime(m.id, -15)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 hover:bg-white hover:border-brand-gold hover:text-brand-gold transition cursor-pointer"
                          title="Adiantar 15 minutos"
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAdjustTime(m.id, 15)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-champagne/40 bg-[#faf8f5] text-brand-text-dark/60 hover:bg-white hover:border-brand-gold hover:text-brand-gold transition cursor-pointer"
                          title="Atrasar 15 minutos"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé da Timeline */}
            <div className="rounded-2xl border border-brand-champagne/45 bg-white p-6 text-center space-y-3 shadow-sm no-print">
              <h4 className="font-serif text-lg font-medium text-brand-text-dark">
                Precisa de uma Assessora Profissional para Coordenar o Dia?
              </h4>
              <p className="text-xs font-light text-brand-text-dark/65 max-w-lg mx-auto leading-relaxed">
                Descubra as melhores empresas de assessoria e coordenação de casamentos de Moçambique
                no Directório Oficial da HAXR.
              </p>
              <div className="pt-1">
                <Link
                  href="/fornecedores?category=planning"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-black hover:bg-brand-gold px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-white transition-colors shadow-xs"
                >
                  <span>Ver Assessoras Aprovadas HAXR</span>
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
