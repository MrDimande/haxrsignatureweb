"use client";

import { useEffect, useRef } from "react";
import SplitType from "split-type";
import { gsap } from "@/lib/gsap";

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

    const split = new SplitType(el, { types: "lines,words" });

    gsap.set(split.words, { opacity: 0, y: 24 });

    const animation = gsap.to(split.words, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.04,
      delay,
      ease: "power3.out",
      ...(trigger
        ? {
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
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
