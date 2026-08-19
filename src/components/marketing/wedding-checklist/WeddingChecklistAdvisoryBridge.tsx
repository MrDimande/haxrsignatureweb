"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function WeddingChecklistAdvisoryBridge() {
  return (
    <section className="relative mt-16 pt-16 border-t border-brand-champagne/35 text-center max-w-3xl mx-auto space-y-6">
      <div className="space-y-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-brand-gold font-bold">
          DIRECÇÃO & GOVERNAÇÃO HAXR
        </span>
        <blockquote className="font-serif text-2xl md:text-3xl text-brand-text-dark font-light leading-snug">
          “A ferramenta organiza.<br />
          O Ecossistema acompanha.<br />
          A Assessoria HAXR orienta e conduz.”
        </blockquote>
        <p className="font-sans text-xs md:text-sm text-brand-text-dark/65 font-light leading-relaxed max-w-xl mx-auto">
          A Checklist pública estrutura a visão e os tempos do casal. A nossa equipa de Assessoria Completa assume a negociação técnica, a blindagem contratual e a regência minuciosa de bastidores no grande dia.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/assessoria-eventos"
          className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-brand-gold hover:text-brand-gold-light font-bold hover:underline transition-colors"
        >
          <span>Conhecer Assessoria HAXR</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
