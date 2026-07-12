"use client";

import { useCallback, useMemo, useState } from "react";
import type { ConciergeModuleData, ConciergeServiceResult } from "@/lib/concierge/portal/types";
import type { IntakeTab } from "./ConciergeIntakeHub";
import ConciergeHeader from "./ConciergeHeader";
import ConciergeStats from "./ConciergeStats";
import ConciergeIntakeHub from "./ConciergeIntakeHub";
import ConciergeInbox from "./ConciergeInbox";
import ConciergeDetailPanel from "./ConciergeDetailPanel";
import { ConciergeEmptyState, ConciergeErrorState, ConciergeSkeleton } from "./ConciergeStates";
import { ConciergeActivityFeed } from "./ConciergeSuggestions";

type ConciergePageClientProps = {
  eventId: string;
  initialResult: ConciergeServiceResult<ConciergeModuleData>;
  /** Base API path — default `/api/concierge`; portal usa `/api/portal/[token]/concierge`. */
  apiBasePath?: string;
};

export default function ConciergePageClient({
  eventId,
  initialResult,
  apiBasePath = "/api/concierge",
}: ConciergePageClientProps) {
  const [result, setResult] = useState(initialResult);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialResult.ok ? initialResult.data.inboxItems[0]?.id ?? null : null
  );
  const [intakeTab, setIntakeTab] = useState<IntakeTab>("upload");
  const [filterValidation, setFilterValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const data = result.ok ? result.data : null;

  const selectedItem = useMemo(
    () => data?.inboxItems.find((i) => i.id === selectedId) ?? null,
    [data, selectedId]
  );

  const refresh = useCallback(async () => {
    const response = await fetch(
      `${apiBasePath}?eventId=${encodeURIComponent(eventId)}`,
      { cache: "no-store" }
    );
    const payload = (await response.json()) as ConciergeServiceResult<ConciergeModuleData>;
    setResult(payload);
    if (payload.ok && payload.data.inboxItems.length > 0 && !selectedId) {
      setSelectedId(payload.data.inboxItems[0].id);
    }
    return payload;
  }, [apiBasePath, eventId, selectedId]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await refresh();
    } catch {
      setResult({
        ok: false,
        error: "load_failed",
        message: "Não foi possível carregar o HAXR Concierge.",
      });
    } finally {
      setIsRetrying(false);
    }
  }, [refresh]);

  const postAction = useCallback(
    async (url: string, body?: Record<string, unknown>) => {
      setIsProcessing(true);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        const payload = (await response.json()) as ConciergeServiceResult<ConciergeModuleData>;
        if (payload.ok) {
          setResult(payload);
        }
        return payload;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const handleIntake = useCallback(
    async (source: "upload" | "manual_note" | "web_clip", body: Record<string, unknown>) => {
      setIsSubmitting(true);
      try {
        const response = await fetch(`${apiBasePath}/intake`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, source, ...body }),
        });
        const payload = (await response.json()) as ConciergeServiceResult<ConciergeModuleData>;
        if (payload.ok) {
          setResult(payload);
          setSelectedId(payload.data.inboxItems[0]?.id ?? null);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [apiBasePath, eventId]
  );

  if (isRetrying) return <ConciergeSkeleton />;

  if (!result.ok || !data) {
    return (
      <ConciergeErrorState
        message={result.ok ? "" : result.message}
        onRetry={handleRetry}
      />
    );
  }

  if (data.inboxItems.length === 0) {
    return (
      <div className="space-y-8 pb-12">
        <ConciergeHeader
          data={data}
          onPrimaryAction={setIntakeTab}
          onSecondaryAction={() => setFilterValidation(true)}
        />
        <ConciergeEmptyState onUpload={() => setIntakeTab("upload")} />
        <ConciergeIntakeHub
          activeTab={intakeTab}
          onTabChange={setIntakeTab}
          inboundEmail={data.inboundEmailAddress}
          isSubmitting={isSubmitting}
          onUpload={(p) =>
            handleIntake("upload", {
              title: p.title,
              description: p.description,
              file: {
                fileName: p.fileName,
                mimeType: p.mimeType,
                sizeBytes: p.sizeBytes,
              },
              fileBase64: p.fileBase64,
              suggestedDestination: p.destination,
            })
          }
          onSaveLink={(p) =>
            handleIntake("web_clip", {
              title: p.title,
              description: p.notes,
              url: p.url,
              clippedTitle: p.title,
              suggestedDestination: p.destination,
            })
          }
          onSaveNote={(p) =>
            handleIntake("manual_note", {
              title: p.title,
              manualText: p.body,
              priority: p.priority,
              suggestedDestination: p.destination,
            })
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <ConciergeHeader
        data={data}
        onPrimaryAction={(tab) => {
          setIntakeTab(tab);
          setFilterValidation(false);
        }}
        onSecondaryAction={() => setFilterValidation((v) => !v)}
      />

      <ConciergeStats stats={data.stats} />

      <ConciergeIntakeHub
        activeTab={intakeTab}
        onTabChange={setIntakeTab}
        inboundEmail={data.inboundEmailAddress}
        isSubmitting={isSubmitting}
        onUpload={(p) =>
          handleIntake("upload", {
            title: p.title,
            description: p.description,
            file: {
              fileName: p.fileName,
              mimeType: p.mimeType,
              sizeBytes: p.sizeBytes,
            },
            fileBase64: p.fileBase64,
            suggestedDestination: p.destination,
          })
        }
        onSaveLink={(p) =>
          handleIntake("web_clip", {
            title: p.title,
            description: p.notes,
            url: p.url,
            clippedTitle: p.title,
            suggestedDestination: p.destination,
          })
        }
        onSaveNote={(p) =>
          handleIntake("manual_note", {
            title: p.title,
            manualText: p.body,
            priority: p.priority,
            suggestedDestination: p.destination,
          })
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ConciergeInbox
          items={data.inboxItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filterValidation={filterValidation}
          showConfidence={data.workspaceMeta.permissions.showConfidence}
        />
        <ConciergeDetailPanel
          item={selectedItem}
          data={data}
          isProcessing={isProcessing}
          onClassify={() =>
            selectedId &&
            postAction(`${apiBasePath}/classify`, { eventId, itemId: selectedId })
          }
          onValidate={() =>
            selectedId &&
            postAction(`${apiBasePath}/items/${selectedId}/validate`, { eventId })
          }
          onRoute={() =>
            selectedId &&
            postAction(`${apiBasePath}/items/${selectedId}/route`, { eventId })
          }
          onReject={() =>
            selectedId &&
            postAction(`${apiBasePath}/items/${selectedId}/reject`, { eventId })
          }
          onArchive={() =>
            selectedId &&
            postAction(`${apiBasePath}/items/${selectedId}/archive`, { eventId })
          }
        />
      </div>

      <ConciergeActivityFeed activities={data.activities.slice(0, 5)} />
    </div>
  );
}
