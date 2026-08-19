"use client";

import { CheckCircle2, Circle, ArrowUpRight, Trash2, Heart } from "lucide-react";
import Link from "next/link";
import { PublicChecklistTask } from "@/lib/marketing/wedding-checklist-data";

interface WeddingChecklistTaskItemProps {
  task: PublicChecklistTask;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function WeddingChecklistTaskItem({
  task,
  onToggle,
  onDelete,
}: WeddingChecklistTaskItemProps) {
  const isSpecial = task.special;

  if (isSpecial) {
    return (
      <div
        className={`relative p-5 rounded-sm border transition-all duration-300 ${
          task.completed
            ? "bg-brand-gold/10 border-brand-gold/40 text-brand-text-dark/60"
            : "bg-gradient-to-r from-brand-gold/15 via-brand-champagne/15 to-brand-gold/10 border-brand-gold/50 shadow-xs"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => onToggle(task.id)}
            className="flex items-start gap-3.5 text-left cursor-pointer flex-1 group"
            aria-pressed={task.completed}
          >
            <div className="shrink-0 mt-0.5">
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-brand-gold fill-brand-gold/20" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-brand-gold flex items-center justify-center group-hover:bg-brand-gold/20 transition-colors">
                  <Heart className="w-2.5 h-2.5 text-brand-gold fill-brand-gold" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p
                className={`font-serif text-base md:text-lg italic font-normal tracking-wide text-brand-text-dark ${
                  task.completed ? "line-through opacity-60" : ""
                }`}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold font-bold px-2 py-0.5 bg-brand-gold/10 rounded-full border border-brand-gold/30">
                  MARCO DE OURO · DIA-D
                </span>
                <span className="font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/50">
                  {task.category}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative p-4 rounded-sm border transition-all duration-200 ${
        task.completed
          ? "bg-brand-champagne/10 border-brand-champagne/20 text-brand-text-dark/45"
          : "bg-white border-brand-champagne/35 hover:border-brand-gold/50 hover:shadow-xs text-brand-text-dark"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Toggle Button & Text */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className="flex items-start gap-3.5 text-left cursor-pointer flex-1"
          aria-pressed={task.completed}
        >
          <div className="shrink-0 mt-0.5">
            {task.completed ? (
              <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0 transition-transform duration-200 scale-105" />
            ) : (
              <Circle className="w-4 h-4 text-brand-champagne group-hover:text-brand-gold shrink-0 transition-colors" />
            )}
          </div>
          <div className="space-y-1.5 flex-1 pr-2">
            <p
              className={`font-sans text-xs md:text-sm leading-relaxed transition-all ${
                task.completed ? "line-through opacity-60 font-light" : "font-light"
              }`}
            >
              {task.title}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[8px] uppercase tracking-wider text-brand-text-dark/50 bg-brand-champagne/15 px-2 py-0.5 rounded-xs">
                {task.category}
              </span>
              {task.custom && (
                <span className="font-mono text-[8px] uppercase tracking-wider text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-xs border border-brand-gold/25">
                  Personalizada
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Right Actions: Contextual Link / Delete */}
        <div className="flex items-center gap-2 shrink-0">
          {task.relatedHref && task.relatedLabel && (
            <Link
              href={task.relatedHref}
              className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-brand-gold hover:text-brand-gold-light hover:underline bg-brand-gold/5 px-2 py-1 rounded-xs border border-brand-gold/20 transition-colors"
              title={task.relatedLabel}
            >
              <span>{task.relatedLabel}</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </Link>
          )}

          {task.custom && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="text-brand-text-dark/30 hover:text-red-600 transition-colors p-1"
              title="Eliminar tarefa personalizada"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
