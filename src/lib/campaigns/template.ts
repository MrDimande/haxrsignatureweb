import {
  ALLOWED_TEMPLATE_VARIABLES,
  type AllowedTemplateVariable,
  type TemplateContext,
} from "@/lib/campaigns/types";

const VARIABLE_PATTERN = /\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi;

const ALLOWED_SET = new Set<string>(ALLOWED_TEMPLATE_VARIABLES);

export type TemplateValidationResult =
  | { ok: true; variables: AllowedTemplateVariable[] }
  | { ok: false; unknownVariables: string[]; message: string };

export function extractTemplateVariables(template: string): string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]?.toLowerCase();
    if (name) found.add(name);
  }
  return [...found];
}

export function validateTemplateVariables(
  template: string
): TemplateValidationResult {
  const variables = extractTemplateVariables(template);
  const unknown = variables.filter((name) => !ALLOWED_SET.has(name));

  if (unknown.length > 0) {
    return {
      ok: false,
      unknownVariables: unknown,
      message: `Variáveis não permitidas: ${unknown.join(", ")}. Permitidas: ${ALLOWED_TEMPLATE_VARIABLES.join(", ")}.`,
    };
  }

  return {
    ok: true,
    variables: variables as AllowedTemplateVariable[],
  };
}

export function renderTemplate(
  template: string,
  context: TemplateContext
): string {
  const validation = validateTemplateVariables(template);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  return template.replace(VARIABLE_PATTERN, (_full, name: string) => {
    const key = name.toLowerCase() as AllowedTemplateVariable;
    return context[key] ?? "";
  });
}

export function buildEmptyTemplateContext(): TemplateContext {
  return {
    guest_name: "",
    couple_names: "",
    event_name: "",
    event_date: "",
    event_location: "",
    invitation_url: "",
    rsvp_deadline: "",
    sender_name: "",
  };
}
