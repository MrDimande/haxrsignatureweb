/**
 * Diagnóstico Brevo — distingue API key (site) vs MCP token (Cursor).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILE = resolve(import.meta.dirname, "..", ".env.local");

function loadKeys() {
  if (!existsSync(ENV_FILE)) throw new Error(".env.local não encontrado");
  const env = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i)] = t.slice(i + 1).trim();
  }

  function decode(raw) {
    if (!raw?.startsWith("eyJ")) return raw;
    try {
      return JSON.parse(Buffer.from(raw, "base64").toString("utf8")).api_key;
    } catch {
      return raw;
    }
  }

  return {
    apiKey: env.BREVO_API_KEY,
    mcpRaw: env.BREVO_MCP_TOKEN,
    mcpBearer: env.BREVO_MCP_TOKEN || env.BREVO_API_KEY,
    mcpDecoded: decode(env.BREVO_MCP_TOKEN),
  };
}

async function main() {
  const { apiKey, mcpRaw, mcpBearer, mcpDecoded } = loadKeys();
  if (!apiKey) throw new Error("BREVO_API_KEY em falta");

  if (mcpRaw?.startsWith("eyJ")) {
    console.log("OK   BREVO_MCP_TOKEN em Base64 (formato Brevo «Create MCP»)");
  }
  let fail = 0;

  const restApiKey = await fetch("https://api.brevo.com/v3/account", {
    headers: { accept: "application/json", "api-key": apiKey },
  });
  if (restApiKey.ok) {
    const a = await restApiKey.json();
    console.log("OK   REST api-key →", a.companyName || "conta");
  } else {
    fail++;
    console.log("FAIL REST api-key →", restApiKey.status);
  }

  const restBearer = await fetch("https://api.brevo.com/v3/account", {
    headers: { accept: "application/json", Authorization: `Bearer ${apiKey}` },
  });
  if (restBearer.status === 401) {
    console.log("OK   REST Bearer rejeitado (esperado — não é token Bearer)");
  } else {
    console.log("WARN REST Bearer →", restBearer.status);
  }

  const mcpProbe = await fetch("https://mcp.brevo.com/v1/brevo/mcp", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mcpBearer}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "haxr-diagnose", version: "1.0" },
      },
    }),
  });
  const mcpBody = await mcpProbe.text();
  if (mcpProbe.ok) {
    console.log("OK   MCP Bearer → token MCP válido");
  } else {
    console.log("INFO MCP Bearer (Base64) →", mcpProbe.status, mcpBody.slice(0, 60));
    console.log("     Normal com mcp-remote — o Cursor faz OAuth no browser.");
    if (mcpDecoded) {
      const restMcpKey = await fetch("https://api.brevo.com/v3/account", {
        headers: { accept: "application/json", "api-key": mcpDecoded },
      });
      if (restMcpKey.ok) {
        console.log("OK   chave interna do Base64 MCP também válida em REST");
      }
    }
    if (!mcpRaw?.startsWith("eyJ")) {
      fail++;
      console.log("FAIL BREVO_MCP_TOKEN deve ser o Base64 do painel Brevo (eyJ...)");
    }
  }

  if (fail) process.exit(1);
  console.log("\nCursor: npm run brevo:fix-mcp → reiniciar Cursor");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
