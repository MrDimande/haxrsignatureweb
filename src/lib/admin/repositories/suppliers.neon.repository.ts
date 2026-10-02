import { z } from "zod";
import { neonQuery } from "@/lib/neon/server-db";
import {
  supplierApplicationStatuses,
  supplierPublicationStatuses,
  type AdminSupplierApplication,
  type AdminSupplierProfile,
  type SupplierBackofficeSnapshot,
  type SupplierModerationEvent,
  type SupplierProfileInput,
  type SupplierReviewInput,
  type SupplierUatRemovalInput,
} from "@/lib/admin/suppliers.types";

const applicationRowSchema = z.object({
  id: z.string().uuid(), applicant_user_id: z.string().uuid().nullable(), supplier_name: z.string(),
  responsible_name: z.string(), email: z.string(), phone: z.string(), category: z.string(), city: z.string(),
  portfolio_url: z.string().nullable(), message: z.string().nullable(), status: z.enum(supplierApplicationStatuses),
  reviewed_at: z.string().nullable(), reviewed_by_email: z.string().nullable(), review_notes: z.string().nullable(),
  is_test_record: z.boolean(), created_at: z.string(), updated_at: z.string(),
});
const profileRowSchema = z.object({
  id: z.string().uuid(), application_id: z.string().uuid().nullable(), owner_user_id: z.string().uuid().nullable(),
  slug: z.string(), business_name: z.string(), category: z.string(), city: z.string(), short_description: z.string().nullable(),
  about: z.string().nullable(), public_email: z.string().nullable(), public_phone: z.string().nullable(),
  website_url: z.string().nullable(), instagram_url: z.string().nullable(), service_level: z.string().nullable(),
  services: z.array(z.string()).nullable(), publication_status: z.enum(supplierPublicationStatuses), is_verified: z.boolean(),
  is_test_record: z.boolean(), published_at: z.string().nullable(), created_at: z.string(), updated_at: z.string(),
});
const eventRowSchema = z.object({
  id: z.string().uuid(), application_id: z.string().uuid().nullable(), supplier_profile_id: z.string().uuid().nullable(),
  actor_email: z.string(), action: z.string(), previous_status: z.string().nullable(), next_status: z.string().nullable(), created_at: z.string(),
});
type NeonJsonRow = { row: unknown };

function databaseError(context: string, message: string): Error {
  console.error(`[supplier-backoffice] ${context}: ${message}`);
  return new Error("Não foi possível concluir a operação de fornecedores.");
}
function mapApplication(row: unknown): AdminSupplierApplication {
  const value = applicationRowSchema.parse(row);
  return { id: value.id, applicantUserId: value.applicant_user_id, supplierName: value.supplier_name, responsibleName: value.responsible_name, email: value.email, phone: value.phone, category: value.category, city: value.city, portfolioUrl: value.portfolio_url, message: value.message, status: value.status, reviewedAt: value.reviewed_at, reviewedByEmail: value.reviewed_by_email, reviewNotes: value.review_notes, isTestRecord: value.is_test_record, createdAt: value.created_at, updatedAt: value.updated_at };
}
function mapProfile(row: unknown): AdminSupplierProfile {
  const value = profileRowSchema.parse(row);
  return { id: value.id, applicationId: value.application_id, ownerUserId: value.owner_user_id, slug: value.slug, businessName: value.business_name, category: value.category, city: value.city, shortDescription: value.short_description ?? "", about: value.about ?? "", publicEmail: value.public_email, publicPhone: value.public_phone, websiteUrl: value.website_url, instagramUrl: value.instagram_url, serviceLevel: value.service_level, services: value.services ?? [], publicationStatus: value.publication_status, isVerified: value.is_verified, isTestRecord: value.is_test_record, publishedAt: value.published_at, createdAt: value.created_at, updatedAt: value.updated_at };
}
function mapEvent(row: unknown): SupplierModerationEvent {
  const value = eventRowSchema.parse(row);
  return { id: value.id, applicationId: value.application_id, supplierProfileId: value.supplier_profile_id, actorEmail: value.actor_email, action: value.action, previousStatus: value.previous_status, nextStatus: value.next_status, createdAt: value.created_at };
}

export async function listSupplierBackoffice(): Promise<SupplierBackofficeSnapshot> {
  try {
    const [applicationsResult, profilesResult, eventsResult] = await Promise.all([
      neonQuery<NeonJsonRow>(`SELECT to_jsonb(a) AS row FROM public.supplier_applications a ORDER BY a.created_at DESC`),
      neonQuery<NeonJsonRow>(`SELECT to_jsonb(p) AS row FROM public.supplier_profiles p ORDER BY p.updated_at DESC`),
      neonQuery<NeonJsonRow>(`SELECT to_jsonb(e) AS row FROM public.supplier_moderation_events e ORDER BY e.created_at DESC LIMIT 100`),
    ]);
    return { applications: applicationsResult.rows.map(({ row }) => mapApplication(row)), profiles: profilesResult.rows.map(({ row }) => mapProfile(row)), recentEvents: eventsResult.rows.map(({ row }) => mapEvent(row)) };
  } catch (cause) {
    throw databaseError("list Neon backoffice", cause instanceof Error ? cause.message : "Falha desconhecida no Neon.");
  }
}

export async function reviewSupplierApplication(input: SupplierReviewInput, actorEmail: string): Promise<void> {
  try {
    await neonQuery(`SELECT public.admin_review_supplier_application_atomic($1::uuid,$2::text,$3::public.supplier_application_status,$4::text,$5::text,$6::boolean)`, [input.applicationId, actorEmail, input.status, input.reviewNotes, input.slug, input.isTestRecord]);
  } catch (cause) {
    throw databaseError("review Neon application", cause instanceof Error ? cause.message : "Falha desconhecida no Neon.");
  }
}

export async function saveSupplierProfile(input: SupplierProfileInput, actorEmail: string): Promise<void> {
  try {
    await neonQuery(`SELECT public.admin_save_supplier_profile_atomic($1::uuid,$2::text,$3::text,$4::text,$5::text,$6::text,$7::text,$8::text,$9::text,$10::text,$11::text,$12::text,$13::text,$14::text[],$15::public.supplier_publication_status,$16::boolean)`, [input.profileId, actorEmail, input.slug, input.businessName, input.category, input.city, input.shortDescription, input.about, input.publicEmail, input.publicPhone, input.websiteUrl, input.instagramUrl, input.serviceLevel, input.services, input.publicationStatus, input.isVerified]);
  } catch (cause) {
    throw databaseError("save Neon profile", cause instanceof Error ? cause.message : "Falha desconhecida no Neon.");
  }
}

export async function removeSupplierUat(input: SupplierUatRemovalInput, actorEmail: string): Promise<void> {
  try {
    await neonQuery(`SELECT public.admin_remove_supplier_uat_atomic($1::uuid,$2::text,$3::text)`, [input.applicationId, actorEmail, input.expectedSupplierName]);
  } catch (cause) {
    throw databaseError("remove Neon UAT supplier", cause instanceof Error ? cause.message : "Falha desconhecida no Neon.");
  }
}
