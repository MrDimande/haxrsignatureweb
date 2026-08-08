import RevealOnScroll from "@/components/ui/RevealOnScroll";
import PortalTopNav from "@/components/portal/PortalTopNav";
import PlanningCard from "@/components/portal/PlanningCard";
import VendorCard from "@/components/portal/VendorCard";
import AssistantPromo from "@/components/portal/AssistantPromo";
import {
  portalDashboardPreview,
  portalPlanningCards,
  portalVendorSamples,
} from "@/lib/portal/dashboard-content";

export default function PortalDashboardPreview() {
  const { eventName, greeting, conciergePending } = portalDashboardPreview;

  return (
    <section className="relative py-16 md:py-24 bg-brand-ivory border-y border-brand-champagne/50">
      <div className="site-container-wide">
        <RevealOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <p className="section-label mb-4">Pré-visualização</p>
            <h2 className="type-section-title mb-4">
              O painel do vosso evento
            </h2>
            <p className="type-section-lead text-brand-text-dark/70">
              Inspirado na experiência Loverly — orçamento, convidados,
              checklist, fornecedores e HAXR Concierge num só lugar.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.05}>
          <div className="rounded-sm border border-brand-champagne shadow-[0_32px_80px_rgba(8,7,6,0.12)] overflow-hidden bg-[#f7f1e8]">
            <PortalTopNav embedded />

            <div className="px-4 md:px-8 py-6 md:py-8 bg-white border-b border-brand-champagne/40">
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-brand-gold mb-1">
                {eventName}
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-brand-text-dark">
                {greeting}
              </h3>
            </div>

            <div className="p-4 md:p-8 space-y-8 md:space-y-10 bg-[#f7f1e8]">
              <div>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-text-dark/45 mb-4">
                  Planeamento
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {portalPlanningCards.map((card) => (
                    <PlanningCard key={card.id} card={card} />
                  ))}
                </div>
              </div>

              <AssistantPromo pendingCount={conciergePending} />

              <div>
                <div className="flex items-end justify-between gap-4 mb-4">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-text-dark/45">
                    Fornecedores sugeridos
                  </p>
                  <span className="font-sans text-[10px] text-brand-text-dark/40 italic">
                    Exemplo ilustrativo
                  </span>
                </div>
                {portalVendorSamples.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portalVendorSamples.map((vendor) => (
                      <VendorCard key={vendor.id} vendor={vendor} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed border-brand-champagne bg-white px-5 py-8 text-center">
                    <p className="font-sans text-sm font-light text-brand-text-dark/60">
                      Sem fornecedores sugeridos. Apenas perfis reais e aprovados serão apresentados aqui.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <p className="text-center font-sans text-xs text-brand-text-dark/45 mt-6 max-w-lg mx-auto">
          Pré-visualização conceptual. Clientes activos usam o admin HAXR; o portal
          autenticado chega na V3.
        </p>
      </div>
    </section>
  );
}
