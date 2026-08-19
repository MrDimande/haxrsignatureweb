"use client";

import Link from "next/link";
import { ArrowLeft, CheckSquare } from "lucide-react";

export default function WeddingChecklistHeader() {
  return (
    <div className="space-y-6 mb-12">
      {/* Back Link */}
      <Link
        href="/ferramentas"
        className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-brand-text-dark/50 hover:text-brand-text-dark transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar às ferramentas</span>
      </Link>

      {/* Micro-label */}
      <div className="flex items-center gap-2 text-brand-gold">
        <CheckSquare className="w-4 h-4" />
        <span className="font-mono text-[9px] uppercase tracking-[0.35em] font-bold">
          HAXR PLANNING TOOL · DEMONSTRAÇÃO PÚBLICA
        </span>
      </div>

      {/* Main Title & Signature */}
      <div className="space-y-2 max-w-2xl">
        <h1 className="font-serif text-3xl md:text-5xl font-light text-brand-text-dark leading-tight tracking-tight">
          Checklist do Vosso Casamento
        </h1>
        <p className="font-serif text-lg md:text-xl text-brand-gold italic font-light">
          Cada etapa no seu tempo.
        </p>
        <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light leading-relaxed pt-2">
          Uma estrutura cronológica concebida para orientar a preparação do vosso casamento com serenidade. Configurem a data e as cerimónias da vossa celebração para obter uma visão clara dos marcos essenciais.
        </p>
      </div>
    </div>
  );
}
