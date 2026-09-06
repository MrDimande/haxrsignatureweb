import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import VendorDirectory from "@/components/vendors/VendorDirectory";
import { shouldUseNeonServerDatabase } from "@/lib/neon/config";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import {
  listPublishedSupplierProfiles,
  type SupplierMarketplaceQueryClient,
} from "@/lib/vendors/marketplace-repository";
import type { PublicSupplierProfile } from "@/lib/vendors/marketplace";

export const metadata: Metadata = {
  title: "Fornecedores de Casamento Aprovados | HAXR Signature",
  description:
    "Descubra e guarde fornecedores de casamento publicados após revisão pela equipa HAXR.",
};

export const dynamic = "force-dynamic";

async function loadDirectory(): Promise<{
  suppliers: PublicSupplierProfile[];
  unavailable: boolean;
}> {
  try {
    const client = shouldUseNeonServerDatabase()
      ? null
      : ((await createSupabaseServerAuthClient()) as unknown as SupplierMarketplaceQueryClient);
    return {
      suppliers: await listPublishedSupplierProfiles(client),
      unavailable: false,
    };
  } catch (error) {
    console.error(
      "[supplier-marketplace] directory unavailable",
      error instanceof Error ? error.message : "unknown error",
    );
    return { suppliers: [], unavailable: true };
  }
}

export default async function FornecedoresPage() {
  const { suppliers, unavailable } = await loadDirectory();

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-24 pt-28 text-brand-text-dark">
      <div className="site-container-wide">
        <header className="grid gap-8 border-b border-brand-champagne/35 pb-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="max-w-3xl">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-brand-gold">
              Directório HAXR
            </p>
            <h1 className="mt-4 font-serif text-4xl font-light leading-tight md:text-6xl">
              Profissionais reais para decisões mais tranquilas.
            </h1>
            <p className="mt-5 max-w-2xl font-sans text-sm font-light leading-7 text-brand-text-dark/65 md:text-base">
              Pesquise profissionais aprovados, consulte informação publicada pelo próprio
              fornecedor e guarde os perfis relevantes na sua conta. Categorias sem
              fornecedores permanecem vazias — sem perfis ou avaliações inventadas.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-champagne/45 bg-white p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" />
              <div>
                <h2 className="font-serif text-lg font-light">É profissional de eventos?</h2>
                <p className="mt-2 text-xs font-light leading-5 text-brand-text-dark/60">
                  Candidate o seu negócio. O perfil só fica público depois de revisão.
                </p>
                <Link
                  href="/for-pros"
                  className="mt-4 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold hover:text-brand-text-dark"
                >
                  Iniciar candidatura
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-10" aria-label="Directório de fornecedores">
          <VendorDirectory suppliers={suppliers} unavailable={unavailable} />
        </section>
      </div>
    </main>
  );
}
