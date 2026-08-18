import { z } from "zod";

export const supplierFavoriteSchema = z.object({
  supplierId: z.string().uuid("Fornecedor inválido."),
});

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function mapSupplierFavoriteError(error: {
  code?: string;
  message?: string;
} | null): { status: number; message: string } | null {
  if (!error) return null;
  if (error.code === "23505") {
    return { status: 200, message: "Fornecedor já estava guardado." };
  }
  if (error.code === "42501") {
    return { status: 403, message: "Não tem permissão para guardar este fornecedor." };
  }
  return { status: 503, message: "Não foi possível actualizar os fornecedores guardados." };
}
