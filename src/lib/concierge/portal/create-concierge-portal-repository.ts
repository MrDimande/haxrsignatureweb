import { InMemoryConciergePortalRepository } from "./in-memory-concierge-portal-repository";
import { NeonConciergePortalRepository } from "./neon-concierge-portal-repository";
import type {
  ConciergePortalPersistenceMode,
  ConciergePortalRepository,
} from "./concierge-portal-repository";
import { isConciergePortalSchemaMissingError } from "./concierge-portal-repository";

let schemaProbeMode: ConciergePortalPersistenceMode | null = null;
let schemaReady = false;

function createPersistentRepository(): ConciergePortalRepository {
  return new NeonConciergePortalRepository();
}

async function probePortalSchema(repo: ConciergePortalRepository): Promise<boolean> {
  try {
    await repo.listItems("__schema_probe__");
    return true;
  } catch (error) {
    if (isConciergePortalSchemaMissingError(error)) return false;
    throw error;
  }
}

export function createConciergePortalRepository(): ConciergePortalRepository {
  return createPersistentRepository();
}

/** Verifica se as tabelas portal existem; em falha usa memória. */
export async function createConciergePortalRepositorySafe(): Promise<ConciergePortalRepository> {
  const repo = createPersistentRepository();
  if (schemaProbeMode !== repo.mode) {
    schemaReady = await probePortalSchema(repo);
    schemaProbeMode = repo.mode;
  }

  if (!schemaReady) {
    return new InMemoryConciergePortalRepository();
  }

  return repo;
}

export function resetConciergePortalRepositoryCache(): void {
  schemaProbeMode = null;
  schemaReady = false;
}
