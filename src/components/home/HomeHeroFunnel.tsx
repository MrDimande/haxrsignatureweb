"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight } from "lucide-react";
import {
  homeEventTypes,
  homeHero,
} from "@/lib/marketing/home-content";

export default function HomeHeroFunnel() {
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<string>(homeEventTypes[0].value);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();
    params.set("tipo", eventType);
    if (eventDate) params.set("data", eventDate);

    router.push(`/contacto?${params.toString()}`);
  };

  return (
    <div className="hero-funnel-card relative w-full max-w-lg mx-auto lg:ml-auto lg:mr-0 text-left rounded-sm">
      <div className="art-deco-corner art-deco-corner--tl" />
      <div className="art-deco-corner art-deco-corner--br" />

      <form onSubmit={handleSubmit} className="relative z-10 p-7 md:p-8 space-y-5">
        <p className="font-sans text-sm font-semibold text-brand-text-dark mb-1">
          Comece o vosso projecto
        </p>

        <div>
          <label
            htmlFor="hero-event-date"
            className="block font-sans text-xs font-semibold tracking-wide text-brand-text-dark mb-2"
          >
            Qual é a data do vosso evento?
          </label>
          <div className="relative">
            <Calendar
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              id="hero-event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-white border border-brand-champagne font-sans text-base text-brand-text-dark rounded-sm focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="hero-event-type"
            className="block font-sans text-xs font-semibold tracking-wide text-brand-text-dark mb-2"
          >
            Tipo de celebração
          </label>
          <select
            id="hero-event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-brand-champagne font-sans text-base text-brand-text-dark rounded-sm focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all appearance-none cursor-pointer"
          >
            {homeEventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="btn-editorial btn-editorial--solid w-full min-w-0 !font-semibold !text-[12px]"
        >
          {homeHero.ctaLabel}
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <Link
            href={homeHero.secondaryHref}
            className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-brand-text-dark/70 hover:text-brand-gold transition-colors"
          >
            {homeHero.secondaryLabel}
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
          <Link
            href={homeHero.undecidedHref}
            className="font-sans text-xs text-brand-text-dark/55 hover:text-brand-text-dark transition-colors"
          >
            {homeHero.undecidedLabel}
          </Link>
        </div>
      </form>
    </div>
  );
}
