import PortalInvalidLink from "@/components/portal/PortalInvalidLink";
import { PortalContractsSection, PortalMessagesSection } from "@/components/portal/sections/PortalPremiumSections";
import { loadPortalPage, PortalSectionHeader } from "@/lib/portal/portal-page";

type PortalContractsPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PortalContractsPage({ params }: PortalContractsPageProps) {
  const { token } = await params;
  const data = await loadPortalPage(token);
  if (!data) return <PortalInvalidLink />;

  return (
    <div className="space-y-10">
      <PortalSectionHeader
        title="Contratos"
        description="Contratos e documentação formal partilhada pela equipa HAXR."
      />
      <PortalContractsSection contracts={data.contracts} />

      {data.messages.length > 0 ? (
        <section className="space-y-4 border-t border-white/10 pt-8">
          <h3 className="font-mono text-[9px] tracking-[0.4em] uppercase text-admin-gold">
            Mensagens da equipa
          </h3>
          <PortalMessagesSection messages={data.messages} />
        </section>
      ) : null}
    </div>
  );
}
