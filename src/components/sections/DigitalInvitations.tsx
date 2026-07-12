"use client";

import IPhone17Frame from "@/components/ui/IPhone17Frame";
import LivePhoneScreen from "@/components/ui/LivePhoneScreen";
import RevealOnScroll from "@/components/ui/RevealOnScroll";
import { invitationShowcase, portfolioCopy } from "@/lib/site-config";
import { ArrowRight, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DigitalInvitations() {
  const { convites } = portfolioCopy;

  const luxuryFeatures = [
    {
      title: "Alfaiataria Digital",
      desc: "Cada convite é desenhado como uma peça de alta-costura, respeitando a vossa paleta e conceito visual do evento."
    },
    {
      title: "Música de Entrada",
      desc: "Trilha sonora integrada com fade-in suave que desperta a emoção do convidado logo no primeiro clique."
    },
    {
      title: "RSVP Concierge",
      desc: "Confirmação rápida e inteligente para os convidados, perfeitamente integrada no vosso painel HAXR."
    },
    {
      title: "Direções & Mapa",
      desc: "Localização precisa do espaço e integração direta com Waze e Google Maps com um único toque."
    }
  ];

  return (
    <section
      id="convites"
      className="relative py-28 md:py-36 bg-black text-white overflow-hidden border-b border-brand-champagne/15"
    >

      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 65% 55% at 50% 80%, rgba(227,196,107,0.14), transparent)"
        }}
      />

      <div className="site-container-wide mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-10 xl:gap-20 items-center">

          {/* Coluna Esquerda: O Coração e Conceito (5 de 12 colunas) */}
          <div className="lg:col-span-5 space-y-8 text-left">
            <RevealOnScroll className="space-y-4">
              <div className="flex items-center gap-2.5 text-brand-gold">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-gold/80 shrink-0">
                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                </svg>
                <span className="font-mono text-[9px] uppercase tracking-[0.38em] font-bold text-gold/90">Arte & Identidade Visual</span>
              </div>

              <div className="relative pt-6">
                <p className="font-signature text-4xl md:text-5xl text-gold/55 absolute -top-4 -left-1 pointer-events-none select-none">
                  O primeiro impacto
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight">
                  Convites Digitais de <br />
                  <span className="font-serif italic text-gold/95">Alta-Costura</span>
                </h2>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.05} className="space-y-6">
              <p className="font-serif text-lg md:text-xl font-light text-brand-ivory leading-relaxed italic border-l border-gold/30 pl-4">
                &quot;O vosso evento começa no instante em que o convite brilha no ecrã de quem mais amam.&quot;
              </p>
              <div className="space-y-4 font-sans text-xs md:text-sm text-brand-ivory/70 leading-relaxed font-light">
                <p>
                  Não criamos apenas links. Criamos a primeira página da vossa história. Um convite digital HAXR Signature é uma experiência imersiva de luxo que combina tipografia editorial refinada, música envolvente e transições cinematográficas.
                </p>
                <p>
                  Desenhado sob medida de raiz, cada pixel é trabalhado com a mesma curadoria de um papel de algodão físico, assegurando a confiança de que o vosso dia especial será memorável do início ao fim.
                </p>
              </div>
            </RevealOnScroll>

            {/* Módulo de Recursos (Features Checklist) */}
            <RevealOnScroll delay={0.1} className="space-y-6 pt-6 border-t border-white/10">
              <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/50 font-semibold">
                Os Padrões da Assinatura HAXR
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {luxuryFeatures.map((feat) => (
                  <div key={feat.title} className="space-y-1">
                    <h4 className="font-serif text-sm font-medium text-gold/90 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/85 shrink-0" />
                      {feat.title}
                    </h4>
                    <p className="font-sans text-[11px] text-white/50 leading-relaxed font-light">
                      {feat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </RevealOnScroll>

            {/* Testemunho de Confiança */}
            <RevealOnScroll delay={0.12} className="pt-2">
              <div className="bg-white/[0.02] border-l-2 border-gold/45 p-4 rounded-r-lg space-y-2">
                <p className="font-serif text-xs italic text-brand-ivory/60 leading-relaxed">
                  &ldquo;Quando os nossos convidados abriram o convite digital, o feedback foi imediato: nunca tinham visto nada tão sofisticado. Ali soubemos que a HAXR era o parceiro certo.&rdquo;
                </p>
                <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-gold/80">
                  — Vania Lucky & Fabião Dimande, Casamento em 2026
                </p>
              </div>
            </RevealOnScroll>

            {/* CTA Button */}
            <RevealOnScroll delay={0.15} className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2.5 bg-brand-gold hover:bg-brand-gold-light text-white font-mono text-[9px] md:text-[10px] tracking-widest uppercase font-bold py-4.5 px-9 rounded-sm shadow-lg transition-all hover:-translate-y-0.5 duration-300 cursor-pointer"
              >
                <span>Desenhar o Meu Convite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2 text-white/40 font-mono text-[8px] tracking-widest uppercase py-2">
                <ShieldCheck className="w-3.5 h-3.5 text-gold/60 shrink-0" />
                <span>Exclusividade Garantida</span>
              </div>
            </RevealOnScroll>
          </div>

          {/* Coluna Direita: Showroom Interativo (7 de 12 colunas) */}
          <div className="lg:col-span-7">
            <RevealOnScroll delay={0.08}>
              <div className="relative bg-zinc-950/60 backdrop-blur-md border border-brand-champagne/10 p-8 sm:p-10 md:p-12 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Decorações art-deco de canto */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-gold/25" />
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-gold/25" />

                <div className="mb-10 text-center max-w-md mx-auto">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.45em] uppercase text-brand-gold mb-2.5 border border-brand-gold/30 px-3 py-1 rounded-full bg-gold/5">
                    <Heart className="w-2.5 h-2.5 animate-pulse" />
                    Experiência Interativa
                  </span>
                  <h3 className="font-serif text-lg sm:text-2xl font-light text-white mb-2">
                    O Toque da Sofisticação
                  </h3>
                  <p className="font-sans text-[10px] text-white/50 leading-relaxed max-w-xs mx-auto">
                    Navegue livremente pelos ecrãs em tempo real. Teste a música, a rolagem e os botões como no vosso telemóvel.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-6 lg:gap-12">
                  {invitationShowcase.map((project, index) => (
                    <div key={project.id} className="flex flex-col items-center">

                      <div className="w-full max-w-[270px] xl:max-w-[285px] transition-transform duration-500 hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(184,138,42,0.12)]" data-lenis-prevent>
                        <IPhone17Frame showLabel={false} variant="compact" className="mx-auto">
                          <LivePhoneScreen project={project} />
                        </IPhone17Frame>
                      </div>

                      <div className="mt-6 text-center max-w-[250px] space-y-1">
                        <h4 className="font-serif text-md font-light text-white leading-tight">
                          {project.caption}
                        </h4>
                        <p className="font-sans text-[9px] tracking-widest uppercase text-white/40 font-medium">
                          {project.format}
                        </p>
                        <p className="font-serif text-[11px] font-light italic text-white/50 leading-relaxed line-clamp-2">
                          {project.editorialNote}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </div>
    </section>
  );
}
