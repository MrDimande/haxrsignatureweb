"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Upload,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Users,
  Wallet,
  ListChecks,
  Palette,
  Briefcase,
  Smartphone,
  CheckCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import StructuredData from "@/components/seo/StructuredData";
import { homeConciergeSection } from "@/lib/marketing/home-content";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { CTABand } from "@/components/marketing/PageHero";

type ProcessStep = "idle" | "reading" | "classifying" | "validating" | "success";

const moduleIcons = {
  vendors: Briefcase,
  guests: Users,
  budget: Wallet,
  moodboard: Palette,
  checklist: ListChecks,
} as const;

export default function HaxrConciergeSetupPage() {
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<ProcessStep>("idle");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [activeScenario, setActiveScenario] = useState<"catering" | "mpesa">("catering");

  // Auto alternation for the iPad mock review queue
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScenario((prev) => (prev === "catering" ? "mpesa" : "catering"));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("concierge@haxrsignature.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simulateProcessing = (name: string, size: string) => {
    setFileName(name);
    setFileSize(size);
    setUploadState("reading");
    setLogs([
      "[1/4] A iniciar leitura digital...",
      "Extração OCR em progresso...",
    ]);

    setTimeout(() => {
      setUploadState("classifying");
      setLogs((prev) => [
        ...prev,
        "[2/4] Classificação inteligente de campos...",
        `Ficheiro reconhecido: ${name.endsWith(".png") || name.endsWith(".jpg") ? "Imagem de Recibo" : "Proposta de Orçamento"}`,
        `Extraído: ${name.includes("M-Pesa") || name.includes("mpesa") ? "Sinal sem fornecedor associado - 42.500 MT" : "Proposta sem fornecedor associado - 446.600 MT"}`,
      ]);

      setTimeout(() => {
        setUploadState("validating");
        setLogs((prev) => [
          ...prev,
          "[3/4] Fila de aprovação HAXR Signature...",
          "A aguardar validação de assessoria...",
        ]);

        setTimeout(() => {
          setUploadState("success");
          setLogs((prev) => [
            ...prev,
            "[4/4] Submissão validada e gravada.",
            "Dados consolidados no painel de casamento.",
          ]);
        }, 1800);
      }, 1800);
    }, 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      simulateProcessing(file.name, `${sizeMB} MB`);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      simulateProcessing(file.name, `${sizeMB} MB`);
    }
  };

  return (
    <>
      <StructuredData page="plataforma" />

      {/* Hero Section Split Vogue Style */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-[#FCFBF9] overflow-hidden border-b border-brand-champagne/15 text-left">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 75% 30%, rgba(184,138,42,0.12), transparent)"
          }}
        />

        <div className="site-container-wide mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

            {/* Left Column: Headline and description */}
            <div className="lg:col-span-6 space-y-8">
              <RevealOnScroll className="space-y-4">
                <div className="flex items-center gap-2.5 text-brand-gold">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                  </svg>
                  <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">HAXR Concierge™</span>
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-brand-text-dark leading-tight">
                  O vosso plano de casamento, organizado instantaneamente por IA.
                </h1>

                <p className="font-sans text-sm sm:text-base text-brand-text-dark/70 leading-relaxed font-light max-w-xl">
                  Reencaminhe propostas de fornecedores, envie capturas de ecrã do M-Pesa ou carregue listas de convidados por email ou WhatsApp. A IA da HAXR lê, processa e organiza tudo no painel, sob validação dos nossos assessores.
                </p>
              </RevealOnScroll>

              <RevealOnScroll className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="#upload-demo"
                  className="bg-brand-gold hover:bg-brand-gold-light text-brand-black font-mono text-[10px] tracking-widest uppercase font-bold py-4.5 px-8 rounded-sm shadow-md transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Testar com um Ficheiro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="#como-funciona"
                  className="font-sans text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-text-dark hover:text-brand-gold border border-brand-text-dark/25 px-8 py-4.5 hover:border-brand-gold transition-colors whitespace-nowrap inline-flex items-center justify-center"
                >
                  Ver Como Funciona
                </a>
              </RevealOnScroll>
            </div>

            {/* Right Column: Breathtaking Interactive Phone & Floating Card Showcase */}
            <div className="lg:col-span-6 relative flex justify-center">

              {/* Main Phone Simulator Container */}
              <div className="relative w-[280px] sm:w-[320px] aspect-[9/18.5] bg-zinc-950 rounded-[42px] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.35)] border border-white/10 shrink-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-10 h-1 bg-zinc-800 rounded-full" />
                </div>

                <div className="w-full h-full bg-[#FCFBF9] rounded-[34px] overflow-hidden border border-zinc-900 flex flex-col relative text-left">

                  {/* Phone Mock Status Bar */}
                  <div className="h-10 px-6 flex items-center justify-between text-brand-text-dark/60 font-mono text-[8px] tracking-wider select-none shrink-0 border-b border-brand-champagne/15 bg-white">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>HAXR AI</span>
                    </div>
                  </div>

                  {/* Phone Body / Chat Sim */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs bg-[#f4f2ee]/40 relative">

                    <div className="p-3 bg-white rounded-2xl border border-brand-champagne/30 space-y-2">
                      <div className="flex items-center justify-between text-[8px] font-mono tracking-wider text-brand-gold font-bold">
                        <span>DOCUMENTO RECEBIDO</span>
                        <span>M-PESA</span>
                      </div>
                      <p className="font-serif text-[11px] font-light text-brand-text-dark">
                        Sinal de decoração — fornecedor não associado
                      </p>
                      <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-brand-gold"
                          animate={{ width: ["0%", "100%"] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-brand-black text-white rounded-2xl border border-brand-gold/20 space-y-1 text-[9px] font-mono leading-relaxed">
                      <p className="text-brand-gold">✦ EXTRAÇÃO HAXR AI:</p>
                      <p className="text-white/80">• Beneficiário: por associar</p>
                      <p className="text-white/80">• Valor: 42.500 MT</p>
                      <p className="text-white/80">• Estado: Aguarda Revisão Humana</p>
                    </div>

                    <div className="p-3 bg-white rounded-2xl border border-brand-champagne/30 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-mono text-[8px] text-brand-gold font-bold">REVISÃO CONCLUÍDA</p>
                        <p className="text-[10px] text-brand-text-dark/80">Validado por Assessor HAXR</p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Floating validation overlay card */}
                <motion.div
                  className="absolute -right-8 bottom-24 bg-white/90 backdrop-blur-md border border-brand-gold/45 p-4 rounded-xl shadow-[0_12px_24px_rgba(184,138,42,0.18)] flex items-center gap-3.5 z-30 max-w-[200px]"
                  animate={{
                    y: [0, -8, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="bg-brand-gold text-brand-black p-2 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="font-mono text-[8px] tracking-wider text-brand-gold font-bold">LIDO PELA IA</p>
                    <p className="font-serif text-[11px] font-medium text-brand-text-dark">Aprovado ✦</p>
                  </div>
                </motion.div>

                {/* Floating backup check card */}
                <motion.div
                  className="absolute -left-12 top-24 bg-brand-black border border-white/10 p-3.5 rounded-xl shadow-2xl flex items-center gap-3 z-30"
                  animate={{
                    y: [0, 8, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.5
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-brand-gold shrink-0">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left font-mono text-[8px] tracking-widest text-zinc-400">
                    <p className="text-white font-serif tracking-normal text-[10px] mb-0.5">Inbox Ativa</p>
                    <p>M-PESA / WA</p>
                  </div>
                </motion.div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Save It. Sort It. Plan It. (Vogue Style Radial Layout) */}
      <section className="relative py-28 bg-[#FAF8F5] overflow-hidden border-b border-brand-champagne/15 text-left">
        <div className="site-container-wide mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

            {/* Left description */}
            <div className="lg:col-span-5 space-y-6">
              <RevealOnScroll className="space-y-4">
                <div className="flex items-center gap-2.5 text-brand-gold">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                  </svg>
                  <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">Organização</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-tight">
                  Guarde. Organize.<br />Planeie.
                </h2>
                <p className="font-sans text-xs md:text-sm text-brand-text-dark/70 leading-relaxed font-light">
                  Esqueça a gestão dispersa de emails e mensagens do WhatsApp. Encaminhe propostas, facturas ou comprovativos. O Concierge lê, classifica e organiza tudo, sem associar fornecedores até existir validação.
                </p>
              </RevealOnScroll>
              <RevealOnScroll className="pt-2">
                <a
                  href="#upload-demo"
                  className="inline-flex items-center gap-2.5 font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold hover:text-brand-gold-light font-semibold transition-colors duration-300"
                >
                  <span>Testar com ficheiro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </RevealOnScroll>
            </div>

            {/* Right: Gorgeous Diagram connected with gold lines */}
            <div className="lg:col-span-7 flex justify-center relative py-12">
              <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center select-none">

                {/* Connecting gold SVG lines */}
                <svg className="absolute inset-0 w-full h-full text-brand-gold/30 pointer-events-none" viewBox="0 0 400 400" fill="none">
                  {/* Center circle at 200,200 */}
                  <line x1="200" y1="200" x2="60" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="200" y1="200" x2="340" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="200" y1="200" x2="60" y2="280" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="200" y1="200" x2="340" y2="280" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="200" y1="200" x2="200" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {/* Center Phone Screen */}
                <div className="relative w-[150px] aspect-[9/18.5] bg-zinc-950 rounded-[28px] p-1.5 shadow-2xl border border-white/10 z-10 shrink-0">
                  <div className="w-full h-full bg-white rounded-[24px] overflow-hidden flex flex-col relative">
                    <div className="h-5 px-3 flex items-center justify-between text-brand-text-dark/40 font-mono text-[5px] shrink-0 border-b border-brand-champagne/15 bg-white">
                      <span>9:41</span>
                    </div>
                    <div className="flex-1 p-2 bg-[#FAF8F5] flex flex-col items-center justify-center text-center">
                      <div className="w-6 h-6 rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-gold mb-1">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <p className="font-serif text-[7px] font-bold text-brand-text-dark">Concierge Ativo</p>
                      <p className="font-sans text-[5px] text-brand-text-dark/50 mt-0.5">Atualização imediata</p>
                    </div>
                  </div>
                </div>

                {/* Satellite Module 1: Fornecedores (Top) */}
                <div className="absolute top-[20px] left-[170px] bg-white border border-brand-champagne/45 p-3 rounded-full shadow-lg z-20 hover:border-brand-gold transition-colors duration-500 flex flex-col items-center justify-center w-16 h-16">
                  <Briefcase className="w-4.5 h-4.5 text-brand-gold mb-0.5" />
                  <span className="font-mono text-[6px] tracking-wider uppercase text-zinc-400 font-bold">Fornece.</span>
                </div>

                {/* Satellite Module 2: Convidados (Top Right) */}
                <div className="absolute top-[90px] right-[20px] bg-white border border-brand-champagne/45 p-3 rounded-full shadow-lg z-20 hover:border-brand-gold transition-colors duration-500 flex flex-col items-center justify-center w-16 h-16">
                  <Users className="w-4.5 h-4.5 text-brand-gold mb-0.5" />
                  <span className="font-mono text-[6px] tracking-wider uppercase text-zinc-400 font-bold">Convida.</span>
                </div>

                {/* Satellite Module 3: Orçamento (Bottom Right) */}
                <div className="absolute bottom-[90px] right-[20px] bg-white border border-brand-champagne/45 p-3 rounded-full shadow-lg z-20 hover:border-brand-gold transition-colors duration-500 flex flex-col items-center justify-center w-16 h-16">
                  <Wallet className="w-4.5 h-4.5 text-brand-gold mb-0.5" />
                  <span className="font-mono text-[6px] tracking-wider uppercase text-zinc-400 font-bold">Orçam.</span>
                </div>

                {/* Satellite Module 4: Moodboard (Bottom Left) */}
                <div className="absolute bottom-[90px] left-[20px] bg-white border border-brand-champagne/45 p-3 rounded-full shadow-lg z-20 hover:border-brand-gold transition-colors duration-500 flex flex-col items-center justify-center w-16 h-16">
                  <Palette className="w-4.5 h-4.5 text-brand-gold mb-0.5" />
                  <span className="font-mono text-[6px] tracking-wider uppercase text-zinc-400 font-bold">Moodb.</span>
                </div>

                {/* Satellite Module 5: Checklist (Top Left) */}
                <div className="absolute top-[90px] left-[20px] bg-white border border-brand-champagne/45 p-3 rounded-full shadow-lg z-20 hover:border-brand-gold transition-colors duration-500 flex flex-col items-center justify-center w-16 h-16">
                  <ListChecks className="w-4.5 h-4.5 text-brand-gold mb-0.5" />
                  <span className="font-mono text-[6px] tracking-wider uppercase text-zinc-400 font-bold">Checkl.</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* An AI That Organizes It All (iPad / Tablet Simulation with real Moçambique values) */}
      <section className="relative py-28 bg-[#FCFBF9] overflow-hidden border-b border-brand-champagne/15 text-left">
        <div className="site-container-wide mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">

            {/* Left Column: iPad Mockup Screen with animation */}
            <div className="lg:col-span-7 flex justify-center">

              {/* Glassmorphic iPad frame */}
              <div className="w-full max-w-[580px] aspect-[4/3] bg-zinc-950 rounded-2xl p-4 shadow-[0_28px_60px_rgba(0,0,0,0.3)] border border-white/10 shrink-0">
                <div className="w-full h-full bg-[#FAF8F5] rounded-lg overflow-hidden border border-zinc-900 flex flex-col">

                  {/* iPad Mock Header */}
                  <div className="bg-white border-b border-brand-champagne/20 px-5 py-3.5 flex items-center justify-between shrink-0 select-none">
                    <span className="font-serif text-xs font-bold text-brand-text-dark">HAXR AI · Fila de Validação</span>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-200" />
                      <span className="w-2 h-2 rounded-full bg-zinc-200" />
                      <span className="w-2 h-2 rounded-full bg-brand-gold/60" />
                    </div>
                  </div>

                  {/* iPad content area */}
                  <div className="flex-1 p-5 overflow-auto text-left font-sans text-[10px] md:text-xs">

                    {/* Simulated validation table */}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-brand-champagne/30 text-zinc-400 text-[8px] font-mono tracking-widest uppercase">
                          <th className="py-2.5 text-left font-normal">Ficheiro</th>
                          <th className="py-2.5 text-left font-normal">Tipo</th>
                          <th className="py-2.5 text-right font-normal">Valor</th>
                          <th className="py-2.5 text-center font-normal">Estado</th>
                          <th className="py-2.5 text-right font-normal">Ação</th>
                        </tr>
                      </thead>
                      <tbody>

                        {/* Row 1 */}
                        <tr className="border-b border-brand-champagne/15">
                          <td className="py-3 font-medium text-brand-text-dark">Proposta_Sem_Fornecedor.pdf</td>
                          <td className="py-3 text-zinc-500">Proposta</td>
                          <td className="py-3 text-right font-serif font-bold text-brand-text-dark">580.000 MT</td>
                          <td className="py-3 text-center">
                            <span className="bg-brand-gold/15 text-brand-gold text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Por Rever
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button className="bg-brand-black text-white hover:bg-brand-gold font-mono text-[7px] tracking-wider uppercase font-bold py-1 px-2.5 rounded-xs cursor-pointer">
                              Rever
                            </button>
                          </td>
                        </tr>

                        {/* Row 2 */}
                        <tr className="border-b border-brand-champagne/15">
                          <td className="py-3 font-medium text-brand-text-dark">Sinal_Decoracao_Mpesa.png</td>
                          <td className="py-3 text-zinc-500">Recibo</td>
                          <td className="py-3 text-right font-serif font-bold text-brand-text-dark">42.500 MT</td>
                          <td className="py-3 text-center">
                            <span className="bg-green-100 text-green-700 text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Aprovado
                            </span>
                          </td>
                          <td className="py-3 text-right text-green-600 font-bold">
                            ✓ Gravado
                          </td>
                        </tr>

                        {/* Row 3 */}
                        <tr className="border-b border-brand-champagne/15">
                          <td className="py-3 font-medium text-brand-text-dark">Lista_Convidados_Vania.xlsx</td>
                          <td className="py-3 text-zinc-500">Convidados</td>
                          <td className="py-3 text-right font-serif font-bold text-brand-text-dark">180 Nomes</td>
                          <td className="py-3 text-center">
                            <span className="bg-brand-gold/15 text-brand-gold text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Por Rever
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button className="bg-brand-black text-white hover:bg-brand-gold font-mono text-[7px] tracking-wider uppercase font-bold py-1 px-2.5 rounded-xs cursor-pointer">
                              Rever
                            </button>
                          </td>
                        </tr>

                      </tbody>
                    </table>

                    {/* Active Review Box Simulator */}
                    <AnimatePresence mode="wait">
                      {activeScenario === "catering" ? (
                        <motion.div
                          key="catering"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-6 p-4 bg-white border border-brand-gold/30 rounded-xl shadow-xs space-y-2.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[7px] tracking-wider text-brand-gold font-bold">REVISÃO MANUAL RECOMENDADA</span>
                            <span className="text-[7px] text-zinc-400">Pela Equipa HAXR</span>
                          </div>
                          <p className="font-sans text-[10px] text-brand-text-dark/80 leading-relaxed font-light">
                            IA detectou uma proposta para <strong>180 convidados</strong>. Confirme primeiro o fornecedor antes de registar o sinal no módulo financeiro.
                          </p>
                          <div className="flex gap-2 justify-end">
                            <button className="border border-brand-champagne px-3 py-1 font-mono text-[7px] tracking-wider uppercase rounded-xs cursor-pointer text-brand-text-dark hover:bg-zinc-50">
                              Corrigir
                            </button>
                            <button className="bg-brand-gold text-brand-black px-3 py-1 font-mono text-[7px] tracking-wider uppercase font-bold rounded-xs cursor-pointer hover:bg-brand-gold-light">
                              Aprovar e Sincronizar
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="mpesa"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-6 p-4 bg-zinc-950 text-white rounded-xl shadow-xs space-y-2.5"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-[7px] tracking-wider text-brand-gold font-bold">CONFIRMAÇÃO M-PESA</span>
                            <span className="text-[7px] text-zinc-400">ID: MP260612847391</span>
                          </div>
                          <p className="font-sans text-[10px] text-white/80 leading-relaxed font-light">
                            Recibo M-Pesa de <strong>42.500 MT</strong> extraído. Aguarda validação e associação manual a um fornecedor real.
                          </p>
                          <div className="flex gap-2 justify-end">
                            <button className="bg-brand-gold text-brand-black px-3 py-1 font-mono text-[7px] tracking-wider uppercase font-bold rounded-xs cursor-pointer hover:bg-brand-gold-light">
                              Lançar no Fluxo Caixa
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                </div>
              </div>

            </div>

            {/* Right Column: Description */}
            <div className="lg:col-span-5 space-y-6">
              <RevealOnScroll className="space-y-4">
                <div className="flex items-center gap-2.5 text-brand-gold">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                    <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                  </svg>
                  <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">IA + Validação Humana</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-text-dark leading-tight">
                  Uma inteligência que organiza tudo instantaneamente.
                </h2>
                <p className="font-sans text-xs md:text-sm text-brand-text-dark/70 leading-relaxed font-light">
                  Enquanto noutras plataformas a Inteligência Artificial insere dados diretamente sem controlo, a HAXR Signature exige perfeição. Os vossos ficheiros passam pela IA para extração ágil de valores e nomes, mas nada entra no vosso painel de casamento sem a verificação humana de um assessor especialista. Evitamos nomes duplicados, erros de câmbio ou valores incorretos.
                </p>
              </RevealOnScroll>
              <RevealOnScroll className="pt-2">
                <a
                  href="#upload-demo"
                  className="bg-brand-black hover:bg-brand-gold text-white hover:text-brand-black font-mono text-[9px] tracking-widest uppercase font-bold py-4 px-6 rounded-sm transition-colors duration-500 inline-block cursor-pointer"
                >
                  Testar Demonstração
                </a>
              </RevealOnScroll>
            </div>

          </div>
        </div>
      </section>

      {/* 3 Channels Section: Forward, Upload, Chat (Vogue Columns Style) */}
      <section className="relative py-28 bg-[#FAF8F5] border-b border-brand-champagne/15 text-left">
        <div className="site-container-wide mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">

            {/* Col 1 */}
            <RevealOnScroll className="space-y-4 pt-6 border-t border-brand-champagne/45 hover:border-brand-gold transition-colors duration-500">
              <div className="w-9 h-9 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-2">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-lg font-light text-brand-text-dark">
                Reencaminhar por E-mail
              </h3>
              <p className="font-sans text-xs text-brand-text-dark/65 leading-relaxed font-light">
                Recebeu um orçamento ou PDF de fornecedor? Reencaminhe para o endereço Concierge do vosso evento. A IA lê e envia para validação de forma autónoma.
              </p>
              <div className="flex items-center justify-between bg-white border border-brand-champagne/30 px-3.5 py-2.5 rounded-sm font-mono text-[10px] w-full">
                <span className="text-brand-text-dark/85 font-semibold">concierge@haxrsignature.com</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="text-brand-gold hover:text-brand-gold-light flex items-center gap-1 cursor-pointer font-bold uppercase text-[8px] tracking-wider"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </RevealOnScroll>

            {/* Col 2 */}
            <RevealOnScroll className="space-y-4 pt-6 border-t border-brand-champagne/45 hover:border-brand-gold transition-colors duration-500">
              <div className="w-9 h-9 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-2">
                <Send className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-lg font-light text-brand-text-dark">
                Enviar via WhatsApp
              </h3>
              <p className="font-sans text-xs text-brand-text-dark/65 leading-relaxed font-light">
                Comprovativos de pagamento rápidos do lobolo, sinalizações no M-Pesa ou fotografias de contratos. Envie directamente via chat no telemóvel em segundos.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/258820883428?text=Olá%20HAXR%20Concierge,%20gostaria%20de%20registar%20um%20documento."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-gold hover:text-brand-gold-light font-bold"
                >
                  <span>Iniciar Chat WA</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </RevealOnScroll>

            {/* Col 3 */}
            <RevealOnScroll className="space-y-4 pt-6 border-t border-brand-champagne/45 hover:border-brand-gold transition-colors duration-500">
              <div className="w-9 h-9 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-2">
                <Upload className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-serif text-lg font-light text-brand-text-dark">
                Carregamento no Portal
              </h3>
              <p className="font-sans text-xs text-brand-text-dark/65 leading-relaxed font-light">
                Arraste folhas de orçamento completas, tabelas Excel ou imagens directamente na caixa de entrada do vosso painel exclusivo de casamento.
              </p>
              <div className="pt-2">
                <a
                  href="#upload-demo"
                  className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] uppercase text-brand-gold hover:text-brand-gold-light font-bold"
                >
                  <span>Testar Simulador</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* How haxr Concierge Works (Timeline Dark Section) */}
      <section id="como-funciona" className="relative py-28 md:py-36 bg-black-soft scroll-mt-20 border-b border-white/5 text-left">
        <div className="site-container-wide mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <RevealOnScroll className="space-y-3">
              <div className="flex items-center justify-center gap-2.5 text-brand-gold">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                </svg>
                <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">O Método</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight">
                Como Funciona o HAXR Concierge™
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-ivory/60 leading-relaxed font-light">
                Cada documento segue um fluxo linear e auditável de 4 fases para garantir integridade absoluta de cada informação do vosso casamento.
              </p>
            </RevealOnScroll>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 items-stretch">
            {homeConciergeSection.steps.map((step, i) => (
              <RevealOnScroll key={step.num} delay={i * 0.08} className="h-full flex flex-col justify-between">
                <li className="pt-8 border-t border-white/10 flex flex-col justify-between h-full group hover:border-brand-gold transition-colors duration-500">
                  <div>
                    {/* Step Number in Serif gold */}
                    <div className="flex items-baseline justify-between mb-5">
                      <span className="font-serif text-4xl font-light text-brand-gold/60 group-hover:text-brand-gold transition-colors duration-500">
                        {step.num}.
                      </span>
                      <span className="font-mono text-[8px] tracking-[0.25em] uppercase text-zinc-500">
                        Etapa
                      </span>
                    </div>

                    <h3 className="font-serif text-xs font-semibold tracking-[0.2em] uppercase text-white mb-4">
                      {step.title}
                    </h3>
                    <p className="font-sans text-xs text-brand-ivory/70 leading-relaxed font-light">
                      {step.description}
                    </p>
                  </div>
                </li>
              </RevealOnScroll>
            ))}
          </ol>

        </div>
      </section>

      {/* Seamless Integration Section */}
      <section className="relative py-28 bg-[#FCFBF9] border-b border-brand-champagne/15 text-left">
        <div className="site-container-wide mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <RevealOnScroll className="space-y-3">
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark leading-tight">
                Sincronização Segura Entre Módulos
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-text-dark/65 leading-relaxed font-light">
                Cada tipo de informação extraída e validada flui automaticamente para o módulo certo do vosso painel digital.
              </p>
            </RevealOnScroll>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {homeConciergeSection.integrationTools.map((tool, i) => {
              const Icon = moduleIcons[tool.id as keyof typeof moduleIcons] ?? Briefcase;
              return (
                <RevealOnScroll key={tool.id} delay={i * 0.05} className="h-full">
                  <article className="p-8 bg-white border border-brand-champagne/45 rounded-sm hover:border-brand-gold/60 transition-colors duration-500 flex flex-col justify-between h-full group">
                    <div>
                      <div className="w-9 h-9 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-6 shrink-0">
                        <Icon className="w-4.5 h-4.5" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-serif text-lg font-light text-brand-text-dark mb-3">
                        {tool.title}
                      </h3>
                      <p className="font-sans text-xs text-brand-text-dark/65 leading-relaxed font-light">
                        {tool.description}
                      </p>
                    </div>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>

        </div>
      </section>

      {/* Upload Drag & Drop Live Simulator Zone */}
      <section id="upload-demo" className="relative py-28 bg-[#FAF8F5] border-b border-brand-champagne/15 text-left scroll-mt-20">
        <div className="site-container mx-auto max-w-3xl">

          <RevealOnScroll className="space-y-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2.5 text-brand-gold mb-3">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                </svg>
                <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">Demonstração</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark leading-tight">
                Experimente o Motor de IA
              </h2>
              <p className="font-sans text-xs sm:text-sm text-brand-text-dark/65 max-w-xl mx-auto leading-relaxed">
                Arraste um PDF de orçamento ou um ficheiro Excel. Veja como a IA lê os dados e os prepara para validação.
              </p>
            </div>

            <div className="bg-white border border-brand-champagne/60 rounded-3xl p-6 md:p-10 shadow-lg space-y-6">

              {uploadState === "idle" && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 relative cursor-pointer ${
                    dragActive
                      ? "border-brand-gold bg-brand-gold/5"
                      : "border-brand-champagne hover:border-brand-gold/50 bg-[#FCFBF9]"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-main"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.docx"
                  />
                  <div className="space-y-4 pointer-events-none">
                    <div className="mx-auto w-12 h-12 rounded-full bg-brand-champagne/20 flex items-center justify-center text-brand-gold">
                      <Upload className="w-5.5 h-5.5" />
                    </div>
                    <p className="font-sans text-xs md:text-sm text-brand-text-dark/80">
                      Arraste o vosso documento aqui ou <span className="text-brand-gold font-bold underline">procure no computador</span>
                    </p>
                    <p className="font-sans text-[10px] text-zinc-400 font-light">
                      PDF, Excel, Word ou Imagem (Máx. 10 MB)
                    </p>
                  </div>
                </div>
              )}

              {uploadState !== "idle" && (
                <div className="bg-brand-black text-white p-6 rounded-2xl font-mono text-[11px] sm:text-xs leading-relaxed space-y-5 shadow-inner relative overflow-hidden text-left border border-white/5">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(184,138,42,0.15),transparent)] animate-pulse" />

                  <div className="flex justify-between items-center border-b border-white/10 pb-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping" />
                      <span className="font-bold text-brand-gold">MOTOR HAXR AI</span>
                    </div>
                    <span className="text-white/40">
                      {fileName} ({fileSize})
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[200px] overflow-y-auto relative z-10 select-text">
                    {logs.map((log, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={log.startsWith("[") ? "text-brand-gold font-bold" : "text-white/80"}
                      >
                        {log}
                      </motion.p>
                    ))}
                  </div>

                  {uploadState !== "success" && (
                    <div className="flex items-center gap-2 text-brand-gold/75 pt-3 border-t border-white/10 relative z-10 select-none">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Processamento em curso...</span>
                    </div>
                  )}

                  {uploadState === "success" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-green-400 pt-3 border-t border-white/10 font-bold relative z-10 select-none">
                      <span className="flex items-center gap-1.5">
                        ✓ Ficheiro processado e enviado para validação HAXR.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadState("idle");
                          setLogs([]);
                        }}
                        className="text-brand-gold hover:underline text-[9px] uppercase tracking-widest font-mono font-bold"
                      >
                        Carregar Outro
                      </button>
                    </div>
                  )}
                </div>
              )}

              <p className="font-sans text-[10px] text-zinc-400 leading-relaxed text-center font-light">
                Esta é uma demonstração visual do motor de inteligência artificial da HAXR. O fluxo real com sincronização automática e validação por consultores HAXR é ativado exclusivamente no vosso painel de eventos real.
              </p>
            </div>
          </RevealOnScroll>

        </div>
      </section>

      {/* Elegant Footer CTA Band */}
      <CTABand
        headline="Pronto para simplificar a organização?"
        description="Fale connosco hoje e ative o HAXR Concierge para o vosso casamento."
        primaryHref="#upload-demo"
        primaryLabel={homeConciergeSection.setupCtaLabel}
        secondaryHref={homeConciergeSection.projectCtaHref}
        secondaryLabel={homeConciergeSection.projectCtaLabel}
      />
    </>
  );
}
