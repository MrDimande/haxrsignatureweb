"use client";

import { useState } from "react";
import type { InvitationProject } from "@/lib/site-config";
import { getDemoById } from "@/lib/demos/catalog";
import InvitationIframe from "@/components/ui/InvitationIframe";

interface LivePhoneScreenProps {
  project: InvitationProject;
}

export default function LivePhoneScreen({ project }: LivePhoneScreenProps) {
  const demo = getDemoById(project.id);
  const embedSrc = demo?.embedUrl ?? project.href;
  const { label, caption } = project;
  const [blocked, setBlocked] = useState(false);

  if (blocked) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-6 text-center">
        <p className="mb-4 font-sans text-xs text-grey leading-relaxed">
          A experiência não pode ser embutida neste dispositivo.
        </p>
        <a
          href={project.href}
          className="border border-gold-dim px-5 py-2.5 font-sans text-[10px] tracking-[0.3em] uppercase text-gold"
        >
          Abrir {caption}
        </a>
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full bg-black"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <InvitationIframe
        src={embedSrc}
        title={label}
        viewportWidth={project.mobileViewportWidth}
        onBlocked={() => setBlocked(true)}
      />
    </div>
  );
}
