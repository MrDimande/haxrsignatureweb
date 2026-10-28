import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPortfolioProject,
  getNextProjectInCollection,
} from "@/lib/portfolio/service";
import { getPublishedPortfolioProjects } from "@/lib/portfolio/catalog";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";
import { isValidSession } from "@/lib/admin/auth";
import ProjectDetailView from "@/components/portfolio/ProjectDetailView";
import { buildPageMetadata } from "@/lib/seo";

export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  const projects = getPublishedPortfolioProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPortfolioProject(slug);
  if (!project) return {};

  return buildPageMetadata({
    path: `/portfolio/${project.slug}`,
    title: project.seo.title,
    description: project.seo.description,
    keywords: project.seo.keywords || [
      project.title,
      project.categoryLabel,
      "HAXR Signature",
      "The Signature Collection",
      project.location,
    ],
  });
}

export default async function PortfolioProjectPage({ params }: PageProps) {
  const { slug } = await params;

  // Verifica se o visitante possui uma sessão administrativa activa para permitir pré-visualização de rascunhos
  let isAdmin = false;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) {
      isAdmin = await isValidSession(token);
    }
  } catch {
    isAdmin = false;
  }

  const project = await getPortfolioProject(slug, { allowDrafts: isAdmin });

  if (!project) {
    notFound();
  }

  const nextProject = await getNextProjectInCollection(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: project.title,
    description: project.summary,
    url: `https://www.haxrsignature.com/portfolio/${project.slug}`,
    image: project.coverImage,
    creator: {
      "@type": "Organization",
      name: "HAXR Signature Atelier Cerimonial",
      url: "https://www.haxrsignature.com",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Início",
          item: "https://www.haxrsignature.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "The Signature Collection",
          item: "https://www.haxrsignature.com/portfolio",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: project.title,
          item: `https://www.haxrsignature.com/portfolio/${project.slug}`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {project.status !== "published" && (
        <aside
          aria-label="Aviso de Pré-visualização Administrativa"
          className="sticky top-0 z-50 bg-[#141210] border-b border-[#C9A96E]/40 px-4 py-2.5 text-center text-xs text-[#E8DCC4] flex items-center justify-center gap-2 shadow-xl"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-[#C9A96E] animate-pulse" />
          <span className="font-mono uppercase tracking-widest text-[10px] text-[#C9A96E] font-bold">
            Modo de Pré-visualização Administrativa
          </span>
          <span className="text-[#E8DCC4]/70 text-[11px]">
            — Este projecto está em estado <strong>{project.status.toUpperCase()}</strong> ({project.editorialReviewStatus}) e não está acessível ao público.
          </span>
        </aside>
      )}
      <ProjectDetailView project={project} nextProject={nextProject} />
    </>
  );
}
