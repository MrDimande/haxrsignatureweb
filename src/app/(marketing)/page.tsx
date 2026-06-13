import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import Philosophy from "@/components/sections/Philosophy";
import Universe from "@/components/sections/Universe";
import DigitalInvitations from "@/components/sections/DigitalInvitations";
import Experiences from "@/components/sections/Experiences";
import Method from "@/components/sections/Method";
import Management from "@/components/sections/Management";
import Archive from "@/components/sections/Archive";
import Contact from "@/components/sections/Contact";
import StructuredData from "@/components/seo/StructuredData";
import { siteSeo } from "@/lib/seo";

export const metadata: Metadata = {
  title: siteSeo.title,
  description: siteSeo.description,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <StructuredData />
      <Hero />
      <Philosophy />
      <Universe />
      <DigitalInvitations />
      <Experiences />
      <Method />
      <Management />
      <Archive />
      <Contact />
    </>
  );
}
