/** Preferências de movimento — performance mobile e acessibilidade */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function isNarrowViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

/** Lenis custa CPU em telemóvel — scroll nativo é mais fluido */
export function shouldUseSmoothScroll(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  if (isCoarsePointer() && isNarrowViewport()) return false;
  return true;
}

export function shouldUseParticles(): boolean {
  if (typeof window === "undefined") return false;
  if (prefersReducedMotion()) return false;
  if (isNarrowViewport()) return false;
  return true;
}

export function shouldUseScrollAnimations(): boolean {
  if (typeof window === "undefined") return true;
  return !prefersReducedMotion();
}
