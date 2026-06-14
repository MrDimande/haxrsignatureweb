import { z } from "zod";

export const rsvpAttendanceSchema = z.enum(["confirm", "decline"]);

export const rsvpFormSchema = z
  .object({
    eventId: z.string().uuid(),
    token: z.string().min(16).max(128),
    name: z
      .string()
      .trim()
      .min(2, "Indique o seu nome completo.")
      .max(120, "Nome demasiado longo."),
    phone: z
      .string()
      .trim()
      .max(30, "Telefone inválido.")
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Email inválido.")
      .max(160)
      .optional()
      .or(z.literal("")),
    attendance: rsvpAttendanceSchema,
    plusOnes: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 acompanhantes.")
      .max(10, "Máximo 10 acompanhantes."),
    dietaryNotes: z.string().trim().max(500).optional().or(z.literal("")),
    guestNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.attendance === "confirm" && !data.phone && !data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indique telefone ou email para contacto.",
        path: ["phone"],
      });
    }
  });

export type RsvpFormInput = z.infer<typeof rsvpFormSchema>;
