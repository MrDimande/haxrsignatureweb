import { isSupabaseConfigured } from "@/lib/supabase/server";
import { InMemoryConciergePortalRepository } from "./in-memory-concierge-portal-repository";
import { SupabaseConciergePortalRepository } from "./supabase-concierge-portal-repository";
import type { ConciergePortalRepository } from "./concierge-portal-repository";
import { isConciergePortalSchemaMissingError } from "./concierge-portal-repository";

let cachedRepo: ConciergePortalRepository | null = null;
let schemaProbeDone = false;
let schemaReady = false;

async function probePortalSchema(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const repo = new SupabaseConciergePortalRepository();
    await repo.listItems("__schema_probe__");
    return true;
  } catch (error) {
    if (isConciergePortalSchemaMissingError(error)) return false;
    throw error;
  }
}

export function createConciergePortalRepository(): ConciergePortalRepository {
  if (!isSupabaseConfigured()) {
    return new InMemoryConciergePortalRepository();
  }
  if (cachedRepo) return cachedRepo;
  cachedRepo = new SupabaseConciergePortalRepository();
  return cachedRepo;
}

/** Verifica se tabelas portal existem; em falha usa memória. */
export async function createConciergePortalRepositorySafe(): Promise<ConciergePortalRepository> {
  if (!isSupabaseConfigured()) {
    return new InMemoryConciergePortalRepository();
  }

  if (!schemaProbeDone) {
    schemaReady = await probePortalSchema();
    schemaProbeDone = true;
  }

  if (!schemaReady) {
    return new InMemoryConciergePortalRepository();
  }

  return new SupabaseConciergePortalRepository();
}

export function resetConciergePortalRepositoryCache(): void {
  cachedRepo = null;
  schemaProbeDone = false;
  schemaReady = false;
}
