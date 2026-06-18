/**
 * Corrige ~/.cursor/mcp.json conforme docs Brevo MCP:
 * https://developers.brevo.com/docs/getting-started
 *
 * - BREVO_MCP_TOKEN = Base64 do painel («Create MCP server API key»)
 * - Header: Authorization: Bearer ${BREVO_MCP_TOKEN}
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_FILE = resolve(ROOT, ".env.local");
const MCP_FILE = resolve(homedir(), ".cursor", "mcp.json");

function parseEnv(file) {
  const values = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    values[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim();
  }
  return values;
}

function describeMcpToken(raw) {
  const value = raw?.trim();
  if (!value) return null;
  if (value.startsWith("eyJ")) {
    try {
      const decoded = JSON.parse(
        Buffer.from(value, "base64").toString("utf8")
      ).api_key;
      if (typeof decoded === "string" && decoded.startsWith("xkeysib-")) {
        return { token: value, suffix: decoded.slice(-8) };
      }
    } catch {
      /* não é JSON base64 — usar como está */
    }
  }
  return { token: value, suffix: value.slice(-8) };
}

const env = parseEnv(ENV_FILE);
const mcpInfo =
  describeMcpToken(env.BREVO_MCP_TOKEN) ||
  (env.BREVO_API_KEY?.trim()
    ? { token: env.BREVO_API_KEY.trim(), suffix: env.BREVO_API_KEY.trim().slice(-8) }
    : null);
const mcpToken = mcpInfo?.token;

if (!mcpToken) {
  console.error("Defina BREVO_MCP_TOKEN ou BREVO_API_KEY em .env.local");
  process.exit(1);
}

if (!existsSync(MCP_FILE)) {
  console.error("mcp.json não encontrado:", MCP_FILE);
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(MCP_FILE, "utf8"));
cfg.mcpServers.brevo = {
  command: "npx",
  args: [
    "-y",
    "mcp-remote@latest",
    "https://mcp.brevo.com/v1/brevo/mcp",
    "--header",
    "Authorization: Bearer ${BREVO_MCP_TOKEN}",
  ],
  env: {
    BREVO_MCP_TOKEN: mcpToken,
  },
};

writeFileSync(MCP_FILE, JSON.stringify(cfg, null, 2));

if (env.BREVO_MCP_TOKEN?.trim().startsWith("eyJ")) {
  console.log("Base64 MCP detectado — token enviado como no painel Brevo");
}

const lockDir = resolve(process.env.LOCALAPPDATA ?? homedir(), "mcp-remote");
if (existsSync(lockDir)) {
  try {
    rmSync(lockDir, { recursive: true, force: true });
    console.log("Lockfiles mcp-remote removidos");
  } catch {
    /* ignorar */
  }
}

console.log("OK mcp.json actualizado");
console.log(`Token MCP: ...${mcpInfo.suffix}`);
console.log("\nCorre: npm run brevo:diagnose");
console.log("Se FAIL MCP Bearer → criar chave com «Create MCP server API key» no Brevo");
