/**
 * Lista listas Brevo, cria atributos HAXR e actualiza .env.local
 * Uso: node scripts/brevo-bootstrap.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");

function loadEnv() {
  const values = {};
  if (!existsSync(ENV_FILE)) throw new Error(".env.local não encontrado");
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function saveListIds(leadsId, newsletterId) {
  let text = readFileSync(ENV_FILE, "utf8");
  const set = (key, val) => {
    const line = `${key}=${val}`;
    if (new RegExp(`^${key}=`, "m").test(text)) {
      text = text.replace(new RegExp(`^${key}=.*$`, "m"), line);
    } else {
      text += `\n${line}`;
    }
  };
  if (leadsId) set("BREVO_LIST_LEADS", String(leadsId));
  if (newsletterId) set("BREVO_LIST_NEWSLETTER", String(newsletterId));
  writeFileSync(ENV_FILE, text);
}

async function main() {
  const env = loadEnv();
  const apiKey = env.BREVO_API_KEY?.trim();
  if (!apiKey) throw new Error("BREVO_API_KEY em falta");

  const headers = {
    "api-key": apiKey,
    accept: "application/json",
    "content-type": "application/json",
  };

  const listsRes = await fetch(
    "https://api.brevo.com/v3/contacts/lists?limit=50",
    { headers }
  );
  const listsJson = await listsRes.json();
  const lists = listsJson.lists ?? [];

  console.log("\n=== Listas Brevo ===");
  for (const list of lists) {
    console.log(`  ${list.id} · ${list.name} (${list.totalSubscribers ?? 0} contactos)`);
  }

  const findList = (pattern) =>
    lists.find((l) => pattern.test(l.name ?? ""));

  let leadsList =
    findList(/lead/i) ??
    lists.find((l) => l.name?.includes("HAXR"));
  let newsletterList = findList(/newsletter/i);

  if (!leadsList && lists.length) {
    const created = await fetch("https://api.brevo.com/v3/contacts/lists", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "HAXR · Leads Website", folderId: 1 }),
    });
    const cj = await created.json();
    if (created.ok) {
      leadsList = { id: cj.id, name: "HAXR · Leads Website" };
      console.log(`\nCriada lista Leads: id ${cj.id}`);
    }
  }

  if (!newsletterList) {
    const created = await fetch("https://api.brevo.com/v3/contacts/lists", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "HAXR · Newsletter", folderId: 1 }),
    });
    const cj = await created.json();
    if (created.ok) {
      newsletterList = { id: cj.id, name: "HAXR · Newsletter" };
      console.log(`Criada lista Newsletter: id ${cj.id}`);
    } else {
      console.log("Newsletter create:", created.status, JSON.stringify(cj));
    }
  }

  const attrs = [
    "PROJECT_TYPE",
    "PACKAGE",
    "LEAD_SOURCE",
  "INQUIRY_ID",
  "MARKETING_OPT_IN",
  "CLIENT_INTENT",
];

  console.log("\n=== Atributos ===");
  for (const name of attrs) {
    const res = await fetch(
      `https://api.brevo.com/v3/contacts/attributes/normal/${name}`,
      { method: "POST", headers, body: JSON.stringify({ type: "text" }) }
    );
    if (res.ok || res.status === 400) {
      const body = await res.text();
      const ok = res.ok || body.includes("already");
      console.log(`  ${ok ? "OK" : "FAIL"} ${name}${res.ok ? "" : " (já existe)"}`);
    } else {
      console.log(`  FAIL ${name} — ${res.status} ${await res.text()}`);
    }
  }

  if (leadsList?.id || newsletterList?.id) {
    saveListIds(leadsList?.id, newsletterList?.id);
    console.log("\n.env.local actualizado:");
    if (leadsList?.id) console.log(`  BREVO_LIST_LEADS=${leadsList.id}`);
    if (newsletterList?.id)
      console.log(`  BREVO_LIST_NEWSLETTER=${newsletterList.id}`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
