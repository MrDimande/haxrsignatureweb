import StructuredData from "@/components/seo/StructuredData";
import type { Metadata } from "next";
import InvitationAtelierExperience from "./_components/InvitationAtelierExperience";

export const metadata: Metadata = {
  title: {
    absolute: "Web-Convites para Casamentos, Lobolos e Celebrações | HAXR Signature",
  },
  description:
    "Web-Convites e identidades visuais HAXR concebidos à medida, com RSVP, Save the Date, Plus Memories e Find Your Seat.",
};

export default function ConvitesIdentidadePage() {
  return (
    <>
      <StructuredData page="convites" />
      <InvitationAtelierExperience />
    </>
  );
}
