"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import OnboardingBrandHeader from "@/components/brand/OnboardingBrandHeader";

export default function OnboardingStep1Page() {
  const router = useRouter();
  const [role, setRole] = useState("noiva");
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("haxr_onboarding_role");
    const savedBride = localStorage.getItem("haxr_onboarding_bride");
    const savedGroom = localStorage.getItem("haxr_onboarding_groom");
    if (savedRole) setRole(savedRole);
    if (savedBride) setBrideName(savedBride);
    if (savedGroom) setGroomName(savedGroom);
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("haxr_onboarding_role", role);
    localStorage.setItem("haxr_onboarding_bride", brideName);
    localStorage.setItem("haxr_onboarding_groom", groomName);
    router.push("/onboarding/profile/2");
  };

  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col justify-between font-sans text-brand-text-dark select-none p-6 md:p-12 relative overflow-x-hidden">

      <header className="max-w-3xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-champagne/30 text-left">
        <OnboardingBrandHeader />

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-zinc-400">Passo 1 de 4</span>
          <div className="w-32 h-1.5 bg-brand-champagne/30 rounded-full overflow-hidden">
            <div className="h-full bg-brand-gold rounded-full w-1/4 transition-all duration-300" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center max-w-xl w-full mx-auto py-12 md:py-16">

        <form onSubmit={handleContinue} className="w-full space-y-8 text-left">

          <div className="space-y-2">
            <span className="font-mono text-[8px] tracking-widest text-brand-gold uppercase font-bold">Perfil Inicial</span>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-brand-text-dark">Quem está a planear?</h2>
            <p className="font-sans text-xs text-zinc-500 font-light">Diga-nos o seu papel e o nome dos noivos para personalizar a experiência.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setRole("noiva")}
              className={`border rounded-2xl p-4 cursor-pointer text-center transition-all ${
                role === "noiva" ? "border-brand-gold bg-brand-champagne/10 shadow-sm" : "border-brand-champagne/45 hover:border-brand-gold/40 bg-white"
              }`}
            >
              <span className="font-serif text-sm font-medium text-brand-text-dark">Noiva / Noivo</span>
              <p className="text-[10px] text-zinc-500 font-light mt-1 font-sans">Casal protagonista</p>
            </div>

            <div
              onClick={() => setRole("consultor")}
              className={`border rounded-2xl p-4 cursor-pointer text-center transition-all ${
                role === "consultor" ? "border-brand-gold bg-brand-champagne/10 shadow-sm" : "border-brand-champagne/45 hover:border-brand-gold/40 bg-white"
              }`}
            >
              <span className="font-serif text-sm font-medium text-brand-text-dark">Consultor / Planner</span>
              <p className="text-[10px] text-zinc-500 font-light mt-1 font-sans">Organizador de casamentos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] tracking-wider uppercase text-zinc-500 font-semibold pl-1">Nome da Noiva</label>
              <input
                type="text"
                required
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                placeholder="Ex: Jessica"
                className="w-full bg-white border border-brand-champagne/45 px-4 py-3 rounded-xl text-sm font-sans placeholder-zinc-400 focus:outline-none focus:border-brand-gold transition-all font-light text-brand-text-dark"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[9px] tracking-wider uppercase text-zinc-500 font-semibold pl-1">Nome do Noivo</label>
              <input
                type="text"
                required
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                placeholder="Ex: Samuel"
                className="w-full bg-white border border-brand-champagne/45 px-4 py-3 rounded-xl text-sm font-sans placeholder-zinc-400 focus:outline-none focus:border-brand-gold transition-all font-light text-brand-text-dark"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-brand-champagne/30 mt-6">
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

      <footer className="max-w-3xl w-full mx-auto pt-6 border-t border-brand-champagne/30 text-center font-mono text-[9px] text-zinc-400">
        <span>HAXR SIGNATURE · GESTÃO OPERACIONAL DE CASAMENTOS</span>
      </footer>

    </div>
  );
}
