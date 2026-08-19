import type { ContactInquiry, InquiryStatus } from "@/lib/contact/types";

export type AdminCommercialStage = InquiryStatus;

export type AdminCommercialPipelineItem = {
  id: string;
  name: string;
  email: string;
  projectType: string;
  packageLabel: string | null;
  intent: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminCommercialPipelineSummary = {
  total: number;
  active: number;
  new: number;
  contacted: number;
  converted: number;
  archived: number;
};

export type AdminCommercialPipeline = {
  summary: AdminCommercialPipelineSummary;
  items: AdminCommercialPipelineItem[];
};

/**
 * Pure service that interprets canonical ContactInquiry records into a
 * structured commercial demand pipeline.
 *
 * Free of database queries and side-effects.
 */
export function buildAdminCommercialPipeline(
  inquiries: ContactInquiry[]
): AdminCommercialPipeline {
  const newCount = inquiries.filter((i) => i.status === "new").length;
  const contactedCount = inquiries.filter((i) => i.status === "contacted").length;
  const convertedCount = inquiries.filter((i) => i.status === "converted").length;
  const archivedCount = inquiries.filter((i) => i.status === "archived").length;

  const summary: AdminCommercialPipelineSummary = {
    total: inquiries.length,
    active: newCount + contactedCount,
    new: newCount,
    contacted: contactedCount,
    converted: convertedCount,
    archived: archivedCount,
  };

  // Operational items: only active commercial demand ("new" and "contacted")
  const activeInquiries = inquiries.filter(
    (i) => i.status === "new" || i.status === "contacted"
  );

  // Sorting:
  // 1. Stage: "new" first, then "contacted"
  // 2. Within stage: updatedAt descending (fallback: createdAt descending)
  // 3. Stable tie-breaker: id ascending
  activeInquiries.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "new" ? -1 : 1;
    }

    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    if (createdB !== createdA) {
      return createdB - createdA;
    }

    return a.id.localeCompare(b.id);
  });

  const items: AdminCommercialPipelineItem[] = activeInquiries.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    projectType: i.projectType,
    packageLabel: i.packageLabel,
    intent: i.intent || i.message || "",
    status: i.status,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }));

  return {
    summary,
    items,
  };
}
