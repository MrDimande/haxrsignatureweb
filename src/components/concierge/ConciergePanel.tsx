"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Gem,
  Upload,
  X,
} from "lucide-react";
import {
  decideConciergeReviewAction,
  getConciergeFileUrlAction,
  reprocessConciergeUploadAction,
  uploadConciergeDocumentAction,
} from "@/lib/concierge/actions/concierge.actions";
import {
  CONCIERGE_DOC_LABELS,
  CONCIERGE_STATUS_LABELS,
  CONCIERGE_SUB_TAB_LABELS,
} from "@/lib/concierge/concierge-labels";
import {
  formatConfidencePercent,
  getConfidenceLevel,
  readConfidenceFromExtractedData,
} from "@/lib/concierge/concierge-confidence";
import {
  parseAndValidateConciergeJson,
  type FieldValidationError,
} from "@/lib/concierge/validate-extraction";
import {
  getApplicabilityLabel,
  IRRELEVANT_OPERATOR_MESSAGE,
  isConciergeExtractionApplicable,
  isIrrelevantExtraction,
  readRejectionReason,
} from "@/lib/concierge/concierge-applicability";
import { isPreviewableMime } from "@/components/concierge/ConciergeAppliedMoodboard";
import ConciergeAppliedVendors from "@/components/concierge/ConciergeAppliedVendors";
import ConciergeAppliedChecklist from "@/components/concierge/ConciergeAppliedChecklist";
import ConciergeAppliedMoodboard from "@/components/concierge/ConciergeAppliedMoodboard";
import type {
  ConciergeDocType,
  ConciergeReviewItem,
  ConciergeSubTab,
  EventChecklistItem,
  EventMoodboardItem,
  EventVendor,
} from "@/lib/concierge/types";

type Filter = "pending_review" | "approved" | "rejected" | "all";

type ConciergePanelProps = {
  eventId: string;
  initialReviews: ConciergeReviewItem[];
  initialVendors: EventVendor[];
  initialChecklist: EventChecklistItem[];
  initialMoodboard: EventMoodboardItem[];
  aiConfigured: boolean;
  aiModel: string;
  onNavigateTab?: (tab: "guests") => void;
};

function ConfidenceBadge({ extractedData }: { extractedData: Record<string, unknown> }) {
  const confidence = readConfidenceFromExtractedData(extractedData);
  const level = getConfidenceLevel(confidence);

  if (confidence == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium border border-stone-700 text-stone-500">
        Confiança: —
      </span>
    );
  }

  if (level === "low") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border border-amber-500/40 bg-amber-500/10 text-amber-300">
        <AlertTriangle className="w-3 h-3" />
        Confiança baixa ({formatConfidencePercent(confidence)}) — revisão cuidadosa
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
      Confiança alta ({formatConfidencePercent(confidence)})
    </span>
  );
}

function subTabForDocumentType(docType: ConciergeDocType): ConciergeSubTab {
  switch (docType) {
    case "vendor_proposal":
      return "fornecedores";
    case "checklist":
      return "checklist";
    case "visual_reference":
      return "moodboard";
    default:
      return "fila";
  }
}

function ApplicabilityBadge({ extractedData }: { extractedData: Record<string, unknown> }) {
  const label = getApplicabilityLabel(extractedData);
  const irrelevant = isIrrelevantExtraction(extractedData);

  if (irrelevant || label === "Não aplicável" || label.startsWith("Não aplicável")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium border border-red-500/40 bg-red-500/10 text-red-300">
        {irrelevant ? "Irrelevante" : label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
      {label}
    </span>
  );
}

function parseEditJsonRecord(editJson: string): Record<string, unknown> | null {
  try {
    return JSON.parse(editJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function ConciergePanel({
  eventId,
  initialReviews,
  initialVendors,
  initialChecklist,
  initialMoodboard,
  aiConfigured,
  aiModel,
  onNavigateTab,
}: ConciergePanelProps) {
  const router = useRouter();
  const [subTab, setSubTab] = useState<ConciergeSubTab>("fila");
  const [reviews, setReviews] = useState(initialReviews);
  const [vendors, setVendors] = useState(initialVendors);
  const [checklist, setChecklist] = useState(initialChecklist);
  const [moodboard, setMoodboard] = useState(initialMoodboard);
  const [filter, setFilter] = useState<Filter>("pending_review");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialReviews.find((r) => r.status === "pending_review")?.id ?? null
  );
  const [editJson, setEditJson] = useState("");
  const [validationErrors, setValidationErrors] = useState<FieldValidationError[]>(
    []
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastAppliedType, setLastAppliedType] = useState<ConciergeDocType | null>(
    null
  );
  const [fileUrlLoading, setFileUrlLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => reviews.find((r) => r.id === selectedId) ?? null,
    [reviews, selectedId]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    return reviews.filter((r) => r.status === filter);
  }, [reviews, filter]);

  const selectReview = useCallback((item: ConciergeReviewItem) => {
    setSelectedId(item.id);
    setEditJson(JSON.stringify(item.extractedData, null, 2));
    setValidationErrors([]);
    setActionError(null);
    setActionMessage(null);
    setLastAppliedType(null);
  }, []);

  useEffect(() => {
    setReviews(initialReviews);
    setVendors(initialVendors);
    setChecklist(initialChecklist);
    setMoodboard(initialMoodboard);
  }, [initialReviews, initialVendors, initialChecklist, initialMoodboard]);

  useEffect(() => {
    if (!selected) return;
    const source =
      selected.finalData && selected.status === "pending_review"
        ? selected.finalData
        : selected.extractedData;
    setEditJson(JSON.stringify(source, null, 2));
  }, [selected]);

  const validateBeforeApprove = useCallback((): boolean => {
    const result = parseAndValidateConciergeJson(editJson);
    if (!result.ok) {
      setValidationErrors(result.errors);
      return false;
    }
    const record = result.data as unknown as Record<string, unknown>;
    if (!isConciergeExtractionApplicable(record)) {
      setValidationErrors([
        {
          path: "documentType",
          message: isIrrelevantExtraction(record)
            ? IRRELEVANT_OPERATOR_MESSAGE
            : "Este documento não pode ser aplicado automaticamente.",
        },
      ]);
      return false;
    }
    setValidationErrors([]);
    return true;
  }, [editJson]);

  const editRecord = useMemo(() => parseEditJsonRecord(editJson), [editJson]);
  const canApproveApply = useMemo(() => {
    if (!selected || selected.status !== "pending_review") return false;
    if (!editRecord) return false;
    if (!isConciergeExtractionApplicable(editRecord)) return false;
    const validation = parseAndValidateConciergeJson(editJson);
    return validation.ok;
  }, [selected, editJson, editRecord]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setActionMessage(null);
    setSubTab("fila");

    const formData = new FormData();
    formData.set("eventId", eventId);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadConciergeDocumentAction(formData);
      if (!result.success) {
        setUploadError(result.error);
        return;
      }
      setActionMessage("Documento processado. Revise os dados na fila.");
      router.refresh();
    });

    e.target.value = "";
  };

  const handleApprove = () => {
    if (!selected) return;
    if (!validateBeforeApprove()) return;

    setActionError(null);
    setActionMessage(null);
    setLastAppliedType(null);

    startTransition(async () => {
      const result = await decideConciergeReviewAction({
        reviewId: selected.id,
        action: "approve",
        finalDataJson: editJson,
      });

      if (!result.success) {
        setActionError(result.error);
        return;
      }

      const data = result.data as { message?: string; documentType?: ConciergeDocType };
      setActionMessage(data?.message ?? "Aplicado com sucesso.");
      if (data?.documentType) {
        setLastAppliedType(data.documentType);
        if (data.documentType !== "payment_receipt" && data.documentType !== "guest_list") {
          setSubTab(subTabForDocumentType(data.documentType));
        }
      }
      router.refresh();
    });
  };

  const handleReject = () => {
    if (!selected) return;
    setActionError(null);
    setActionMessage(null);

    startTransition(async () => {
      const result = await decideConciergeReviewAction({
        reviewId: selected.id,
        action: "reject",
      });

      if (!result.success) {
        setActionError(result.error);
        return;
      }

      setActionMessage(result.data?.message ?? "Item rejeitado.");
      router.refresh();
    });
  };

  const handleReprocess = () => {
    if (!selected?.uploadId) return;
    setActionError(null);
    setActionMessage(null);

    startTransition(async () => {
      const result = await reprocessConciergeUploadAction(selected.uploadId);
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      setActionMessage(result.data?.message ?? "Reprocessado.");
      router.refresh();
    });
  };

  const handleOpenOriginalFile = () => {
    const path = selected?.upload?.storagePath;
    if (!path) {
      setActionError("Ficheiro original não disponível.");
      return;
    }

    setFileUrlLoading(true);
    setActionError(null);
    startTransition(async () => {
      const result = await getConciergeFileUrlAction({
        eventId,
        storagePath: path,
      });
      setFileUrlLoading(false);
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  };

  const renderPostApplyLinks = () => {
    if (!lastAppliedType) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {lastAppliedType === "payment_receipt" && (
          <Link
            href="/admin/cash"
            className="text-xs text-admin-gold border border-admin-gold/40 px-2 py-1 hover:bg-admin-gold/10"
          >
            Ver financeiro →
          </Link>
        )}
        {lastAppliedType === "guest_list" && onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab("guests")}
            className="text-xs text-admin-gold border border-admin-gold/40 px-2 py-1 hover:bg-admin-gold/10"
          >
            Ver convidados →
          </button>
        )}
        {lastAppliedType === "vendor_proposal" && (
          <button
            type="button"
            onClick={() => setSubTab("fornecedores")}
            className="text-xs text-admin-gold border border-admin-gold/40 px-2 py-1 hover:bg-admin-gold/10"
          >
            Ver fornecedores →
          </button>
        )}
        {lastAppliedType === "checklist" && (
          <button
            type="button"
            onClick={() => setSubTab("checklist")}
            className="text-xs text-admin-gold border border-admin-gold/40 px-2 py-1 hover:bg-admin-gold/10"
          >
            Ver checklist →
          </button>
        )}
        {lastAppliedType === "visual_reference" && (
          <button
            type="button"
            onClick={() => setSubTab("moodboard")}
            className="text-xs text-admin-gold border border-admin-gold/40 px-2 py-1 hover:bg-admin-gold/10"
          >
            Ver moodboard →
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 p-5 border border-admin-gold/20 bg-admin-gold/5">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 border border-admin-gold/40 text-admin-gold">
            <Gem className="w-5 h-5" strokeWidth={1.5} />
          </span>
          <div>
            <h3 className="font-serif text-lg text-stone-100">HAXR Concierge</h3>
            <p className="text-sm text-stone-400 mt-1 max-w-xl">
              A IA organiza. A equipa HAXR valida. Nada é aplicado sem a sua
              aprovação explícita.
            </p>
            <p className="text-xs text-stone-500 mt-2">
              Modelo: {aiModel}
              {aiConfigured ? (
                <span className="text-emerald-400/90 ml-2">· IA activa</span>
              ) : (
                <span className="text-amber-400/90 ml-2">
                  · Configure GEMINI_API_KEY no .env.local
                </span>
              )}
            </p>
          </div>
        </div>

        <label
          className={[
            "inline-flex items-center justify-center gap-2 px-5 py-3 border text-sm font-medium cursor-pointer transition-colors",
            aiConfigured && !isPending
              ? "border-admin-gold/50 text-admin-gold hover:bg-admin-gold/10"
              : "border-stone-700 text-stone-600 cursor-not-allowed",
          ].join(" ")}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Carregar documento
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.csv,.txt,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.webp"
            disabled={!aiConfigured || isPending}
            onChange={handleUpload}
          />
        </label>
      </div>

      {uploadError && (
        <p className="text-sm text-red-400 border border-red-400/30 bg-red-400/10 px-4 py-3">
          {uploadError}
        </p>
      )}
      {actionError && (
        <p className="text-sm text-red-400 border border-red-400/30 bg-red-400/10 px-4 py-3">
          {actionError}
        </p>
      )}
      {actionMessage && (
        <div className="text-sm text-emerald-300/90 border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
          {actionMessage}
          {renderPostApplyLinks()}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-3">
        {(
          Object.entries(CONCIERGE_SUB_TAB_LABELS) as [ConciergeSubTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={[
              "px-3 py-1.5 text-xs font-medium border transition-colors",
              subTab === key
                ? "border-admin-gold/50 text-admin-gold bg-admin-gold/10"
                : "border-stone-700 text-stone-400 hover:border-stone-600",
            ].join(" ")}
          >
            {label}
            {key === "fornecedores" && vendors.length > 0
              ? ` (${vendors.length})`
              : ""}
            {key === "checklist" && checklist.length > 0
              ? ` (${checklist.length})`
              : ""}
            {key === "moodboard" && moodboard.length > 0
              ? ` (${moodboard.length})`
              : ""}
          </button>
        ))}
      </div>

      {subTab === "fornecedores" ? (
        <ConciergeAppliedVendors vendors={vendors} />
      ) : null}

      {subTab === "checklist" ? (
        <ConciergeAppliedChecklist items={checklist} />
      ) : null}

      {subTab === "moodboard" ? (
        <ConciergeAppliedMoodboard eventId={eventId} items={moodboard} />
      ) : null}

      {subTab === "fila" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["pending_review", "Por rever"],
                ["approved", "Aprovados"],
                ["rejected", "Rejeitados"],
                ["all", "Todos"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={[
                  "px-3 py-1.5 text-xs font-medium border transition-colors",
                  filter === key
                    ? "border-admin-gold/50 text-admin-gold bg-admin-gold/10"
                    : "border-stone-700 text-stone-400 hover:border-stone-600",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[360px]">
            <div className="border border-stone-800 divide-y divide-stone-800 max-h-[480px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-6 text-sm text-stone-500">
                  Nenhum item nesta fila. Carregue um documento para começar.
                </p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectReview(item)}
                    className={[
                      "w-full text-left p-4 transition-colors",
                      selectedId === item.id
                        ? "bg-admin-gold/10 border-l-2 border-admin-gold"
                        : "hover:bg-stone-900/50 border-l-2 border-transparent",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-admin-gold/80">
                        {CONCIERGE_DOC_LABELS[item.documentType] ?? item.documentType}
                      </span>
                      <ApplicabilityBadge extractedData={item.extractedData} />
                      <span className="text-[10px] text-stone-500 ml-auto">
                        {CONCIERGE_STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </div>
                    <p className="text-sm text-stone-200 truncate">
                      {item.upload?.fileName ?? "Documento"}
                    </p>
                    {item.applyError && item.status === "pending_review" && (
                      <p className="text-[10px] text-amber-400 mt-1 truncate">
                        Erro apply: {item.applyError}
                      </p>
                    )}
                    <p className="text-xs text-stone-500 mt-1">
                      {new Date(item.createdAt).toLocaleString("pt-MZ")}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="border border-stone-800 p-4 flex flex-col">
              {!selected ? (
                <p className="text-sm text-stone-500 flex-1 flex items-center justify-center">
                  Seleccione um item para rever.
                </p>
              ) : (
                <>
                  <div className="mb-4 space-y-2">
                    <p className="text-xs text-stone-500 uppercase tracking-wider">
                      Revisão humana
                    </p>
                    <p className="text-sm text-stone-200">
                      {selected.upload?.fileName ?? "Documento"}
                    </p>
                    <p className="text-xs text-stone-500">
                      Tipo detectado:{" "}
                      <span className="text-stone-300">
                        {CONCIERGE_DOC_LABELS[selected.documentType]}
                      </span>
                      {" · "}
                      {selected.aiModel}
                    </p>
                    <ConfidenceBadge extractedData={selected.extractedData} />
                    <ApplicabilityBadge extractedData={selected.extractedData} />
                    {isIrrelevantExtraction(selected.extractedData) && (
                      <p className="text-xs text-red-300/95 border border-red-500/30 bg-red-500/10 px-3 py-2">
                        {IRRELEVANT_OPERATOR_MESSAGE}
                        {readRejectionReason(selected.extractedData) ? (
                          <span className="block mt-1 text-red-400/80 font-mono text-[10px]">
                            Motivo IA: {readRejectionReason(selected.extractedData)}
                          </span>
                        ) : null}
                      </p>
                    )}
                    {(selected.documentType === "contract" ||
                      selected.documentType === "other") &&
                      !isIrrelevantExtraction(selected.extractedData) && (
                      <p className="text-xs text-amber-400/90 border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                        Contratos e outros tipos ainda não têm aplicação
                        automática. Consulte o ficheiro original e registe
                        manualmente se necessário.
                      </p>
                    )}
                    {selected.upload?.storagePath ? (
                      <button
                        type="button"
                        onClick={handleOpenOriginalFile}
                        disabled={fileUrlLoading || isPending}
                        className="inline-flex items-center gap-2 text-xs text-admin-gold border border-admin-gold/30 px-2 py-1 hover:bg-admin-gold/10 disabled:opacity-50"
                      >
                        {fileUrlLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3 h-3" />
                        )}
                        {selected.upload?.mimeType &&
                        isPreviewableMime(selected.upload.mimeType)
                          ? "Ver ficheiro original"
                          : "Descarregar ficheiro original"}
                      </button>
                    ) : null}
                  </div>

                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">
                    Dados extraídos (editável)
                  </p>

                  {validationErrors.length > 0 && (
                    <ul className="mb-3 text-xs text-red-300 border border-red-400/30 bg-red-400/10 px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
                      {validationErrors.map((err) => (
                        <li key={`${err.path}-${err.message}`}>
                          <span className="text-red-400">{err.path}:</span>{" "}
                          {err.message}
                        </li>
                      ))}
                    </ul>
                  )}

                  <textarea
                    value={editJson}
                    onChange={(e) => {
                      setEditJson(e.target.value);
                      setValidationErrors([]);
                    }}
                    disabled={selected.status !== "pending_review"}
                    className="flex-1 min-h-[220px] w-full bg-stone-950 border border-stone-800 p-3 font-mono text-xs text-stone-300 resize-y"
                    spellCheck={false}
                  />

                  {selected.status === "pending_review" ? (
                    <div className="flex flex-wrap gap-3 mt-4">
                      <button
                        type="button"
                        disabled={isPending || !canApproveApply}
                        onClick={handleApprove}
                        title={
                          !canApproveApply
                            ? "Documento não aplicável ou validação incompleta"
                            : undefined
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 bg-admin-gold/20 border border-admin-gold/50 text-admin-gold text-sm font-medium hover:bg-admin-gold/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {selected.applyError
                          ? "Tentar aplicar novamente"
                          : "Aprovar e aplicar"}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleReject}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-stone-700 text-stone-400 text-sm hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Rejeitar
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !aiConfigured}
                        onClick={handleReprocess}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-stone-700 text-stone-400 text-sm hover:border-admin-gold/40 hover:text-admin-gold disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reprocessar com IA
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 mt-4">
                      Revisto em{" "}
                      {selected.reviewedAt
                        ? new Date(selected.reviewedAt).toLocaleString("pt-MZ")
                        : "—"}
                      {selected.appliedAt && (
                        <span className="block text-emerald-400/90 mt-1">
                          Aplicado em{" "}
                          {new Date(selected.appliedAt).toLocaleString("pt-MZ")}
                        </span>
                      )}
                      {selected.applyError && (
                        <span className="block text-amber-400 mt-1">
                          {selected.applyError}
                        </span>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
