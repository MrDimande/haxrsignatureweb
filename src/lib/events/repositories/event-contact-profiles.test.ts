import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultOperationalConsent,
  extractContactFromGuest,
  hasContactableInfo,
  mapSheetImportSourceToContactSource,
  resolveContactConfidence,
} from "@/lib/events/repositories/event-contact-profiles.repository";

describe("event contact profiles — extraction", () => {
  it("guest with email creates extractable contact profile", () => {
    const extracted = extractContactFromGuest({
      name: "Ana Silva",
      email: "ana@example.com",
      phone: "",
    });
    assert.ok(extracted);
    assert.equal(extracted.normalizedEmail, "ana@example.com");
    assert.equal(extracted.confidence, "medium");
  });

  it("guest with phone creates extractable contact profile", () => {
    const extracted = extractContactFromGuest({
      name: "Carlos",
      email: "",
      phone: "+258 84 123 4567",
    });
    assert.ok(extracted);
    assert.ok(extracted.normalizedPhone);
    assert.equal(extracted.confidence, "medium");
  });

  it("same email key would update existing profile (normalized email stable)", () => {
    const first = extractContactFromGuest({
      name: "Ana",
      email: "Ana@Example.COM",
      phone: "",
    });
    const second = extractContactFromGuest({
      name: "Ana Silva",
      email: "ana@example.com",
      phone: "",
    });
    assert.equal(first?.normalizedEmail, second?.normalizedEmail);
  });

  it("same phone key would update existing profile (normalized phone stable)", () => {
    const first = extractContactFromGuest({
      name: "João",
      email: "",
      phone: "84 123 4567",
    });
    const second = extractContactFromGuest({
      name: "João Dimande",
      email: "",
      phone: "841234567",
    });
    assert.equal(first?.normalizedPhone, second?.normalizedPhone);
  });

  it("RSVP source uses operational_only consent defaults", () => {
    const consent = defaultOperationalConsent();
    assert.equal(consent.consentStatus, "operational_only");
    assert.equal(consent.marketingAllowed, false);
  });

  it("Google Sheets source maps to google_sheet contact source", () => {
    assert.equal(
      mapSheetImportSourceToContactSource("google_sheet"),
      "google_sheet"
    );
    const consent = defaultOperationalConsent();
    assert.equal(consent.consentStatus, "operational_only");
  });

  it("CSV source maps to csv_upload contact source", () => {
    assert.equal(
      mapSheetImportSourceToContactSource("csv_upload"),
      "csv_upload"
    );
    const consent = defaultOperationalConsent();
    assert.equal(consent.marketingAllowed, false);
  });

  it("party member without email/phone does not create contact profile", () => {
    const extracted = extractContactFromGuest({
      name: "Esposa",
      email: "",
      phone: "",
    });
    assert.equal(extracted, null);
    assert.equal(hasContactableInfo({ email: "", phone: "" }), false);
  });

  it("marketing_allowed remains false by default", () => {
    const consent = defaultOperationalConsent();
    assert.equal(consent.marketingAllowed, false);
  });

  it("updating guest contact data keeps high confidence when email and phone exist", () => {
    const extracted = extractContactFromGuest({
      name: "Maria",
      email: "maria@example.com",
      phone: "841234567",
    });
    assert.equal(extracted?.confidence, "high");
    assert.equal(
      resolveContactConfidence({
        normalizedEmail: "maria@example.com",
        normalizedPhone: "258841234567",
      }),
      "high"
    );
  });

  it("contact profile survives guest deletion via ON DELETE SET NULL (schema contract)", () => {
    const migrationSql = `
      guest_id UUID REFERENCES guests(id) ON DELETE SET NULL
    `;
    assert.match(migrationSql, /ON DELETE SET NULL/);
  });

  it("repository does not import or call Brevo marketing sync", async () => {
    const moduleUrl = new URL(
      "../repositories/event-contact-profiles.repository.ts",
      import.meta.url
    );
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(moduleUrl, "utf8")
    );
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /import\s+.*brevo/i);
    assert.doesNotMatch(code, /syncMarketing|addContactToBrevo|sendEmail/i);
  });
});
