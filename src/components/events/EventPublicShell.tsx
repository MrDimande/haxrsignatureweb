import type { ReactNode } from "react";
import { EVENT_TYPE_LABELS } from "@/lib/admin/constants";
import type { EventType } from "@/lib/admin/types";

type EventPublicShellProps = {
  title: string;
  subtitle?: string;
  eventName?: string;
  eventType?: EventType;
  eventDate?: string | null;
  eventLocation?: string;
  footer?: string;
  children: ReactNode;
};

function formatEventDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-MZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Maputo",
  });
}

export default function EventPublicShell({
  title,
  subtitle,
  eventName,
  eventType,
  eventDate,
  eventLocation,
  footer = "HAXR Signature · Maputo, Moçambique",
  children,
}: EventPublicShellProps) {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-5 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-lg">
        <div className="border border-grey-dark/80 bg-black-soft/50 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <header className="px-7 sm:px-8 pt-10 pb-8 border-b border-grey-dark/60 text-center">
            <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-gold/50 mb-5">
              HAXR Signature
            </p>
            <h1 className="font-serif text-3xl md:text-[2.35rem] font-light text-white/95 mb-2 leading-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm text-grey/60 leading-relaxed max-w-sm mx-auto mt-3">
                {subtitle}
              </p>
            ) : null}
            {eventType ? (
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-grey/50 mt-5">
                {EVENT_TYPE_LABELS[eventType]}
              </p>
            ) : null}
            {eventName ? (
              <p className="font-serif text-lg font-light text-white/75 mt-3">
                {eventName}
              </p>
            ) : null}
            {eventDate ? (
              <p className="text-sm text-grey/60 mt-2">{formatEventDate(eventDate)}</p>
            ) : null}
            {eventLocation ? (
              <p className="text-sm text-grey/50 mt-1">{eventLocation}</p>
            ) : null}
          </header>

          <div className="px-7 sm:px-8 py-8">{children}</div>

          <footer className="px-7 sm:px-8 py-5 border-t border-grey-dark/60 text-center">
            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-grey/35">
              {footer}
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
