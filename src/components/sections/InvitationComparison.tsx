import {
  getComparisonLevel,
  invitationComparison,
  type InvitationPackage,
} from "@/lib/marketing/invitation-offer";
import { Check, Minus, Plus } from "lucide-react";

function ComparisonMark({
  level,
  label,
}: {
  level: "included" | "optional" | "none";
  label: string;
}) {
  if (level === "included") {
    return (
      <span className="inline-flex items-center gap-2 text-brand-text-dark">
        <Check aria-hidden="true" className="size-4 text-brand-gold" strokeWidth={1.8} />
        <span className="sr-only">{label}: incluído</span>
      </span>
    );
  }

  if (level === "optional") {
    return (
      <span className="inline-flex items-center gap-2 text-brand-text-dark/65">
        <Plus aria-hidden="true" className="size-4 text-brand-gold" strokeWidth={1.6} />
        <span className="sr-only">{label}: opcional</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-brand-text-dark/25">
      <Minus aria-hidden="true" className="size-4" strokeWidth={1.4} />
      <span className="sr-only">{label}: não incluído</span>
    </span>
  );
}

export default function InvitationComparison({
  packages,
}: {
  packages: readonly InvitationPackage[];
}) {
  return (
    <section aria-labelledby="comparison-heading" className="mt-16 border-t border-brand-gold/20 pt-12 md:mt-24 md:pt-16">
      <div className="mb-8 max-w-2xl">
        <p className="section-label mb-4">Comparativo transparente</p>
        <h3 id="comparison-heading" className="font-serif text-3xl leading-tight text-brand-text-dark md:text-5xl">
          Escolha profundidade, não complexidade.
        </h3>
        <p className="mt-5 text-base leading-7 text-brand-text-dark/68">
          Incluído, opcional ou não aplicável — sem funcionalidades escondidas entre nomes de pacote.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-brand-text-dark/65">
        <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-brand-gold" aria-hidden="true" /> Incluído</span>
        <span className="inline-flex items-center gap-2"><Plus className="size-3.5 text-brand-gold" aria-hidden="true" /> Opcional</span>
        <span className="inline-flex items-center gap-2"><Minus className="size-3.5 text-brand-text-dark/30" aria-hidden="true" /> Não incluído</span>
      </div>

      <div className="space-y-4 md:hidden">
        {packages.map((packageItem) => (
          <details key={packageItem.id} className="group border border-brand-gold/18 bg-white/55 px-5 py-1 open:bg-white">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-serif text-xl text-brand-text-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
              <span>{packageItem.name}</span>
              <span aria-hidden="true" className="font-sans text-lg text-brand-gold transition-transform group-open:rotate-45">+</span>
            </summary>
            <dl className="border-t border-brand-gold/15 py-4">
              {invitationComparison.map((capability) => {
                const level = getComparisonLevel(packageItem, capability.id);
                return (
                  <div key={capability.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-brand-gold/10 py-3 last:border-0">
                    <dt className="text-sm leading-6 text-brand-text-dark/70">{capability.label}</dt>
                    <dd><ComparisonMark level={level} label={capability.label} /></dd>
                  </div>
                );
              })}
            </dl>
          </details>
        ))}
      </div>

      <div className="hidden overflow-x-auto border border-brand-gold/18 bg-white/60 md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">Comparação de capacidades dos pacotes seleccionados</caption>
          <thead>
            <tr className="border-b border-brand-gold/20 bg-brand-champagne/18">
              <th scope="col" className="w-[38%] px-6 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-dark/55">Experiência</th>
              {packages.map((packageItem) => (
                <th key={packageItem.id} scope="col" className="px-4 py-5 text-center font-serif text-xl font-normal text-brand-text-dark">
                  {packageItem.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invitationComparison.map((capability) => (
              <tr key={capability.id} className="border-b border-brand-gold/10 last:border-0">
                <th scope="row" className="px-6 py-4 text-sm font-normal text-brand-text-dark/70">{capability.label}</th>
                {packages.map((packageItem) => (
                  <td key={packageItem.id} className="px-4 py-4 text-center">
                    <ComparisonMark level={getComparisonLevel(packageItem, capability.id)} label={capability.label} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
