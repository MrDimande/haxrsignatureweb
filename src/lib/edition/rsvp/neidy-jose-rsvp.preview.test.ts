import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { execSync } from "node:child_process";
import { Pool } from "pg";
import { resolveEditionSlug, getEditionEventBinding } from "../registry";
import { validateEditionRsvpBody } from "./validate";

describe("Neidy & José RSVP Preview Integration & Deduplication", () => {
  let pool: Pool;
  const eventId = "aed4c44a-49f8-4e9e-8b6b-cd5b3c701102";
  const testGuestName = "__test_nj_rsvp__ Convidado Isolado";
  const testGuestNormalized = "test_nj_rsvp_convidado_isolado";
  const testEmail = "test.nj.rsvp@haxrsignature.local";
  const testPhone = "+258849999999";

  before(async () => {
    // Obter ligação estritamente à base de dados de PREVIEW
    const cs = execSync("npx neon connection-string br-wandering-sea-ayc6ti1v", {
      encoding: "utf8",
    }).trim();
    pool = new Pool({ connectionString: cs, ssl: { rejectUnauthorized: false } });

    // Limpar qualquer teste anterior residual apenas da Preview
    await pool.query(
      "DELETE FROM public.guests WHERE event_id = $1 AND name_normalized = $2",
      [eventId, testGuestNormalized]
    );
  });

  after(async () => {
    if (pool) {
      await pool.query(
        "DELETE FROM public.guests WHERE event_id = $1 AND name_normalized = $2",
        [eventId, testGuestNormalized]
      );
      await pool.end();
    }
  });

  it("1. Resolves slug and binds to EDITION_EVENT_NEIDY_JOSE_ID", () => {
    process.env.EDITION_EVENT_NEIDY_JOSE_ID = eventId;
    try {
      const resolved = resolveEditionSlug("neidyejosewedding");
      assert.equal(resolved, "neidyejosewedding");

      const binding = getEditionEventBinding("neidyejosewedding");
      assert.ok(binding);
      assert.equal(binding.eventId, eventId);
      assert.equal(binding.slug, "neidyejosewedding");
    } finally {
      delete process.env.EDITION_EVENT_NEIDY_JOSE_ID;
    }
  });

  it("2. Rejects invalid payloads safely", () => {
    const emptyName = validateEditionRsvpBody({
      slug: "neidyejosewedding",
      name: "",
      attending: true,
      guests: 1,
    });
    assert.equal(emptyName.ok, false);

    const invalidParty = validateEditionRsvpBody({
      slug: "neidyejosewedding",
      name: "Convidado Teste",
      attending: true,
      guests: 99,
    });
    assert.equal(invalidParty.ok, false);
  });

  it("3. Traps honeypot triggers safely without persistence", () => {
    const honeypot = validateEditionRsvpBody({
      slug: "neidyejosewedding",
      name: "Spam Bot",
      attending: true,
      guests: 1,
      honeypot: "http://spam.link",
    });
    assert.equal(honeypot.ok, true);
    assert.equal(honeypot.honeypot, true);
  });

  it("4. Persists valid RSVP and enforces deduplication via submit_edition_rsvp in Preview DB", async () => {
    // Primeira submissão (Criação)
    const { rows: firstRows } = await pool.query(
      `SELECT public.submit_edition_rsvp($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) AS result`,
      [
        eventId,
        testGuestName,
        testGuestNormalized,
        true, // attending
        2,    // partySize (convidado + 1)
        "neidyejosewedding",
        testEmail,
        testPhone,
        "Mensagem de teste de casamento",
        "",   // size
        true, // dressCodeConfirmed
      ]
    );

    const firstResult = firstRows[0]?.result;
    assert.ok(firstResult, "firstResult must exist");
    assert.equal(firstResult.ok, true);
    assert.equal(firstResult.created, true, "First submission must create a new guest");
    assert.equal(firstResult.status, "confirmed");
    assert.equal(firstResult.partySize, 2);
    assert.equal(firstResult.plusOnes, 1);
    const guestId = firstResult.guestId;
    assert.ok(guestId, "Guest ID must be generated");

    // Verificar na tabela guests da Preview
    const { rows: checkFirst } = await pool.query(
      "SELECT id, name, status, plus_ones, guest_source FROM public.guests WHERE event_id = $1 AND name_normalized = $2",
      [eventId, testGuestNormalized]
    );
    assert.equal(checkFirst.length, 1, "Exactly one guest record must exist");
    assert.equal(checkFirst[0].id, guestId);
    assert.equal(checkFirst[0].status, "confirmed");
    assert.equal(checkFirst[0].plus_ones, 1);
    assert.equal(checkFirst[0].guest_source, "edition_rsvp");

    // Segunda submissão repetida com alteração (Deduplicação / Actualização)
    const { rows: secondRows } = await pool.query(
      `SELECT public.submit_edition_rsvp($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) AS result`,
      [
        eventId,
        testGuestName,
        testGuestNormalized,
        true, // attending
        1,    // partySize alterado para 1
        "neidyejosewedding",
        testEmail,
        testPhone,
        "Mensagem actualizada",
        "",
        true,
      ]
    );

    const secondResult = secondRows[0]?.result;
    assert.ok(secondResult, "secondResult must exist");
    assert.equal(secondResult.ok, true);
    assert.equal(secondResult.created, false, "Second submission must update existing guest, not create new");
    assert.equal(secondResult.guestId, guestId, "Guest ID must remain identical");
    assert.equal(secondResult.partySize, 1);
    assert.equal(secondResult.plusOnes, 0);

    // Assegurar que continua a existir EXACTAMENTE UM registo (Zero duplicações)
    const { rows: checkSecond } = await pool.query(
      "SELECT count(*) as total FROM public.guests WHERE event_id = $1 AND name_normalized = $2",
      [eventId, testGuestNormalized]
    );
    assert.equal(checkSecond[0].total, "1", "Duplicate protection: count must remain exactly 1");
  });
});
