"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { shouldUseScrollAnimations } from "@/lib/motion/preferences";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  y = 40,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!shouldUseScrollAnimations()) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    const motionY = window.matchMedia("(max-width: 767px)").matches
      ? Math.min(y, 20)
      : y;

    gsap.set(el, { opacity: 0, y: motionY });

    const fallback = window.setTimeout(() => {
      gsap.set(el, { opacity: 1, y: 0 });
    }, 2500);

    const tween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: window.matchMedia("(max-width: 767px)").matches ? 0.8 : 1.2,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        once: true,
      },
      onComplete: () => window.clearTimeout(fallback),
    });

    return () => {
      window.clearTimeout(fallback);
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, y]);

  return (
    <div ref={ref} className={`opacity-100 ${className}`}>
      {children}
    </div>
  );
}
