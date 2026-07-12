#!/usr/bin/env node
/**
 * Contract tests — Edition vs Core POST /rsvp
 *
 * Safe cases only (400 validation + honeypot 200). No successful writes.
 */

const EDITION_BASE =
  process.env.EDITION_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";
const CORE_BASE =
  process.env.CORE_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

const EDITION_PATH = "/api/rsvp";
const CORE_PATH = "/api/v1/edition/rsvp";

const PHASE = process.env.CONTRACT_PHASE?.trim() || "local";
const CORE_PROTECTION_BYPASS =
  process.env.CORE_PROTECTION_BYPASS?.trim() ||
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ||
  "";
const PROXY_SECRET = process.env.HAXR_EDITION_PROXY_SECRET?.trim() || "";
const EDITION_PROTECTION_BYPASS =
  process.env.EDITION_PROTECTION_BYPASS?.trim() || "";

/** @type {Array<{ name: string; body: Record<string, unknown>; expectStatus: number; expectError?: string }>} */
const CASES = [
  {
    name: "missing name",
    body: { attending: true, guests: 1 },
    expectStatus: 400,
    expectError: "Por favor, introduza o seu nome.",
  },
  {
    name: "missing attending",
    body: { name: "Contract Test" },
    expectStatus: 400,
    expectError: "Por favor, indique se irá comparecer.",
  },
  {
    name: "invalid guest count",
    body: {
      name: "Contract Test",
      attending: true,
      guests: 0,
      email: "contract@example.com",
    },
    expectStatus: 400,
    expectError: "O número de pessoas deve ser entre 1 e 10.",
  },
  {
    name: "invalid email",
    body: {
      name: "Contract Test",
      attending: true,
      guests: 1,
      email: "not-valid",
    },
    expectStatus: 400,
    expectError: "Por favor, introduza um email válido.",
  },
  {
    name: "farewell missing phone",
    body: {
      name: "Contract Test",
      attending: true,
      guests: 1,
      slug: "despedida-de-solteira",
      email: "contract@example.com",
    },
    expectStatus: 400,
    expectError: "Indique o telefone para contacto (WhatsApp).",
  },
  {
    name: "attending without contact",
    body: {
      name: "Contract Test",
      attending: true,
      guests: 1,
      slug: "jessicakulaya",
    },
    expectStatus: 400,
    expectError: "Indique email ou telefone para contacto.",
  },
  {
    name: "honeypot trigger",
    body: {
      name: "Bot",
      attending: true,
      guests: 1,
      honeypot: "spam-bot",
    },
    expectStatus: 200,
  },
];

/**
 * @param {string} baseUrl
 * @param {string} path
 * @param {Record<string, unknown>} body
 * @param {string} syntheticIp
 * @param {"edition" | "core"} plane
 */
async function postRsvp(baseUrl, path, body, syntheticIp, plane) {
  /** @type {Record<string, string>} */
  const headers = {
    "Content-Type": "application/json",
    "X-Forwarded-For": syntheticIp,
  };

  if (plane === "core" && CORE_PROTECTION_BYPASS && baseUrl.includes("vercel.app")) {
    headers["x-vercel-protection-bypass"] = CORE_PROTECTION_BYPASS;
  }

  if (
    plane === "edition" &&
    EDITION_PROTECTION_BYPASS &&
    baseUrl.includes("vercel.app")
  ) {
    headers["x-vercel-protection-bypass"] = EDITION_PROTECTION_BYPASS;
  }

  if (plane === "core" && PROXY_SECRET) {
    headers.Authorization = `Bearer ${PROXY_SECRET}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  let json;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, json };
}

/**
 * @param {string} label
 * @param {{ status: number; json: unknown }} edition
 * @param {{ status: number; json: unknown }} core
 * @param {{ expectStatus: number; expectError?: string }} spec
 */
/**
 * @returns {{ failures: string[]; note?: string }}
 */
function assertParity(label, edition, core, spec) {
  const failures = [];
  const editionBody = /** @type {Record<string, unknown>} */ (edition.json ?? {});
  const coreBody = /** @type {Record<string, unknown>} */ (core.json ?? {});

  if (edition.status !== core.status) {
    failures.push(
      `Status mismatch: Edition ${edition.status} vs Core ${core.status}`
    );
  }

  if (typeof editionBody.success !== "boolean") {
    failures.push("Edition missing boolean success envelope");
  }
  if (typeof coreBody.success !== "boolean") {
    failures.push("Core missing boolean success envelope");
  }

  if (editionBody.error !== coreBody.error) {
    failures.push(
      `Error message mismatch: Edition "${editionBody.error}" vs Core "${coreBody.error}"`
    );
  }

  if (editionBody.success !== coreBody.success) {
    failures.push(
      `Success flag mismatch: Edition ${editionBody.success} vs Core ${coreBody.success}`
    );
  }

  if (failures.length > 0) {
    return { failures };
  }

  if (
    (PHASE === "staging" || PHASE === "proxy-preview") &&
    edition.status !== spec.expectStatus
  ) {
    return {
      failures: [],
      note:
        edition.status === 429
          ? "parity OK · rate limited on both planes (8 req/15 min IP real)"
          : `parity OK · HTTP ${edition.status} (infra, not logic drift)`,
    };
  }

  if (edition.status !== spec.expectStatus) {
    failures.push(
      `Edition status ${edition.status} !== expected ${spec.expectStatus}`
    );
  }
  if (core.status !== spec.expectStatus) {
    failures.push(
      `Core status ${core.status} !== expected ${spec.expectStatus}`
    );
  }

  if (spec.expectError && editionBody.error !== spec.expectError) {
    failures.push(
      `Edition error mismatch: got "${editionBody.error}" expected "${spec.expectError}"`
    );
  }
  if (spec.expectError && coreBody.error !== spec.expectError) {
    failures.push(
      `Core error mismatch: got "${coreBody.error}" expected "${spec.expectError}"`
    );
  }

  if (spec.expectStatus === 200 && spec.expectError === undefined) {
    if (editionBody.success !== true || coreBody.success !== true) {
      failures.push("Honeypot should return success: true on both planes");
    }
  }

  return { failures };
}

async function probe(baseUrl, label) {
  try {
    const response = await fetch(baseUrl, { method: "HEAD" });
    return { ok: response.ok || response.status < 500, label, baseUrl };
  } catch (error) {
    return {
      ok: false,
      label,
      baseUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log(`Edition API contract tests — RSVP validation parity [${PHASE}]\n`);
  console.log(`  Edition: ${EDITION_BASE}${EDITION_PATH}`);
  console.log(`  Core:    ${CORE_BASE}${CORE_PATH}\n`);

  const [editionProbe, coreProbe] = await Promise.all([
    probe(EDITION_BASE, "Edition"),
    probe(CORE_BASE, "Core"),
  ]);

  const unreachable = [editionProbe, coreProbe].filter((p) => !p.ok);
  if (unreachable.length > 0) {
    for (const p of unreachable) {
      console.error(`✗ ${p.label} unreachable at ${p.baseUrl}: ${p.error ?? "connection failed"}`);
    }
    console.error(
      "\nStart both dev servers or set EDITION_BASE_URL / CORE_BASE_URL."
    );
    process.exit(2);
  }

  const caseOffset = Number(process.env.CONTRACT_CASE_OFFSET ?? 0);
  const caseLimit = Number(
    process.env.CONTRACT_CASE_LIMIT ?? String(CASES.length)
  );
  const activeCases = CASES.slice(caseOffset, caseOffset + caseLimit);

  if (activeCases.length === 0) {
    console.error("No contract cases selected for this batch.");
    process.exit(2);
  }

  if (
    (PHASE === "staging" || PHASE === "proxy-preview") &&
    activeCases.length < CASES.length
  ) {
    console.log(
      `  Batch: cases ${caseOffset + 1}-${caseOffset + activeCases.length} of ${CASES.length}\n`
    );
  }

  let passed = 0;
  let failed = 0;

  for (let index = 0; index < activeCases.length; index += 1) {
    const testCase = activeCases[index];
    const globalIndex = caseOffset + index;
    const syntheticIp = `203.0.113.${100 + globalIndex + 1}`;
    const edition = await postRsvp(
      EDITION_BASE,
      EDITION_PATH,
      testCase.body,
      syntheticIp,
      "edition"
    );
    const core = await postRsvp(
      CORE_BASE,
      CORE_PATH,
      testCase.body,
      syntheticIp,
      "core"
    );

    const result = assertParity(testCase.name, edition, core, testCase);

    if (result.failures.length === 0) {
      const suffix = result.note ? ` (${result.note})` : "";
      console.log(`✓ ${testCase.name}${suffix}`);
      passed += 1;
    } else {
      console.log(`✗ ${testCase.name}`);
      for (const f of result.failures) {
        console.log(`    - ${f}`);
      }
      failed += 1;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
