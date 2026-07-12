import { z } from "zod";
import { MARKETING_SEND_CONFIRMATION } from "@/lib/email/email-config";
import { MARKETING_CONSENT_TEXT } from "@/lib/email/marketing/marketing-contact";

const marketingConsentField = z.literal(true, {
  errorMap: () => ({
    message: "É necessário aceitar o consentimento de marketing.",
  }),
});

/** Aceita qualquer valor; a rota trata gotcha preenchido como bot (200 silencioso). */
const honeypotField = z.string();

export const marketingTestEmailSchema = z.object({
  templateId: z.string().min(1).default("haxr_launch"),
  firstName: z.string().min(1).max(80).optional(),
});

export const newsletterSignupSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(120),
  email: z.string().trim().email("Email inválido").max(254),
  marketingConsent: marketingConsentField,
  gotcha: honeypotField,
});

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(120),
  email: z.string().trim().email("Email inválido").max(254),
  phone: z.string().trim().min(8, "Telefone obrigatório").max(40),
  eventType: z.string().trim().min(1, "Seleccione o tipo de evento").max(64),
  eventDate: z.string().trim().max(32).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Cidade obrigatória").max(80),
  estimatedGuests: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
  serviceInterest: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
  marketingConsent: marketingConsentField,
  gotcha: honeypotField,
  packageLabel: z.string().trim().max(120).optional().nullable(),
});

export const supplierJoinSchema = z.object({
  supplierName: z.string().trim().min(2, "Nome do fornecedor obrigatório").max(120),
  responsibleName: z
    .string()
    .trim()
    .min(2, "Nome do responsável obrigatório")
    .max(120),
  email: z.string().trim().email("Email inválido").max(254),
  phone: z.string().trim().min(8, "Telefone obrigatório").max(40),
  category: z.string().trim().min(2, "Categoria obrigatória").max(80),
  city: z.string().trim().min(2, "Cidade obrigatória").max(80),
  portfolioUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine(
      (value) => !value || /^https?:\/\/.+/i.test(value),
      "URL inválida"
    ),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
  marketingConsent: marketingConsentField,
  gotcha: honeypotField,
});

export const marketingContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  companyName: z.string().max(120).optional(),
  role: z.enum([
    "lead",
    "client",
    "supplier",
    "newsletter",
    "couple",
    "event_company",
    "other",
  ]),
  source: z.string().min(1).max(80),
  segment: z.enum([
    "clientes_interessados",
    "casais_noivos",
    "fornecedores",
    "empresas_eventos",
    "leads_site",
    "newsletter",
    "clientes_activos",
    "clientes_inactivos",
    "contactos_seleccionados",
    "prospects_eventos",
    "prospects_corporativos",
  ]),
  consentStatus: z.enum(["granted", "pending", "denied", "unknown"]),
});

export { MARKETING_CONSENT_TEXT };

export const marketingCampaignDraftSchema = z.object({
  campaignId: z.string().min(1),
  firstName: z.string().min(1).max(80).optional(),
});

export const marketingCampaignSendSchema = z.object({
  campaignId: z.number().int().positive(),
  listId: z.number().int().positive(),
  confirm: z.literal(MARKETING_SEND_CONFIRMATION),
  dryRun: z.literal(false),
});
