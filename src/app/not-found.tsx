import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import { ArrowLeft, Compass } from "lucide-react";

export const metadata = {
  title: "Página Não Encontrada | HAXR Signature",
  description: "A criação ou experiência que procura não se encontra disponível ou reside em arquivo confidencial.",
};

export default function NotFound() {
  return (
    <main
      className="min-h-screen bg-black text-brand-ivory flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden"
      data-lenis-prevent
    >
      {/* Vinheta linear e radial sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-brand-black-soft/30 to-black pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        {/* Identidade HAXR */}
        <div className="flex justify-center">
          <BrandLogo variant="footer" className="h-24 md:h-28 mx-auto" />
        </div>

        {/* Kicker Editorial */}
        <p className="font-mono text-[9px] md:text-[10px] tracking-[0.45em] uppercase text-brand-gold">
          Arquivo Confidencial · Erro 404
        </p>

        {/* Título e Explicação */}
        <div className="space-y-4">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-brand-ivory leading-[1.2]">
            Criação Reservada
          </h1>
          <p className="font-sans text-sm md:text-base text-brand-ivory/70 leading-relaxed font-light max-w-md mx-auto">
            O endereço solicitado não se encontra disponível publicamente, foi reorganizado ou reside em curadoria confidencial de atelier.
          </p>
        </div>

        {/* Divisor Delicado em Ouro Champanhe */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent mx-auto" />

        {/* Ações de Navegação */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-gold text-brand-black hover:bg-brand-ivory transition-all duration-300 font-mono text-[9.5px] tracking-[0.25em] uppercase font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retornar ao Atelier</span>
          </Link>

          <Link
            href="/portfolio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-brand-champagne/40 hover:border-brand-gold text-brand-ivory/80 hover:text-brand-ivory transition-all duration-300 font-mono text-[9.5px] tracking-[0.25em] uppercase"
          >
            <Compass className="w-3.5 h-3.5 text-brand-gold" />
            <span>The Signature Collection</span>
          </Link>
        </div>

        {/* Informação de Apoio */}
        <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-brand-ivory/40 pt-8">
          HAXR Signature · Private Planning Atelier & Alta-Costura Digital
        </p>
      </div>
    </main>
  );
}
