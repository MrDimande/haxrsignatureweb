import test from "node:test";
import assert from "node:assert/strict";
import { buildOgImageUrl, buildDynamicEventMetadata } from "./og-builder";

test("buildOgImageUrl generates default brand url when no options provided", () => {
  const url = buildOgImageUrl();
  assert.ok(url.startsWith("https://www.haxrsignature.com/api/og"));
});

test("buildOgImageUrl sets query parameters correctly", () => {
  const url = buildOgImageUrl({
    mode: "vip",
    couple: "Mariana & Rodrigo",
    guest: "Dra. Amina Patel",
    date: "24 de Outubro de 2026",
    venue: "Polana Serena Hotel",
  });

  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/api/og");
  assert.equal(parsed.searchParams.get("mode"), "vip");
  assert.equal(parsed.searchParams.get("couple"), "Mariana & Rodrigo");
  assert.equal(parsed.searchParams.get("guest"), "Dra. Amina Patel");
  assert.equal(parsed.searchParams.get("date"), "24 de Outubro de 2026");
  assert.equal(parsed.searchParams.get("venue"), "Polana Serena Hotel");
});

test("buildDynamicEventMetadata generates event metadata without guest", () => {
  const meta = buildDynamicEventMetadata({
    slug: "mariana-rodrigo-2026",
    coupleName: "Mariana & Rodrigo",
    dateText: "24 de Outubro de 2026",
    venueName: "Polana Serena Hotel",
  });

  assert.equal(meta.title, "Casamento de Mariana & Rodrigo | HAXR Signature");
  assert.ok(typeof meta.robots === "object" && meta.robots !== null && meta.robots.index === true);
  assert.ok(meta.openGraph?.images);
});

test("buildDynamicEventMetadata generates VIP guest metadata with noindex protection", () => {
  const meta = buildDynamicEventMetadata({
    slug: "mariana-rodrigo-2026",
    coupleName: "Mariana & Rodrigo",
    guestName: "Exma. Sra. Amina Patel",
    dateText: "24 de Outubro de 2026",
    venueName: "Polana Serena Hotel",
  });

  assert.match(String(meta.title), /Amina Patel/);
  // Protecção de privacidade para convidados VIP: noindex
  assert.ok(typeof meta.robots === "object" && meta.robots !== null && meta.robots.index === false);
  assert.ok(typeof meta.robots === "object" && meta.robots !== null && meta.robots.follow === false);
});
