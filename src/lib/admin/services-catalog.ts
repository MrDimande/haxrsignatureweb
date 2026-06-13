import type { BusinessId, ServiceCatalogItem } from "@/lib/admin/types";
import { haxrSiteCatalog } from "@/lib/admin/site-catalog";

/** Fallback estático — alinhado com invitationPackages em site-config.ts */
export const servicesCatalog: ServiceCatalogItem[] = [
  ...haxrSiteCatalog,
  {
    id: "copywriting",
    name: "Copywriting Profissional",
    category: "media",
    description: "Textos comerciais e institucionais",
    basePrice: 8000,
    businessIds: ["brainywrite"],
  },
  {
    id: "content-strategy",
    name: "Estratégia de Conteúdo",
    category: "media",
    description: "Planeamento editorial e narrativa de marca",
    basePrice: 12000,
    businessIds: ["brainywrite"],
  },
];

export function getCatalogForBusiness(businessId: BusinessId): ServiceCatalogItem[] {
  return servicesCatalog.filter(
    (item) => !item.businessIds || item.businessIds.includes(businessId)
  );
}
