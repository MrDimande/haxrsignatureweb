"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig, type InvitationProject } from "@/lib/site-config";
import IPhone17Frame from "@/components/ui/IPhone17Frame";
import InvitationIframe from "@/components/ui/InvitationIframe";
import InvitationLoading from "@/components/ui/InvitationLoading";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface InvitationViewerProps {
  open: boolean;
  onClose: () => void;
  project: InvitationProject;
}

export default function InvitationViewer({
  open,
  onClose,
  project,
}: InvitationViewerProps) {
  const { href, label, caption } = project;
  const [mounted, setMounted] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const isFullscreen = useMediaQuery(
    `(max-width: ${siteConfig.invitationFullscreenMaxWidth}px)`
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setIframeBlocked(false);
      setLoading(true);
    }
  }, [open, project.id]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const blockedFallback = (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black px-6 text-center">
      <p className="mb-6 font-sans text-xs leading-relaxed text-grey">
        A pré-visualização não está disponível neste formato.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-gold-dim px-6 py-3 font-sans text-[10px] tracking-[0.35em] uppercase text-gold transition-colors duration-500 hover:border-gold"
      >
        Abrir experiência
      </a>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          data-lenis-prevent
        >
          {isFullscreen ? (
            <>
              <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <p className="truncate pr-3 font-serif text-sm font-light tracking-wide text-white/70">
                  {caption}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 font-mono text-[10px] tracking-[0.35em] uppercase text-grey transition-colors hover:text-gold"
                >
                  Fechar
                </button>
              </header>

              <div className="relative min-h-0 flex-1 overflow-hidden">
                {iframeBlocked ? (
                  blockedFallback
                ) : (
                  <>
                    {loading && <InvitationLoading />}
                    <iframe
                      src={href}
                      title={label}
                      className="h-full w-full border-0 bg-black"
                      allow="autoplay; fullscreen"
                      onLoad={() => setLoading(false)}
                      onError={() => {
                        setLoading(false);
                        setIframeBlocked(true);
                      }}
                    />
                  </>
                )}
              </div>

              <footer className="shrink-0 border-t border-white/[0.06] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[9px] tracking-[0.35em] uppercase text-grey/60"
                >
                  Abrir em separador →
                </a>
              </footer>
            </>
          ) : (
            <>
              <button
                type="button"
                className="absolute inset-0 bg-black/94 backdrop-blur-lg"
                onClick={onClose}
                aria-label="Fechar pré-visualização"
              />

              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.25, 0, 0.1, 1] }}
                className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-y-auto px-4 py-8"
              >
                <div className="mb-6 flex w-full max-w-[402px] items-center justify-between">
                  <p className="pr-4 font-serif text-lg font-light tracking-wide text-white/70">
                    {caption}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 font-mono text-[10px] tracking-[0.4em] uppercase text-grey transition-colors hover:text-gold"
                  >
                    Fechar
                  </button>
                </div>

                <IPhone17Frame fullWidth showLabel>
                  {iframeBlocked ? (
                    blockedFallback
                  ) : (
                    <InvitationIframe
                      src={href}
                      title={label}
                      viewportWidth={project.mobileViewportWidth}
                      onBlocked={() => setIframeBlocked(true)}
                      onLoaded={() => setLoading(false)}
                    />
                  )}
                </IPhone17Frame>

                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 font-mono text-[9px] tracking-[0.4em] uppercase text-grey/60 transition-colors hover:text-gold/80"
                >
                  Abrir em ecrã completo →
                </a>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
