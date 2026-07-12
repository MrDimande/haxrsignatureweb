import type { Metadata } from "next";
import HomeClient from "@/components/sections/HomeClient";
import StructuredData from "@/components/seo/StructuredData";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("home");

export default function HomePage() {
  return (
    <>
      <StructuredData page="home" />
      <HomeClient />
    </>
  );
}
