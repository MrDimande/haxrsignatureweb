"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardModule, DashboardModuleStatus } from "@/lib/dashboard/types";
import { ArrowRight } from "lucide-react";

type ModulesGridProps = {
  modules: DashboardModule[];
};

type ModuleTab = "all" | DashboardModuleStatus;

export default function ModulesGrid({ modules }: ModulesGridProps) {
  const [activeTab, setActiveTab] = useState<ModuleTab>("all");

  const filteredModules = useMemo(() => {
    if (activeTab === "all") return modules;
    return modules.filter((module) => module.status === activeTab);
  }, [activeTab, modules]);

  return (
    <div className="space-y-6 border-t border-brand-champagne/10 pt-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1 text-left">
          <h3 className="font-serif text-xl font-light text-white">Módulos do Ecossistema</h3>
          <p className="font-sans text-xs font-light text-zinc-400">
            Clique em cada módulo para abrir a sua ferramenta de planeamento.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start rounded-xl border border-brand-champagne/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === "all" ? "bg-brand-gold text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Todos ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === "active" ? "bg-brand-gold text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Ativos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("setup")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === "setup" ? "bg-brand-gold text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            Configuração
          </button>
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <p className="font-sans text-xs font-light text-zinc-500">
          Nenhum módulo disponível nesta categoria.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredModules.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="haxr-dashboard-card group flex min-h-[160px] flex-col justify-between rounded-2xl border border-brand-champagne/10 bg-[#120e0d] p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-gold/45"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-serif text-base font-light text-white transition-colors duration-300 group-hover:text-brand-gold">
                    {item.title}
                  </h4>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      item.status === "active"
                        ? "bg-emerald-500"
                        : item.status === "setup"
                          ? "animate-pulse bg-brand-gold"
                          : "bg-zinc-600"
                    }`}
                  />
                </div>
                <p className="font-sans text-xs font-light leading-relaxed text-zinc-400">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 font-mono text-xs">
                <span className="text-[10px] font-semibold text-brand-gold">{item.metric}</span>
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-white">
                  <span>Abrir</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
