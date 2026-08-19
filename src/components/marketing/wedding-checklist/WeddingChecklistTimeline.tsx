"use client";

import { useState } from "react";
import { Plus, Filter, CheckCircle2 } from "lucide-react";
import {
  PublicChecklistTask,
  CHECKLIST_PHASES,
  ChecklistPhase,
  ChecklistCategory,
  WeddingJourney,
} from "@/lib/marketing/wedding-checklist-data";
import WeddingChecklistTaskItem from "./WeddingChecklistTaskItem";

interface WeddingChecklistTimelineProps {
  tasks: PublicChecklistTask[];
  selectedJourneys: WeddingJourney[];
  weddingDate: string | null;
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, phase: ChecklistPhase, category: ChecklistCategory) => void;
  onDeleteCustomTask: (id: string) => void;
}

export default function WeddingChecklistTimeline({
  tasks,
  selectedJourneys,
  weddingDate,
  onToggleTask,
  onAddTask,
  onDeleteCustomTask,
}: WeddingChecklistTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "completed">("all");
  const [addingPhase, setAddingPhase] = useState<ChecklistPhase | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<ChecklistCategory>("Fundação & Visão");

  // Determine current active phase based on date
  const getActivePhaseId = (): ChecklistPhase | null => {
    if (!weddingDate) return null;
    const target = new Date(weddingDate);
    if (isNaN(target.getTime())) return null;

    const now = new Date();
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "pos_evento";
    if (diffDays <= 7) return "celebracao";
    if (diffDays <= 28) return "fecho";
    if (diffDays <= 90) return "consolidacao";
    if (diffDays <= 180) return "definicao";
    if (diffDays <= 270) return "estrutura";
    return "fundacao";
  };

  const currentPhaseId = getActivePhaseId();

  // Filter tasks that apply to selected journeys
  const applicableTasks = tasks.filter((t) => {
    const matchesJourney =
      t.appliesTo.includes("all") ||
      t.appliesTo.some((j) => selectedJourneys.includes(j as WeddingJourney));
    if (!matchesJourney) return false;

    if (activeFilter === "pending") return !t.completed;
    if (activeFilter === "completed") return !!t.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent, phase: ChecklistPhase) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim(), phase, newTaskCategory);
    setNewTaskTitle("");
    setAddingPhase(null);
  };

  return (
    <div className="space-y-12">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-champagne/35 p-4 rounded-sm">
        <div className="flex items-center gap-2 text-brand-text-dark/60 font-mono text-[10px] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-brand-gold" />
          <span>Filtrar tarefas:</span>
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "Todas" },
            { id: "pending", label: "Pendentes" },
            { id: "completed", label: "Concluídas" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as typeof activeFilter)}
              className={`px-3 py-1.5 rounded-xs font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === f.id
                  ? "bg-brand-gold text-white font-bold"
                  : "bg-brand-champagne/10 hover:bg-brand-champagne/25 text-brand-text-dark/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-12 relative before:hidden md:before:block md:before:absolute md:before:top-4 md:before:bottom-4 md:before:left-[23px] md:before:w-px md:before:bg-brand-champagne/35">
        {CHECKLIST_PHASES.map((phase) => {
          const phaseTasks = applicableTasks.filter((t) => t.phase === phase.id);
          const allPhaseTasks = tasks.filter(
            (t) =>
              t.phase === phase.id &&
              (t.appliesTo.includes("all") ||
                t.appliesTo.some((j) => selectedJourneys.includes(j as WeddingJourney)))
          );

          const totalInPhase = allPhaseTasks.length;
          const completedInPhase = allPhaseTasks.filter((t) => t.completed).length;
          const isCurrent = currentPhaseId === phase.id;
          const isPhaseCompleted = totalInPhase > 0 && completedInPhase === totalInPhase;

          return (
            <section
              key={phase.id}
              id={`phase-${phase.id}`}
              className={`relative md:pl-16 transition-all ${
                isCurrent ? "opacity-100" : "opacity-95"
              }`}
            >
              {/* Timeline Marker Dot (Desktop) */}
              <div
                className={`hidden md:flex absolute top-1.5 left-3 w-6 h-6 -translate-x-1/2 rounded-full border items-center justify-center text-[10px] font-mono font-bold transition-all ${
                  isPhaseCompleted
                    ? "bg-brand-gold border-brand-gold text-white"
                    : isCurrent
                    ? "bg-brand-ivory border-brand-gold text-brand-gold ring-4 ring-brand-gold/20"
                    : "bg-white border-brand-champagne/60 text-brand-text-dark/60"
                }`}
              >
                {isPhaseCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  phase.roman
                )}
              </div>

              {/* Phase Header Card */}
              <div
                className={`p-6 md:p-8 rounded-sm border transition-all mb-6 ${
                  isCurrent
                    ? "bg-brand-ivory/80 border-brand-gold/60 shadow-xs"
                    : "bg-white border-brand-champagne/35"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-gold font-bold">
                        FASE {phase.roman} · {phase.period}
                      </span>
                      {isCurrent && (
                        <span className="font-mono text-[8px] uppercase tracking-wider text-brand-gold bg-brand-gold/15 px-2 py-0.5 rounded-full border border-brand-gold/30 font-bold">
                          FASE ACTUAL
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl md:text-2xl text-brand-text-dark font-light">
                      {phase.title}
                    </h3>
                    <p className="font-sans text-xs text-brand-text-dark/60 font-light leading-relaxed">
                      {phase.description}
                    </p>
                  </div>

                  {/* Phase Progress Badge */}
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-brand-text-dark/50">
                        Progresso da Fase
                      </p>
                      <p className="font-mono text-xs font-bold text-brand-gold">
                        {completedInPhase} de {totalInPhase} concluídas
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-brand-champagne/40 bg-brand-ivory flex items-center justify-center font-mono text-[11px] font-bold text-brand-text-dark/80">
                      {totalInPhase > 0
                        ? `${Math.round((completedInPhase / totalInPhase) * 100)}%`
                        : "0%"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              {phaseTasks.length === 0 ? (
                <div className="bg-white/50 border border-brand-champagne/25 p-6 rounded-sm text-center">
                  <p className="font-sans text-xs text-brand-text-dark/40 font-light">
                    Nenhuma tarefa pendente nesta fase com o filtro actual.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {phaseTasks.map((task) => (
                    <WeddingChecklistTaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteCustomTask}
                    />
                  ))}
                </div>
              )}

              {/* Add Custom Task to Phase Button/Form */}
              <div className="mt-4">
                {addingPhase === phase.id ? (
                  <form
                    onSubmit={(e) => handleCreateTask(e, phase.id)}
                    className="bg-white border border-brand-gold/40 p-4 rounded-sm space-y-3 shadow-xs animate-fade-in"
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Descreva a sua tarefa pessoal..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 bg-brand-ivory/40 border border-brand-champagne/70 focus:border-brand-gold text-xs p-2.5 rounded-sm outline-none font-sans"
                      />
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value as ChecklistCategory)}
                        className="bg-brand-ivory/40 border border-brand-champagne/70 focus:border-brand-gold text-xs p-2.5 rounded-sm outline-none font-sans"
                      >
                        <option value="Fundação & Visão">Fundação & Visão</option>
                        <option value="Orçamento">Orçamento</option>
                        <option value="Local & Logística">Local & Logística</option>
                        <option value="Fornecedores">Fornecedores</option>
                        <option value="Convidados">Convidados</option>
                        <option value="Convites & Identidade">Convites & Identidade</option>
                        <option value="Trajes & Beleza">Trajes & Beleza</option>
                        <option value="Cerimónia & Tradição">Cerimónia & Tradição</option>
                        <option value="Recepção & Experiência">Recepção & Experiência</option>
                        <option value="Fecho & Dia-D">Fecho & Dia-D</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingPhase(null);
                          setNewTaskTitle("");
                        }}
                        className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-text-dark/50 hover:text-brand-text-dark transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Adicionar Tarefa
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingPhase(phase.id);
                      setNewTaskTitle("");
                    }}
                    className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-gold hover:text-brand-gold-light hover:underline pt-2 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar tarefa personalizada à Fase {phase.roman}</span>
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
