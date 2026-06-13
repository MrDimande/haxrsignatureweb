"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as clientsRepo from "@/lib/admin/repositories/clients.repository";
import type { Client, ClientFormData } from "@/lib/admin/types";

export async function getClientsAction() {
  return runAction(() => clientsRepo.listClients());
}

export async function saveClientAction(data: ClientFormData, id?: string) {
  const result = await runAction(() => clientsRepo.upsertClient(data, id));
  if (result.success) {
    revalidatePath("/admin/clients");
    revalidatePath("/admin/documents");
  }
  return result;
}

export async function deleteClientAction(id: string) {
  const result = await runAction(() => clientsRepo.deleteClient(id));
  if (result.success) {
    revalidatePath("/admin/clients");
  }
  return result;
}

export type { Client };
