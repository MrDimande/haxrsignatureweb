import React from "react";
import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import { marketingMetadata } from "@/lib/marketing/seo";
import {
  listPortfolioProjects,
  getPortfolioCategories,
} from "@/lib/portfolio/service";
import PortfolioHero from "@/components/portfolio/PortfolioHero";
import PortfolioGallery from "@/components/portfolio/PortfolioGallery";
import DigitalExperiencesShowcase from "@/components/portfolio/DigitalExperiencesShowcase";
import FourSpecialties from "@/components/portfolio/FourSpecialties";
import IntegralExperienceTimeline from "@/components/portfolio/IntegralExperienceTimeline";
import HaxrMethodology from "@/components/portfolio/HaxrMethodology";
import ProofOfExecution from "@/components/portfolio/ProofOfExecution";
import PortfolioCTA from "@/components/portfolio/PortfolioCTA";

export const metadata: Metadata = marketingMetadata("portfolio");

export default async function PortfolioPage() {
  const [projects, categories] = await Promise.all([
    listPortfolioProjects(),
    getPortfolioCategories(),
  ]);

  return (
    <>
      <StructuredData page="portfolio" />

      {/* Secção I — Capa Editorial (The Signature Collection) */}
      <PortfolioHero />

      {/* Secção II — Histórias de Assinatura (Galeria Editorial Interactiva com Filtros) */}
      <PortfolioGallery projects={projects} categories={categories} />

      {/* Secção IV — Digital Experiences Showcase (Web-Invites Prólogo, Elo, Legado & Demos) */}
      <DigitalExperiencesShowcase />

      {/* Secção V — As Quatro Especialidades Oficiais do Atelier */}
      <FourSpecialties />

      {/* Secção VI — A Experiência Integral HAXR (Timeline Cerimonial) */}
      <IntegralExperienceTimeline />

      {/* Secção VII — O Método HAXR (Rigor & Discrição) */}
      <HaxrMethodology />

      {/* Secção VIII — Confiança & Prova de Execução (Testemunhos Reais) */}
      <ProofOfExecution />

      {/* Secção IX — Contacto & Conversão de Alto Padrão */}
      <PortfolioCTA />
    </>
  );
}
