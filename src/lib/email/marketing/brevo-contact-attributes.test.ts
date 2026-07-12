import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBrevoMarketingContactAttributes,
  isBrevoPhoneValidationError,
  omitBrevoSmsAttribute,
  resolveBrevoSmsAttribute,
} from "@/lib/email/marketing/brevo-contact-attributes";
import type { HAXRLead } from "@/lib/email/email-types";

const baseLead: HAXRLead = {
  email: "lead@example.com",
  firstName: "Ana",
  lastName: "Silva",
  segment: "casais_noivos",
  source: "quote_request",
  consentStatus: "granted",
};

describe("resolveBrevoSmsAttribute", () => {
  it("aceita E.164 plausível", () => {
    assert.equal(resolveBrevoSmsAttribute("+351912345678"), "+351912345678");
  });

  it("ignora formato local sem indicativo", () => {
    assert.equal(resolveBrevoSmsAttribute("912345678"), undefined);
  });

  it("ignora string vazia", () => {
    assert.equal(resolveBrevoSmsAttribute(""), undefined);
  });
});

describe("buildBrevoMarketingContactAttributes", () => {
  it("não inclui SMS quando telefone é local", () => {
    const attrs = buildBrevoMarketingContactAttributes({
      ...baseLead,
      phone: "923 456 789",
    });
    assert.equal(attrs.SMS, undefined);
    assert.equal(attrs.FIRSTNAME, "Ana");
  });

  it("inclui SMS quando E.164 válido", () => {
    const attrs = buildBrevoMarketingContactAttributes({
      ...baseLead,
      phone: "+351912345678",
    });
    assert.equal(attrs.SMS, "+351912345678");
  });
});

describe("isBrevoPhoneValidationError", () => {
  it("deteta erro de telefone Brevo", () => {
    assert.equal(isBrevoPhoneValidationError("Invalid phone number"), true);
    assert.equal(isBrevoPhoneValidationError("duplicate"), false);
  });
});

describe("omitBrevoSmsAttribute", () => {
  it("remove SMS mantendo restantes atributos", () => {
    const trimmed = omitBrevoSmsAttribute({
      FIRSTNAME: "Ana",
      SMS: "+351912345678",
      SEGMENT: "newsletter",
    });
    assert.deepEqual(trimmed, {
      FIRSTNAME: "Ana",
      SEGMENT: "newsletter",
    });
  });
});
