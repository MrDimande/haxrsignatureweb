import {
  FAREWELL_SLUG,
  resolveEditionSlug,
} from "@/lib/edition/registry";
import {
  isFarewellRsvpDeadlinePassed,
} from "@/lib/edition/events/farewell";
import type { EditionRsvpSubmission } from "@/lib/edition/rsvp/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 30);
}

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, 160);
}

export type ValidateEditionRsvpResult =
  | { ok: true; submission: EditionRsvpSubmission; honeypot: false }
  | { ok: true; honeypot: true }
  | { ok: false; error: string };

export function validateEditionRsvpBody(
  body: unknown
): ValidateEditionRsvpResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Por favor, introduza o seu nome." };
  }

  const raw = body as Record<string, unknown>;
  const honeypot = typeof raw.honeypot === "string" ? raw.honeypot : "";
  if (honeypot.trim() !== "") {
    return { ok: true, honeypot: true };
  }

  const name = typeof raw.name === "string" ? raw.name : "";
  if (!name.trim()) {
    return { ok: false, error: "Por favor, introduza o seu nome." };
  }

  if (typeof raw.attending !== "boolean") {
    return {
      ok: false,
      error: "Por favor, indique se irá comparecer.",
    };
  }

  const attending = raw.attending;
  const parsedGuests = parseInt(String(raw.guests ?? ""), 10);

  if (attending && (isNaN(parsedGuests) || parsedGuests < 1 || parsedGuests > 10)) {
    return {
      ok: false,
      error: "O número de pessoas deve ser entre 1 e 10.",
    };
  }

  const normalizedEmail = normalizeEmail(raw.email);
  const normalizedPhone = normalizePhone(raw.phone);

  if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      ok: false,
      error: "Por favor, introduza um email válido.",
    };
  }

  const canonicalSlug = resolveEditionSlug(
    typeof raw.slug === "string" ? raw.slug : undefined
  );
  if (!canonicalSlug) {
    return { ok: false, error: "Convite inválido." };
  }

  const isFarewell = canonicalSlug === FAREWELL_SLUG;

  if (isFarewell && !normalizedPhone) {
    return {
      ok: false,
      error: "Indique o telefone para contacto (WhatsApp).",
    };
  }

  if (attending && !normalizedEmail && !normalizedPhone) {
    return {
      ok: false,
      error: "Indique email ou telefone para contacto.",
    };
  }

  if (isFarewell && isFarewellRsvpDeadlinePassed()) {
    return {
      ok: false,
      error: "O prazo para confirmação terminou. Contacte a organizadora.",
    };
  }

  const normalizedMessage =
    typeof raw.messageForBride === "string"
      ? raw.messageForBride.trim().slice(0, 280)
      : undefined;
  const normalizedSize =
    typeof raw.size === "string" ? raw.size.trim().slice(0, 12) : undefined;

  return {
    ok: true,
    honeypot: false,
    submission: {
      name: name.trim(),
      attending,
      guests: attending ? parsedGuests : 0,
      slug: canonicalSlug,
      email: normalizedEmail || undefined,
      phone: normalizedPhone || undefined,
      messageForBride: normalizedMessage || undefined,
      size: normalizedSize || undefined,
      dressCodeConfirmed:
        typeof raw.dressCodeConfirmed === "boolean"
          ? raw.dressCodeConfirmed
          : undefined,
    },
  };
}
