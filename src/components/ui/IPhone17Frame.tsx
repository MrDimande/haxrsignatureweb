import { IPHONE_17_VIEWPORT } from "@/lib/site-config";

interface IPhone17FrameProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  showLabel?: boolean;
  variant?: "default" | "compact";
}

/**
 * Moldura iPhone 17 — viewport 402×874 CSS px
 * Ref: https://www.ios-resolution.com/iphone-17-pro/
 */
export default function IPhone17Frame({
  children,
  className = "",
  fullWidth = false,
  showLabel = true,
  variant = "default",
}: IPhone17FrameProps) {
  const bezel = variant === "compact" ? 10 : 12;
  const outerRadius = variant === "compact" ? 44 : 52;

  return (
    <div
      className={`relative mx-auto shrink-0 ${
        fullWidth
          ? "w-[min(100%,calc(100vw-2rem))]"
          : "w-[min(100%,360px)]"
      } ${className}`}
      style={{ maxWidth: fullWidth ? IPHONE_17_VIEWPORT.width + bezel * 2 + 8 : 360 }}
    >
      {/* Action button */}
      <div
        className="absolute right-[-3px] z-10 w-[3px] rounded-r-md bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-700"
        style={{ top: "26%", height: "11%" }}
      />
      {/* Volume */}
      <div
        className="absolute left-[-3px] z-10 w-[3px] rounded-l-md bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-700"
        style={{ top: "17%", height: "4%" }}
      />
      <div
        className="absolute left-[-3px] z-10 w-[3px] rounded-l-md bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-700"
        style={{ top: "23%", height: "7%" }}
      />
      <div
        className="absolute left-[-3px] z-10 w-[3px] rounded-l-md bg-gradient-to-b from-zinc-400 via-zinc-600 to-zinc-700"
        style={{ top: "32%", height: "7%" }}
      />

      {/* Chassis titanium */}
      <div
        className="relative bg-gradient-to-b from-[#8a8a8e] via-[#3a3a3c] to-[#1c1c1e] p-[2px]"
        style={{
          borderRadius: outerRadius,
          boxShadow:
            "0 48px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.18) inset",
        }}
      >
        <div
          className="bg-gradient-to-b from-[#2c2c2e] to-black p-[3px]"
          style={{ borderRadius: outerRadius - 2 }}
        >
          <div
            className="relative overflow-hidden bg-black ring-1 ring-white/[0.05]"
            style={{
              borderRadius: outerRadius - bezel,
              width: "100%",
              aspectRatio: `${IPHONE_17_VIEWPORT.width} / ${IPHONE_17_VIEWPORT.height}`,
            }}
          >
            {/* Dynamic Island */}
            <div
              className="absolute left-1/2 z-50 flex -translate-x-1/2 items-center justify-center rounded-full bg-black"
              style={{
                top: "1.6%",
                width: "27%",
                height: "3.4%",
                minWidth: 96,
                minHeight: 28,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="rounded-full bg-[#0a0a0a]"
                style={{ width: "62%", height: "58%" }}
              />
            </div>

            {/* Ecrã — interacção directa (scroll/touch ficam no iframe) */}
            <div
              className="absolute inset-0 overflow-hidden bg-black isolate"
              data-lenis-prevent
            >
              {children}
            </div>

            {/* Home indicator */}
            <div
              className="absolute left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/35"
              style={{
                bottom: "0.9%",
                width: "29%",
                height: "0.45%",
                minWidth: 100,
                minHeight: 4,
              }}
            />
          </div>
        </div>
      </div>

      {showLabel && (
        <p className="mt-5 text-center font-mono text-[8px] tracking-[0.45em] uppercase text-grey/50">
          iPhone 17 · {IPHONE_17_VIEWPORT.width}×{IPHONE_17_VIEWPORT.height}
        </p>
      )}
    </div>
  );
}
