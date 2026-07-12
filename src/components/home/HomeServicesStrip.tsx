import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import {
  homeServices,
  homeServicesSection,
} from "@/lib/marketing/home-content";

export default function HomeServicesStrip() {
  return (
    <section
      id="servicos"
      className="relative py-20 md:py-28 bg-brand-champagne/25 border-y border-brand-champagne/50"
    >
      <div className="site-container-wide mx-auto">
        <RevealOnScroll>
          <p className="section-label mb-5">{homeServicesSection.label}</p>
          <h2 className="type-section-title mb-5 max-w-3xl">
            {homeServicesSection.headline}
          </h2>
          <p className="type-section-lead max-w-2xl mb-14 md:mb-16">
            {homeServicesSection.description}
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {homeServices.map((service, index) => (
            <RevealOnScroll key={service.num} delay={index * 0.05}>
              <Link
                href={service.href}
                className="group block h-full p-7 md:p-8 bg-white border border-brand-champagne/60 rounded-sm shadow-[0_8px_28px_rgba(8,7,6,0.05)] hover:border-brand-gold/45 hover:shadow-[0_16px_40px_rgba(8,7,6,0.08)] transition-all duration-500"
              >
                <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-brand-gold mb-4">
                  {service.num}
                </p>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-serif text-2xl font-medium text-brand-text-dark">
                    {service.title}
                  </h3>
                  <ArrowUpRight
                    className="w-5 h-5 text-brand-gold/50 group-hover:text-brand-gold shrink-0 mt-1 transition-colors duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="font-sans text-base text-brand-text-dark/80 leading-relaxed">
                  {service.desc}
                </p>
              </Link>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
