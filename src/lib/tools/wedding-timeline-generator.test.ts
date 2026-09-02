import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateWeddingTimeline,
  timeToMinutes,
  minutesToTime,
  formatTimelineWhatsAppMessage,
  type TimelineGeneratorInput,
} from "./wedding-timeline-generator";

test("timeToMinutes and minutesToTime conversions are reciprocal", () => {
  assert.equal(timeToMinutes("14:00"), 840);
  assert.equal(timeToMinutes("08:30"), 510);
  assert.equal(minutesToTime(840), "14:00");
  assert.equal(minutesToTime(510), "08:30");
});

test("generateWeddingTimeline calculates milestones for standard 14:00 ceremony", () => {
  const input: TimelineGeneratorInput = {
    ceremonyTime: "14:00",
    format: "afternoon_evening",
    bridalPartyCount: "bride_plus_4",
    locationType: "separate_locations",
    hasFirstLook: false,
    partyDurationHours: 6,
    coupleNames: "Jéssica & Samuel",
    weddingDate: "18 de Outubro de 2025",
  };

  const result = generateWeddingTimeline(input);

  assert.ok(result.milestones.length >= 15);
  // Cerimónia deve estar exatamente às 14:00
  const ceremony = result.milestones.find((m) => m.title.includes("Entrada Nupcial"));
  assert.ok(ceremony);
  assert.equal(ceremony?.time, "14:00");

  // Início da maquilhagem deve ser antes das 10h da manhã
  const prep = result.milestones.find((m) => m.title.includes("Início de Cabelo"));
  assert.ok(prep);
  assert.ok(prep.timeMinutes < timeToMinutes("10:00"));

  // Corte do bolo deve existir
  const cake = result.milestones.find((m) => m.title.includes("Corte do Bolo"));
  assert.ok(cake);
  assert.ok(cake.timeMinutes > timeToMinutes("20:00"));
});

test("includes First Look milestone when toggle is active", () => {
  const input: TimelineGeneratorInput = {
    ceremonyTime: "15:00",
    format: "afternoon_evening",
    bridalPartyCount: "bride_plus_2",
    locationType: "same_venue",
    hasFirstLook: true,
    partyDurationHours: 6,
  };

  const result = generateWeddingTimeline(input);
  const firstLook = result.milestones.find((m) => m.title.includes("First Look"));
  assert.ok(firstLook, "Deve incluir o marco de First Look quando ativado");
  assert.ok(firstLook.timeMinutes < timeToMinutes("15:00"));
});

test("formats valid WhatsApp message containing couple names and milestones", () => {
  const input: TimelineGeneratorInput = {
    ceremonyTime: "14:00",
    format: "afternoon_evening",
    bridalPartyCount: "bride_plus_2",
    locationType: "same_venue",
    hasFirstLook: false,
    partyDurationHours: 6,
    coupleNames: "Vânia & Fabião",
    weddingDate: "20 de Dezembro de 2025",
  };

  const result = generateWeddingTimeline(input);
  const message = formatTimelineWhatsAppMessage(result);

  assert.ok(message.includes("VÂNIA & FABIÃO"));
  assert.ok(message.includes("14:00"));
  assert.ok(message.includes("HAXR SIGNATURE"));
  assert.ok(message.includes("Corte do Bolo"));
});
