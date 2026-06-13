"use server";

import { runAction } from "@/lib/admin/actions/auth";
import * as businessesRepo from "@/lib/admin/repositories/businesses.repository";
import * as catalogRepo from "@/lib/admin/repositories/catalog.repository";
import type { BusinessId } from "@/lib/admin/types";

export async function getBusinessesAction() {
  return runAction(() => businessesRepo.listBusinesses());
}

export async function getCatalogAction(businessId?: BusinessId) {
  return runAction(() =>
    businessId
      ? catalogRepo.getCatalogForBusiness(businessId)
      : catalogRepo.listCatalog()
  );
}
