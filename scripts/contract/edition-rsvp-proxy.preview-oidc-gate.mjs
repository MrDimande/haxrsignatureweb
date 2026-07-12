#!/usr/bin/env node
/**
 * Gate manual Preview — Edition proxy → Core via OIDC (testes seguros).
 * Usa bypass só para aceder ao Edition protegido; OIDC é server-side Edition→Core.
 */
import { resolveEditionProtectionBypass } from "./resolve-preview-bypass.mjs";

const editionBase =
  process.env.EDITION_BASE_URL?.replace(/\/$/, "") ||
  "https://projecto-haxrsignature-edition-lk17nhjyg.vercel.app";

const editionBypass = resolveEditionProtectionBypass(editionBase);
if (editionBase.includes("vercel.app") && !editionBypass) {
  console.error("Could not resolve Edition preview protection bypass.");
  process.exit(2);
}

/** @param {Record<string, unknown>} body */
async function postEdition(body) {
  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/json",
    "X-Forwarded-For": "203.0.113.77",
  };
  if (editionBypass) {
    headers["x-vercel-protection-bypass"] = editionBypass;
  }

  const response = await fetch(`${editionBase}/api/rsvp`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, json, raw: json };
}

async function main() {
  console.log(`Edition Preview OIDC gate — ${editionBase}/api/rsvp\n`);

  const missingName = await postEdition({ attending: true, guests: 1 });
  const missingNameOk =
    missingName.status === 400 &&
    missingName.json &&
    typeof missingName.json === "object" &&
    /** @type {Record<string, unknown>} */ (missingName.json).success === false &&
    /** @type {Record<string, unknown>} */ (missingName.json).error ===
      "Por favor, introduza o seu nome.";

  console.log(
    missingNameOk
      ? "✓ missing name → 400 + mensagem Core via proxy"
      : `✗ missing name (status ${missingName.status}, body ${JSON.stringify(missingName.json)})`
  );

  const farewellPhone = await postEdition({
    name: "Contract Preview",
    attending: true,
    guests: 1,
    slug: "despedida-de-solteira",
    email: "contract-preview@example.com",
  });
  const farewellPhoneOk =
    farewellPhone.status === 400 &&
    farewellPhone.json &&
    typeof farewellPhone.json === "object" &&
    /** @type {Record<string, unknown>} */ (farewellPhone.json).error ===
      "Indique o telefone para contacto (WhatsApp).";

  console.log(
    farewellPhoneOk
      ? "✓ farewell missing phone → 400 + mensagem Core via proxy"
      : `✗ farewell missing phone (status ${farewellPhone.status}, body ${JSON.stringify(farewellPhone.json)})`
  );

  const honeypot = await postEdition({
    name: "Bot",
    attending: true,
    guests: 1,
    honeypot: "spam-bot",
  });
  const honeypotOk =
    honeypot.status === 200 &&
    honeypot.json &&
    typeof honeypot.json === "object" &&
    /** @type {Record<string, unknown>} */ (honeypot.json).success === true;

  console.log(
    honeypotOk
      ? "✓ honeypot → 200 silencioso (sem persistência)"
      : `✗ honeypot (status ${honeypot.status}, body ${JSON.stringify(honeypot.json)})`
  );

  const passed = [missingNameOk, farewellPhoneOk, honeypotOk].filter(Boolean).length;
  console.log(`\n${passed}/3 preview OIDC gate checks passed`);

  if (passed !== 3) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
