import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HAXR_CLIENT_JOURNEYS,
  HAXR_REAL_WEDDINGS,
  getCelebrationsForCouple,
  getPublicRealWeddingSubtitle,
  getPublicRealWeddingTitle,
  getRealWeddingsForCategory,
} from "./vendor-real-weddings";

describe("HAXR Real Weddings & Privacy Governance", () => {
  it("only exposes owner-confirmed and verified public events in public query", () => {
    const venueWeddings = getRealWeddingsForCategory("venues", 10);
    assert.ok(venueWeddings.length > 0);

    for (const wedding of venueWeddings) {
      assert.equal(wedding.isPublic, true);
      assert.ok(
        wedding.evidenceStatus === "OWNER_CONFIRMED" ||
          wedding.evidenceStatus === "VERIFIED",
      );
    }
  });

  it("strictly excludes Polana Serena and uncorroborated cases from public rendering", () => {
    const polana = HAXR_REAL_WEDDINGS.find(
      (w) => w.id === "legacy-polana-serena" || w.venue.includes("Polana Serena"),
    );
    assert.ok(polana, "Polana record must exist in internal archive");
    assert.equal(polana?.isPublic, false, "Polana must NOT be public");
    assert.equal(polana?.evidenceStatus, "EVIDENCE_REQUIRED");

    const publicVenues = getRealWeddingsForCategory("venues", 100);
    const hasPolana = publicVenues.some((w) =>
      w.venue.toLowerCase().includes("polana"),
    );
    assert.equal(hasPolana, false, "Public real weddings must NEVER include Polana");
  });

  it("preserves internal couple association for Jessica Muege & Samuel Govene", () => {
    const jessicaJourney = HAXR_CLIENT_JOURNEYS.find(
      (j) => j.coupleId === "jessica-muege-samuel-govene",
    );
    assert.ok(jessicaJourney, "Journey for Jessica & Samuel must exist");
    assert.equal(jessicaJourney?.coupleNames, "Jéssica Muege & Samuel Govene");

    const celebrations = getCelebrationsForCouple("jessica-muege-samuel-govene");
    assert.equal(celebrations.length, 2, "Must link both Lobolo and Casamento");

    const lobolo = celebrations.find((c) => c.eventType === "Lobolo");
    const casamento = celebrations.find((c) => c.eventType === "Casamento");

    assert.ok(lobolo, "Must include Lobolo");
    assert.ok(casamento, "Must include Casamento");

    // Canonical internal facts strictly preserved
    assert.equal(lobolo?.venue, "Casa d'Artista Kutenga");
    assert.equal(lobolo?.eventDate, "2026-08-08");
    assert.equal(lobolo?.guestScale, "cerca de 300 convidados");
    assert.equal(lobolo?.evidenceStatus, "OWNER_CONFIRMED");

    assert.equal(casamento?.venue, "Vila Verde");
    assert.equal(casamento?.eventDate, "2026-08-15");
    assert.equal(casamento?.eventDateEnd, "2026-08-16");
    assert.equal(casamento?.guestScale, "mais de 300 convidados");
    assert.equal(casamento?.evidenceStatus, "OWNER_CONFIRMED");
  });

  it("enforces strict privacy classification without claiming blanket anonymisation", () => {
    const publicWeddings = HAXR_REAL_WEDDINGS.filter((w) => w.isPublic);

    for (const wedding of publicWeddings) {
      // Identity directly displayed must be false while permission is required
      assert.equal(
        wedding.clientIdentityDirectlyDisplayed,
        false,
        "Identity must not be directly displayed without written permission",
      );
      assert.equal(
        wedding.publicNameRemoved,
        true,
        "Public names must be removed from open marketing surfaces",
      );
      assert.equal(
        wedding.reidentificationRisk,
        "REQUIRES_REVIEW",
        "Must acknowledge re-identification risk requires review rather than claiming safe anonymity",
      );
      // Ensure no invalid claim of ANONYMOUS=true is made
      assert.equal("anonymous" in wedding, false);
    }
  });

  it("applies data minimisation to public representations when permission is pending", () => {
    const kutenga = HAXR_REAL_WEDDINGS.find((w) => w.id === "kutenga-lobolo");
    assert.ok(kutenga);

    // Public title minimised to prevent coupling exact venue + date + guest scale
    const publicTitle = getPublicRealWeddingTitle(kutenga);
    assert.equal(publicTitle, "Lobolo em Maputo — cerca de 300 convidados");
    assert.doesNotMatch(publicTitle, /Jéssica|Samuel/i);
    assert.doesNotMatch(publicTitle, /8 de Agosto|2026-08-08/);

    // Public subtitle minimised when permission is required
    const publicSubtitle = getPublicRealWeddingSubtitle(kutenga);
    assert.equal(publicSubtitle, "Maputo · cerca de 300 convidados");
    assert.doesNotMatch(publicSubtitle, /Kutenga/);
    assert.doesNotMatch(publicSubtitle, /Agosto/);
  });

  it("enforces canonical dates for Jessica & Samuel and prevents contradictory dates", () => {
    const JESSICA_SAMUEL_LOBOLO_DATE = "2026-08-08";
    const JESSICA_SAMUEL_WEDDING_START = "2026-08-15";
    const JESSICA_SAMUEL_WEDDING_END = "2026-08-16";

    const celebrations = getCelebrationsForCouple("jessica-muege-samuel-govene");
    const lobolo = celebrations.find((c) => c.eventType === "Lobolo");
    const casamento = celebrations.find((c) => c.eventType === "Casamento");

    assert.ok(lobolo);
    assert.ok(casamento);

    assert.equal(lobolo?.eventDate, JESSICA_SAMUEL_LOBOLO_DATE);
    assert.equal(casamento?.eventDate, JESSICA_SAMUEL_WEDDING_START);
    assert.equal(casamento?.eventDateEnd, JESSICA_SAMUEL_WEDDING_END);

    // REGRESSION GUARD: Ensure no contradictory dates (such as 17 de Outubro / 2026-10-17) exist
    for (const c of celebrations) {
      assert.doesNotMatch(c.date ?? "", /17 de Outubro|Outubro de 2026/);
      assert.notEqual(c.eventDate, "2026-10-17");
      if (c.eventDateEnd) {
        assert.notEqual(c.eventDateEnd, "2026-10-17");
      }
    }

    const vilaVerde = HAXR_REAL_WEDDINGS.find((w) => w.id === "vila-verde-casamento");
    assert.ok(vilaVerde);
    assert.equal(vilaVerde?.eventDate, JESSICA_SAMUEL_WEDDING_START);
    assert.equal(vilaVerde?.eventDateEnd, JESSICA_SAMUEL_WEDDING_END);
    assert.doesNotMatch(vilaVerde?.date ?? "", /Outubro/);
  });
});

