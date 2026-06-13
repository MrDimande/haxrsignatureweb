"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/admin/actions/auth";
import * as signaturesRepo from "@/lib/admin/repositories/signatures.repository";
import type {
  BusinessId,
  BusinessSignature,
  UploadSignatureInput,
} from "@/lib/admin/types";

export async function listSignaturesAction(businessId?: BusinessId) {
  return runAction(() => signaturesRepo.listSignatures(businessId));
}

export async function uploadSignatureAction(input: UploadSignatureInput) {
  const result = await runAction(() => signaturesRepo.createSignature(input));
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/admin/documents/new");
    revalidatePath("/admin/documents");
  }
  return result;
}

export async function deleteSignatureAction(id: string) {
  const result = await runAction(() => signaturesRepo.deleteSignature(id));
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/admin/documents/new");
    revalidatePath("/admin/documents");
  }
  return result;
}

export async function setDefaultSignatureAction(id: string, businessId: BusinessId) {
  const result = await runAction(() =>
    signaturesRepo.setDefaultSignature(id, businessId)
  );
  if (result.success) {
    revalidatePath("/admin/settings");
    revalidatePath("/admin/documents/new");
    revalidatePath("/admin/documents");
  }
  return result;
}

export type { BusinessSignature };
