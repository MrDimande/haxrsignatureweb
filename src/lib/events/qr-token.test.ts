import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractQrToken } from "./qr-token";

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
});
