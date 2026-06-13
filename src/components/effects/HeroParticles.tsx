"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const options: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    number: { value: 40, density: { enable: true, width: 800, height: 800 } },
    color: { value: "#c9a96e" },
    opacity: {
      value: { min: 0.05, max: 0.25 },
      animation: { enable: true, speed: 0.3, sync: false },
    },
    size: { value: { min: 0.5, max: 1.5 } },
    move: {
      enable: true,
      speed: 0.3,
      direction: "none",
      random: true,
      outModes: { default: "out" },
    },
    links: { enable: false },
  },
  detectRetina: true,
};

export default function HeroParticles() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <Particles
      id="hero-particles"
      className="absolute inset-0 z-0 pointer-events-none"
      options={options}
    />
  );
}
