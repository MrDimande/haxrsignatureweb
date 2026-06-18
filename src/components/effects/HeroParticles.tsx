"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { shouldUseParticles } from "@/lib/motion/preferences";

function buildOptions(density: number): ISourceOptions {
  return {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    fpsLimit: 45,
    particles: {
      number: { value: density, density: { enable: true, width: 900, height: 900 } },
      color: { value: "#c9a96e" },
      opacity: {
        value: { min: 0.04, max: 0.2 },
        animation: { enable: true, speed: 0.25, sync: false },
      },
      size: { value: { min: 0.5, max: 1.25 } },
      move: {
        enable: true,
        speed: 0.25,
        direction: "none",
        random: true,
        outModes: { default: "out" },
      },
      links: { enable: false },
    },
    detectRetina: false,
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
  };
}

export default function HeroParticles() {
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!shouldUseParticles()) return;

    let cancelled = false;

    const boot = () => {
      initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      }).then(() => {
        if (!cancelled) {
          setReady(true);
          setActive(true);
        }
      });
    };

    const scheduleBoot = () => {
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(boot, { timeout: 2000 });
        return () => {
          cancelled = true;
          window.cancelIdleCallback(id);
        };
      }

      const timer = window.setTimeout(boot, 400);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    };

    return scheduleBoot();
  }, []);

  const options = useMemo(() => buildOptions(28), []);

  if (!active || !ready) return null;

  return (
    <Particles
      id="hero-particles"
      className="absolute inset-0 z-0 pointer-events-none"
      options={options}
    />
  );
}
