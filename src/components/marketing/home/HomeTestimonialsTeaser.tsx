import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import type { Testimonial } from "@/lib/site-config";

type HomeTestimonialsTeaserProps = {
  testimonials: Testimonial[];
};

export default function HomeTestimonialsTeaser({
  testimonials,
}: HomeTestimonialsTeaserProps) {
  // Pegamos os dois primeiros depoimentos de destaque
  const featured = testimonials.slice(0, 2);

  return (
    <section className="relative py-28 md:py-36 bg-black-soft border-y border-white/5">
      {/* Light glow at the background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(184,138,42,0.1), transparent)"
        }}
      />

      <div className="site-container-wide mx-auto relative z-10">

        {/* Cabeçalho de Luxo */}
        <RevealOnScroll className="mb-20">
          <div className="flex items-center gap-2.5 text-brand-gold mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-brand-gold shrink-0">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
            </svg>
            <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-brand-gold">Testemunhos</span>
          </div>

          <div className="relative pt-2">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight max-w-2xl">
              O Que Dizem os Nossos Clientes
            </h2>
            <p className="font-signature text-3xl md:text-4xl text-brand-gold/55 absolute -top-5 left-72 pointer-events-none select-none">
              Amor & Confiança
            </p>
          </div>
        </RevealOnScroll>

        {/* Depoimentos Lado a Lado (2 Colunas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-12 lg:gap-20 items-stretch">
          {featured.map((item, i) => (
            <RevealOnScroll key={item.id} delay={i * 0.08} className="h-full flex flex-col justify-between">
              <blockquote className="relative text-left h-full flex flex-col justify-between border-t border-white/10 pt-8 group hover:border-gold/55 transition-colors duration-500">
                {/* Ícone de Aspas de Luxo */}
                <span className="font-serif text-5xl font-light text-brand-gold/25 absolute top-4 right-0 pointer-events-none select-none">
                  “
                </span>

                <p className="font-serif text-lg md:text-xl font-light italic text-brand-ivory/90 leading-relaxed mb-8 pr-6">
                  &ldquo;{item.quote}&rdquo;
                </p>

                <footer className="mt-auto">
                  {item.author ? (
                    <cite className="not-italic font-serif text-md text-white/90 block mb-1">
                      {item.author}
                    </cite>
                  ) : null}
                  <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-brand-gold">
                    {item.role} · {item.service}
                  </p>
                </footer>
              </blockquote>
            </RevealOnScroll>
          ))}
        </div>

        {/* CTA Conhecer a HAXR */}
        <RevealOnScroll className="mt-16 text-left">
          <Link
            href="/sobre"
            className="inline-flex items-center gap-2.5 font-mono text-[9px] tracking-[0.3em] uppercase text-brand-gold hover:text-brand-gold-light font-semibold transition-colors duration-300 group"
          >
            <span>Conhecer a HAXR</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
          </Link>
        </RevealOnScroll>

      </div>
    </section>
  );
}
