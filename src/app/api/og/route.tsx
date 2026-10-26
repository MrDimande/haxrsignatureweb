import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Cache de fontes na instância Edge para resposta ultra-rápida (<20ms)
const fontCache = new Map<string, ArrayBuffer>();

// Cache de assets da marca em Data URI para eliminar dependência de rede repetida
const imageCache = new Map<string, string>();

async function loadFont(
  urlOrPath: string,
  fallbackUrl?: string
): Promise<ArrayBuffer | null> {
  if (fontCache.has(urlOrPath)) {
    return fontCache.get(urlOrPath)!;
  }

  try {
    const res = await fetch(urlOrPath);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      fontCache.set(urlOrPath, buffer);
      return buffer;
    }
  } catch {
    // Silently fall through to fallback
  }

  if (fallbackUrl) {
    try {
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        const buffer = await resFallback.arrayBuffer();
        fontCache.set(urlOrPath, buffer);
        return buffer;
      }
    } catch {
      // Fallback failed
    }
  }

  return null;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(buffer).toString("base64");
  }
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadBrandAssetAsDataUri(
  baseUrl: string,
  assetPath: string
): Promise<string | null> {
  if (imageCache.has(assetPath)) {
    return imageCache.get(assetPath)!;
  }

  try {
    const url = `${baseUrl}${assetPath}`;
    const res = await fetch(url);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const base64 = bufferToBase64(buffer);
      const dataUri = `data:image/png;base64,${base64}`;
      imageCache.set(assetPath, dataUri);
      return dataUri;
    }
  } catch {
    // Silently fall through
  }

  return null;
}

// Paleta Cromática Canónica HAXR Signature (Alta-Costura Digital)
const PALETTE = {
  noirDeep: "#080808",
  noirSurface: "#0E0E0E",
  noirCard: "#131313",
  goldChampagne: "#C9A96E",
  goldLight: "#E8D5B5",
  goldMuted: "#8E7548",
  ivorySilk: "#FAF8F5",
  ivoryMuted: "#C5C3BC",
  borderGold: "rgba(201, 169, 110, 0.35)",
  borderGoldFaint: "rgba(201, 169, 110, 0.18)",
  sealBg: "rgba(18, 18, 18, 0.95)",
  sealBorder: "#C9A96E",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Parâmetros de rota
  const mode =
    searchParams.get("mode") ||
    (searchParams.get("guest") || searchParams.get("convidado") ? "vip" : "brand");
  const title = (searchParams.get("title") || "").slice(0, 90);
  const couple = (searchParams.get("couple") || searchParams.get("casal") || "Mariana & Rodrigo").slice(0, 60);
  const guest = (searchParams.get("guest") || searchParams.get("convidado") || "").slice(0, 70);
  const date = (searchParams.get("date") || searchParams.get("data") || "24 de Outubro de 2026").slice(0, 40);
  const venue = (searchParams.get("venue") || searchParams.get("local") || "Polana Serena Hotel · Maputo").slice(0, 50);
  const coverImage = searchParams.get("coverImage") || searchParams.get("cover");

  // Carregamento de fontes e assets oficiais da HAXR Signature em paralelo
  const baseUrl = new URL(req.url).origin;
  const [
    cormorantRegular,
    cormorantItalic,
    interRegular,
    markGoldUri,
  ] = await Promise.all([
    loadFont(
      `${baseUrl}/fonts/CormorantGaramond-Regular.ttf`,
      "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-400-normal.ttf"
    ),
    loadFont(
      `${baseUrl}/fonts/CormorantGaramond-Italic.ttf`,
      "https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-400-italic.ttf"
    ),
    loadFont(
      `${baseUrl}/fonts/Inter-Regular.ttf`,
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf"
    ),
    loadBrandAssetAsDataUri(baseUrl, "/images/brand/haxr-mark-gold.png"),
  ]);

  const fontsConfig: Array<{
    name: string;
    data: ArrayBuffer;
    style?: "normal" | "italic";
    weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  }> = [];

  if (cormorantRegular) {
    fontsConfig.push({
      name: "Cormorant Garamond",
      data: cormorantRegular,
      style: "normal",
      weight: 400,
    });
  }
  if (cormorantItalic) {
    fontsConfig.push({
      name: "Cormorant Garamond",
      data: cormorantItalic,
      style: "italic",
      weight: 400,
    });
  }
  if (interRegular) {
    fontsConfig.push({
      name: "Inter",
      data: interRegular,
      style: "normal",
      weight: 400,
    });
  }

  // Fallback SVG caso a imagem PNG não esteja acessível por rede
  const FallbackMonogramSvg = ({ size = 44 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
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
  );

  // Símbolo em Relevo de Luxo (Dark Gold Seal) — Ardósia Negra & Ouro Champanhe Oficial
  const DarkGoldSeal = ({ size = 76, iconSize = 42 }: { size?: number; iconSize?: number }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: PALETTE.sealBg,
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(201, 169, 110, 0.08) 0%, rgba(18, 18, 18, 0.98) 80%)",
        border: `1.5px solid ${PALETTE.sealBorder}`,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size - 16,
          height: size - 16,
          borderRadius: "50%",
          border: "1px dashed rgba(201, 169, 110, 0.45)",
        }}
      >
        {markGoldUri ? (
          <img
            src={markGoldUri}
            width={iconSize}
            height={iconSize}
            style={{ width: iconSize, height: iconSize, objectFit: "contain" }}
            alt="HAXR Signature"
          />
        ) : (
          <FallbackMonogramSvg size={iconSize} />
        )}
      </div>
    </div>
  );
  const WaxSeal = DarkGoldSeal;

  // =========================================================================
  // CENÁRIO A: ATELIER PRINCIPAL (haxrsignature.com)
  // Capa institucional de prestígio, textura de ardósia e Ícone Oficial HAXR Signature.
  // =========================================================================
  if (mode === "brand") {
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
            backgroundImage: "radial-gradient(ellipse 900px 550px at 50% 48%, rgba(201, 169, 110, 0.08) 0%, transparent 70%)",
            color: PALETTE.ivorySilk,
            fontFamily: fontsConfig.length ? "Inter, sans-serif" : "sans-serif",
            position: "relative",
          }}
        >
          {/* Molduras com Coordenadas Píxeis Exatas (Sem calc ou inset) */}
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
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 400,
                }}
              >
                Atelier Privado · Moçambique
              </p>
              <div style={{ width: 32, height: 1, backgroundColor: PALETTE.goldChampagne, opacity: 0.5 }} />
            </div>

            {/* Ícone Oficial da Marca HAXR Signature */}
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
                <FallbackMonogramSvg size={78} />
              )}
            </div>

            {/* Nome da Marca com Contraste Editorial Clássico */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              <h1
                style={{
                  fontSize: 78,
                  fontWeight: 400,
                  letterSpacing: "0.22em",
                  color: PALETTE.ivorySilk,
                  margin: 0,
                  lineHeight: 1,
                  fontFamily: fontsConfig.length ? "Cormorant Garamond, serif" : "Georgia, serif",
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
                  fontFamily: fontsConfig.length ? "Cormorant Garamond, serif" : "Georgia, serif",
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

            {/* Posicionamento Editorial de Marca */}
            <p
              style={{
                fontSize: 14,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: PALETTE.ivoryMuted,
                margin: 0,
                marginBottom: 8,
                fontFamily: "Inter, sans-serif",
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
                fontFamily: "Inter, sans-serif",
              }}
            >
              Alta-Costura Digital · Curadoria Bespoke
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontsConfig,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        },
      }
    );
  }

  // =========================================================================
  // CENÁRIO B: CONVITE DE CASAMENTO GERAL (/evento-slug)
  // O casal, data solene, local e Lacre de Cera com Ícone Oficial HAXR.
  // =========================================================================
  if (mode === "event") {
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
            backgroundImage: "radial-gradient(ellipse 950px 580px at 50% 50%, rgba(201, 169, 110, 0.09) 0%, transparent 75%)",
            color: PALETTE.ivorySilk,
            fontFamily: fontsConfig.length ? "Inter, sans-serif" : "sans-serif",
            position: "relative",
          }}
        >
          {/* Se imagem de capa for fornecida, fundo fotográfico com dimensões absolutas */}
          {coverImage ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                backgroundImage: `url(${coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.18,
                display: "flex",
              }}
            />
          ) : null}

          {/* Molduras Concêntricas com Coordenadas Píxeis Exatas */}
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

          {/* SAFE ZONE CENTRAL WHATSAPP (630 x 630 px) */}
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
            {/* Topo do Convite */}
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                color: PALETTE.goldChampagne,
                margin: 0,
                marginBottom: 18,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {title || "Celebração de Casamento"}
            </p>

            {/* Lacre de Cera com Ícone Oficial HAXR */}
            <div style={{ display: "flex", marginBottom: 16 }}>
              <WaxSeal size={74} iconSize={42} />
            </div>

            {/* Nomes dos Noivos em Serifa Nobre */}
            <h1
              style={{
                fontSize: 68,
                fontWeight: 400,
                fontStyle: "italic",
                letterSpacing: "0.04em",
                color: PALETTE.ivorySilk,
                margin: 0,
                marginBottom: 16,
                lineHeight: 1.1,
                fontFamily: fontsConfig.length ? "Cormorant Garamond, serif" : "Georgia, serif",
              }}
            >
              {couple}
            </h1>

            {/* Divisor de Fio de Ouro */}
            <div
              style={{
                width: 70,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${PALETTE.goldChampagne}, transparent)`,
                marginBottom: 20,
                display: "flex",
              }}
            />

            {/* Data e Local Solenes */}
            <p
              style={{
                fontSize: 14,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: PALETTE.goldLight,
                margin: 0,
                marginBottom: 8,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
              }}
            >
              {date}
            </p>
            <p
              style={{
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: PALETTE.ivoryMuted,
                margin: 0,
                marginBottom: 24,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {venue}
            </p>

            {/* Selo de Cortesia HAXR Signature */}
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: PALETTE.goldMuted,
                margin: 0,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Web-Convite Exclusivo · HAXR Signature
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: fontsConfig,
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        },
      }
    );
  }

  // =========================================================================
  // CENÁRIO C: HYPER-PERSONALIZED VIP GUEST PREVIEW (/evento-slug?convidado=Nome)
  // Envelope digital com Lacre de Cera gravado com o Ícone Oficial HAXR Signature.
  // =========================================================================
  const guestFormatted = guest || "Estimado Convidado";

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
          backgroundImage: "radial-gradient(ellipse 900px 580px at 50% 48%, rgba(201, 169, 110, 0.12) 0%, transparent 75%)",
          color: PALETTE.ivorySilk,
          fontFamily: fontsConfig.length ? "Inter, sans-serif" : "sans-serif",
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

        {/* Silhueta Geométrica de Envelope: Coordenadas Exatas (1128px de largura) */}
        <svg
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            width: 1128,
            height: 140,
          }}
          viewBox="0 0 1128 140"
          fill="none"
        >
          <path
            d="M0 0L564 130L1128 0"
            stroke={PALETTE.goldChampagne}
            strokeWidth="0.8"
            strokeDasharray="3 3"
            opacity="0.35"
          />
        </svg>

        {/* SAFE ZONE CENTRAL WHATSAPP (630 x 630 px) */}
        <div
          style={{
            width: 630,
            height: 520,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Lacre de Cera Real com Ícone Oficial HAXR Signature */}
          <div style={{ display: "flex", marginBottom: 20 }}>
            <WaxSeal size={74} iconSize={42} />
          </div>

          {/* Chamada Nobre de Protocolo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 28, height: 1, backgroundColor: PALETTE.goldChampagne, opacity: 0.4 }} />
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: PALETTE.goldChampagne,
                margin: 0,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
              }}
            >
              Reservado com Distinção Para
            </p>
            <div style={{ width: 28, height: 1, backgroundColor: PALETTE.goldChampagne, opacity: 0.4 }} />
          </div>

          {/* Nome do Convidado em Folha de Ouro Editorial */}
          <div
            style={{
              padding: "16px 28px",
              borderRadius: 4,
              backgroundColor: "rgba(19, 19, 19, 0.8)",
              border: "1px solid rgba(201, 169, 110, 0.4)",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 20,
              maxWidth: 580,
            }}
          >
            <h2
              style={{
                fontSize: 38,
                fontWeight: 400,
                fontStyle: "italic",
                color: PALETTE.goldLight,
                margin: 0,
                lineHeight: 1.2,
                fontFamily: fontsConfig.length ? "Cormorant Garamond, serif" : "Georgia, serif",
              }}
            >
              {guestFormatted}
            </h2>
          </div>

          {/* Menção ao Evento dos Noivos */}
          <p
            style={{
              fontSize: 13,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: PALETTE.ivorySilk,
              margin: 0,
              marginBottom: 6,
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
            }}
          >
            Para a Celebração de Casamento de
          </p>
          <p
            style={{
              fontSize: 26,
              fontStyle: "italic",
              color: PALETTE.goldChampagne,
              margin: 0,
              marginBottom: 16,
              fontFamily: fontsConfig.length ? "Cormorant Garamond, serif" : "Georgia, serif",
            }}
          >
            {couple}
          </p>

          {/* Coordenadas e Protocolo */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: PALETTE.ivoryMuted,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {date}
            </span>
            <span style={{ color: PALETTE.goldMuted }}>·</span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: PALETTE.ivoryMuted,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {venue}
            </span>
          </div>

          {/* Status Solene */}
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: PALETTE.goldMuted,
              margin: 0,
              marginTop: 18,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Acesso Pessoal & Intransferível · HAXR Signature
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontsConfig,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    }
  );
}
