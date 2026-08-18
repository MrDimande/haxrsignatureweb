"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import OnboardingBrandHeader from "@/components/brand/OnboardingBrandHeader";

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [weddingDate, setWeddingDate] = useState("2026-08-24");

  useEffect(() => {
    const savedDate = localStorage.getItem("haxr_onboarding_date");
    if (savedDate) setWeddingDate(savedDate);
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("haxr_onboarding_date", weddingDate);
    router.push("/onboarding/profile/3");
  };

  return (
    <div className="haxr-onboarding-stage flex min-h-screen select-none flex-col justify-between overflow-x-hidden p-5 font-sans text-brand-text-dark sm:p-8 md:p-12">

      <header className="haxr-onboarding-header mx-auto flex w-full max-w-4xl flex-col justify-between gap-4 border-b pb-6 text-left sm:flex-row sm:items-center">
        <OnboardingBrandHeader />

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-zinc-400">Passo 2 de 4</span>
          <div className="w-32 h-1.5 bg-brand-champagne/30 rounded-full overflow-hidden">
            <div className="h-full bg-brand-gold rounded-full w-2/4 transition-all duration-300" />
          </div>
        </div>
      </header>

      <main className="haxr-onboarding-main mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-10 md:py-16">

        <form onSubmit={handleContinue} className="haxr-onboarding-form w-full space-y-8 text-left">

          <div className="space-y-2">
            <span className="font-mono text-[8px] tracking-widest text-brand-gold uppercase font-bold">O Cronograma</span>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-brand-text-dark">Quando é o grande dia?</h2>
            <p className="font-sans text-xs text-zinc-500 font-light">Selecione a data prevista do vosso casamento. Se ainda não tiverem a certeza, podem escolher uma data estimada e alterar mais tarde.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] tracking-wider uppercase text-zinc-500 font-semibold pl-1">Data Estimada</label>
              <input
                type="date"
                required
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="w-full bg-white border border-brand-champagne/45 px-4 py-3.5 rounded-xl text-sm font-sans focus:outline-none focus:border-brand-gold transition-all font-light text-brand-text-dark"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-brand-champagne/30 mt-6">
            <button
              type="button"
              onClick={() => router.push("/onboarding/profile/1")}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-brand-text-dark font-mono text-[9px] md:text-[10px] tracking-widest uppercase font-bold py-2.5 px-4 rounded-xl border border-transparent hover:border-brand-champagne/45 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>

            <button
              type="submit"
              className="bg-brand-black hover:bg-zinc-800 text-white font-mono text-[10px] tracking-widest uppercase font-bold py-3 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              <span>Continuar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </main>

      <footer className="haxr-onboarding-footer mx-auto w-full max-w-4xl border-t pt-6 text-center font-mono text-[9px] text-zinc-400">
        <span>HAXR SIGNATURE · GESTÃO OPERACIONAL DE CASAMENTOS</span>
      </footer>

    </div>
  );
}
