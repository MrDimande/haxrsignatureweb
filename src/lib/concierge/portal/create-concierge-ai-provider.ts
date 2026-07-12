/**
 * SERVER ONLY — factory do provider de IA do Concierge portal.
 * Não importar em componentes cliente.
 */
import type { ConciergeAIProvider } from "./concierge-ai-provider";
import { RuleBasedConciergeProvider } from "./concierge-ai-provider";
import { isGeminiConfigured } from "./gemini-config";
import { GeminiConciergeProvider } from "./gemini-concierge-provider";

export function createConciergeAIProvider(): ConciergeAIProvider {
  if (isGeminiConfigured()) {
    return new GeminiConciergeProvider();
  }
  return new RuleBasedConciergeProvider();
}

export function getConciergeAIProvider(): ConciergeAIProvider {
  return createConciergeAIProvider();
}
