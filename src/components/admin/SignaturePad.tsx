"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Eraser } from "lucide-react";

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toDataUrl: () => string | null;
};

type SignaturePadProps = {
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
};

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    {
      width = 480,
      height = 180,
      className = "",
      strokeColor = "#1a1a1a",
      strokeWidth = 2.2,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasStroke = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);

    const setupCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.clearRect(0, 0, width, height);
      hasStroke.current = false;
    }, [height, strokeColor, strokeWidth, width]);

    useEffect(() => {
      setupCanvas();
      window.addEventListener("resize", setupCanvas);
      return () => window.removeEventListener("resize", setupCanvas);
    }, [setupCanvas]);

    const getPoint = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const clientX =
          "touches" in event ? event.touches[0]?.clientX : event.clientX;
        const clientY =
          "touches" in event ? event.touches[0]?.clientY : event.clientY;

        if (clientX == null || clientY == null) return null;

        return {
          x: clientX - rect.left,
          y: clientY - rect.top,
        };
      },
      []
    );

    const startDrawing = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if ("touches" in event) event.preventDefault();
        const point = getPoint(event);
        if (!point) return;

        isDrawing.current = true;
        lastPoint.current = point;
      },
      [getPoint]
    );

    const draw = useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        if ("touches" in event) event.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const point = getPoint(event);
        if (!canvas || !ctx || !point || !lastPoint.current) return;

        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();

        lastPoint.current = point;
        hasStroke.current = true;
      },
      [getPoint]
    );

    const stopDrawing = useCallback(() => {
      isDrawing.current = false;
      lastPoint.current = null;
    }, []);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, width, height);
      hasStroke.current = false;
    }, [width]);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        isEmpty: () => !hasStroke.current,
        toDataUrl: () => {
          if (!hasStroke.current) return null;
          return canvasRef.current?.toDataURL("image/png") ?? null;
        },
      }),
      [clear]
    );

    return (
      <div className={`relative ${className}`}>
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair rounded-sm border border-grey-dark/80 bg-white touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          aria-label="Área para assinar com o rato ou dedo"
        />
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-sm border border-grey-dark/60 bg-black/80 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-grey/70 hover:text-white transition-colors"
        >
          <Eraser className="w-3 h-3" />
          Limpar
        </button>
      </div>
    );
  }
);

export default SignaturePad;
