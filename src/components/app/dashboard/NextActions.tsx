import Link from "next/link";
import type { DashboardNextAction } from "@/lib/dashboard/types";
import { ACTION_PRIORITY_STYLES } from "@/lib/dashboard/presentation";
import { ArrowRight } from "lucide-react";

type NextActionsProps = {
  actions: DashboardNextAction[];
  checklistHref?: string;
};

export default function NextActions({ actions, checklistHref }: NextActionsProps) {
  return (
    <div className="space-y-6 rounded-3xl border border-brand-champagne/10 bg-white/5 p-6 md:p-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-serif text-lg font-light text-white">Próximas Acções</h3>
        <span className="font-mono text-[9px] uppercase text-zinc-500">Lista de Tarefas</span>
      </div>

      {actions.length === 0 ? (
        <p className="font-sans text-xs font-light text-zinc-500">
          Não existem acções pendentes neste momento.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {actions.map((action) => (
            <div key={action.id} className="flex items-center justify-between gap-3 py-3 text-xs">
              <div className="space-y-1 text-left">
                {action.href ? (
                  <Link
                    href={action.href}
                    className="font-medium leading-snug text-white transition-colors hover:text-brand-gold"
                  >
                    {action.title}
                  </Link>
                ) : (
                  <p className="font-medium leading-snug text-white">{action.title}</p>
                )}
                <p className="text-[10px] font-light text-zinc-500">Prazo: {action.dueDate}</p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${
                  ACTION_PRIORITY_STYLES[action.priority] ?? ACTION_PRIORITY_STYLES.Baixa
                }`}
              >
                {action.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      {checklistHref ? (
        <div className="pt-2">
          <Link
            href={checklistHref}
            className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-gold transition-colors hover:text-white"
          >
            <span>Ver todas as tarefas</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
