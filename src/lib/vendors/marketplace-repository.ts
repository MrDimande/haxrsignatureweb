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

export async function listPublishedSupplierProfiles(
  client: SupplierMarketplaceQueryClient,
): Promise<PublicSupplierProfile[]> {
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
  client: SupplierMarketplaceQueryClient,
  slug: string,
): Promise<PublicSupplierProfile | null> {
  const normalizedSlug = slug.trim().toLocaleLowerCase("pt-PT");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    return null;
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
