import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(120),
  email: z.string().trim().email("Email inválido").max(254),
  projectType: z.string().trim().min(1, "Seleccione o tipo de projecto").max(64),
  message: z.string().trim().min(10, "Mensagem demasiado curta").max(4000),
  packageLabel: z.string().trim().max(120).optional().nullable(),
  marketingOptIn: z.boolean(),
  gotcha: z.string(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
