/**
 * Garante listas Brevo HAXR para captura de contactos.
 * Não envia emails. Não cria campanhas. Não altera .env.local.
 *
 * Uso: npm run brevo:ensure-lists
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const BREVO_API = "https://api.brevo.com/v3";
const FOLDER_NAME = "HAXR Signature";

/** @type {Array<{ envKey: string; name: string; matchers: RegExp[]; createIfMissing: boolean }>} */
const LIST_DEFINITIONS = [
  {
    envKey: "BREVO_LIST_LEADS",
    name: "Leads HAXR",
    matchers: [/^leads?\s*haxr$/i, /haxr\s*[·•]\s*leads/i, /leads?\s*website/i],
    createIfMissing: false,
  },
  {
    envKey: "BREVO_LIST_NEWSLETTER",
    name: "Newsletter HAXR",
    matchers: [/^newsletter\s*haxr$/i, /haxr\s*[·•]\s*newsletter/i],
    createIfMissing: false,
  },
  {
    envKey: "BREVO_SUPPLIERS_LIST_ID",
    name: "Fornecedores HAXR",
    matchers: [/^fornecedores\s*haxr$/i, /haxr\s*[·•]\s*fornecedores/i],
    createIfMissing: true,
  },
  {
    envKey: "BREVO_CLIENTS_LIST_ID",
    name: "Clientes HAXR",
    matchers: [/^clientes\s*haxr$/i, /haxr\s*[·•]\s*clientes/i],
    createIfMissing: true,
  },
  {
    envKey: "BREVO_MARKETING_LIST_ID",
    name: "Marketing HAXR",
    matchers: [/^marketing\s*haxr$/i, /haxr\s*[·•]\s*marketing/i],
    createIfMissing: true,
  },
];

function loadEnvLocal() {
  const values = {};
  if (!existsSync(ENV_FILE)) return values;
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

function normalizeName(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * @param {string} apiKey
 * @param {string} path
 * @param {RequestInit} [init]
 */
async function brevoRequest(apiKey, path, init = {}) {
  const response = await fetch(`${BREVO_API}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
      ...init.headers,
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { ok: response.ok, status: response.status, data };
}

/** @param {string} apiKey */
async function fetchAllLists(apiKey) {
  const lists = [];
  const limit = 50;
  let offset = 0;

  for (;;) {
    const res = await brevoRequest(
      apiKey,
      `/contacts/lists?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) {
      throw new Error(
        `Falha ao listar listas Brevo (${res.status}): ${JSON.stringify(res.data)}`
      );
    }
    const batch = res.data?.lists ?? [];
    lists.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return lists;
}

/** @param {string} apiKey */
async function fetchAllFolders(apiKey) {
  const folders = [];
  const limit = 50;
  let offset = 0;

  for (;;) {
    const res = await brevoRequest(
      apiKey,
      `/contacts/folders?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) {
      throw new Error(
        `Falha ao listar pastas Brevo (${res.status}): ${JSON.stringify(res.data)}`
      );
    }
    const batch = res.data?.folders ?? [];
    folders.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return folders;
}

/**
 * @param {Array<{ id: number; name?: string }>} lists
 * @param {{ name: string; matchers: RegExp[] }} def
 * @param {string | undefined} configuredId
 */
function findList(lists, def, configuredId) {
  if (configuredId) {
    const id = Number(configuredId);
    if (Number.isFinite(id) && id > 0) {
      const byId = lists.find((list) => list.id === id);
      if (byId) return { list: byId, match: "env-id" };
    }
  }

  const canonical = normalizeName(def.name);
  const byExactName = lists.find(
    (list) => normalizeName(list.name ?? "") === canonical
  );
  if (byExactName) return { list: byExactName, match: "exact-name" };

  for (const pattern of def.matchers) {
    const byPattern = lists.find((list) => pattern.test(list.name ?? ""));
    if (byPattern) return { list: byPattern, match: "pattern" };
  }

  return { list: null, match: null };
}

/** @param {string} apiKey */
async function ensureFolder(apiKey) {
  const folders = await fetchAllFolders(apiKey);
  const target = normalizeName(FOLDER_NAME);
  const existing = folders.find(
    (folder) => normalizeName(folder.name ?? "") === target
  );
  if (existing) {
    return { folder: existing, created: false };
  }

  const res = await brevoRequest(apiKey, "/contacts/folders", {
    method: "POST",
    body: JSON.stringify({ name: FOLDER_NAME }),
  });

  if (!res.ok) {
    throw new Error(
      `Falha ao criar pasta "${FOLDER_NAME}" (${res.status}): ${JSON.stringify(res.data)}`
    );
  }

  return { folder: { id: res.data.id, name: FOLDER_NAME }, created: true };
}

/**
 * @param {string} apiKey
 * @param {number} folderId
 * @param {string} name
 */
async function createList(apiKey, folderId, name) {
  const res = await brevoRequest(apiKey, "/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ folderId, name }),
  });

  if (!res.ok) {
    const message = JSON.stringify(res.data);
    if (
      res.status === 400 &&
      /already exists|duplicate|exist/i.test(message)
    ) {
      throw new Error(
        `Lista "${name}" já existe no Brevo — reexecutar após sincronizar cache.`
      );
    }
    throw new Error(
      `Falha ao criar lista "${name}" (${res.status}): ${message}`
    );
  }

  return { id: res.data.id, name };
}

async function main() {
  const env = loadEnvLocal();
  const apiKey = env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    console.error("ERRO: BREVO_API_KEY em falta no .env.local");
    process.exit(1);
  }

  console.log("\n=== HAXR · Brevo ensure lists ===\n");
  console.log("Modo: apenas leitura/criação de listas — sem emails, sem campanhas.\n");

  const account = await brevoRequest(apiKey, "/account");
  if (!account.ok) {
    const msg = JSON.stringify(account.data ?? "");
    if (account.status === 401 && /IP address|authorised_ips/i.test(msg)) {
      console.error(
        "ERRO: IP não autorizado no Brevo. Adicionar em Security → Authorised IPs."
      );
      process.exit(1);
    }
    console.error(`ERRO: API Brevo (${account.status}): ${msg}`);
    process.exit(1);
  }

  const accountLabel =
    account.data?.companyName ?? account.data?.email ?? "conta OK";
  console.log(`Conta Brevo: ${accountLabel}`);

  const lists = await fetchAllLists(apiKey);
  console.log(`\nListas existentes (${lists.length}):`);
  for (const list of lists.sort((a, b) => a.id - b.id)) {
    console.log(
      `  ${list.id} · ${list.name} (${list.totalSubscribers ?? list.uniqueSubscribers ?? 0} contactos)`
    );
  }

  const { folder, created: folderCreated } = await ensureFolder(apiKey);
  console.log(
    `\nPasta: ${folder.name} (id ${folder.id})${folderCreated ? " — criada agora" : " — reutilizada"}`
  );

  const found = [];
  const created = [];
  const resolved = {};

  for (const def of LIST_DEFINITIONS) {
    const configuredId = env[def.envKey]?.trim();
    let result = findList(lists, def, configuredId);

    if (!result.list && def.createIfMissing) {
      const duplicate = lists.some(
        (list) => normalizeName(list.name ?? "") === normalizeName(def.name)
      );
      if (duplicate) {
        result = findList(lists, def, undefined);
      } else {
        const newList = await createList(apiKey, folder.id, def.name);
        const entry = { id: newList.id, name: def.name };
        lists.push(entry);
        created.push({ ...def, id: newList.id });
        result = { list: entry, match: "created" };
        console.log(`\nCriada: ${def.name} → id ${newList.id}`);
      }
    }

    if (!result.list) {
      console.error(`\nERRO: Lista não encontrada: ${def.name} (${def.envKey})`);
      process.exit(1);
    }

    resolved[def.envKey] = result.list.id;
    found.push({
      envKey: def.envKey,
      expectedName: def.name,
      id: result.list.id,
      actualName: result.list.name,
      match: result.match,
      configuredId: configuredId || null,
    });
  }

  console.log("\n--- Resumo ---\n");
  console.log("Encontradas / confirmadas:");
  for (const item of found) {
    const nameNote =
      normalizeName(item.actualName ?? "") === normalizeName(item.expectedName)
        ? item.actualName
        : `${item.actualName} (esperado: ${item.expectedName})`;
    console.log(
      `  ${item.envKey}=${item.id} · ${nameNote} [${item.match}]`
    );
  }

  if (created.length) {
    console.log("\nCriadas nesta execução:");
    for (const item of created) {
      console.log(`  ${item.name} → id ${item.id}`);
    }
  } else {
    console.log("\nCriadas nesta execução: nenhuma");
  }

  console.log("\n--- Sugestão .env.local (copiar manualmente) ---\n");
  console.log("# Listas Brevo — HAXR contact capture");
  for (const def of LIST_DEFINITIONS) {
    console.log(`${def.envKey}=${resolved[def.envKey]}`);
  }

  console.log("\n--- Confirmação ---");
  console.log("✓ Nenhum email enviado");
  console.log("✓ Nenhuma campanha criada ou disparada");
  console.log("✓ BREVO_API_KEY não foi impressa");
  console.log("✓ .env.local não foi alterado automaticamente\n");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
