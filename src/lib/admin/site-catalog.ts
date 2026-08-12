import {
  invitationOccasions,
  invitationPackages,
} from "@/lib/site-config";
import type { BusinessId, ServiceCatalogItem } from "./types";

const occasionLabelById = Object.fromEntries(
  invitationOccasions.map((o) => [o.id, o.label])
) as Record<string, string>;

/** Catálogo oficial derivado dos pacotes do site público */
export function buildHaxrServiceCatalog(): ServiceCatalogItem[] {
  return invitationPackages
    .filter((pkg) => pkg.price != null)
    .map((pkg) => {
      const occasionId = pkg.occasion;
      const occasionLabel = occasionLabelById[occasionId] ?? occasionId;

      return {
        id: pkg.id,
        name: `${pkg.name} (${occasionLabel})`,
        category: "invitations",
        description: `${pkg.subtitle} ${pkg.description}`.trim(),
        basePrice: pkg.price as number,
        businessIds: ["haxr-signature"] as BusinessId[],
      };
    });
}

export const haxrSiteCatalog = buildHaxrServiceCatalog();
