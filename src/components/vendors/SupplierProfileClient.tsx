"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Camera,
  Clock,
  Coins,
  Crown,
  ExternalLink,
  Globe2,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";
import {
  buildSupplierInitials,
  type PublicSupplierProfile,
} from "@/lib/vendors/marketplace";
import type { RealWedding } from "@/lib/vendors/vendor-real-weddings";
import {
  VENDOR_STYLES,
  getStyleMatchScore,
  type SavedStyleQuizResult,
} from "@/lib/vendors/vendor-styles";
import { getCategoryBudgetInsight } from "@/lib/vendors/vendor-budget-guide";
import VendorQuoteModal from "@/components/vendors/VendorQuoteModal";

type SupplierProfileClientProps = {
  supplier: PublicSupplierProfile;
  realWeddings: RealWedding[];
};

export default function SupplierProfileClient({
  supplier,
  realWeddings,
}: SupplierProfileClientProps) {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [userSavedStyle, setUserSavedStyle] = useState<SavedStyleQuizResult | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("haxr_style_quiz_result");
      if (stored) {
        const parsed = JSON.parse(stored) as SavedStyleQuizResult;
        if (parsed?.key) {
          setUserSavedStyle(parsed);
        }
      }
    } catch {
      // Ignorar se storage inacessível
    }
  }, []);

  const styleMatch = getStyleMatchScore(
    supplier.styles,
    userSavedStyle?.key ?? null,
  );

  const budgetInsight = getCategoryBudgetInsight(supplier.category);

  return (
    <>
      <div className="site-container-wide mx-auto space-y-8">
        {/* ── Breadcrumb & Voltar ── */}
        <div className="flex items-center justify-between">
          <Link
            href="/fornecedores"
            className="inline-flex items-center gap-2 font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-dark/55 transition hover:text-brand-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao Directório de Fornecedores</span>
          </Link>

          <span className="font-mono text-[9px] uppercase tracking-widest text-brand-gold font-bold">
            Curadoria HAXR Signature
          </span>
        </div>

        {/* ── Card Principal do Perfil de Fornecedor ── */}
        <article className="overflow-hidden rounded-3xl border border-brand-champagne/45 bg-white shadow-[0_20px_70px_rgba(28,26,23,0.06)]">
          {/* 1. Hero Cover Banner */}
          <div className="relative aspect-[21/9] sm:aspect-[24/8] min-h-[260px] md:min-h-[340px] w-full overflow-hidden bg-brand-black">
            <Image
              src={supplier.coverImageUrl}
              alt={supplier.name}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover brightness-[0.85] transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Badges de Destaque */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/90 backdrop-blur-md px-3.5 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-brand-black shadow-xs">
                {supplier.categoryLabel}
              </span>
              <span className="rounded-full border border-brand-gold/50 bg-brand-gold/20 backdrop-blur-md px-3 py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-brand-gold-light">
                {supplier.featuredBadge}
              </span>
            </div>

            {/* Cidade */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 hidden sm:flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1.5 font-mono text-[9px] text-white/80">
              <MapPin className="h-3.5 w-3.5 text-brand-gold" />
              <span>{supplier.city}, Moçambique</span>
            </div>
          </div>

          {/* 2. Barra de Perfil com Avatar */}
          <div className="px-6 sm:px-10 pb-8 pt-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 relative z-10">
              {/* Avatar / Monograma */}
              <div className="flex items-end gap-4 sm:gap-6">
                <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#1c1917] to-[#0c0a09] shadow-xl overflow-hidden">
                  {supplier.avatarUrl ? (
                    <Image
                      src={supplier.avatarUrl}
                      alt={supplier.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-serif text-3xl sm:text-4xl font-light text-brand-champagne/90 tracking-wider">
                      {buildSupplierInitials(supplier.name)}
                    </span>
                  )}
                  {supplier.verified && (
                    <div
                      className="absolute bottom-1 right-1 rounded-full bg-brand-gold p-1 text-brand-black shadow-sm"
                      title="Perfil Verificado HAXR"
                    >
                      <BadgeCheck className="h-4 w-4 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h1 className="font-serif text-2xl sm:text-4xl font-medium text-brand-text-dark">
                    {supplier.name}
                  </h1>
                  <p className="flex items-center gap-1.5 font-sans text-xs sm:text-sm font-light text-brand-text-dark/65">
                    <MapPin className="h-3.5 w-3.5 text-brand-gold shrink-0" />
                    <span>{supplier.city}</span>
                    <span className="text-brand-text-dark/30">·</span>
                    <span className="font-mono text-xs text-brand-gold font-semibold">
                      {supplier.priceRange}
                    </span>
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Solicitar Proposta Formal</span>
                </button>

                {supplier.instagramUrl && (
                  <a
                    href={supplier.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-champagne/60 bg-[#faf8f5] hover:bg-white hover:border-brand-gold px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-text-dark transition-colors"
                  >
                    <svg
                      className="h-4 w-4 text-pink-600 fill-none stroke-current"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    <span>Instagram</span>
                  </a>
                )}
              </div>
            </div>

            {/* ── 🎯 BANNER DE MATCH INTELIGENTE COM O STYLE QUIZ ── */}
            {userSavedStyle && styleMatch.isMatch && (
              <div className="mt-8 rounded-2xl border border-brand-gold/40 bg-gradient-to-r from-brand-gold/10 via-[#faf8f5] to-brand-gold/5 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-brand-gold/20 p-2.5 text-brand-gold shrink-0">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                        Match com o Vosso Style Quiz
                      </span>
                      <span className="rounded-full bg-brand-gold text-brand-black px-2 py-0.5 font-mono text-[8px] uppercase font-bold tracking-wider">
                        {styleMatch.matchPercentage}% Compatível
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-medium text-brand-text-dark mt-0.5">
                      Estética: {styleMatch.styleLabel}
                    </h3>
                    <p className="text-xs font-light text-brand-text-dark/70 leading-relaxed max-w-2xl">
                      Com base nas vossas respostas no Style Quiz, o trabalho e linguagem visual deste
                      atelier alinham-se perfeitamente com a visão do vosso casamento.
                    </p>
                  </div>
                </div>

                <Link
                  href="/style-quiz"
                  className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold hover:text-brand-text-dark transition"
                >
                  Refazer Style Quiz →
                </Link>
              </div>
            )}

            {/* ── Grid de Conteúdo ── */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-brand-champagne/30">
              {/* Coluna Esquerda: Sobre, Serviços, Portfólio, Casamentos Reais */}
              <div className="lg:col-span-8 space-y-8">
                {/* Sobre */}
                <div className="space-y-3">
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                    Sobre o Atelier / Profissional
                  </h2>
                  <p className="font-sans text-sm sm:text-base font-light leading-relaxed text-brand-text-dark/80">
                    {supplier.description ||
                      `${supplier.name} é uma referência em ${supplier.categoryLabel.toLowerCase()} no mercado de casamentos e eventos em Moçambique, oferecendo padrões de rigor estético e excelência operacional.`}
                  </p>
                  {supplier.about && (
                    <p className="font-sans text-sm font-light leading-relaxed text-brand-text-dark/70 pt-2">
                      {supplier.about}
                    </p>
                  )}
                </div>

                {/* Estilos e Afinidades Estéticas */}
                {supplier.styles && supplier.styles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                      Afinidades Estéticas & Assinatura Visual
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {supplier.styles.map((styleKey) => {
                        const style = VENDOR_STYLES[styleKey];
                        if (!style) return null;
                        return (
                          <div
                            key={styleKey}
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-3.5 py-2 text-xs font-light text-brand-text-dark/80"
                          >
                            <Crown className="h-3 w-3 text-brand-gold" />
                            <span>{style.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Serviços */}
                {supplier.services && supplier.services.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                      Serviços Oferecidos & Especialidades
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {supplier.services.map((service, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 rounded-xl border border-brand-champagne/45 bg-[#faf8f5] px-3.5 py-2 text-xs font-light text-brand-text-dark/80"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfólio */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-brand-gold" />
                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                        Portfólio & Trabalhos Selecionados
                      </h3>
                    </div>
                    <span className="font-mono text-[9px] text-brand-text-dark/45 uppercase">
                      {supplier.portfolioImages.length} Fotografias
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {supplier.portfolioImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="group/img relative aspect-[4/3] rounded-2xl overflow-hidden border border-brand-champagne/40 bg-brand-black shadow-2xs"
                      >
                        <Image
                          src={imgUrl}
                          alt={`${supplier.name} — Trabalho ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-cover transition-transform duration-500 group-hover/img:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-3 right-3 text-white font-mono text-[8px] uppercase tracking-wider opacity-0 group-hover/img:opacity-100 transition-opacity">
                          Casamento Real em {supplier.city}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── CASAMENTOS REAIS VINCULADOS ── */}
                {realWeddings.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-brand-champagne/20">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-brand-gold" />
                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                        Casamentos Reais com esta Assinatura
                      </h3>
                    </div>
                    <p className="text-xs font-light text-brand-text-dark/60 leading-relaxed">
                      Eventos reais em Moçambique onde profissionais desta categoria deixaram a sua
                      marca de excelência.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {realWeddings.map((wedding) => (
                        <Link
                          key={wedding.id}
                          href={wedding.slug}
                          className="group/wedding overflow-hidden rounded-2xl border border-brand-champagne/40 bg-white shadow-[0_8px_30px_rgba(28,26,23,0.04)] transition-all hover:-translate-y-1 hover:border-brand-gold/40 hover:shadow-[0_12px_40px_rgba(28,26,23,0.08)]"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-brand-black">
                            <Image
                              src={wedding.coverImage}
                              alt={wedding.couple}
                              fill
                              sizes="300px"
                              className="object-cover brightness-[0.85] transition-transform duration-500 group-hover/wedding:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 text-white">
                              <p className="font-serif text-sm font-medium leading-tight">
                                {wedding.couple}
                              </p>
                              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-brand-gold">
                                {wedding.venue} · {wedding.date}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-xs font-light leading-relaxed text-brand-text-dark/70 line-clamp-2">
                              {wedding.editorial}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna Direita: Status de Temporada, Métricas, Guia de Orçamento & Contactos */}
              <div className="lg:col-span-4 space-y-6">
                {/* ── 📅 STATUS DE TEMPORADA & ABERTURA DE AGENDA ── */}
                <div className="rounded-2xl border border-emerald-600/30 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 p-6 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                        {supplier.seasonality.statusBadge}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-brand-text-dark/75 font-light">
                    <p className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{supplier.seasonality.seasonAlert}</span>
                    </p>
                    <p className="flex items-center gap-2 text-[11px] text-brand-text-dark/65 pt-1">
                      <Clock className="h-3.5 w-3.5 text-brand-gold shrink-0" />
                      <span>{supplier.seasonality.recommendedAdvance}</span>
                    </p>
                  </div>
                </div>

                {/* ── 💡 GUIA DE INVESTIMENTO / ORÇAMENTO DA CATEGORIA ── */}
                <div className="rounded-2xl border border-brand-champagne/50 bg-[#faf8f5] p-6 space-y-3.5">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <Coins className="h-4 w-4" />
                    <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                      Referência de Mercado
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <p className="font-serif text-sm font-medium text-brand-text-dark">
                      {budgetInsight.label}:{" "}
                      <span className="text-brand-gold font-mono text-xs">{budgetInsight.percentageShare}</span>
                    </p>
                    <p className="font-mono text-[10px] text-brand-text-dark/60">
                      Faixa média: {budgetInsight.averageRangeMZN}
                    </p>
                    <p className="font-sans text-xs font-light text-brand-text-dark/70 pt-1 leading-relaxed">
                      {budgetInsight.recommendation}
                    </p>
                  </div>

                  <Link
                    href="/tools/orcamento"
                    className="inline-flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-wider text-brand-gold hover:text-brand-text-dark transition pt-1"
                  >
                    <span>Simular Orçamento no HAXR</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {/* ── Métricas de Confiança ── */}
                <div className="rounded-2xl border border-brand-champagne/50 bg-[#faf8f5] p-6 space-y-4">
                  <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-brand-gold">
                    Métricas de Confiança
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-brand-champagne/30 bg-white p-3 text-center space-y-1">
                      <Clock className="h-4 w-4 text-emerald-600 mx-auto" />
                      <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50">
                        Resposta
                      </p>
                      <p className="font-sans text-xs font-medium text-brand-text-dark">
                        {supplier.responseTime}
                      </p>
                    </div>

                    <div className="rounded-xl border border-brand-champagne/30 bg-white p-3 text-center space-y-1">
                      <Star className="h-4 w-4 text-amber-500 mx-auto" />
                      <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50">
                        Satisfação
                      </p>
                      <p className="font-sans text-xs font-medium text-brand-text-dark">
                        {supplier.satisfactionRate}%
                      </p>
                    </div>

                    <div className="rounded-xl border border-brand-champagne/30 bg-white p-3 text-center space-y-1">
                      <Trophy className="h-4 w-4 text-brand-gold mx-auto" />
                      <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50">
                        Experiência
                      </p>
                      <p className="font-sans text-xs font-medium text-brand-text-dark">
                        {supplier.experienceYears} anos
                      </p>
                    </div>

                    <div className="rounded-xl border border-brand-champagne/30 bg-white p-3 text-center space-y-1">
                      <Calendar className="h-4 w-4 text-blue-500 mx-auto" />
                      <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-brand-text-dark/50">
                        Membro
                      </p>
                      <p className="font-sans text-xs font-medium text-brand-text-dark">
                        Desde {supplier.memberSince}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Painel de Contacto */}
                <div className="rounded-2xl border border-brand-champagne/50 bg-[#faf8f5] p-6 space-y-5">
                  <h3 className="font-serif text-lg font-medium text-brand-text-dark">
                    Contactos & Informações
                  </h3>

                  <div className="space-y-3.5 text-xs text-brand-text-dark/80 font-light">
                    {supplier.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-brand-gold shrink-0" />
                        <a
                          href={`tel:${supplier.phone}`}
                          className="hover:text-brand-gold transition-colors font-mono"
                        >
                          {supplier.phone}
                        </a>
                      </div>
                    )}

                    {supplier.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-brand-gold shrink-0" />
                        <a
                          href={`mailto:${supplier.email}`}
                          className="hover:text-brand-gold transition-colors truncate"
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}

                    {supplier.websiteUrl && (
                      <div className="flex items-center gap-3">
                        <Globe2 className="h-4 w-4 text-brand-gold shrink-0" />
                        <a
                          href={supplier.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-brand-gold transition-colors truncate inline-flex items-center gap-1"
                        >
                          <span>Visitar Website</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-brand-champagne/30">
                    <Link
                      href={`/tools/vendor-manager?addVendor=${encodeURIComponent(supplier.name)}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-brand-gold/40 bg-white hover:bg-brand-gold/5 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-gold transition-colors"
                    >
                      <span>Guardar no Gestor de Fornecedores</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Selo de Garantia */}
                <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-5 space-y-2">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                      Garantia de Qualidade HAXR
                    </span>
                  </div>
                  <p className="font-sans text-xs text-brand-text-dark/70 font-light leading-relaxed">
                    Este fornecedor foi avaliado de acordo com os critérios de pontualidade, reputação
                    e excelência operacional da HAXR Signature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* ── Modal de Cotação VIP ── */}
      <VendorQuoteModal
        supplier={supplier}
        open={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />
    </>
  );
}
