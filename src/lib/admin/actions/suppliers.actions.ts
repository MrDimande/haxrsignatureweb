"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAction } from "@/lib/admin/actions/auth";
import * as suppliersRepo from "@/lib/admin/repositories/suppliers.repository";
import {
  supplierProfileInputSchema,
  supplierReviewInputSchema,
  supplierUatRemovalInputSchema,
  type SupplierProfileInput,
  type SupplierReviewInput,
  type SupplierUatRemovalInput,
} from "@/lib/admin/suppliers.types";

const adminEmailSchema = z.string().trim().toLowerCase().email();

function getAdminActorEmail(): string {
  const parsed = adminEmailSchema.safeParse(process.env.ADMIN_EMAIL);
  if (!parsed.success) {
    throw new Error("O email do administrador não está configurado correctamente.");
  }
  return parsed.data;
}

function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  return parsed.data;
}

function revalidateSupplierViews(): void {
  revalidatePath("/admin/suppliers");
  revalidatePath("/fornecedores");
  revalidatePath("/fornecedores/[slug]", "page");
}

export async function reviewSupplierApplicationAction(
  input: SupplierReviewInput,
) {
  const result = await runAction(async () => {
    const validInput = parseInput(supplierReviewInputSchema, input);
    await suppliersRepo.reviewSupplierApplication(
      validInput,
      getAdminActorEmail(),
    );
    return { applicationId: validInput.applicationId };
  });
  if (result.success) revalidateSupplierViews();
  return result;
}

export async function saveSupplierProfileAction(input: SupplierProfileInput) {
  const result = await runAction(async () => {
    const validInput = parseInput(supplierProfileInputSchema, input);
    await suppliersRepo.saveSupplierProfile(validInput, getAdminActorEmail());
    return { profileId: validInput.profileId };
  });
  if (result.success) revalidateSupplierViews();
  return result;
}

export async function removeSupplierUatAction(
  input: SupplierUatRemovalInput,
) {
  const result = await runAction(async () => {
    const validInput = parseInput(supplierUatRemovalInputSchema, input);
    await suppliersRepo.removeSupplierUat(validInput, getAdminActorEmail());
    return { applicationId: validInput.applicationId };
  });
  if (result.success) revalidateSupplierViews();
  return result;
}
