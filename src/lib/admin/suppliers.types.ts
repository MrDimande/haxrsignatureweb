import { z } from "zod";

export const supplierApplicationStatuses = [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "withdrawn",
] as const;

export const supplierPublicationStatuses = [
  "draft",
  "pending_review",
  "published",
  "suspended",
] as const;

export type SupplierApplicationStatus =
  (typeof supplierApplicationStatuses)[number];
export type SupplierPublicationStatus =
  (typeof supplierPublicationStatuses)[number];

export type AdminSupplierApplication = {
  id: string;
  applicantUserId: string | null;
  supplierName: string;
  responsibleName: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  portfolioUrl: string | null;
  message: string | null;
  status: SupplierApplicationStatus;
  reviewedAt: string | null;
  reviewedByEmail: string | null;
  reviewNotes: string | null;
  isTestRecord: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSupplierProfile = {
  id: string;
  applicationId: string | null;
  ownerUserId: string | null;
  slug: string;
  businessName: string;
  category: string;
  city: string;
  shortDescription: string;
  about: string;
  publicEmail: string | null;
  publicPhone: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  serviceLevel: string | null;
  services: string[];
  publicationStatus: SupplierPublicationStatus;
  isVerified: boolean;
  isTestRecord: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierModerationEvent = {
  id: string;
  applicationId: string | null;
  supplierProfileId: string | null;
  actorEmail: string;
  action: string;
  previousStatus: string | null;
  nextStatus: string | null;
  createdAt: string;
};

export type SupplierBackofficeSnapshot = {
  applications: AdminSupplierApplication[];
  profiles: AdminSupplierProfile[];
  recentEvents: SupplierModerationEvent[];
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable();

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), {
    message: "Use um endereço completo iniciado por http:// ou https://.",
  })
  .transform((value) => value || null)
  .nullable();

export const supplierReviewInputSchema = z
  .object({
    applicationId: z.string().uuid(),
    status: z.enum(["in_review", "approved", "rejected"]),
    reviewNotes: optionalText(2000),
    slug: z
      .string()
      .trim()
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "O slug deve conter apenas letras minúsculas, números e hífenes.",
      })
      .nullable(),
    isTestRecord: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.status === "approved" && !value.slug) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slug"],
        message: "Defina o slug antes de aprovar.",
      });
    }
  });

export type SupplierReviewInput = z.infer<typeof supplierReviewInputSchema>;

export const supplierProfileInputSchema = z
  .object({
    profileId: z.string().uuid(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    businessName: z.string().trim().min(2).max(120),
    category: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    shortDescription: z.string().trim().max(320),
    about: z.string().trim().max(5000),
    publicEmail: z
      .union([z.string().trim().email().max(254), z.literal("")])
      .transform((value) => value || null)
      .nullable(),
    publicPhone: optionalText(40),
    websiteUrl: optionalUrl,
    instagramUrl: optionalUrl,
    serviceLevel: optionalText(120),
    services: z.array(z.string().trim().min(1).max(120)).max(30),
    publicationStatus: z.enum(supplierPublicationStatuses),
    isVerified: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.publicationStatus !== "published") return;
    if (value.shortDescription.length < 20) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shortDescription"],
        message: "Uma publicação precisa de uma descrição com pelo menos 20 caracteres.",
      });
    }
    if (value.about.length < 40) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["about"],
        message: "Uma publicação precisa de uma apresentação com pelo menos 40 caracteres.",
      });
    }
  });

export type SupplierProfileInput = z.infer<typeof supplierProfileInputSchema>;

export const supplierUatRemovalInputSchema = z.object({
  applicationId: z.string().uuid(),
  expectedSupplierName: z.string().trim().min(2).max(120),
});

export type SupplierUatRemovalInput = z.infer<
  typeof supplierUatRemovalInputSchema
>;

export function suggestSupplierSlug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-PT")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
