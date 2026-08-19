"use client";

import { useState } from "react";
import { invitationShowcase, type InvitationProject } from "@/lib/site-config";
import IPhone17Frame from "@/components/ui/IPhone17Frame";
import LivePhoneScreen from "@/components/ui/LivePhoneScreen";
import InvitationViewer from "@/components/ui/InvitationViewer";
import { Smartphone, ExternalLink } from "lucide-react";

function ShowcaseCard({
  project,
  index,
  onOpenViewer,
}: {
  project: InvitationProject;
  index: number;
  onOpenViewer: (p: InvitationProject) => void;
}) {
  return (
    <article className="flex flex-col items-center text-center md:items-stretch md:text-left">
      <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-brand-gold mb-5 w-full">
        0{index + 1} · {project.category}
      </p>

      <div
        className="mx-auto md:mx-0 w-full max-w-[300px] md:max-w-none cursor-pointer group relative"
        data-lenis-prevent
        onClick={() => onOpenViewer(project)}
      >
        <IPhone17Frame showLabel={false} variant="compact" className="mx-auto md:mx-0">
          <LivePhoneScreen project={project} />
        </IPhone17Frame>
        
        <p className="mt-4 font-mono text-[8px] tracking-[0.35em] uppercase text-brand-ivory/50 text-center md:text-left flex items-center justify-center md:justify-start gap-1.5">
          <Smartphone className="w-3 h-3 text-gold" />
          <span>Navegue dentro do telemóvel ou toque para ecrã completo</span>
        </p>
      </div>

      <div className="mt-8 w-full max-w-sm mx-auto md:mx-0 md:max-w-none">
        <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-brand-gold mb-3">
          {project.format}
        </p>
        <h3 className="font-serif text-xl md:text-2xl font-light text-white leading-tight mb-2">
          {project.caption}
        </h3>
        <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-brand-ivory/65 mb-4">
          {project.occasion}
        </p>
        <p className="font-serif text-sm font-light italic text-brand-ivory/50 leading-relaxed mb-6">
          {project.editorialNote}
        </p>

        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
          <button
            type="button"
            onClick={() => onOpenViewer(project)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/40 bg-gold/15 hover:bg-gold/30 text-gold font-mono text-[9px] tracking-widest uppercase font-bold transition-all duration-300 shadow-md hover:scale-105 cursor-pointer"
          >
            <Smartphone className="w-3 h-3" />
            <span>Abrir no Telemóvel 📱</span>
          </button>
          <a
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-white/50 hover:text-gold font-mono text-[8px] tracking-wider uppercase transition-colors"
          >
            <span>Link Directo</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function InvitationMockup() {
  const [selectedProject, setSelectedProject] = useState<InvitationProject | null>(null);

  return (
    <article className="relative w-full">
      <div className="art-deco-corner art-deco-corner--tl" />
      <div className="art-deco-corner art-deco-corner--br" />

      <div className="mb-12 md:mb-16 max-w-2xl text-left">
        <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-brand-gold mb-4">
          Experiências reais
        </p>
        <h3 className="font-serif text-2xl md:text-3xl font-light text-white mb-4">
          Dois formatos. Uma assinatura.
        </h3>
        <p className="font-sans text-sm text-brand-ivory/70 leading-relaxed font-light">
          Toque no ecrã e navegue como num telemóvel real — convite completo ou save the date editorial, sem sair do site HAXR.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-10 lg:gap-16 md:divide-x md:divide-brand-champagne/15">
        {invitationShowcase.map((project, index) => (
          <div
            key={project.id}
            className={index === 1 ? "md:pl-10 lg:pl-16" : "md:pr-10 lg:pr-16"}
          >
            <ShowcaseCard
              project={project}
              index={index}
              onOpenViewer={(p) => setSelectedProject(p)}
            />
          </div>
        ))}
      </div>

      {selectedProject && (
        <InvitationViewer
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
        />
      )}
    </article>
  );
}
