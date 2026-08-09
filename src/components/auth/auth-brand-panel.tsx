import Image from "next/image";
import { Sparkles } from "lucide-react";
import HaxrLogo from "@/components/brand/HaxrLogo";

const EXPERIENCE_STEPS = [
  { number: "01", label: "Imagine", detail: "Defina a intenção do vosso dia." },
  { number: "02", label: "Curadoria", detail: "Organize cada escolha com clareza." },
  { number: "03", label: "Celebre", detail: "Viva o momento, sem ruído." },
] as const;

export default function AuthBrandPanel() {
  return (
    <div className="relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden bg-brand-black p-7 text-white lg:p-12 xl:p-16">
      <Image
        src="/images/hero/wedding-editorial-couple.png"
        alt="Casal HAXR a celebrar o início de uma nova história"
        fill
        priority
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="object-cover object-center opacity-55 grayscale"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(115deg,rgba(8,7,6,0.97)_0%,rgba(8,7,6,0.82)_43%,rgba(8,7,6,0.38)_78%,rgba(8,7,6,0.72)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-5 border border-white/10 lg:inset-8"
        aria-hidden
      />
      <div
        className="absolute left-5 top-5 h-16 w-16 border-l border-t border-brand-gold/55 lg:left-8 lg:top-8"
        aria-hidden
      />
      <div
        className="absolute bottom-5 right-5 h-16 w-16 border-b border-r border-brand-gold/55 lg:bottom-8 lg:right-8"
        aria-hidden
      />

      <div className="relative z-10 flex items-start justify-between gap-6">
        <HaxrLogo
          variant="full"
          tone="dark"
          size="md"
          subtitle="Private Planning Atelier"
          link
          href="/"
          className="items-start"
        />
        <span className="hidden items-center gap-2 border border-white/12 bg-black/25 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.24em] text-white/70 backdrop-blur-sm sm:inline-flex">
          <Sparkles className="h-3 w-3 text-brand-gold" aria-hidden />
          Signature Experience
        </span>
      </div>

      <div className="relative z-10 my-10 max-w-xl text-left lg:my-16">
        <p className="mb-5 font-mono text-[9px] font-semibold uppercase tracking-[0.42em] text-brand-gold-light">
          Precisão nos bastidores. Liberdade no momento.
        </p>
        <h2 className="max-w-lg font-serif text-[clamp(2.4rem,5vw,5.4rem)] font-light leading-[0.98] tracking-[-0.035em] text-brand-ivory">
          Onde a intenção ganha forma.
        </h2>
        <p className="mt-6 max-w-md font-sans text-sm font-light leading-7 text-white/72 lg:text-base">
          Uma experiência privada para transformar decisões, detalhes e emoções num casamento
          com assinatura própria.
        </p>
      </div>

      <div className="relative z-10">
        <div className="grid gap-px border border-white/12 bg-white/10 sm:grid-cols-3">
          {EXPERIENCE_STEPS.map((step) => (
            <div key={step.number} className="bg-black/55 px-4 py-4 text-left backdrop-blur-md lg:px-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[8px] font-semibold tracking-[0.2em] text-brand-gold">
                  {step.number}
                </span>
                <span className="h-px w-6 bg-brand-gold/40" aria-hidden />
                <span className="font-serif text-base font-light text-white">{step.label}</span>
              </div>
              <p className="mt-2 font-sans text-[11px] font-light leading-5 text-white/52">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
          <span>HAXR Signature · Maputo</span>
          <span>Est. 2026</span>
        </div>
      </div>
    </div>
  );
}
