import { neonQuery } from "@/lib/neon/server-db";
import {
  mapSupplierProfileRow,
  type PublicSupplierProfile,
  type SupplierProfileRow,
} from "@/lib/vendors/marketplace";

const NEON_SUPPLIER_PROFILE_COLUMNS = `
  id,
  slug,
  business_name,
  category,
  city,
  short_description,
  about,
  public_email,
  public_phone,
  website_url,
  instagram_url,
  service_level,
  services,
  is_verified,
  published_at::text AS published_at
`;

export class SupplierMarketplaceUnavailableError extends Error {
  constructor(message = "Não foi possível carregar os fornecedores.") {
    super(message);
    this.name = "SupplierMarketplaceUnavailableError";
  }
}

async function listPublishedSupplierProfilesNeon(
  query: typeof neonQuery = neonQuery,
): Promise<PublicSupplierProfile[]> {
  try {
    const result = await query<SupplierProfileRow>(
      `SELECT ${NEON_SUPPLIER_PROFILE_COLUMNS}
         FROM public.supplier_profiles
        WHERE publication_status = 'published'::supplier_publication_status
        ORDER BY published_at DESC NULLS LAST`,
    );
    return result.rows.map(mapSupplierProfileRow);
  } catch (cause) {
    throw new SupplierMarketplaceUnavailableError(
      cause instanceof Error ? cause.message : undefined,
    );
  }
}

async function getPublishedSupplierProfileBySlugNeon(
  normalizedSlug: string,
  query: typeof neonQuery = neonQuery,
): Promise<PublicSupplierProfile | null> {
  try {
    const result = await query<SupplierProfileRow>(
      `SELECT ${NEON_SUPPLIER_PROFILE_COLUMNS}
         FROM public.supplier_profiles
        WHERE slug = $1
          AND publication_status = 'published'::supplier_publication_status
        LIMIT 1`,
      [normalizedSlug],
    );
    return result.rows[0] ? mapSupplierProfileRow(result.rows[0]) : null;
  } catch (cause) {
    throw new SupplierMarketplaceUnavailableError(
      cause instanceof Error ? cause.message : undefined,
    );
  }
}

export async function listPublishedSupplierProfiles(
  query?: typeof neonQuery,
): Promise<PublicSupplierProfile[]> {
  return listPublishedSupplierProfilesNeon(query);
}

export async function getPublishedSupplierProfileBySlug(
  slug: string,
  query?: typeof neonQuery,
): Promise<PublicSupplierProfile | null> {
  const normalizedSlug = slug.trim().toLocaleLowerCase("pt-PT");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    return null;
  }

  return getPublishedSupplierProfileBySlugNeon(normalizedSlug, query);
}
