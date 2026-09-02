import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Coins,
  Crown,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import SupplierJoinForm from "@/components/marketing/forms/SupplierJoinForm";

export const metadata: Metadata = {
  title: "Curadoria de Fornecedores de Elite | HAXR Signature Moçambique",
  description:
    "Junte o seu negócio ao directório mais exclusivo de casamentos e eventos de Moçambique. Conecte-se com noivos qualificados sem comissões abusivas.",
};

const BENEFITS = [
  {
    icon: Crown,
    title: "Noivos Qualificados de Alto Padrão",
    description:
      "Acesso direto a casais com visão estética alinhada e orçamentos reais para celebrações memoráveis em Moçambique.",
  },
  {
    icon: MessageCircle,
    title: "Zero Comissões & Contacto Direto WhatsApp",
    description:
      "Sem percentagens ocultas. Os casais entram em contacto diretamente consigo pelo WhatsApp com propostas pré-formatadas.",
  },
  {
    icon: BadgeCheck,
    title: "Perfil Editorial com Selo de Verificação",
    description:
      "Apresentação cinematográfica com fotografia de alta resolução, métricas de fiabilidade e selo de excelência operacional.",
  },
  {
    icon: TrendingUp,
    title: "Match Inteligente com o Style Quiz",
    description:
      "O vosso atelier é recomendado automaticamente aos casais cujo perfil no Style Quiz corresponda à vossa assinatura estética.",
  },
  {
    icon: MapPin,
    title: "Presença em Todo o Território Nacional",
    description:
      "Destaque segmentado por províncias, cidades e distritos municipais (KaFumo, Matola, Marracuene, Beira, Nampula, etc.).",
  },
] as const;

const CURATION_STEPS = [
  {
    step: "01",
    title: "Submissão da Candidatura",
    description:
      "Partilhe a identidade do vosso atelier, portfólio visual, link do Instagram e especialidades.",
  },
  {
    step: "02",
    title: "Curadoria & Avaliação HAXR",
    description:
      "A nossa equipa valida a consistência estética, pontualidade e reputação no mercado de eventos.",
  },
  {
    step: "03",
    title: "Publicação com Selo de Confiança",
    description:
      "O perfil ganha presença no directório, comparador e recomendações aos casais da plataforma.",
  },
] as const;

export default function ForProsPage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] pb-28 pt-24 md:pt-28 text-brand-text-dark font-sans">
      <div className="site-container-wide mx-auto space-y-16">
        {/* ── Hero Section ── */}
        <header className="mx-auto max-w-4xl text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="rounded-full bg-brand-gold/15 border border-brand-gold/30 px-3.5 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.25em] text-brand-gold">
              Curadoria Exclusiva para Profissionais
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-light text-brand-text-dark leading-tight">
            Apresente o seu Atelier à Elite de Noivos de Moçambique.
          </h1>

          <p className="mx-auto max-w-2xl font-sans text-sm sm:text-base font-light text-brand-text-dark/70 leading-relaxed">
            A HAXR Signature reúne os profissionais, quintas e criadores que definem o padrão de
            excelência em casamentos e grandes celebrações. Sem intermediários, sem comissões e com
            o prestígio que o seu trabalho merece.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up?from=%2Ffor-pros"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-black px-6 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-brand-gold shadow-sm"
            >
              <UserRoundCheck className="h-4 w-4" />
              <span>Criar Conta de Fornecedor</span>
            </Link>
            <Link
              href="/fornecedores"
              className="rounded-xl border border-brand-champagne/60 bg-white px-6 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] transition hover:border-brand-gold hover:text-brand-gold shadow-2xs"
            >
              Ver Directório Atual
            </Link>
          </div>
        </header>

        {/* ── Seção de Benefícios & Porquê Pertencer à HAXR ── */}
        <section className="space-y-8" aria-label="Benefícios da Curadoria">
          <div className="text-center space-y-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-brand-gold">
              Vantagens Exclusivas
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
              Porquê Pertencer à Curadoria HAXR Signature?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-brand-champagne/40 bg-white p-7 shadow-[0_12px_40px_rgba(28,26,23,0.03)] space-y-3 transition-all hover:-translate-y-1 hover:border-brand-gold/40 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                    {benefit.title}
                  </h3>
                  <p className="font-sans text-xs font-light leading-relaxed text-brand-text-dark/70">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Como Funciona a Curadoria ── */}
        <section
          className="rounded-3xl border border-brand-champagne/45 bg-gradient-to-br from-white via-[#faf8f5] to-brand-gold/5 p-8 sm:p-12 shadow-sm space-y-8"
          aria-label="Processo de Curadoria"
        >
          <div className="text-center space-y-2">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-brand-gold">
              Processo Rigoroso
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-brand-text-dark">
              Como Funciona a Adesão & Verificação
            </h2>
            <p className="text-xs font-light text-brand-text-dark/65 max-w-xl mx-auto">
              Para salvaguardar a confiança dos casais, todas as candidaturas são avaliadas
              individualmente antes de serem publicadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CURATION_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-brand-champagne/40 bg-white p-6 space-y-2 shadow-2xs"
              >
                <span className="font-mono text-xs font-bold text-brand-gold block">
                  PASSO {item.step}
                </span>
                <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                  {item.title}
                </h3>
                <p className="text-xs font-light text-brand-text-dark/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Seção com Formulário de Candidatura VIP ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-brand-gold">
                Manifestação de Interesse
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark leading-tight">
                Candidate o seu Atelier hoje mesmo.
              </h2>
              <p className="font-sans text-xs sm:text-sm font-light text-brand-text-dark/70 leading-relaxed">
                Preencha o formulário ao lado com os detalhes do seu negócio. A equipa de curadoria
                entrará em contacto após a revisão do portfólio.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-champagne/40 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-brand-gold">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider">
                  Garantia de Privacidade & Rigor
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs font-light text-brand-text-dark/75">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                  <span>A vossa candidatura permanece privada durante o período de revisão.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                  <span>Sem contratos de exclusividade forçada nem fidelizações abusivas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                  <span>Suporte direto da equipa HAXR em Maputo.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SupplierJoinForm />
          </div>
        </section>
      </div>
    </main>
  );
}
