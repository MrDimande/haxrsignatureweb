/**
 * HAXR Signature — Guia de Locais para Casamentos e Celebrações (Phase E.2)
 * Rota: /locais-para-casamentos
 *
 * Directrizes Editoriais e de Engenharia:
 * - Alta-Costura Digital: curadoria serena, tipografia nobre, sem superlativos vazios;
 * - Prevenção de Publicação Indevida:
 *   Em produção, renderiza 0 locais (PRODUCTION_VENUES_RENDERABLE=0)
 *   Em preview, renderiza 4 candidatos de revisão (PREVIEW_VENUES_RENDERABLE=4)
 * - Indexação restrita durante a fase de revisão (robots: noindex, nofollow)
 * - Zero esquemas JSON-LD de nível de local individual nesta fase.
 */

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Building,
  Compass,
  FileCheck,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { siteUrl } from "@/lib/seo";
import { getPublicVenueCardsForCanonicalEnvironment } from "@/lib/venues/server";
import VenueCard from "@/components/venues/VenueCard";

export const metadata: Metadata = {
  title: "Locais para Casamentos em Maputo e Matola",
  description:
    "Guia editorial e prático de espaços para casamentos e celebrações em Maputo e Matola, com informação sobre capacidade, ambientes e critérios de escolha.",
  alternates: {
    canonical: "/locais-para-casamentos",
  },
  // Bloqueio de indexação em motores de busca durante a fase de revisão em Preview
  robots: {
    index: false,
    follow: false,
  },
};

export default function LocaisParaCasamentosPage() {
  const publicCards = getPublicVenueCardsForCanonicalEnvironment();

  // JSON-LD Restrito de Página (WebPage + BreadcrumbList) — Zero schema de Local individual em E.2
  const jsonLd = {
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/locais-para-casamentos`,
        url: `${siteUrl}/locais-para-casamentos`,
        name: "Locais para Casamentos em Maputo e Matola | HAXR Signature",
        description:
          "Guia editorial e prático de espaços para casamentos e celebrações em Maputo e Matola, com informação sobre capacidade, ambientes e critérios de escolha.",
        inLanguage: "pt-MZ",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: siteUrl,
          name: "HAXR Signature",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Início",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Guia de Locais",
            item: `${siteUrl}/locais-para-casamentos`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-brand-text-dark">
      {/* Dados Estruturados JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 01. HERO EDITORIAL ──────────────────────────────────────────────── */}
      <section
        id="hero-guia"
        className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#0C0B0A] text-white overflow-hidden border-b border-brand-champagne/15"
      >
        {/* Glow de Fundo Sutil de Alta-Costura */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(184,138,42,0.18), transparent 75%)",
          }}
          aria-hidden="true"
        />

        <div className="site-container-wide mx-auto relative z-10 text-center max-w-4xl space-y-6 px-4">
          <div className="inline-flex items-center gap-2.5 text-brand-gold justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-2.5 h-2.5 text-brand-gold shrink-0"
              aria-hidden="true"
            >
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
            </svg>
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] font-bold text-brand-gold">
              Guia HAXR de Locais
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-brand-ivory leading-tight">
            Locais para Casamentos e Celebrações
          </h1>

          <p className="font-sans text-base sm:text-lg text-brand-ivory/75 font-light leading-relaxed max-w-2xl mx-auto">
            A HAXR Signature organiza informação prática e editorial para ajudar
            casais e anfitriões a compreender as características operacionais,
            estéticas e de acolhimento dos diferentes espaços em Maputo e Matola.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-brand-champagne/70">
            <span>Maputo & Matola</span>
            <span>•</span>
            <span>Critérios Operacionais</span>
            <span>•</span>
            <span>Curadoria de Alta-Costura</span>
          </div>
        </div>
      </section>

      {/* ── 02. INTRODUÇÃO EDITORIAL & CRITÉRIOS ────────────────────────────── */}
      <section
        id="introducao-editorial"
        className="py-16 md:py-24 bg-[#FAF8F5] border-b border-brand-champagne/20"
      >
        <div className="site-container-wide mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div className="inline-flex items-center gap-2 text-brand-gold">
              <Compass className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
                Princípios de Escolha
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark leading-snug">
              A escolha de um espaço é tanto uma decisão técnica quanto estética.
            </h2>

            <p className="font-sans text-base text-brand-text-dark/80 leading-relaxed font-light">
              Na assessoria de um casamento, a beleza arquitectónica de um espaço
              apenas se concretiza quando acompanhada por viabilidade logística. O
              número de convidados, a autonomia do catering, o conforto térmico, a
              potência eléctrica para som e iluminação e as alternativas em caso de
              chuva determinam a tranquilidade real do grande dia.
            </p>

            <p className="font-sans text-sm text-brand-text-dark/70 leading-relaxed font-light">
              Neste guia, diferenciamos categoricamente dados declarados pelas fontes
              oficiais daquilo que ainda carece de confirmação específica com a
              administração de cada local antes de qualquer celebração.
            </p>
          </div>
        </div>
      </section>

      {/* ── 03. CATÁLOGO EDITORIAL DE ESPAÇOS ───────────────────────────────── */}
      <section
        id="explorar-locais"
        className="py-20 md:py-28 bg-[#FCFBF9] border-b border-brand-champagne/20"
      >
        <div className="site-container-wide mx-auto px-4 sm:px-6 space-y-12">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 text-brand-gold">
              <Building className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
                Espaços Curados
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark">
              Espaços em Maputo
            </h2>
            <p className="font-sans text-sm md:text-base text-brand-text-dark/70 font-light max-w-2xl">
              Consulte a selecção editorial preliminar. Quatro espaços
              com capacidade declarada em fontes oficiais e infra-estrutura apta para celebrações.
            </p>
          </div>

          {/* Grelha Editorial de Locais */}
          {publicCards.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              {publicCards.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <div className="py-20 px-6 text-center bg-[#FAF8F5] border border-brand-champagne/20 rounded-3xl space-y-4 max-w-lg mx-auto">
              <h3 className="font-serif text-2xl font-light text-brand-text-dark">
                Guia em Actualização Editorial
              </h3>
              <p className="font-sans text-sm text-brand-text-dark/70 font-light leading-relaxed">
                A curadoria de espaços para celebrações está em processo de verificação documental e vistoria técnica pela equipa da HAXR Signature.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 04. GOVERNAÇÃO DA INFORMAÇÃO HAXR ───────────────────────────────── */}
      <section
        id="governacao-dados"
        className="py-20 md:py-28 bg-[#FAF8F5] border-b border-brand-champagne/20"
      >
        <div className="site-container-wide mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-brand-gold">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
                  Governação HAXR
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark">
                Como a HAXR trata a informação de cada local
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-2xl bg-white border border-brand-champagne/30 space-y-3">
                <FileCheck className="w-5 h-5 text-brand-gold" strokeWidth={1.5} />
                <h3 className="font-serif text-lg font-light text-brand-text-dark">
                  Capacidade Oficial Declarada
                </h3>
                <p className="font-sans text-xs text-brand-text-dark/75 leading-relaxed font-light">
                  Apenas indicamos números de lotação quando expressamente
                  publicados pelo espaço ou confirmados formalmente pela gerência.
                  A escala de convidados em eventos passados não é confundida com
                  a capacidade técnica do salão.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-brand-champagne/30 space-y-3">
                <HelpCircle className="w-5 h-5 text-brand-gold" strokeWidth={1.5} />
                <h3 className="font-serif text-lg font-light text-brand-text-dark">
                  Transparência de Incerteza
                </h3>
                <p className="font-sans text-xs text-brand-text-dark/75 leading-relaxed font-light">
                  Sempre que um atributo (como restrições de gerador, exclusividade
                  ou acessibilidade) não possuir rastreio factual consolidado, é
                  explicitamente indicado como pendente de confirmação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 05. ORIENTAÇÕES PRÁTICAS ANTES DE RESERVAR ──────────────────────── */}
      <section
        id="orientacoes-praticas"
        className="py-20 md:py-28 bg-[#FCFBF9] border-b border-brand-champagne/20"
      >
        <div className="site-container-wide mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-3">
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-brand-gold">
                Checklist Operacional
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-text-dark">
                Critérios essenciais antes de assinar contrato
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "1. Autonomia e Política de Catering",
                  desc: "Verifique se o espaço obriga ao serviço de refeição interno ou se permite a contratação de empresas de catering e decoração externas sem taxas adicionais de rolha.",
                },
                {
                  title: "2. Suporte Eléctrico e Climatização",
                  desc: "Confirme a capacidade efectiva do gerador próprio, a transição automática em caso de corte e o número de BTUs de climatização com o salão em lotação máxima.",
                },
                {
                  title: "3. Protocolo de Horários e Desmontagem",
                  desc: "Exija clarificação expressa sobre limites de som exterior, hora limite para encerramento da recepção e janelas horárias para montagem e desmontagem das equipas técnicas.",
                },
                {
                  title: "4. Acessos e Estacionamento Privado",
                  desc: "Avalie o fluxo de viaturas nos horários de ponta, a segurança perimetral do parque e a facilidade de mobilidade para familiares e convidados seniores.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-brand-champagne/25 space-y-1.5"
                >
                  <h3 className="font-serif text-lg font-light text-brand-text-dark">
                    {item.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-brand-text-dark/75 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 06. CTA DE ASSESSORIA HAXR ──────────────────────────────────────── */}
      <section
        id="cta-assessoria"
        className="py-20 md:py-28 bg-[#0C0B0A] text-white border-t border-brand-champagne/15"
      >
        <div className="site-container mx-auto px-4 text-center max-w-2xl space-y-6">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold text-brand-gold">
            Atelier HAXR Signature
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl font-light text-brand-ivory leading-tight">
            Precisa de apoio especializado na selecção do espaço ideal?
          </h2>

          <p className="font-sans text-sm sm:text-base text-brand-ivory/75 font-light leading-relaxed">
            A assessoria HAXR conduz vistorias técnicas presenciais, análise de
            contratos, simulação de layouts de mesas e alinhamento logístico para
            assegurar que o espaço escolhido suporta perfeitamente a vossa visão.
          </p>

          <div className="pt-4">
            <Link
              href="/contacto?assunto=seleccao-de-espacos"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-brand-gold text-brand-black font-sans text-xs font-semibold hover:bg-brand-gold-light transition-colors"
            >
              <span>Iniciar Conversa com o Atelier</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
