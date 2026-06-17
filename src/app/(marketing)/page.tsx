import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import PillarCards from "@/components/marketing/PillarCards";
import HomeHowWeWork from "@/components/marketing/home/HomeHowWeWork";
import HomePortfolioTeaser from "@/components/marketing/home/HomePortfolioTeaser";
import HomeTechnology from "@/components/marketing/home/HomeTechnology";
import HomeTestimonialsTeaser from "@/components/marketing/home/HomeTestimonialsTeaser";
import { CTABand } from "@/components/marketing/PageHero";
import StructuredData from "@/components/seo/StructuredData";
import { brandEssence } from "@/lib/marketing/editorial";
import {
  homeHowWeWork,
  homeTechnology,
  marketingPillars,
} from "@/lib/marketing/pages";
import { marketingMetadata } from "@/lib/marketing/seo";
import { portfolioArchive, testimonials } from "@/lib/site-config";

export const metadata: Metadata = marketingMetadata("home");

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <Hero />
      <PillarCards
        pillars={marketingPillars}
        headline={brandEssence.pillarsHeadline}
        intro={brandEssence.pillarsIntro}
      />
      <HomeHowWeWork phases={homeHowWeWork} />
      <HomePortfolioTeaser items={portfolioArchive} />
      <HomeTechnology items={homeTechnology} />
      <HomeTestimonialsTeaser testimonials={testimonials} />
      <CTABand />
    </>
  );
}
