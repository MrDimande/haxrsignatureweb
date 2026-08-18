"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2, Phone } from "lucide-react";
import OnboardingBrandHeader from "@/components/brand/OnboardingBrandHeader";
import { markOnboardingComplete } from "@/lib/auth/onboarding-status";
import { resolvePostOnboardingCompletionRedirect } from "@/lib/auth/onboarding-sync";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function OnboardingStep4Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Form states
  const [guestsCount, setGuestsCount] = useState("240");
  const [estimatedBudget, setEstimatedBudget] = useState("750000");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    const savedGuests = localStorage.getItem("haxr_onboarding_guests");
    const savedBudget = localStorage.getItem("haxr_onboarding_budget");
    const savedPhone = localStorage.getItem("haxr_onboarding_phone");
    if (savedGuests) setGuestsCount(savedGuests);
    if (savedBudget) setEstimatedBudget(savedBudget);
    if (savedPhone) setPhoneNumber(savedPhone);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("haxr_onboarding_guests", guestsCount);
    localStorage.setItem("haxr_onboarding_budget", estimatedBudget);

    // Open the premium phone gate modal
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    if (!phoneNumber) {
      setPhoneError("Por favor, introduza o seu número de telemóvel.");
      return;
    }

    localStorage.setItem("haxr_onboarding_phone", phoneNumber);
    markOnboardingComplete();
    window.dispatchEvent(new Event("haxr:onboarding-updated"));
    setShowPhoneModal(false);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    router.push(resolvePostOnboardingCompletionRedirect(Boolean(session)));
    setLoading(false);
  };

  return (
    <div className="haxr-onboarding-stage flex min-h-screen select-none flex-col justify-between overflow-x-hidden p-5 font-sans text-brand-text-dark sm:p-8 md:p-12">

      {/* Header */}
      <header className="haxr-onboarding-header mx-auto flex w-full max-w-4xl flex-col justify-between gap-4 border-b pb-6 text-left sm:flex-row sm:items-center">
        <OnboardingBrandHeader />

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-zinc-400">Passo 4 de 4</span>
          <div className="w-32 h-1.5 bg-brand-champagne/30 rounded-full overflow-hidden">
            <div className="h-full bg-brand-gold rounded-full w-full transition-all duration-300" />
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="haxr-onboarding-main mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-10 md:py-16">

        {loading ? (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="w-10 h-10 text-brand-gold animate-spin mx-auto" />
            <h3 className="font-serif text-xl font-light text-brand-text-dark">A configurar o seu Painel Inteligente...</h3>
            <p className="font-sans text-xs text-zinc-500 font-light">Estamos a estruturar as vossas ferramentas e o vosso HAXR Concierge.</p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="haxr-onboarding-form w-full space-y-8 text-left">

            <div className="space-y-2">
              <span className="font-mono text-[8px] tracking-widest text-brand-gold uppercase font-bold">Escala & Orçamento</span>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-brand-text-dark">Dimensão do vosso evento</h2>
              <p className="font-sans text-xs text-zinc-500 font-light">Configuramos a vossa checklist e calculadoras orçamentais de acordo com estes parâmetros.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[9px] tracking-wider uppercase text-zinc-500 font-semibold pl-1">Número Estimado de Convidados</label>
                <input
                  type="number"
                  required
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  placeholder="Ex: 240"
                  className="w-full bg-white border border-brand-champagne/45 px-4 py-3 rounded-xl text-sm font-sans placeholder-zinc-400 focus:outline-none focus:border-brand-gold transition-all font-light text-brand-text-dark"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[9px] tracking-wider uppercase text-zinc-500 font-semibold pl-1">Orçamento Planeado (MT)</label>
                <input
                  type="number"
                  required
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  placeholder="Ex: 750000"
                  className="w-full bg-white border border-brand-champagne/45 px-4 py-3 rounded-xl text-sm font-sans placeholder-zinc-400 focus:outline-none focus:border-brand-gold transition-all font-light text-brand-text-dark"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-brand-champagne/30 mt-6">
              <button
                type="button"
                onClick={() => router.push("/onboarding/profile/3")}
                className="flex items-center gap-1.5 text-zinc-500 hover:text-brand-text-dark font-mono text-[9px] md:text-[10px] tracking-widest uppercase font-bold py-2.5 px-4 rounded-xl border border-transparent hover:border-brand-champagne/45 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                className="bg-brand-black hover:bg-zinc-800 text-white font-mono text-[10px] tracking-widest uppercase font-bold py-3 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <span>Concluir Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        )}

      </main>

      {/* 3. Phone Number Gate Modal (Loverly Flow) */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">

          <div className="bg-[#120e0d] border border-brand-champagne/30 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 text-white text-left shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_bottom,rgba(184,138,42,0.15),transparent)]" />

            <div className="relative z-10 space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center text-brand-gold">
                <Phone className="w-5 h-5 stroke-[1.25]" />
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[8px] tracking-widest text-brand-gold uppercase font-bold">Última Etapa</span>
                <h3 className="font-serif text-xl md:text-2xl font-light leading-snug">Introduza o seu telemóvel</h3>
                <p className="font-sans text-xs text-brand-ivory/60 leading-relaxed font-light">
                  Necessário para ativar o HAXR Concierge™ e ligar o seu painel ao WhatsApp para envio direto de propostas e convidados.
                </p>
              </div>
            </div>

            {phoneError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-[11px] text-red-400 font-sans font-light">
                {phoneError}
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="font-mono text-[9px] tracking-wider uppercase text-zinc-400 font-semibold pl-1">Telemóvel (WhatsApp)</label>
                <div className="flex gap-2">
                  <span className="bg-white/5 border border-white/10 px-3.5 py-3 rounded-xl text-sm font-mono text-zinc-400 flex items-center">
                    +258
                  </span>
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="84 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-sm font-sans placeholder-zinc-500 focus:outline-none focus:border-brand-gold transition-all font-light text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 gap-3">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="border border-white/10 hover:border-white text-zinc-400 hover:text-white font-mono text-[9px] tracking-widest uppercase font-bold py-3 px-5 rounded-xl transition-colors cursor-pointer"
                >
                  Voltar
                </button>

                <button
                  type="submit"
                  className="bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] md:text-[10px] tracking-widest uppercase font-bold py-3 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-gold/10 hover:shadow-brand-gold/25 transition-all"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

      {/* Footer */}
      <footer className="haxr-onboarding-footer mx-auto w-full max-w-4xl border-t pt-6 text-center font-mono text-[9px] text-zinc-400">
        <span>HAXR SIGNATURE · GESTÃO OPERACIONAL DE CASAMENTOS</span>
      </footer>

    </div>
  );
}
