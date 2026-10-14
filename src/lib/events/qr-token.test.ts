import assert from "node:assert/strict";
import { describe, it } from "node:test";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { extractQrToken } from "./qr-token";

function renderQrMatrix(
  qrUrl: string,
  scale = 6,
  quietZoneModules = 4
): { pixels: Uint8ClampedArray; width: number } {
  const matrix = QRCode.create(qrUrl, { errorCorrectionLevel: "M" }).modules;
  const width = (matrix.size + quietZoneModules * 2) * scale;
  const pixels = new Uint8ClampedArray(width * width * 4);
  pixels.fill(255);

  for (let row = 0; row < matrix.size; row += 1) {
    for (let col = 0; col < matrix.size; col += 1) {
      if (!matrix.get(row, col)) continue;
      const startX = (col + quietZoneModules) * scale;
      const startY = (row + quietZoneModules) * scale;

      for (let y = startY; y < startY + scale; y += 1) {
        for (let x = startX; x < startX + scale; x += 1) {
          const offset = (y * width + x) * 4;
          pixels[offset] = 10;
          pixels[offset + 1] = 33;
          pixels[offset + 2] = 26;
          pixels[offset + 3] = 255;
        }
      }
    }
  }

  return { pixels, width };
}

describe("extractQrToken", () => {
  const token = "b7a2d4f9e1c3856012345678abcdef01";
  const eventId = "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102";

  it("extracts the token from the canonical Edition QR URL", () => {
    assert.equal(
      extractQrToken(`https://haxrsignatureweb-preview.vercel.app/event/${eventId}/checkin/${token}`),
      token
    );
  });

  it("ignores query strings and fragments after the token", () => {
    assert.equal(
      extractQrToken(`https://core.example/event/${eventId}/checkin/${token}?source=pass#top`),
      token
    );
  });

  it("decodes a URL-encoded token segment", () => {
    assert.equal(
      extractQrToken(`/event/${eventId}/checkin/token%2Dencoded`),
      "token-encoded"
    );
  });

  it("preserves a raw token for manual validation", () => {
    assert.equal(extractQrToken(`  ${token}  `), token);
  });

  it("returns an empty string for an empty input", () => {
    assert.equal(extractQrToken("  "), "");
  });

  it("does not treat an unrelated URL as a check-in token", () => {
    const url = `https://core.example/event/${eventId}/find-seat?code=1234567890123456`;
    assert.equal(extractQrToken(url), url);
  }); 
  it("round-trips an Edition check-in QR through jsQR and extracts the real token", () => {
    const qrUrl = `https://haxrsignatureweb-preview.vercel.app/event/${eventId}/checkin/${token}`;
    const { pixels, width } = renderQrMatrix(qrUrl);
    const decoded = jsQR(pixels, width, width, {
      inversionAttempts: "attemptBoth",
    });

    assert.ok(decoded, "jsQR deve descodificar a matriz QR gerada");
    assert.equal(decoded.data, qrUrl);
    assert.equal(extractQrToken(decoded.data), token);
  });

});
