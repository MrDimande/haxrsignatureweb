"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  ModuleEmptyState,
  ModuleErrorState,
  ModuleSkeleton,
} from "@/components/app/modules/ModuleShell";
import type { ModuleDataResult } from "@/lib/event-modules/types";

type ModulePageClientProps<T> = {
  eventId: string;
  modulePath: string;
  apiPath?: string;
  initialResult: ModuleDataResult<T>;
  emptyTitle?: string;
  emptyDescription?: string;
  children: (data: T) => ReactNode;
};

export default function ModulePageClient<T>({
  eventId,
  modulePath,
  apiPath,
  initialResult,
  emptyTitle = "Ainda não existe um evento activo.",
  emptyDescription = "Crie o vosso evento para começar a usar este módulo.",
  children,
}: ModulePageClientProps<T>) {
  const [result, setResult] = useState(initialResult);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const url =
        apiPath ?? `/api/events/${encodeURIComponent(eventId)}/${modulePath}`;
      const response = await fetch(url, { cache: "no-store" });
      const payload = (await response.json()) as ModuleDataResult<T>;
      setResult(payload);
    } catch {
      setResult({
        ok: false,
        error: "unavailable",
        message: "Não foi possível carregar o módulo.",
      });
    } finally {
      setRetrying(false);
    }
  }, [eventId, modulePath, apiPath]);

  if (retrying) return <ModuleSkeleton />;

  if (!result.ok) {
    if (result.error === "not_found") {
      return (
        <ModuleEmptyState
          title={emptyTitle}
          description={emptyDescription}
          cta={{ label: "Criar novo evento", href: "/onboarding" }}
        />
      );
    }

    if (
      result.error === "forbidden" ||
      result.error === "operational_not_linked" ||
      result.error === "unauthorized"
    ) {
      return (
        <ModuleErrorState
          message={
            result.message ??
            (result.error === "forbidden"
              ? "Não tem permissão para aceder a este evento."
              : result.error === "operational_not_linked"
                ? "O evento operacional ainda não está ligado."
                : "Sessão inválida ou expirada.")
          }
          onRetry={result.error === "unauthorized" ? undefined : handleRetry}
        />
      );
    }

    return <ModuleErrorState message={result.message} onRetry={handleRetry} />;
  }

  return <>{children(result.data)}</>;
}
