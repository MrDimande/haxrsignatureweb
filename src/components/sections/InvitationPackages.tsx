"use client";

import InvitationComparison from "@/components/sections/InvitationComparison";
import {
  invitationOccasions,
  invitationPackages,
  type InvitationOccasionId,
} from "@/lib/marketing/invitation-offer";
import { siteConfig, siteContact } from "@/lib/site-config";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

export default function InvitationPackages() {
  const [activeOccasion, setActiveOccasion] = useState<InvitationOccasionId>("casamento");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOccasion = invitationOccasions.find((occasion) => occasion.id === activeOccasion) ?? invitationOccasions[0];
  const displayPackages = invitationPackages.filter((packageItem) => packageItem.occasion === activeOccasion);

  function selectTab(index: number) {
    const nextOccasion = invitationOccasions[index];
    if (!nextOccasion) return;
    setActiveOccasion(nextOccasion.id);
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectTab((index + 1) % invitationOccasions.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab((index - 1 + invitationOccasions.length) % invitationOccasions.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(invitationOccasions.length - 1);
    }
  }

  return (
    <div>
      <div
        aria-label="Tipo de evento"
        className="-mx-5 flex snap-x snap-mandatory overflow-x-auto border-y border-brand-text-dark/14 px-5 [scrollbar-width:none] md:mx-0 md:px-0"
        role="tablist"
      >
        {invitationOccasions.map((occasion, index) => {
          const isActive = occasion.id === activeOccasion;
          return (
            <button
              key={occasion.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              type="button"
              role="tab"
              id={`occasion-tab-${occasion.id}`}
              aria-controls={`occasion-panel-${occasion.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveOccasion(occasion.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`group relative min-h-24 min-w-[10.5rem] flex-1 snap-start px-5 py-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-gold md:min-w-0 ${
                isActive ? "bg-brand-black text-brand-ivory" : "text-brand-text-dark hover:bg-white/55"
              }`}
            >
              <span className={`block text-[0.58rem] tracking-[0.24em] ${isActive ? "text-brand-gold-light" : "text-brand-gold"}`}>0{index + 1}</span>
              <span className="mt-3 block font-serif text-lg leading-tight md:text-xl">{occasion.label}</span>
              <span className={`absolute bottom-0 left-5 right-5 h-px origin-left transition-transform ${isActive ? "scale-x-100 bg-brand-gold" : "scale-x-0 bg-brand-gold group-hover:scale-x-100"}`} />
            </button>
          );
        })}
      </div>

      <div
        id={`occasion-panel-${activeOccasion}`}
        role="tabpanel"
        aria-labelledby={`occasion-tab-${activeOccasion}`}
        className="pt-10 md:pt-14"
      >
        <div className="grid gap-8 border-b border-brand-text-dark/14 pb-10 lg:grid-cols-[0.38fr_1fr] lg:gap-16">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.27em] text-brand-gold">Curadoria da ocasião</p>
          <p className="max-w-3xl font-serif text-2xl leading-relaxed text-brand-text-dark/76 md:text-3xl">{selectedOccasion.note}</p>
        </div>

        <div className="border-b border-brand-text-dark/14">
          {displayPackages.map((packageItem, index) => {
            const proposalHref = packageItem.price === null
              ? siteContact.whatsapp.href
              : siteConfig.contact.convitePackageHash(packageItem.id);

            return (
              <article
                key={packageItem.id}
                className={`relative -mx-5 grid gap-8 border-t border-brand-text-dark/14 px-5 py-10 md:mx-0 md:px-7 md:py-14 lg:grid-cols-[0.56fr_0.95fr_0.54fr] lg:gap-14 ${
                  packageItem.featured ? "bg-brand-black text-brand-ivory md:px-10" : "text-brand-text-dark"
                }`}
              >
                <div>
                  <p className={`text-[0.6rem] font-semibold uppercase tracking-[0.26em] ${packageItem.featured ? "text-brand-gold-light" : "text-brand-gold"}`}>
                    {packageItem.featured ? "Selecção HAXR" : `Colecção 0${index + 1}`}
                  </p>
                  <h3 className="mt-5 font-serif text-5xl leading-none md:text-6xl">{packageItem.name}</h3>
                  <p className={`mt-4 text-[0.62rem] uppercase tracking-[0.2em] ${packageItem.featured ? "text-brand-ivory/42" : "text-brand-text-dark/42"}`}>
                    {packageItem.tier}
                  </p>
                </div>

                <div>
                  <p className="font-serif text-2xl leading-9 md:text-3xl">{packageItem.subtitle}</p>
                  <p className={`mt-5 text-sm leading-7 ${packageItem.featured ? "text-brand-ivory/62" : "text-brand-text-dark/62"}`}>
                    {packageItem.description}
                  </p>
                  <ul className="mt-7 grid gap-x-6 gap-y-3 sm:grid-cols-2" aria-label={`Principais elementos da colecção ${packageItem.name}`}>
                    {packageItem.features.map((feature) => (
                      <li key={feature} className={`flex items-start gap-3 text-sm leading-6 ${packageItem.featured ? "text-brand-ivory/72" : "text-brand-text-dark/68"}`}>
                        <Check aria-hidden="true" className="mt-1 size-3.5 shrink-0 text-brand-gold" strokeWidth={1.8} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <details className={`group mt-7 border-t pt-1 ${packageItem.featured ? "border-brand-ivory/12" : "border-brand-text-dark/12"}`}>
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold">
                      Notas da colecção
                      <ChevronDown aria-hidden="true" className="size-4 text-brand-gold transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className={`space-y-3 pb-4 text-sm leading-6 ${packageItem.featured ? "text-brand-ivory/56" : "text-brand-text-dark/56"}`}>
                      {packageItem.details.map((detail) => <li key={detail}>— {detail}</li>)}
                    </ul>
                  </details>
                </div>

                <div className="flex flex-col justify-between lg:border-l lg:border-current/12 lg:pl-8">
                  <div>
                    <p className={`text-[0.58rem] uppercase tracking-[0.22em] ${packageItem.featured ? "text-brand-ivory/38" : "text-brand-text-dark/38"}`}>Investimento base</p>
                    <p className="mt-3 font-serif text-3xl md:text-4xl">{packageItem.priceLabel}</p>
                  </div>
                  <Link
                    href={proposalHref}
                    className={`mt-8 inline-flex min-h-13 items-center justify-between gap-5 border-b py-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold ${
                      packageItem.featured
                        ? "border-brand-gold text-brand-ivory hover:text-brand-gold-light"
                        : "border-brand-text-dark text-brand-text-dark hover:border-brand-gold hover:text-brand-gold"
                    }`}
                  >
                    {packageItem.price === null ? "Solicitar proposta" : "Comissionar colecção"}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <InvitationComparison packages={displayPackages} />
      </div>
    </div>
  );
}
