import Link from "next/link";
import { ModuleShell } from "@/components/app/modules/ModuleShell";

type ComingSoonModuleProps = {
  title: string;
  description?: string;
  backHref?: string;
};

export default function ComingSoonModule({
  title,
  description = "Este módulo está em preparação. Em breve fará parte do vosso painel HAXR.",
  backHref = "/app/dashboard",
}: ComingSoonModuleProps) {
  return (
    <ModuleShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-brand-champagne/15 bg-white/5 px-6 py-16 text-center">
        <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold">
          Em breve
        </span>
        <h1 className="mt-3 font-serif text-3xl font-light text-white">{title}</h1>
        <p className="mt-4 max-w-md font-sans text-sm font-light text-zinc-400">{description}</p>
        <Link
          href={backHref}
          className="mt-8 inline-flex rounded-xl border border-brand-champagne/30 bg-white/5 px-8 py-3.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:border-brand-gold hover:text-brand-gold"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </ModuleShell>
  );
}
