"use client";

import { portfolioAssets } from "@/lib/assets";

export default function DetailGallery() {
  const images = [
    portfolioAssets.casamentoSignature,
    portfolioAssets.celebracaoPrivada,
    portfolioAssets.saveTheDate,
    portfolioAssets.corporativo,
    portfolioAssets.convitePreviewPortrait,
  ];

  return (
    <section className="relative py-6 bg-brand-ivory pointer-events-auto">
      <div className="site-container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden aspect-video md:aspect-[2.1/1] relative bg-brand-champagne/10 border border-brand-champagne/20 shadow-sm">
          {/* Foto Principal Esquerda (Larga) */}
          <div className="md:col-span-2 md:row-span-2 relative overflow-hidden h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt="Casamento Signature HAXR"
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Foto 2: Topo Meio */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[1]}
              alt="Celebração Privada HAXR"
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Foto 3: Topo Direita */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[2]}
              alt="Save the Date Editorial"
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Foto 4: Base Meio */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[3]}
              alt="Evento Corporativo Estratégico"
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* Foto 5: Base Direita */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[4]}
              alt="Convite Digital Preview"
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
