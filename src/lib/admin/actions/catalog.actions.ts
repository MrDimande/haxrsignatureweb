"use server";

import { revalidatePath } from "next/cache";
import * as catalogRepo from "@/lib/admin/repositories/catalog.repository";
import { runAction } from "@/lib/admin/actions/auth";
import type { CatalogFormData } from "@/lib/admin/types";

export async function listCatalogAdminAction(includeInactive = true) {
  return runAction(() => catalogRepo.listCatalog(undefined, includeInactive));
}

export async function saveCatalogItemAction(form: CatalogFormData) {
  const result = await runAction(() => catalogRepo.saveCatalogItem(form));
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/admin/documents");
    revalidatePath("/admin/documents/new");
  }
  return result;
}

export async function deleteCatalogItemAction(id: string) {
  const result = await runAction(() => catalogRepo.deleteCatalogItem(id));
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/admin/documents");
  }
  return result;
}
