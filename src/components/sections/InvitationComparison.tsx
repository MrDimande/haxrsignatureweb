import {
  getComparisonLevel,
  invitationComparison,
  type InvitationPackage,
} from "@/lib/marketing/invitation-offer";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";

function ComparisonMark({
  level,
  label,
}: {
  level: "included" | "optional" | "none";
  label: string;
}) {
  if (level === "included") {
    return (
      <span className="inline-flex items-center text-brand-text-dark">
        <Check aria-hidden="true" className="size-4 text-brand-gold" strokeWidth={1.8} />
        <span className="sr-only">{label}: incluído</span>
      </span>
    );
  }

  if (level === "optional") {
    return (
      <span className="inline-flex items-center text-brand-text-dark/65">
        <Plus aria-hidden="true" className="size-4 text-brand-gold" strokeWidth={1.6} />
        <span className="sr-only">{label}: opcional</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-brand-text-dark/20">
      <Minus aria-hidden="true" className="size-4" strokeWidth={1.4} />
      <span className="sr-only">{label}: não incluído</span>
    </span>
  );
}

export default function InvitationComparison({ packages }: { packages: readonly InvitationPackage[] }) {
  return (
    <details className="group mt-12 border-y border-brand-text-dark/14 md:mt-16">
      <summary className="flex min-h-24 cursor-pointer list-none items-center justify-between gap-8 py-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-brand-gold">Detalhe da curadoria</p>
          <h3 className="mt-2 font-serif text-2xl text-brand-text-dark md:text-3xl">Comparar o que cada colecção inclui.</h3>
        </div>
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-brand-gold transition-transform group-open:rotate-180" />
      </summary>

      <div className="border-t border-brand-text-dark/12 pb-8 pt-7 md:pb-12 md:pt-9">
        <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-brand-text-dark/55">
          <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-brand-gold" aria-hidden="true" /> Incluído</span>
          <span className="inline-flex items-center gap-2"><Plus className="size-3.5 text-brand-gold" aria-hidden="true" /> Opcional</span>
          <span className="inline-flex items-center gap-2"><Minus className="size-3.5 text-brand-text-dark/25" aria-hidden="true" /> Não incluído</span>
        </div>

        <div className="space-y-3 md:hidden">
          {packages.map((packageItem) => (
            <details key={packageItem.id} className="group/item border border-brand-text-dark/12 bg-white/45 px-5">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold">
                {packageItem.name}
                <Plus aria-hidden="true" className="size-4 text-brand-gold transition-transform group-open/item:rotate-45" />
              </summary>
              <dl className="border-t border-brand-text-dark/10 py-3">
                {invitationComparison.map((capability) => (
                  <div key={capability.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-brand-text-dark/8 py-3 last:border-0">
                    <dt className="text-sm leading-6 text-brand-text-dark/62">{capability.label}</dt>
                    <dd><ComparisonMark level={getComparisonLevel(packageItem, capability.id)} label={capability.label} /></dd>
                  </div>
                ))}
              </dl>
            </details>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">Comparação de capacidades das colecções seleccionadas</caption>
            <thead>
              <tr className="border-b border-brand-text-dark/14">
                <th scope="col" className="w-[42%] py-4 pr-6 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-brand-text-dark/42">Experiência</th>
                {packages.map((packageItem) => (
                  <th key={packageItem.id} scope="col" className="px-4 py-4 text-center font-serif text-xl font-normal">{packageItem.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invitationComparison.map((capability) => (
                <tr key={capability.id} className="border-b border-brand-text-dark/8 last:border-0">
                  <th scope="row" className="py-3.5 pr-6 text-sm font-normal text-brand-text-dark/62">{capability.label}</th>
                  {packages.map((packageItem) => (
                    <td key={packageItem.id} className="px-4 py-3.5 text-center">
                      <ComparisonMark level={getComparisonLevel(packageItem, capability.id)} label={capability.label} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
