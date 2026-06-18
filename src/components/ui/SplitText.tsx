"use client";

import { useEffect, useRef } from "react";
import SplitType from "split-type";
import { gsap } from "@/lib/gsap";
import { shouldUseScrollAnimations } from "@/lib/motion/preferences";

interface SplitTextProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  trigger?: boolean;
}

export default function SplitText({
  children,
  as: Tag = "p",
  className = "",
  delay = 0,
  trigger = true,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!shouldUseScrollAnimations()) {
      gsap.set(el, { opacity: 1 });
      return;
    }

    const split = new SplitType(el, { types: "lines,words" });

    gsap.set(split.words, { opacity: 0, y: 20 });

    const animation = gsap.to(split.words, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.03,
      delay,
      ease: "power3.out",
      ...(trigger
        ? {
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          }
        : {}),
    });

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
      split.revert();
    };
  }, [children, delay, trigger]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
