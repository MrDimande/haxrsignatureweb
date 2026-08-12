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
        className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
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
              className={`min-h-12 shrink-0 snap-start border px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold ${
                isActive
                  ? "border-brand-gold bg-brand-gold text-brand-black"
                  : "border-brand-gold/22 bg-white/35 text-brand-text-dark/65 hover:border-brand-gold/55 hover:text-brand-text-dark"
              }`}
            >
              {occasion.label}
            </button>
          );
        })}
      </div>

      <div
        id={`occasion-panel-${activeOccasion}`}
        role="tabpanel"
        aria-labelledby={`occasion-tab-${activeOccasion}`}
        className="pt-8 md:pt-10"
      >
        <p className="max-w-2xl font-serif text-xl leading-relaxed text-brand-text-dark/72 md:text-2xl">
          {selectedOccasion.note}
        </p>

        <div className={`mt-10 grid gap-5 ${displayPackages.length === 1 ? "max-w-2xl" : displayPackages.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
          {displayPackages.map((packageItem, index) => {
            const proposalHref = packageItem.price === null
              ? siteContact.whatsapp.href
              : siteConfig.contact.convitePackageHash(packageItem.id);

            return (
              <article
                key={packageItem.id}
                className={`relative flex min-h-full flex-col border p-6 transition-[border-color,transform,box-shadow] duration-300 md:p-8 ${
                  packageItem.featured
                    ? "border-brand-gold bg-brand-black text-brand-ivory shadow-[0_24px_60px_rgba(8,7,6,0.18)] md:-translate-y-2"
                    : "border-brand-gold/20 bg-white/66 text-brand-text-dark hover:border-brand-gold/55"
                }`}
              >
                {packageItem.featured ? (
                  <p className="mb-7 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-brand-gold-light">Escolha HAXR</p>
                ) : (
                  <p className="mb-7 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-brand-gold">0{index + 1} · {packageItem.tier}</p>
                )}

                <h3 className="font-serif text-4xl leading-none md:text-5xl">{packageItem.name}</h3>
                <p className={`mt-4 text-sm leading-6 ${packageItem.featured ? "text-brand-ivory/68" : "text-brand-text-dark/62"}`}>
                  {packageItem.subtitle}
                </p>
                <p className="mt-7 font-serif text-2xl">{packageItem.priceLabel}</p>
                <p className={`mt-5 text-sm leading-6 ${packageItem.featured ? "text-brand-ivory/72" : "text-brand-text-dark/68"}`}>
                  {packageItem.description}
                </p>

                <ul className="mt-7 flex-1 space-y-3" aria-label={`Principais elementos do pacote ${packageItem.name}`}>
                  {packageItem.features.map((feature) => (
                    <li key={feature} className={`flex items-start gap-3 text-sm leading-6 ${packageItem.featured ? "text-brand-ivory/78" : "text-brand-text-dark/74"}`}>
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-gold" strokeWidth={1.8} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <details className={`group mt-7 border-y py-1 ${packageItem.featured ? "border-brand-ivory/12" : "border-brand-gold/16"}`}>
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold">
                    Ver todos os detalhes
                    <ChevronDown aria-hidden="true" className="size-4 text-brand-gold transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className={`space-y-3 pb-5 text-sm leading-6 ${packageItem.featured ? "text-brand-ivory/64" : "text-brand-text-dark/62"}`}>
                    {packageItem.details.map((detail) => <li key={detail}>— {detail}</li>)}
                  </ul>
                </details>

                <Link
                  href={proposalHref}
                  className={`mt-7 inline-flex min-h-12 items-center justify-between gap-4 border px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold ${
                    packageItem.featured
                      ? "border-brand-gold bg-brand-gold text-brand-black hover:bg-brand-gold-light"
                      : "border-brand-text-dark bg-brand-text-dark text-brand-ivory hover:border-brand-gold hover:bg-brand-gold hover:text-brand-black"
                  }`}
                >
                  {packageItem.price === null ? "Pedir proposta" : "Escolher experiência"}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <InvitationComparison packages={displayPackages} />
      </div>
    </div>
  );
}
