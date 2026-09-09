/**
 * HAXR Signature — Venue Intelligence & Domain Foundation (Server-Only Entry Point)
 *
 * Ponto de entrada canónico e exclusivo do lado servidor para acesso ao dataset interno,
 * validação de domínio e portas de publicação governadas por ambiente.
 *
 * Directriz Arquitectural (Blocker B):
 * - Este módulo NUNCA deve ser importado por componentes de cliente ("use client").
 * - O barrel genérico `@/lib/venues` (index.ts) permanece estritamente client-safe.
 */

import { assertServerContext } from "./publication";

// Assegura contexto estritamente de servidor aquando da inicialização do módulo
assertServerContext();

export * from "./types";
export * from "./venue-data";
export * from "./venue-validation";
export * from "./publication";
export * from "./public-mapper";
