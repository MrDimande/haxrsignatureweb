import { z } from "zod";
import type { ClientEventSource, ClientEventType } from "@/lib/events/client-app-database.types";

export const CLIENT_EVENT_TYPES = [
  "wedding",
  "birthday",
  "corporate",
  "baby_shower",
  "graduation",
  "other",
] as const satisfies readonly ClientEventType[];

export const CLIENT_EVENT_SOURCES = [
  "onboarding",
  "manual",
  "import",
] as const satisfies readonly ClientEventSource[];

export const KNOWN_ONBOARDING_SERVICES = [
  "convites_digitais",
  "rsvp",
  "assessoria",
  "gestao_convidados",
  "identidade_visual",
] as const;

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const mozambiquePhoneRegex = /^\+258[2-9]\d{7,8}$/;

export const createClientEventSchema = z
  .object({
    eventType: z.enum(CLIENT_EVENT_TYPES),
    eventName: z.string().trim().min(2).max(120),
    brideName: z.string().trim().min(1).max(80),
    groomName: z.string().trim().min(1).max(80),
    eventDate: z
      .string()
      .trim()
      .regex(isoDateRegex, "Data inválida. Use YYYY-MM-DD."),
    eventLocation: z.string().trim().min(2).max(200),
    estimatedGuests: z.number().int().min(1).max(5000),
    budgetMin: z.number().int().min(0).optional().nullable(),
    budgetMax: z.number().int().min(0).optional().nullable(),
    servicesInterested: z
      .array(z.enum(KNOWN_ONBOARDING_SERVICES))
      .max(20)
      .default([]),
    phone: z
      .string()
      .trim()
      .regex(mozambiquePhoneRegex, "Telefone inválido. Use formato +258..."),
    source: z.enum(CLIENT_EVENT_SOURCES).default("onboarding"),
    plannerRole: z.enum(["noiva", "consultor"]).optional(),
    localFingerprint: z.string().trim().min(8).max(128).optional(),
  })
  .superRefine((data, ctx) => {
    const min = data.budgetMin ?? null;
    const max = data.budgetMax ?? null;
    if (min !== null && max !== null && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "budgetMin não pode ser maior que budgetMax.",
        path: ["budgetMin"],
      });
    }
  });

export type CreateClientEventInput = z.infer<typeof createClientEventSchema>;

export type CreateClientEventValidationError = {
  field: string;
  message: string;
};

export function parseCreateClientEventPayload(
  raw: unknown,
):
  | { ok: true; data: CreateClientEventInput }
  | { ok: false; errors: CreateClientEventValidationError[] } {
  const parsed = createClientEventSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "payload",
        message: issue.message,
      })),
    };
  }

  return { ok: true, data: parsed.data };
}
