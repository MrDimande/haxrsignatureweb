const DEFAULT_MODEL = "gemini-2.0-flash";

/**
 * Configuração Gemini partilhada — SERVER ONLY.
 * Reutiliza a mesma convenção do admin Concierge (`src/lib/concierge/provider.ts`).
 */
export function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || null;
  return key || null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export function requireGeminiApiKey(): string {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("Gemini API key não configurada.");
  }
  return key;
}
