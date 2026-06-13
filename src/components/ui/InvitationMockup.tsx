"use client";

import { invitationShowcase, type InvitationProject } from "@/lib/site-config";
import IPhone17Frame from "@/components/ui/IPhone17Frame";
import LivePhoneScreen from "@/components/ui/LivePhoneScreen";

function ShowcaseCard({
  project,
  index,
}: {
  project: InvitationProject;
  index: number;
}) {
  return (
    <article className="flex flex-col items-center text-center md:items-stretch md:text-left">
      <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-5 w-full">
        0{index + 1} · {project.category}
      </p>

      <div
        className="mx-auto md:mx-0 w-full max-w-[300px] md:max-w-none"
        data-lenis-prevent
      >
        <IPhone17Frame showLabel={false} variant="compact" className="mx-auto md:mx-0">
          <LivePhoneScreen project={project} />
        </IPhone17Frame>
        <p className="mt-4 font-mono text-[8px] tracking-[0.35em] uppercase text-grey/45 text-center md:text-left">
          Navegue dentro do telemóvel — sem sair desta página
        </p>
      </div>

      <div className="mt-8 w-full max-w-sm mx-auto md:mx-0 md:max-w-none">
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-gold/45 mb-3">
          {project.format}
        </p>
        <h3 className="font-serif text-xl md:text-2xl font-light text-white/90 leading-tight mb-2">
          {project.caption}
        </h3>
        <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-grey/65 mb-5">
          {project.occasion}
        </p>
        <p className="font-serif text-sm font-light italic text-white/40 leading-relaxed mb-6">
          {project.editorialNote}
        </p>
      </div>
    </article>
  );
}

export default function InvitationMockup() {
  return (
    <article className="relative w-full">
      <div className="art-deco-corner art-deco-corner--tl" />
      <div className="art-deco-corner art-deco-corner--br" />

      <div className="mb-12 md:mb-16 max-w-2xl">
        <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-grey mb-4">
          Experiências reais
        </p>
        <h3 className="font-serif text-2xl md:text-3xl font-light text-white/90 mb-4">
          Dois formatos. Uma assinatura.
        </h3>
        <p className="font-sans text-sm text-grey leading-relaxed">
          Toque no ecrã e navegue como num telemóvel real — convite completo ou
          save the date editorial, sem sair do site HAXR.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-10 lg:gap-16 md:divide-x md:divide-grey-dark/80">
        {invitationShowcase.map((project, index) => (
          <div
            key={project.id}
            className={index === 1 ? "md:pl-10 lg:pl-16" : "md:pr-10 lg:pr-16"}
          >
            <ShowcaseCard project={project} index={index} />
          </div>
        ))}
      </div>
    </article>
  );
}
