import { ImageResponse } from "next/og";
import { siteSeo } from "@/lib/seo";

export const alt = siteSeo.ogImage.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #000000 0%, #0a0a0a 55%, #111111 100%)",
          color: "#f5f5f0",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(201,169,110,0.14) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(201,169,110,0.35), transparent)",
          }}
        />

        <p
          style={{
            fontSize: 18,
            letterSpacing: "0.55em",
            textTransform: "uppercase",
            color: "rgba(163,163,163,0.9)",
            marginBottom: 28,
          }}
        >
          Maputo · Moçambique
        </p>

        <p
          style={{
            fontSize: 92,
            fontWeight: 300,
            letterSpacing: "0.28em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          HAXR
        </p>

        <p
          style={{
            fontSize: 54,
            fontStyle: "italic",
            color: "rgba(201,169,110,0.82)",
            marginTop: 8,
            marginBottom: 36,
          }}
        >
          Signature
        </p>

        <div
          style={{
            width: 72,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(201,169,110,0.45), transparent)",
            marginBottom: 36,
          }}
        />

        <p
          style={{
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(201,169,110,0.75)",
            marginBottom: 18,
          }}
        >
          {siteSeo.tagline}
        </p>

        <p
          style={{
            fontSize: 20,
            color: "rgba(163,163,163,0.95)",
            maxWidth: 760,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Convites digitais · Assessoria de eventos · Curadoria exclusiva
        </p>

        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(201,169,110,0.25), transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
