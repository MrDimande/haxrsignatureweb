import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { siteSeo } from "@/lib/seo";

export const alt = siteSeo.ogImage.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PALETTE = {
  noirDeep: "#080808",
  goldChampagne: "#C9A96E",
  goldLight: "#E8D5B5",
  goldMuted: "#8E7548",
  ivorySilk: "#FAF8F5",
  ivoryMuted: "#C5C3BC",
  borderGold: "rgba(201, 169, 110, 0.35)",
  borderGoldFaint: "rgba(201, 169, 110, 0.18)",
};

// Carregamento resiliente do ícone oficial HAXR Signature em Data URI
function getHaxrMarkDataUri(): string | null {
  try {
    const filePath = path.join(process.cwd(), "public", "images", "brand", "haxr-mark-gold.png");
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    }
  } catch {
    // Silently fall through
  }
  return null;
}

export default function OpenGraphImage() {
  const markGoldUri = getHaxrMarkDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PALETTE.noirDeep,
          backgroundImage:
            "radial-gradient(ellipse 900px 550px at 50% 48%, rgba(201, 169, 110, 0.08) 0%, transparent 70%)",
          color: PALETTE.ivorySilk,
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Molduras Concêntricas com Coordenadas Píxeis Exatas (Sem calc ou inset) */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            width: 1144,
            height: 574,
            border: `1px solid ${PALETTE.borderGoldFaint}`,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            width: 1128,
            height: 558,
            border: `1px solid ${PALETTE.borderGold}`,
            display: "flex",
          }}
        />

        {/* Cantoneiras Geométricas de Alta-Costura */}
        <div style={{ position: "absolute", top: 44, left: 44, width: 14, height: 14, borderTop: `1.5px solid ${PALETTE.goldChampagne}`, borderLeft: `1.5px solid ${PALETTE.goldChampagne}`, display: "flex" }} />
        <div style={{ position: "absolute", top: 44, right: 44, width: 14, height: 14, borderTop: `1.5px solid ${PALETTE.goldChampagne}`, borderRight: `1.5px solid ${PALETTE.goldChampagne}`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 44, left: 44, width: 14, height: 14, borderBottom: `1.5px solid ${PALETTE.goldChampagne}`, borderLeft: `1.5px solid ${PALETTE.goldChampagne}`, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 44, right: 44, width: 14, height: 14, borderBottom: `1.5px solid ${PALETTE.goldChampagne}`, borderRight: `1.5px solid ${PALETTE.goldChampagne}`, display: "flex" }} />

        {/* SAFE ZONE WHATSAPP CENTRAL (630 x 630 px) */}
        <div
          style={{
            width: 630,
            height: 520,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {/* Topo: Origem & Protocolo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 32, height: 1, backgroundColor: PALETTE.goldChampagne, opacity: 0.5 }} />
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                color: PALETTE.goldChampagne,
                margin: 0,
                fontWeight: 400,
              }}
            >
              Atelier Privado · Moçambique
            </p>
            <div style={{ width: 32, height: 1, backgroundColor: PALETTE.goldChampagne, opacity: 0.5 }} />
          </div>

          {/* Ícone Oficial da Marca HAXR Signature em Ouro Champanhe */}
          <div style={{ display: "flex", marginBottom: 20 }}>
            {markGoldUri ? (
              <img
                src={markGoldUri}
                width="78"
                height="78"
                style={{ width: 78, height: 78, objectFit: "contain" }}
                alt="HAXR Signature"
              />
            ) : (
              <svg width="78" height="78" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" stroke={PALETTE.goldChampagne} strokeWidth="1.2" opacity="0.65" />
                <circle cx="50" cy="50" r="44" stroke={PALETTE.goldChampagne} strokeWidth="0.6" strokeDasharray="2 3" opacity="0.4" />
                <path
                  d="M32 26V74M68 26V74M32 50H68"
                  stroke={PALETTE.goldChampagne}
                  strokeWidth="3.2"
                  strokeLinecap="square"
                />
                <circle cx="50" cy="50" r="3" fill={PALETTE.goldLight} />
              </svg>
            )}
          </div>

          {/* Nome da Marca com Contraste Editorial */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
            <h1
              style={{
                fontSize: 78,
                fontWeight: 400,
                letterSpacing: "0.22em",
                color: PALETTE.ivorySilk,
                margin: 0,
                lineHeight: 1,
              }}
            >
              HAXR
            </h1>
            <p
              style={{
                fontSize: 42,
                fontStyle: "italic",
                letterSpacing: "0.08em",
                color: PALETTE.goldChampagne,
                margin: 0,
                marginTop: -6,
              }}
            >
              Signature
            </p>
          </div>

          {/* Linha Divisória de Alfaiataria */}
          <div
            style={{
              width: 90,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${PALETTE.goldChampagne}, transparent)`,
              marginBottom: 22,
              display: "flex",
            }}
          />

          {/* Posicionamento Editorial */}
          <p
            style={{
              fontSize: 14,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: PALETTE.ivoryMuted,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Assessoria de Eventos & Web-Convites
          </p>

          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: PALETTE.goldMuted,
              margin: 0,
            }}
          >
            Alta-Costura Digital · Curadoria Bespoke
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
