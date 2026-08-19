import type { Metadata } from "next";
import StructuredData from "@/components/seo/StructuredData";
import GuestHeroInteractive from "@/components/marketing/GuestHeroInteractive";
import GuestJourneyFlow from "@/components/marketing/GuestJourneyFlow";
import GuestInteractiveShowcase from "@/components/marketing/GuestInteractiveShowcase";
import GuestOperationsConsole from "@/components/marketing/GuestOperationsConsole";
import GuestPhysicalIdentity from "@/components/marketing/GuestPhysicalIdentity";
import GuestExperienceExtensions from "@/components/marketing/GuestExperienceExtensions";
import GuestDiagnosticSection from "@/components/marketing/GuestDiagnosticSection";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = marketingMetadata("convidados");

export default function GestaoConvidadosPage() {
  return (
    <>
      <StructuredData page="convidados" />

      {/* ═══════════════════════════════════════════════════════════════════
          01 · HERO — GUEST EXPERIENCE & RECEPTION GOVERNANCE
          ═══════════════════════════════════════════════════════════════════ */}
      <GuestHeroInteractive />

      {/* ═══════════════════════════════════════════════════════════════════
          02 · THE GUEST JOURNEY — DA LISTA AO ACOLHIMENTO
          ═══════════════════════════════════════════════════════════════════ */}
      <GuestJourneyFlow />

      {/* ═══════════════════════════════════════════════════════════════════
          03 · INTERACTIVE SHOWCASE — RSVP · SEATING · FIND YOUR SEAT · CHECK-IN
          ═══════════════════════════════════════════════════════════════════ */}
      <GuestInteractiveShowcase />

      {/* ═══════════════════════════════════════════════════════════════════
          04 · THE OPERATIONS CONSOLE — O CONTROLO NOS BASTIDORES
          ═══════════════════════════════════════════════════════════════════ */}
      <GuestOperationsConsole />

      {/* ═══════════════════════════════════════════════════════════════════
          05 · DA INFORMAÇÃO À IDENTIDADE (DO DIGITAL AO ESPAÇO FÍSICO)
          ═══════════════════════════════════════════════════════════════════ */}
      <GuestPhysicalIdentity />

      {/* ═══════════════════════════════════════════════════════════════════
          06 · EXPERIENCE EXTENSIONS — ALÉM DA RECEPÇÃO
          ═══════════════════════════════════════════════════════════════════ */}
      <GuestExperienceExtensions />

      {/* ═══════════════════════════════════════════════════════════════════
          07 · DIAGNÓSTICO PRIVADO & RESERVA
          ═══════════════════════════════════════════════════════════════════ */}
      <GuestDiagnosticSection />
    </>
  );
}
