/**
 * HAXR Edition Engine — Memories Storage Write-Freeze Control
 *
 * REGRA OPERACIONAL (Gate 3F-E1):
 * - Default: false (mecanismo dormente, comportamento de produção inalterado).
 * - Quando activo: rejeita novas intenções de upload de wedding-photos ANTES
 *   de emitir a URL assinada.
 * - Leituras da galeria pública permanecem 100% operacionais.
 * - Outros fluxos (concierge, portal payments) NUNCA são afectados.
 * - Erro tipado de nível aplicacional: StorageWriteFreezeError.
 */

export class StorageWriteFreezeError extends Error {
  readonly code = "STORAGE_WRITE_FREEZE_ACTIVE";

  constructor(
    message: string = "STORAGE_WRITE_FREEZE_ACTIVE: O envio de novas fotografias está temporariamente suspenso para manutenção operacional da infra-estrutura."
  ) {
    super(message);
    this.name = "StorageWriteFreezeError";
  }
}

let writeFreezeOverride: boolean | null = null;

/**
 * Verifica se o Write-Freeze de novas memórias está activo.
 * Por defeito retorna false (mecanismo dormente).
 * Pode ser accionado pela variável de ambiente HAXR_STORAGE_WRITE_FREEZE=true.
 */
export function isStorageWriteFreezeActive(): boolean {
  if (writeFreezeOverride !== null) {
    return writeFreezeOverride;
  }
  return process.env.HAXR_STORAGE_WRITE_FREEZE === "true";
}

/**
 * Utilitário estritamente reservado para testes determinísticos em memória.
 */
export function __setStorageWriteFreezeForTesting(active: boolean | null): void {
  writeFreezeOverride = active;
}
