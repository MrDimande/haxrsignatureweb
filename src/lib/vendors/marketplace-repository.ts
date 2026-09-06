import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { neonQuery } from "@/lib/neon/server-db";
import {
  mapSupplierProfileRow,
  type PublicSupplierProfile,
  type SupplierProfileRow,
} from "@/lib/vendors/marketplace";

const SUPPLIER_PROFILE_COLUMNS = [
  "id",
  "slug",
  "business_name",
  "category",
  "city",
  "short_description",
  "about",
  "public_email",
  "public_phone",
  "website_url",
  "instagram_url",
  "service_level",
  "services",
  "is_verified",
  "published_at",
].join(", ");

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

type QueryError = { message: string } | null;
type QueryResult<T> = { data: T | null; error: QueryError };

type SupplierProfilesQuery = {
  eq(column: string, value: string): SupplierProfilesQuery;
  order(
    column: string,
    options: { ascending: boolean; nullsFirst?: boolean },
  ): Promise<QueryResult<SupplierProfileRow[]>>;
  maybeSingle(): Promise<QueryResult<SupplierProfileRow>>;
};

export type SupplierMarketplaceQueryClient = {
  from(table: "supplier_profiles"): {
    select(columns: string): SupplierProfilesQuery;
  };
};

export class SupplierMarketplaceUnavailableError extends Error {
  constructor(message = "Não foi possível carregar os fornecedores.") {
    super(message);
    this.name = "SupplierMarketplaceUnavailableError";
  }
}

async function listPublishedSupplierProfilesNeon(): Promise<PublicSupplierProfile[]> {
  try {
    const result = await neonQuery<SupplierProfileRow>(
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
): Promise<PublicSupplierProfile | null> {
  try {
    const result = await neonQuery<SupplierProfileRow>(
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
  client: SupplierMarketplaceQueryClient | null,
): Promise<PublicSupplierProfile[]> {
  if (shouldUseNeonServerDatabase()) {
    return listPublishedSupplierProfilesNeon();
  }

  if (!client) {
    throw new SupplierMarketplaceUnavailableError("Cliente Supabase indisponível.");
  }

  const { data, error } = await client
    .from("supplier_profiles")
    .select(SUPPLIER_PROFILE_COLUMNS)
    .eq("publication_status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new SupplierMarketplaceUnavailableError(error.message);
  }

  return (data ?? []).map(mapSupplierProfileRow);
}

export async function getPublishedSupplierProfileBySlug(
  client: SupplierMarketplaceQueryClient | null,
  slug: string,
): Promise<PublicSupplierProfile | null> {
  const normalizedSlug = slug.trim().toLocaleLowerCase("pt-PT");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    return null;
  }

  if (shouldUseNeonServerDatabase()) {
    return getPublishedSupplierProfileBySlugNeon(normalizedSlug);
  }

  if (!client) {
    throw new SupplierMarketplaceUnavailableError("Cliente Supabase indisponível.");
  }

  const { data, error } = await client
    .from("supplier_profiles")
    .select(SUPPLIER_PROFILE_COLUMNS)
    .eq("slug", normalizedSlug)
    .eq("publication_status", "published")
    .maybeSingle();

  if (error) {
    throw new SupplierMarketplaceUnavailableError(error.message);
  }

  return data ? mapSupplierProfileRow(data) : null;
}
