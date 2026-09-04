/**
 * HAXR Edition Engine — Memories Moderation Service
 *
 * Atualiza o status de moderação ('approved' | 'rejected') com isolamento por evento.
 */

import { MemoriesRepository } from "./memories.types";

export interface ModerateMemoryInput {
  slug: string;
  photoId: string;
  action: "approve" | "reject";
  secretKey?: string;
  expectedSecretKey?: string;
}

export interface ModerateMemoryResult {
  success: boolean;
  error?: string;
  message?: string;
}

export class MemoriesModerationService {
  constructor(private readonly repository: MemoriesRepository) {}

  async moderateMemory(
    input: ModerateMemoryInput
  ): Promise<ModerateMemoryResult> {
    const { slug, photoId, action, secretKey, expectedSecretKey } = input;

    if (!slug || !photoId || !action) {
      return { success: false, error: "Parâmetros em falta." };
    }

    if (action !== "approve" && action !== "reject") {
      return { success: false, error: "Ação de moderação inválida." };
    }

    // Validação de segredo administrativo
    const requiredSecret = expectedSecretKey || process.env.ADMIN_MODERATION_SECRET;
    if (requiredSecret && secretKey !== requiredSecret) {
      return { success: false, error: "Não autorizado." };
    }

    const updated = await this.repository.updateModerationStatus(
      photoId,
      slug,
      action === "approve" ? "approved" : "rejected"
    );

    if (!updated) {
      return { success: false, error: "Registo não encontrado ou violação de evento." };
    }

    return {
      success: true,
      message: `Memória ${action === "approve" ? "aprovada" : "ocultada"} com sucesso.`,
    };
  }
}
