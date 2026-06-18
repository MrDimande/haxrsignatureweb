import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StructuredData from "@/components/seo/StructuredData";
import ExperienceDemoView from "@/app/(marketing)/experiencias/[slug]/ExperienceDemoView";
import { demoCatalog, getDemoBySlug } from "@/lib/demos/catalog";
import { buildPageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return demoCatalog.map((demo) => ({ slug: demo.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);
  if (!demo) return {};

  return buildPageMetadata({
    path: demo.publicPath,
    title: demo.title,
    description: demo.description,
    keywords: [
      "convite digital",
      "experiência HAXR",
      demo.category,
      "Maputo",
    ],
  });
}

export default async function ExperienciaDemoPage({ params }: PageProps) {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);
  if (!demo) notFound();

  return (
    <>
      <StructuredData demoSlug={slug} />
      <ExperienceDemoView demo={demo} />
    </>
  );
}
