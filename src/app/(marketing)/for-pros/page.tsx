import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  ClipboardCheck,
  Eye,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import SupplierJoinForm from "@/components/marketing/forms/SupplierJoinForm";

export const metadata: Metadata = {
  title: "Junte o seu Negócio à HAXR | Fornecedores",
  description:
    "Candidate o seu negócio de eventos ao directório HAXR. Perfis são revistos antes de serem publicados aos casais.",
};

const steps = [
  {
    icon: ClipboardCheck,
    title: "Envie a candidatura",
    description:
      "Partilhe os dados essenciais do negócio, categoria, cidade e portfólio.",
  },
  {
    icon: ShieldCheck,
    title: "Revisão humana",
    description:
      "A equipa HAXR valida a informação. A candidatura nunca é publicada automaticamente.",
  },
  {
    icon: Eye,
    title: "Perfil publicado",
    description:
      "Após aprovação, o perfil pode aparecer no directório e nas sugestões aos casais.",
  },
] as const;

export default function ForProsPage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] pb-24 pt-28 text-brand-text-dark">
      <div className="site-container-wide">
        <header className="mx-auto max-w-4xl text-center">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-brand-gold">
            HAXR para profissionais
          </p>
          <h1 className="mt-5 font-serif text-4xl font-light leading-tight md:text-6xl">
            O seu trabalho merece ser descoberto com confiança.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-light leading-7 text-brand-text-dark/65 md:text-base">
            Crie uma candidatura clara e acompanhe uma integração orientada pela equipa
            HAXR. Só mostramos fornecedores reais, com informação revista e autorização
            para publicação.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link
              href="/sign-up?from=%2Ffor-pros"
              className="inline-flex items-center gap-2 rounded-full bg-brand-black px-6 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-brand-gold"
            >
              <UserRoundCheck className="h-4 w-4" />
              Criar conta
            </Link>
            <Link
              href="/sign-in?from=%2Ffor-pros"
              className="rounded-full border border-brand-champagne/60 bg-white px-6 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] transition hover:border-brand-gold hover:text-brand-gold"
            >
              Já tenho conta
            </Link>
          </div>
        </header>

        <section className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3" aria-label="Como funciona">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="rounded-2xl border border-brand-champagne/45 bg-white p-6 shadow-[0_12px_40px_rgba(28,26,23,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-brand-gold" />
                  <span className="font-mono text-[9px] text-brand-text-dark/35">
                    0{index + 1}
                  </span>
                </div>
                <h2 className="mt-5 font-serif text-xl font-light">{step.title}</h2>
                <p className="mt-3 text-xs font-light leading-6 text-brand-text-dark/60">
                  {step.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mx-auto mt-14 grid max-w-6xl overflow-hidden rounded-3xl border border-brand-champagne/45 bg-white shadow-[0_24px_80px_rgba(28,26,23,0.07)] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-brand-black p-8 text-white md:p-12">
            <BadgeCheck className="h-7 w-7 text-brand-gold" />
            <h2 className="mt-6 font-serif text-3xl font-light">
              Uma presença profissional, sem promessas artificiais.
            </h2>
            <ul className="mt-8 space-y-4 text-sm font-light leading-6 text-zinc-300">
              <li>• Dados da candidatura mantidos privados durante a revisão.</li>
              <li>• Perfil público apenas depois de aprovação explícita.</li>
              <li>• Sem avaliações, fotografias ou serviços inventados.</li>
              <li>• Casais podem guardar perfis publicados para decidir mais tarde.</li>
            </ul>
            <p className="mt-8 border-t border-white/10 pt-6 text-xs font-light leading-5 text-zinc-400">
              Crie ou inicie sessão antes de enviar para que a candidatura fique ligada ao
              utilizador responsável. Também aceitamos candidaturas públicas sem conta.
            </p>
          </div>

          <div className="p-8 md:p-12">
            <SupplierJoinForm />
          </div>
        </section>
      </div>
    </main>
  );
}
