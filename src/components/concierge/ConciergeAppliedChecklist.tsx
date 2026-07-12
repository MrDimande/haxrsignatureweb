import type { EventChecklistItem } from "@/lib/concierge/types";

type ConciergeAppliedChecklistProps = {
  items: EventChecklistItem[];
};

export default function ConciergeAppliedChecklist({
  items,
}: ConciergeAppliedChecklistProps) {
  if (!items.length) {
    return (
      <p className="p-6 text-sm text-stone-500 border border-stone-800">
        Nenhuma tarefa aplicada via Concierge. Aprove um documento de checklist
        na fila para ver tarefas aqui.
      </p>
    );
  }

  return (
    <div className="border border-stone-800 divide-y divide-stone-800">
      {items.map((item) => (
        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-stone-100">{item.title}</p>
            <p className="text-xs text-stone-500 mt-1">
              Prioridade: {item.priority} · Estado: {item.status}
            </p>
          </div>
          <p className="text-xs text-stone-400">
            {item.dueDate
              ? `Prazo: ${new Date(item.dueDate).toLocaleDateString("pt-MZ")}`
              : "Sem prazo"}
          </p>
        </div>
      ))}
    </div>
  );
}
