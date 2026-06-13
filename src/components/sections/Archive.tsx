"use client";

import Image from "next/image";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const projects = [
  {
    title: "Projecto I",
    category: "Privado",
    image: "/images/archive-01.webp",
    span: true,
  },
  {
    title: "Projecto II",
    category: "Social",
    image: "/images/archive-02.webp",
    span: false,
  },
  {
    title: "Projecto III",
    category: "Corporativo",
    image: "/images/archive-03.webp",
    span: false,
  },
  {
    title: "Projecto IV",
    category: "Curadoria",
    image: "/images/archive-04.webp",
    span: false,
  },
];

export default function Archive() {
  return (
    <section id="arquivo" className="relative pt-20 pb-12 md:pt-28 md:pb-16">
      <div className="site-container site-prose-medium mx-auto">
        <RevealOnScroll>
          <h2 className="section-label mb-8">Arquivo</h2>
          <p className="font-sans text-sm text-grey leading-relaxed mb-20 max-w-lg">
            Atmosfera, silêncio e intenção. Sem clichés. Sem espectáculo
            gratuito.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj, i) => (
            <RevealOnScroll
              key={proj.title}
              delay={i * 0.08}
              className={proj.span ? "md:row-span-2" : ""}
            >
              <div
                className={`group relative overflow-hidden bg-grey-dark/30 ${proj.span ? "h-full min-h-[480px]" : "aspect-video md:aspect-auto md:min-h-[240px]"}`}
              >
                <Image
                  src={proj.image}
                  alt={proj.title}
                  fill
                  className="object-cover opacity-60 grayscale contrast-110 group-hover:opacity-80 group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-1000 ease-luxury"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold/50 mb-2">
                    {proj.category}
                  </p>
                  <h3 className="font-serif text-xl md:text-2xl font-light tracking-wide text-white">
                    {proj.title}
                  </h3>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll className="mt-16 md:mt-20">
          <div className="line-gold" />
        </RevealOnScroll>
      </div>
    </section>
  );
}
