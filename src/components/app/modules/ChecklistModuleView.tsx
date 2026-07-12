"use client";

import type { ChecklistModuleData } from "@/lib/event-modules/types";
import {
  CHECKLIST_PRIORITY_STYLES,
  CHECKLIST_STATUS_STYLES,
} from "@/lib/event-modules/presentation";
import { formatPercentage } from "@/lib/formatters";
import {
  EventContextBar,
  ModuleEmptyState,
  ModuleHeader,
  ModulePanel,
  ModuleShell,
  ModuleStatGrid,
} from "@/components/app/modules/ModuleShell";

export default function ChecklistModuleView({ data }: { data: ChecklistModuleData }) {
  const { summary, tasks, categories } = data;
  const hasTasks = tasks.length > 0;

  const tasksByCategory = categories.map((cat) => ({
    category: cat,
    tasks: tasks.filter((t) => t.categoryId === cat.id),
  }));

  return (
    <ModuleShell>
      <ModuleHeader
        label="Checklist"
        title="Planeamento & Tarefas"
        description="Consulte tarefas operacionais, prioridades, prazos e progresso do evento."
      />

      <EventContextBar context={data.context} />

      <ModuleStatGrid
        stats={[
          { label: "Total tarefas", value: summary.total },
          { label: "Concluídas", value: summary.completed },
          { label: "Em atraso", value: summary.overdue },
          { label: "Prioritárias", value: summary.priority },
          { label: "Progresso geral", value: formatPercentage(summary.progress) },
        ]}
      />

      {!hasTasks ? (
        <ModuleEmptyState
          title="Ainda não há tarefas na checklist"
          description="Quando a equipa HAXR ou o Concierge validar tarefas operacionais para este evento, elas aparecerão aqui com prioridade, prazo e estado."
        />
      ) : (
        <div className="space-y-6">
          {tasksByCategory.map(({ category, tasks: catTasks }) => (
            <ModulePanel key={category.id} title={category.name}>
              {catTasks.length === 0 ? (
                <p className="text-xs text-zinc-500">Sem tarefas nesta categoria.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {catTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-white">{task.title}</p>
                        <p className="text-zinc-500">
                          {task.assignee} · Prazo: {task.dueDate}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase ${CHECKLIST_PRIORITY_STYLES[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase ${CHECKLIST_STATUS_STYLES[task.status]}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModulePanel>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}
