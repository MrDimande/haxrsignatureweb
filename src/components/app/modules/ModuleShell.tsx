import type { ReactNode } from "react";
import type { EventModuleContext } from "@/lib/event-modules/types";
import { CircleDot } from "lucide-react";
import MapPinIcon from "@/components/app/dashboard/MapPinIcon";

type EventContextBarProps = {
  context: EventModuleContext;
};

export function EventContextBar({ context }: EventContextBarProps) {
  const { eventOverview } = context;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-champagne/15 bg-white/5 px-4 py-3 text-xs">
      <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-brand-gold">
        {eventOverview.type}
      </span>
      <span className="font-serif text-sm font-light text-white">{eventOverview.name}</span>
      <span className="hidden items-center gap-1 text-zinc-400 sm:flex">
        <MapPinIcon className="h-3 w-3" />
        {eventOverview.location}
      </span>
      <span className="text-zinc-500">·</span>
      <span className="text-zinc-400">{eventOverview.date}</span>
      <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] text-zinc-500">
        <CircleDot className="h-2 w-2 fill-brand-gold text-brand-gold" />
        {eventOverview.status}
      </span>
    </div>
  );
}

export function ModuleShell({ children }: { children: ReactNode }) {
  return <div className="select-none space-y-8 pb-12 text-left">{children}</div>;
}

type ModuleHeaderProps = {
  label: string;
  title: string;
  description: string;
  primaryAction?: { label: string; onClick?: () => void; href?: string };
  secondaryAction?: { label: string; onClick?: () => void; href?: string };
};

export function ModuleHeader({
  label,
  title,
  description,
  primaryAction,
  secondaryAction,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-brand-champagne/10 pb-6 md:flex-row md:items-start">
      <div className="max-w-2xl space-y-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold">
          {label}
        </span>
        <h1 className="font-serif text-3xl font-light leading-tight text-white md:text-4xl">{title}</h1>
        <p className="font-sans text-xs font-light text-zinc-400 md:text-sm">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {secondaryAction ? (
          <ModuleActionButton variant="secondary" {...secondaryAction} />
        ) : null}
        {primaryAction ? <ModuleActionButton variant="primary" {...primaryAction} /> : null}
      </div>
    </div>
  );
}

function ModuleActionButton({
  label,
  onClick,
  href,
  variant,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "bg-brand-gold hover:bg-brand-gold-light text-white shadow-md shadow-brand-gold/10"
      : "border border-brand-champagne/25 bg-white/5 text-brand-gold hover:border-brand-gold hover:text-white";

  if (href) {
    return (
      <a
        href={href}
        className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest transition-colors md:text-[10px] ${className}`}
      >
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest transition-colors md:text-[10px] ${className}`}
    >
      {label}
    </button>
  );
}

type StatItem = { label: string; value: string | number; detail?: string };

export function ModuleStatGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-brand-champagne/10 bg-white/5 p-4"
        >
          <p className="font-sans text-[10px] text-zinc-500">{stat.label}</p>
          <p className="my-1.5 font-serif text-xl font-light text-white">{stat.value}</p>
          {stat.detail ? (
            <p className="font-sans text-[9px] text-brand-gold/70">{stat.detail}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ModulePanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-brand-champagne/10 bg-white/5 ${className}`}
    >
      {title ? (
        <div className="border-b border-white/5 px-5 py-4 md:px-6">
          <h3 className="font-serif text-lg font-light text-white">{title}</h3>
        </div>
      ) : null}
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

export function ModuleSkeleton() {
  return (
    <div className="animate-pulse space-y-8 pb-12">
      <div className="space-y-3 border-b border-brand-champagne/10 pb-6">
        <div className="h-3 w-32 rounded bg-white/10" />
        <div className="h-9 w-64 rounded bg-white/10" />
        <div className="h-4 w-96 max-w-full rounded bg-white/5" />
      </div>
      <div className="h-12 rounded-2xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-80 rounded-3xl bg-white/5" />
    </div>
  );
}

export function ModuleEmptyState({ title, description, cta }: { title: string; description: string; cta?: { label: string; href: string } }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-brand-champagne/15 bg-white/5 px-6 py-16 text-center">
      <h2 className="font-serif text-2xl font-light text-white">{title}</h2>
      <p className="mt-3 max-w-md font-sans text-sm font-light text-zinc-400">{description}</p>
      {cta ? (
        <a
          href={cta.href}
          className="mt-8 inline-flex rounded-xl bg-brand-gold px-8 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white"
        >
          {cta.label}
        </a>
      ) : null}
    </div>
  );
}

export function ModuleErrorState({
  message = "Não foi possível carregar o módulo.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
      <h2 className="font-serif text-2xl font-light text-white">{message}</h2>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 cursor-pointer rounded-xl border border-brand-champagne/30 bg-white/5 px-8 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:border-brand-gold"
        >
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}
