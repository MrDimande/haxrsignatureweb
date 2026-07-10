import type { DashboardData } from "@/lib/dashboard/types";
import {
  mapDbChecklistPriorityToUiPriority,
  mapDbChecklistStatusToUiStatus,
} from "@/lib/checklist/client-event-checklist-service";
import type {
  ClientEventChecklistRpcPayload,
  ClientEventChecklistRpcTaskRef,
} from "@/lib/checklist/client-event-checklist-rpc";

/** Checklist KPIs shared by the checklist module and client dashboard. */
export type ClientEventDashboardChecklistMetrics = {
  checklistTotal: number;
  checklistCompleted: number;
  checklistSnapshot: DashboardData["checklistSnapshot"];
};

function formatSnapshotDueDate(dueDate: string | null): string {
  if (!dueDate) return "Sem prazo";
  const parsed = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return parsed.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapTaskRefToSnapshotItem(
  task: ClientEventChecklistRpcTaskRef,
): DashboardData["checklistSnapshot"][number] {
  const priority = mapDbChecklistPriorityToUiPriority(task.priority);
  const status = mapDbChecklistStatusToUiStatus(task.status, task.due_date);

  return {
    id: task.id,
    title: task.title,
    dueDate: formatSnapshotDueDate(task.due_date),
    priority,
    status,
  };
}

export function mapRpcPayloadToDashboardChecklistMetrics(
  payload: ClientEventChecklistRpcPayload,
): ClientEventDashboardChecklistMetrics {
  const urgent = payload.summary.urgentTasks.map(mapTaskRefToSnapshotItem);
  const snapshot =
    urgent.length > 0
      ? urgent
      : payload.summary.nextTask
        ? [mapTaskRefToSnapshotItem(payload.summary.nextTask)]
        : payload.items.slice(0, 5).map((item) =>
            mapTaskRefToSnapshotItem({
              id: item.id,
              title: item.title,
              due_date: item.due_date,
              priority: item.priority,
              status: item.status,
              created_at: item.created_at,
            }),
          );

  return {
    checklistTotal: payload.summary.totalTasks,
    checklistCompleted: payload.summary.completedTasks,
    checklistSnapshot: snapshot,
  };
}
