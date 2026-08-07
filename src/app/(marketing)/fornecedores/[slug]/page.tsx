import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import {
  getPublishedSupplierProfileBySlug,
  type SupplierMarketplaceQueryClient,
} from "@/lib/vendors/marketplace-repository";
import { buildSupplierInitials } from "@/lib/vendors/marketplace";

export const dynamic = "force-dynamic";

async function loadSupplier(slug: string) {
  const client =
    (await createSupabaseServerAuthClient()) as unknown as SupplierMarketplaceQueryClient;
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
      title: `${supplier.name} | Fornecedores HAXR`,
      description:
        supplier.description ||
        `${supplier.categoryLabel} em ${supplier.city}, publicado no directório HAXR.`,
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

  return (
    <main className="min-h-screen bg-[#faf8f5] pb-24 pt-28 text-brand-text-dark">
      <div className="site-container mx-auto max-w-5xl">
        <Link
          href="/fornecedores"
          className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/55 transition hover:text-brand-gold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao directório
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl border border-brand-champagne/45 bg-white shadow-[0_20px_70px_rgba(28,26,23,0.07)]">
          <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="flex min-h-72 items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(191,155,82,0.28),transparent_55%),linear-gradient(145deg,#191512,#0d0b0a)] lg:min-h-full">
              <span className="font-serif text-7xl font-light tracking-[0.08em] text-brand-champagne/85">
                {buildSupplierInitials(supplier.name)}
              </span>
            </div>

            <div className="p-7 md:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-brand-champagne/35 px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                  {supplier.categoryLabel}
                </span>
                {supplier.verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-gold">
                    <BadgeCheck className="h-4 w-4" />
                    Perfil verificado
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 font-serif text-4xl font-light leading-tight md:text-5xl">
                {supplier.name}
              </h1>
              <p className="mt-4 flex items-center gap-2 text-sm font-light text-brand-text-dark/60">
                <MapPin className="h-4 w-4 text-brand-gold" />
                {supplier.city}
              </p>

              {supplier.description ? (
                <p className="mt-6 max-w-2xl text-base font-light leading-8 text-brand-text-dark/70">
                  {supplier.description}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                {supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-black px-5 py-2.5 text-xs text-white transition hover:bg-brand-gold"
                  >
                    <Mail className="h-4 w-4" />
                    Enviar email
                  </a>
                ) : null}
                {supplier.phone ? (
                  <a
                    href={`tel:${supplier.phone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-champagne/60 px-5 py-2.5 text-xs transition hover:border-brand-gold hover:text-brand-gold"
                  >
                    <Phone className="h-4 w-4" />
                    Telefonar
                  </a>
                ) : null}
                {supplier.websiteUrl ? (
                  <a
                    href={supplier.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-champagne/60 px-5 py-2.5 text-xs transition hover:border-brand-gold hover:text-brand-gold"
                  >
                    <Globe2 className="h-4 w-4" />
                    Website
                  </a>
                ) : null}
                {supplier.instagramUrl ? (
                  <a
                    href={supplier.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-champagne/60 px-5 py-2.5 text-xs transition hover:border-brand-gold hover:text-brand-gold"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Instagram
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {(supplier.about || supplier.services.length > 0) ? (
            <div className="grid gap-10 border-t border-brand-champagne/30 p-7 md:p-10 lg:grid-cols-2">
              {supplier.about ? (
                <section>
                  <h2 className="font-serif text-2xl font-light">Sobre o fornecedor</h2>
                  <p className="mt-4 whitespace-pre-line text-sm font-light leading-7 text-brand-text-dark/65">
                    {supplier.about}
                  </p>
                </section>
              ) : null}

              {supplier.services.length > 0 ? (
                <section>
                  <h2 className="font-serif text-2xl font-light">Serviços publicados</h2>
                  <ul className="mt-4 space-y-3">
                    {supplier.services.map((service) => (
                      <li
                        key={service}
                        className="border-b border-brand-champagne/25 pb-3 text-sm font-light text-brand-text-dark/70"
                      >
                        {service}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
