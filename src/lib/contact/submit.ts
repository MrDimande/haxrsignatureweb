import type { ContactFormInput } from "@/lib/contact/validation";

export async function submitContactForm(
  data: ContactFormInput,
  options?: { packageLabel?: string | null }
) {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ...data,
      packageLabel: options?.packageLabel ?? null,
    }),
  });

  const body = (await res.json().catch(() => null)) as {
    error?: string;
    success?: boolean;
  } | null;

  if (!res.ok) {
    throw new Error(body?.error ?? "Falha ao enviar formulário");
  }

  return body;
}
