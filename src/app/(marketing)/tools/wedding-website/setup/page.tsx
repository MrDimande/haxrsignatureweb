"use client";

import { useState } from "react";
import {
  Globe, Sparkles, MessageCircle, ArrowLeft,
  Smartphone, Monitor, Check
} from "lucide-react";
import Link from "next/link";

interface WebsiteConfig {
  partner1: string;
  partner2: string;
  date: string;
  location: string;
  story: string;
  template: "marfim" | "tropical" | "minimalist";
}

export default function WeddingWebsiteSetupPage() {
  const [config, setConfig] = useState<WebsiteConfig>({
    partner1: "Sofia",
    partner2: "Alberto",
    date: "2026-10-18",
    location: "Maputo, Moçambique",
    story: "Nossa história começou nas margens do Índico e agora damos o passo mais importante das nossas vidas. Venha celebrar connosco!",
    template: "marfim",
  });

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaved, setIsSaved] = useState(false);

  const handleInputChange = (field: keyof WebsiteConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("haxr_wedding_website_config", JSON.stringify(config));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Get preview styling classes based on selected template
  const getTemplateStyles = () => {
    switch (config.template) {
      case "tropical":
        return {
          bg: "bg-[#F4F9F4] text-[#2F5233]",
          heroBg: "bg-emerald-800 text-white",
          fontSerif: "font-serif",
          accentColor: "text-[#2F5233] border-[#2F5233]",
          navBg: "bg-white/95 border-emerald-800/10",
        };
      case "minimalist":
        return {
          bg: "bg-white text-zinc-900",
          heroBg: "bg-zinc-900 text-white",
          fontSerif: "font-sans font-light tracking-wide",
          accentColor: "text-zinc-900 border-zinc-900",
          navBg: "bg-white/90 border-zinc-200",
        };
      case "marfim":
      default:
        return {
          bg: "bg-[#F7F1E8] text-[#1C1A17]",
          heroBg: "bg-[#080706] text-[#F7F1E8]",
          fontSerif: "font-serif",
          accentColor: "text-[#B88A2A] border-[#B88A2A]",
          navBg: "bg-[#F7F1E8]/90 border-brand-champagne/30",
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <main className="relative min-h-screen py-24 bg-brand-ivory text-brand-text-dark">
      <div className="site-container-wide mx-auto px-4">

        {/* Back Link */}
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/50 hover:text-brand-text-dark mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel</span>
        </Link>

        {/* Header */}
        <div className="max-w-4xl mb-12">
          <div className="flex items-center gap-2 text-brand-gold mb-3">
            <Globe className="w-4 h-4" />
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold">Ferramentas de Planeamento</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-light leading-tight">
            Criador de Website de Casamento
          </h1>
          <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light mt-2 max-w-2xl">
            Configure a vossa presença digital e convite online com um design editorial refinado. Edite as informações abaixo para ver a atualização em tempo real no simulador.
          </p>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* Left Column: Form Setup */}
          <form onSubmit={handleSave} className="xl:col-span-5 bg-white border border-brand-champagne/45 p-6 md:p-8 rounded-sm shadow-sm space-y-6">
            <h3 className="font-serif text-base font-light border-b border-brand-champagne/25 pb-3">
              Informações do Site
            </h3>

            {/* Names Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Parceiro(a) 1
                </label>
                <input
                  type="text"
                  required
                  value={config.partner1}
                  onChange={(e) => handleInputChange("partner1", e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Parceiro(a) 2
                </label>
                <input
                  type="text"
                  required
                  value={config.partner2}
                  onChange={(e) => handleInputChange("partner2", e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>
            </div>

            {/* Date and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Data do Evento
                </label>
                <input
                  type="date"
                  required
                  value={config.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>
              <div>
                <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                  Localização
                </label>
                <input
                  type="text"
                  required
                  value={config.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans"
                />
              </div>
            </div>

            {/* Message to Guests */}
            <div>
              <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                Nossa Mensagem / Biografia
              </label>
              <textarea
                required
                value={config.story}
                onChange={(e) => handleInputChange("story", e.target.value)}
                rows={4}
                className="w-full bg-brand-ivory/50 border border-brand-champagne/70 focus:border-brand-gold text-xs p-3 rounded-sm outline-none font-sans resize-none"
              />
            </div>

            {/* Template Selector */}
            <div className="space-y-3">
              <label className="block font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/45 mb-1.5">
                Escolha o Tema Editorial
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "marfim", label: "Marfim Clássico", preview: "bg-[#F7F1E8] border-brand-champagne" },
                  { id: "tropical", label: "Tropical Chic", preview: "bg-[#F4F9F4] border-emerald-800/30" },
                  { id: "minimalist", label: "Minimalist Modern", preview: "bg-white border-zinc-200" },
                ].map((temp) => (
                  <button
                    key={temp.id}
                    type="button"
                    onClick={() => handleInputChange("template", temp.id as "marfim" | "tropical" | "minimalist")}
                    className={`p-3 border rounded-sm text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                      config.template === temp.id
                        ? "border-brand-gold ring-1 ring-brand-gold shadow-xs"
                        : "border-brand-champagne/45 bg-[#fcfcfc] hover:border-brand-gold/60"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full border ${temp.preview} shrink-0 mb-3`} />
                    <span className="font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/80">{temp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] tracking-widest uppercase font-bold py-4 rounded-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Configuração Gravada</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Publicar Rascunho</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Live Web Simulator */}
          <div className="xl:col-span-7 space-y-4">

            {/* Device Controller */}
            <div className="flex justify-between items-center bg-white border border-brand-champagne/45 px-5 py-3 rounded-sm shadow-xs">
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/45 font-bold flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-brand-gold" />
                <span>Simulador de Website</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                    previewDevice === "desktop" ? "bg-brand-champagne/30 text-brand-gold" : "text-brand-text-dark/40"
                  }`}
                  title="Vista Computador"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                    previewDevice === "mobile" ? "bg-brand-champagne/30 text-brand-gold" : "text-brand-text-dark/40"
                  }`}
                  title="Vista Telemóvel"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated Window Frame */}
            <div className="flex items-center justify-center bg-brand-champagne/10 p-4 border border-brand-champagne/35 rounded-sm min-h-[500px]">

              <div
                className={`transition-all duration-500 overflow-hidden shadow-2xl border border-brand-champagne/40 bg-white ${
                  previewDevice === "mobile"
                    ? "w-[340px] h-[550px] rounded-[32px] border-[8px] border-zinc-950"
                    : "w-full min-h-[460px] rounded-sm"
                }`}
              >
                {/* Browser Address Bar (only desktop) */}
                {previewDevice === "desktop" && (
                  <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="bg-white border border-zinc-200 px-3 py-0.5 rounded-md flex-1 text-center select-none truncate">
                      https://haxrsignature.com/casamento/{config.partner1.toLowerCase()}-{config.partner2.toLowerCase()}
                    </div>
                  </div>
                )}

                {/* Simulated Website Content Wrapper */}
                <div className={`w-full h-full overflow-y-auto ${styles.bg} p-6 font-sans text-xs flex flex-col justify-between min-h-[420px] max-h-[550px] relative`}>

                  {/* Simulated Navbar */}
                  <div className={`flex justify-between items-center border-b pb-3 mb-6 font-mono text-[8px] uppercase tracking-widest ${styles.navBg}`}>
                    <span>{config.partner1} & {config.partner2}</span>
                    <div className="flex gap-3">
                      <span>Início</span>
                      <span>RSVP</span>
                      <span>Prendas</span>
                    </div>
                  </div>

                  {/* Simulated Hero */}
                  <div className="text-center py-6 space-y-4">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold">
                      {config.date ? new Date(config.date).toLocaleDateString("pt-PT", { year: "numeric", month: "long", day: "numeric" }) : "Data do Evento"}
                    </span>
                    <h2 className={`${styles.fontSerif} text-2xl md:text-3.5xl font-light tracking-wide leading-tight`}>
                      {config.partner1} & {config.partner2}
                    </h2>
                    <div className={`inline-block border-y py-1 px-4 text-[9px] uppercase tracking-widest font-mono ${styles.accentColor}`}>
                      {config.location}
                    </div>
                  </div>

                  {/* Simulated Narrative Story */}
                  <div className="max-w-md mx-auto text-center py-4 border-t border-brand-champagne/20">
                    <p className="font-sans leading-relaxed font-light text-brand-text-dark/75">
                      {config.story}
                    </p>
                  </div>

                  {/* RSVP Call-to-action */}
                  <div className="text-center py-6">
                    <button
                      type="button"
                      className={`inline-block py-2.5 px-6 font-mono text-[8px] uppercase tracking-widest font-bold border ${styles.accentColor} hover:bg-white transition-colors`}
                    >
                      Confirmar Presença
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="text-center border-t pt-3 mt-6 font-mono text-[7px] text-brand-text-dark/40 uppercase tracking-widest">
                    Desenvolvido por HAXR Signature
                  </div>

                </div>

              </div>

            </div>

            {/* Setup Help */}
            <div className="bg-brand-champagne/10 border border-brand-champagne/25 p-5 rounded-sm flex items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <h4 className="font-serif text-xs font-semibold text-brand-text-dark">Precisa de ajuda com o design?</h4>
                <p className="font-sans text-[10px] text-brand-text-dark/50 font-light leading-relaxed max-w-md">
                  Fale com a nossa equipa artística no WhatsApp para solicitar monogramas e fotografia personalizada para o site do vosso casamento.
                </p>
              </div>
              <a
                href={`https://wa.me/258870883428?text=${encodeURIComponent(
                  `Olá HAXR Signature, gostaria de obter ajuda da vossa equipa de design e direção artística para criar e estruturar o Website do meu casamento.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[8px] tracking-widest uppercase font-bold py-2.5 px-4 rounded-sm shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Solicitar ajuda</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
