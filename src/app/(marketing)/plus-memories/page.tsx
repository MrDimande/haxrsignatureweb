import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import { marketingMetadata } from "@/lib/marketing/seo";
import PlusMemoriesExperience from "./_components/PlusMemoriesExperience";

export const metadata: Metadata = marketingMetadata("plusMemories");

export default function PlusMemoriesPage() {
  return (
    <>
      <StructuredData page="plusMemories" />
      <PlusMemoriesExperience />
    </>
  );
}
