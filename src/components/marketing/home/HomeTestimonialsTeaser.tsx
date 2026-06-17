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
  const featured = testimonials.slice(0, 2);

  return (
    <section className="relative py-20 md:py-28 bg-black-soft">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-14">O Que Dizem os Nossos Clientes</h2>
        </RevealOnScroll>

        <div className="space-y-12 mb-12">
          {featured.map((item, i) => (
            <RevealOnScroll key={item.id} delay={i * 0.06}>
              <blockquote className="border-l border-gold-dim pl-6 md:pl-8">
                <p className="font-serif text-lg md:text-xl font-light italic text-white/75 leading-relaxed mb-6">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <footer>
                  {item.author ? (
                    <cite className="not-italic font-sans text-sm text-white/60 block mb-1">
                      {item.author}
                    </cite>
                  ) : null}
                  <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-grey/50">
                    {item.role} · {item.service}
                  </p>
                </footer>
              </blockquote>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <Link
            href="/sobre"
            className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-gold/60 hover:text-gold transition-colors duration-500"
          >
            Conhecer a HAXR
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
