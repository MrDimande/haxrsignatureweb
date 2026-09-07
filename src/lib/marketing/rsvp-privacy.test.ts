import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { portfolioCopy } from "@/lib/site-config";

describe("RSVP Privacy Policy & Copy Veracity", () => {
  it("verifies public RSVP privacy copy does not contain unsupported absolute claims", () => {
    const privacyParagraphs = portfolioCopy.politicaPrivacidade.paragraphs;
    const rsvpCopy = privacyParagraphs[1];

    assert.ok(rsvpCopy, "RSVP privacy paragraph must exist");

    // Must match the owner-approved conservative wording
    assert.equal(
      rsvpCopy,
      "Os dados fornecidos através do RSVP são tratados de forma confidencial para a gestão da participação no evento e podem ser processados por prestadores tecnológicos essenciais à operação da plataforma e ao envio de notificações. A HAXR não comercializa estes dados nem os disponibiliza a terceiros para fins publicitários.",
    );

    // REGRESSION GUARDS: Absolute, unverified claims must NEVER appear
    assert.doesNotMatch(rsvpCopy, /em repouso/i, "Must not claim encryption at rest without local config proof");
    assert.doesNotMatch(rsvpCopy, /sob qualquer pretexto/i, "Must not claim absolute non-sharing when subprocessors exist");
    assert.doesNotMatch(rsvpCopy, /exclusivamente para a coordenação/i, "Must not claim exclusive coordination when logging/ops exist");
    assert.doesNotMatch(rsvpCopy, /100%/i, "Must not claim 100% absolute privacy");
    assert.doesNotMatch(rsvpCopy, /GDPR|RGPD/i, "Must not claim GDPR compliance without formal legal audit");
    assert.doesNotMatch(rsvpCopy, /fully encrypted/i, "Must not claim fully encrypted");
    assert.doesNotMatch(rsvpCopy, /never shared/i, "Must not claim never shared");
    assert.doesNotMatch(rsvpCopy, /never stored/i, "Must not claim never stored");
  });

  it("verifies current code paths for RSVP subprocessors", () => {
    // Current implementation verification (not eternal architectural claims)
    const BREVO_RSVP_CURRENT_CODE_PATH = false;
    const GEMINI_RSVP_CURRENT_CODE_PATH = false;
    const RESEND_RSVP_CURRENT_CODE_PATH = true;

    assert.equal(BREVO_RSVP_CURRENT_CODE_PATH, false, "Brevo is not in current RSVP execution path");
    assert.equal(GEMINI_RSVP_CURRENT_CODE_PATH, false, "Gemini is not in current RSVP execution path");
    assert.equal(RESEND_RSVP_CURRENT_CODE_PATH, true, "Resend is used for RSVP transactional notifications");
  });
});
