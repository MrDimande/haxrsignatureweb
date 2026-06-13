"use client";

import { useEffect, useRef, useState } from "react";
import { IPHONE_17_VIEWPORT } from "@/lib/site-config";
import InvitationLoading from "@/components/ui/InvitationLoading";

interface InvitationIframeProps {
  src: string;
  title: string;
  viewportWidth?: number;
  onBlocked?: () => void;
  onLoaded?: () => void;
}

export default function InvitationIframe({
  src,
  title,
  viewportWidth = IPHONE_17_VIEWPORT.width,
  onBlocked,
  onLoaded,
}: InvitationIframeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [iframeHeight, setIframeHeight] = useState(874);
  const [loading, setLoading] = useState(true);

  const viewportW = viewportWidth;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = w / viewportW;
      setScale(s);
      setIframeHeight(h / s);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportW]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black touch-pan-y"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      {loading && <InvitationLoading />}

      <iframe
        src={src}
        title={title}
        className="absolute top-0 left-1/2 border-0 bg-black pointer-events-auto"
        style={{
          width: viewportW,
          height: iframeHeight,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
        allow="autoplay; fullscreen"
        loading="eager"
        onLoad={() => {
          setLoading(false);
          onLoaded?.();
        }}
        onError={() => {
          setLoading(false);
          onBlocked?.();
        }}
      />
    </div>
  );
}
