import {
  invitationOccasions,
  invitationPackages,
} from "@/lib/site-config";
import type { BusinessId, ServiceCatalogItem, ServiceCategory } from "./types";

const occasionLabelById = Object.fromEntries(
  invitationOccasions.map((o) => [o.id, o.label])
) as Record<string, string>;

/** Catálogo oficial derivado dos pacotes do site público */
export function buildHaxrServiceCatalog(): ServiceCatalogItem[] {
  return invitationPackages
    .filter((pkg) => pkg.price != null && !("isQuote" in pkg && pkg.isQuote))
    .map((pkg) => {
      const occasionId = pkg.occasions[0];
      const occasionLabel = occasionLabelById[occasionId] ?? occasionId;

      return {
        id: pkg.id,
        name: `${pkg.name} (${occasionLabel})`,
        category: mapOccasionToCategory(occasionId),
        description: `${pkg.subtitle} ${pkg.desc}`.trim(),
        basePrice: pkg.price as number,
        businessIds: ["haxr-signature"] as BusinessId[],
      };
    });
}

function mapOccasionToCategory(_occasionId: string): ServiceCategory {
  return "invitations";
}

export const haxrSiteCatalog = buildHaxrServiceCatalog();
