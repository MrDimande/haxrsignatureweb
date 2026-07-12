"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

export default function SignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Inicializar o canvas e lidar com redimensionamento
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      // Obter tamanho visível no layout
      const rect = canvas.getBoundingClientRect();
      // Ajustar para alta densidade de ecrã (Retina)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Definir estilos de linha dourada
      ctx.strokeStyle = "#E3C46B"; // Ouro brilhante
      ctx.lineWidth = 1.75;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Efeito de brilho (glowing trail)
      ctx.shadowColor = "#B88A2A";
      ctx.shadowBlur = 6;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Impedir scroll no mobile ao desenhar na tela
    if (e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reaplicar estilos que podem ser perdidos no redimensionamento
    ctx.strokeStyle = "#E3C46B";
    ctx.lineWidth = 1.75;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#B88A2A";
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    // Impedir scroll no mobile ao desenhar
    if (e.cancelable) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  return (
    <div className="relative w-full h-36 bg-black-soft/40 border border-white/10 rounded-sm overflow-hidden group cursor-crosshair">
      {/* Grelha de textura de luxo discreta */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(184,138,42,0.03)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

      {/* Marca de água decorativa art-deco */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gold/25 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gold/25 pointer-events-none" />

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="absolute inset-0 w-full h-full block z-10"
      />

      {/* Instruções */}
      {!hasDrawn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 text-center px-4">
          <p className="font-serif text-xs italic text-white/30 tracking-wide">
            Deixe a sua assinatura digital
          </p>
          <p className="font-sans text-[9px] text-white/20 tracking-[0.2em] uppercase mt-1">
            desenhe com o rato ou toque
          </p>
        </div>
      )}

      {/* Botões de controlo */}
      {hasDrawn && (
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 font-mono text-[8px] tracking-wider uppercase text-white/35 hover:text-gold transition-colors duration-300 bg-black/60 px-2 py-1 border border-white/10 rounded-sm"
          title="Limpar assinatura"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Limpar</span>
        </button>
      )}

      {/* Moldura dourada que acende no hover */}
      <div className="absolute inset-0 border border-gold/0 group-hover:border-gold/15 transition-colors duration-750 pointer-events-none" />
    </div>
  );
}
