import type { z } from "zod";
import type {
  newsletterSignupSchema,
  quoteRequestSchema,
  supplierJoinSchema,
} from "@/lib/email/email-schemas";

type NewsletterInput = z.infer<typeof newsletterSignupSchema>;
type QuoteInput = z.infer<typeof quoteRequestSchema>;
type SupplierInput = z.infer<typeof supplierJoinSchema>;

async function postJson(
  url: string,
  body: unknown
): Promise<{ success?: boolean; message?: string; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    error?: string;
  } | null;

  if (!res.ok) {
    throw new Error(data?.error ?? "Falha ao enviar formulário");
  }

  return data ?? { success: true };
}

export async function submitNewsletterSignup(data: NewsletterInput) {
  return postJson("/api/marketing/newsletter", data);
}

export async function submitQuoteRequest(
  data: QuoteInput & { packageLabel?: string | null }
) {
  return postJson("/api/marketing/quote", data);
}

export async function submitSupplierJoin(data: SupplierInput) {
  return postJson("/api/marketing/supplier-leads", data);
}
