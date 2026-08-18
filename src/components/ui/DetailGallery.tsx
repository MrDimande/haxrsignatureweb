"use client";

import { portfolioAssets } from "@/lib/assets";

export default function DetailGallery() {
  return (
    <section className="relative py-6 bg-brand-ivory pointer-events-auto">
      <div className="site-container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden aspect-video md:aspect-[2.1/1] relative bg-brand-champagne/10 border border-brand-champagne/20 shadow-sm">
          {/* 1) BLOCO ESQUERDA GRANDE (hero principal do mosaico) */}
          <div className="md:col-span-2 md:row-span-2 relative overflow-hidden h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portfolioAssets.casamentoSignature}
              alt="Casal em composição editorial diante de painel branco floral"
              className="object-cover object-center w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* 2) BLOCO TOPO CENTRO */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portfolioAssets.salaoBranco}
              alt="Salão branco preparado para recepção de casamento"
              className="object-cover object-center w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* 3) BLOCO TOPO DIREITA */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portfolioAssets.conviteJessicaSamuel}
              alt="Capa de convite digital premium da HAXR Signature"
              className="object-cover object-center w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* 4) BLOCO BASE CENTRO */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portfolioAssets.mesaDourada}
              alt="Mesa de recepção com cadeiras douradas e styling de casamento"
              className="object-cover object-center w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>

          {/* 5) BLOCO BASE DIREITA */}
          <div className="relative overflow-hidden h-full hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portfolioAssets.euEspioQr}
              alt="Placa interactiva com QR Code para participação dos convidados"
              className="object-cover object-center w-full h-full hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
