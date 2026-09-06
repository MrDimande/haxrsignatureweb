import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import {
  getPublishedSupplierProfileBySlug,
  type SupplierMarketplaceQueryClient,
} from "@/lib/vendors/marketplace-repository";
import { getRealWeddingsForCategory } from "@/lib/vendors/vendor-real-weddings";
import SupplierProfileClient from "@/components/vendors/SupplierProfileClient";

export const dynamic = "force-dynamic";

async function loadSupplier(slug: string) {
  const client = shouldUseNeonServerDatabase()
    ? null
    : ((await createSupabaseServerAuthClient()) as unknown as SupplierMarketplaceQueryClient);
  return getPublishedSupplierProfileBySlug(client, slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supplier = await loadSupplier(slug);
    if (!supplier) return { title: "Fornecedor não encontrado | HAXR Signature" };
    return {
      title: `${supplier.name} — ${supplier.categoryLabel} em ${supplier.city} | HAXR Signature`,
      description:
        supplier.description ||
        `${supplier.categoryLabel} em ${supplier.city}, com curadoria e aprovação no directório de luxo HAXR.`,
    };
  } catch {
    return { title: "Fornecedores HAXR" };
  }
}

export default async function SupplierProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supplier = await loadSupplier(slug);
  if (!supplier) notFound();

  const realWeddings = getRealWeddingsForCategory(supplier.category, 3);

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-24 pt-24 md:pt-28 text-brand-text-dark font-sans">
      <SupplierProfileClient
        supplier={supplier}
        realWeddings={realWeddings}
      />
    </main>
  );
}
