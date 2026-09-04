/**
 * HAXR Edition Engine — Storage Composition Root & Dependency Injection
 *
 * REGRA ARQUITETURAL (Gate 3C):
 * A lógica de negócio nunca deve instanciar diretamente 'new SupabaseStorageProvider()'
 * ou 'new S3CompatibleStorageProvider()'.
 * Todo o binding concreto acontece exclusivamente neste ponto central de composição.
 */

import {
  StorageProvider,
  StorageSecurityError,
} from "./storage-provider.types";
import { FakeStorageProvider } from "./fake-storage-provider";
import {
  SupabaseStorageProvider,
  SupabaseStorageClientLike,
} from "./supabase-storage-provider";
import {
  S3CompatibleStorageProvider,
  S3ClientLike,
  S3PresignerLike,
} from "./s3-compatible-storage-provider";

export type StorageProviderType = "supabase" | "fake" | "r2-s3";

export interface StorageCompositionConfig {
  providerType?: StorageProviderType;
  supabaseClient?: SupabaseStorageClientLike;
  s3Client?: S3ClientLike;
  s3Presigner?: S3PresignerLike;
  bucketName?: string;
}

let activeTestProvider: StorageProvider | null = null;
let defaultProviderInstance: StorageProvider | null = null;

/**
 * Ponto de resolução único (Composition Root) para obter a instância ativa de StorageProvider.
 */
export function resolveStorageProvider(
  config?: StorageCompositionConfig
): StorageProvider {
  // 1. Se existir um provider explicitamente injetado para testes, tem precedência absoluta
  if (activeTestProvider) {
    return activeTestProvider;
  }

  // 2. Determinar o tipo de provider através do ambiente ou configuração
  const envProvider = (
    process.env.STORAGE_PROVIDER ||
    config?.providerType ||
    "supabase"
  ).toLowerCase() as StorageProviderType;

  switch (envProvider) {
    case "fake": {
      return new FakeStorageProvider();
    }

    case "supabase": {
      // Se um cliente for injetado, cria uma instância vinculada
      if (config?.supabaseClient) {
        return new SupabaseStorageProvider(config.supabaseClient);
      }

      // Se já existir uma instância default instanciada, reutiliza
      if (defaultProviderInstance && defaultProviderInstance.providerName === "supabase") {
        return defaultProviderInstance;
      }

      // Lazy import do cliente supabase do server apenas quando necessário
      throw new StorageSecurityError(
        "supabase_client_not_configured_in_composition_root:client_must_be_provided"
      );
    }

    case "r2-s3": {
      if (!config?.s3Client || !config?.s3Presigner) {
        throw new StorageSecurityError(
          "r2_s3_storage_provider_requires_s3_client_and_presigner"
        );
      }
      return new S3CompatibleStorageProvider(
        config.s3Client,
        config.s3Presigner,
        { bucketName: config.bucketName }
      );
    }

    default:
      throw new StorageSecurityError(`unsupported_storage_provider_type:${envProvider}`);
  }
}

/**
 * Registra um client default para uso no Composition Root (ex: durante inicialização da app).
 */
export function registerDefaultSupabaseStorageClient(
  client: SupabaseStorageClientLike
): void {
  if (!client) {
    throw new StorageSecurityError("cannot_register_null_supabase_storage_client");
  }
  defaultProviderInstance = new SupabaseStorageProvider(client);
}

/**
 * Seam de Testes: Permite que testes unitários e de integração substituam o provider
 * de forma determinística em memória sem efeitos colaterais.
 */
export function __setStorageProviderForTests(
  provider: StorageProvider | null
): void {
  activeTestProvider = provider;
}

/**
 * Restaura o Composition Root para o estado padrão.
 */
export function __resetStorageComposition(): void {
  activeTestProvider = null;
  defaultProviderInstance = null;
}
