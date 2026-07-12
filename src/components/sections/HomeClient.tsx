"use client";

import Hero from "@/components/sections/Hero";
import WeddingAdvisory from "@/components/sections/WeddingAdvisory";
import HomePlatformShowcase from "@/components/home/HomePlatformShowcase";
import HomeConciergeSection from "@/components/home/HomeConciergeSection";
import HomeToolsGrid from "@/components/home/HomeToolsGrid";
import HomeVendorCategories from "@/components/home/HomeVendorCategories";
import DigitalInvitations from "@/components/sections/DigitalInvitations";
import HomeWeddingGallery from "@/components/home/HomeWeddingGallery";
import InspirationFeed from "@/components/sections/InspirationFeed";
import HomeHowWeWork from "@/components/marketing/home/HomeHowWeWork";
import HomeTestimonialsTeaser from "@/components/marketing/home/HomeTestimonialsTeaser";
import { CTABand } from "@/components/marketing/PageHero";
import { portfolioArchive, testimonials } from "@/lib/site-config";
import { homeHowWeWork } from "@/lib/marketing/pages";

export default function HomeClient() {
  return (
    <>
      <Hero />
      <WeddingAdvisory />
      <HomePlatformShowcase />
      <HomeConciergeSection full={false} />
      <HomeToolsGrid />
      <HomeVendorCategories />
      <DigitalInvitations />
      <HomeWeddingGallery />
      <InspirationFeed />
      <HomeHowWeWork phases={homeHowWeWork} />
      <HomeTestimonialsTeaser testimonials={testimonials} />
      <CTABand />
    </>
  );
}
