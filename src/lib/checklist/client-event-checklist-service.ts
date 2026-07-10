import {
  resolveClientEventDashboardAccess,
  type ClientEventDashboardAuthClient,
} from "@/lib/dashboard/client-event-dashboard-service";
import type { ClientEventRow } from "@/lib/events/client-app-database.types";
import type {
  ChecklistCategory,
  ChecklistModuleData,
  ChecklistPriority,
  ChecklistStatus,
  ChecklistTask,
  EventModuleContext,
} from "@/lib/event-modules/types";
import {
  ClientEventChecklistRpcError,
  fetchClientEventChecklistViaRpc,
  type ClientEventChecklistRpcClient,
  type ClientEventChecklistRpcItemRow,
  type ClientEventChecklistRpcPayload,
} from "@/lib/checklist/client-event-checklist-rpc";

export type ClientEventChecklistAuthClient = ClientEventDashboardAuthClient;

export type ClientEventChecklistAccessResult =
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "operational_not_linked"; event: ClientEventRow }
  | { kind: "unavailable"; message: string }
  | { kind: "ok"; data: ChecklistModuleData };

export { ClientEventChecklistRpcError };

function formatEventDate(date: string | null): string {
  if (!date) return "Data por definir";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function mapEventTypeLabel(type: ClientEventRow["event_type"]): string {
  switch (type) {
    case "wedding":
      return "Casamento";
    case "birthday":
      return "Aniversário";
    case "corporate":
      return "Evento corporativo";
    case "baby_shower":
      return "Baby shower";
    case "graduation":
      return "Formatura";
    case "other":
      return "Evento";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function buildChecklistModuleContext(event: ClientEventRow): EventModuleContext {
  return {
    eventId: event.id,
    currency: "MT",
    eventOverview: {
      name: event.event_name,
      type: mapEventTypeLabel(event.event_type),
      date: formatEventDate(event.event_date),
      location: event.event_location || "Local por definir",
      status: event.status === "planning" ? "Em planeamento" : event.status,
      slug: event.slug,
    },
  };
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function isDbChecklistCompleted(status: string): boolean {
  const normalized = normalizeToken(status);
  return (
    normalized === "completed" ||
    normalized === "done" ||
    normalized === "concluido" ||
    normalized === "concluida"
  );
}

export function mapDbChecklistStatusToUiStatus(
  status: string,
  dueDate: string | null,
): ChecklistStatus {
  if (isDbChecklistCompleted(status)) return "concluída";

  const normalized = normalizeToken(status);
  if (normalized.includes("curso") || normalized.includes("progress")) return "em_curso";

  if (dueDate) {
    const due = new Date(`${dueDate}T23:59:59`);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
      return "atrasada";
    }
  }

  return "aberta";
}

export function mapDbChecklistPriorityToUiPriority(priority: string): ChecklistPriority {
  const normalized = normalizeToken(priority);
  if (normalized.includes("alta") || normalized.includes("high") || normalized.includes("urgent")) {
    return "alta";
  }
  if (normalized.includes("baixa") || normalized.includes("low")) {
    return "baixa";
  }
  return "média";
}

function mapPriorityToCategory(priority: ChecklistPriority): ChecklistCategory {
  switch (priority) {
    case "alta":
      return { id: "priority-high", name: "Prioridade alta" };
    case "média":
      return { id: "priority-medium", name: "Prioridade média" };
    case "baixa":
      return { id: "priority-low", name: "Prioridade baixa" };
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

function formatDueDateLabel(dueDate: string | null): string {
  if (!dueDate) return "Sem prazo";
  const parsed = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dueDate;

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueDay = new Date(parsed);
  dueDay.setHours(12, 0, 0, 0);

  if (dueDay.getTime() === today.getTime()) return "Hoje";
  if (dueDay.getTime() === tomorrow.getTime()) return "Amanhã";
  if (dueDay.getTime() < today.getTime()) return "Em atraso";

  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapItemRowToUiTask(row: ClientEventChecklistRpcItemRow): ChecklistTask {
  const priority = mapDbChecklistPriorityToUiPriority(row.priority);
  const category = mapPriorityToCategory(priority);

  return {
    id: row.id,
    title: row.title,
    categoryId: category.id,
    category: category.name,
    assignee: "Equipa HAXR",
    priority,
    status: mapDbChecklistStatusToUiStatus(row.status, row.due_date),
    dueDate: formatDueDateLabel(row.due_date),
    dueDateIso: row.due_date ?? undefined,
  };
}

function buildCategoriesFromTasks(tasks: ChecklistTask[]): ChecklistCategory[] {
  const seen = new Map<string, ChecklistCategory>();
  for (const task of tasks) {
    if (!seen.has(task.categoryId)) {
      seen.set(task.categoryId, { id: task.categoryId, name: task.category });
    }
  }
  return Array.from(seen.values());
}

function countPriorityTasks(tasks: ChecklistTask[]): number {
  return tasks.filter((task) => task.priority === "alta" && task.status !== "concluída").length;
}

export function mapRpcPayloadToChecklistModuleData(
  event: ClientEventRow,
  payload: ClientEventChecklistRpcPayload,
): ChecklistModuleData {
  const tasks = payload.items.map(mapItemRowToUiTask);
  const categories = buildCategoriesFromTasks(tasks);

  return {
    context: buildChecklistModuleContext(event),
    summary: {
      total: payload.summary.totalTasks,
      completed: payload.summary.completedTasks,
      overdue: payload.summary.overdueTasks,
      priority: countPriorityTasks(tasks),
      progress: Math.round(payload.summary.completionRate),
    },
    categories,
    tasks,
  };
}

export async function getClientEventChecklistData(input: {
  authClient: ClientEventChecklistAuthClient;
  rpcClient: ClientEventChecklistRpcClient;
  userId: string;
  eventId: string;
}): Promise<ClientEventChecklistAccessResult> {
  const access = await resolveClientEventDashboardAccess(
    input.authClient,
    input.userId,
    input.eventId,
  );

  if (access.kind === "not_found") {
    return { kind: "not_found" };
  }

  if (access.kind === "forbidden") {
    return { kind: "forbidden" };
  }

  if (!access.event.operational_event_id) {
    return { kind: "operational_not_linked", event: access.event };
  }

  try {
    const payload = await fetchClientEventChecklistViaRpc(
      input.rpcClient,
      access.event.id,
    );

    return {
      kind: "ok",
      data: mapRpcPayloadToChecklistModuleData(access.event, payload),
    };
  } catch (error) {
    if (error instanceof ClientEventChecklistRpcError) {
      if (error.code === "client_event_not_found") {
        return { kind: "not_found" };
      }
      if (error.code === "operational_not_linked") {
        return { kind: "operational_not_linked", event: access.event };
      }
    }

    return {
      kind: "unavailable",
      message: "Não foi possível carregar a checklist operacional.",
    };
  }
}
