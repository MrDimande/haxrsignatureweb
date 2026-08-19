import { IPHONE_17_VIEWPORT } from "@/lib/site-config";

interface IPhone17FrameProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  showLabel?: boolean;
  variant?: "default" | "compact";
}

/**
 * Visualizador de Viewport Mobile Sleek HAXR Signature
 * Estilo Editorial Limpo (Dash Limintso & Artboard Studio Edition)
 * Permite exibições de 440×956px sem entalhes (notch) a tapar o texto ou botões cortados.
 */
export default function IPhone17Frame({
  children,
  className = "",
  fullWidth = false,
  showLabel = false,
}: IPhone17FrameProps) {
  return (
    <div
      className={`relative mx-auto shrink-0 max-w-full group/phone ${
        fullWidth
          ? "w-[min(100%,calc(100vw-1.5rem))]"
          : "w-[min(100%,245px)] sm:w-[min(100%,265px)]"
      } ${className}`}
      style={{ maxWidth: fullWidth ? IPHONE_17_VIEWPORT.width + 16 : 265 }}
    >
      {/* Dynamic Backlight Glow */}
      <div
        className="absolute inset-0 -z-10 rounded-[2.2rem] bg-brand-gold/20 blur-[40px] transition-opacity duration-700 opacity-50 group-hover/phone:opacity-85 pointer-events-none"
        aria-hidden="true"
      />

      {/* Sleek Mobile Viewport Card */}
      <div
        className="relative bg-black p-[2px] rounded-[2rem] transition-transform duration-500 group-hover/phone:scale-[1.01]"
        style={{
          boxShadow:
            "0 30px 90px rgba(0,0,0,0.9), 0 0 35px rgba(184,138,42,0.18), 0 0 0 1px rgba(234,216,184,0.3)",
        }}
      >
        <div
          className="relative overflow-hidden bg-black rounded-[1.9rem]"
          style={{
            width: "100%",
            aspectRatio: `${IPHONE_17_VIEWPORT.width} / ${IPHONE_17_VIEWPORT.height}`,
          }}
        >
          {/* Ecrã 100% desimpedido — sem notch ou botões a tapar o convite */}
          <div
            className="absolute inset-0 overflow-hidden bg-black isolate"
            data-lenis-prevent
          >
            {children}
          </div>
        </div>
      </div>

      {showLabel && (
        <p className="mt-4 text-center font-mono text-[8px] tracking-[0.45em] uppercase text-gold/60">
          HAXR Mobile Viewport · {IPHONE_17_VIEWPORT.width}×{IPHONE_17_VIEWPORT.height}
        </p>
      )}
    </div>
  );
}
