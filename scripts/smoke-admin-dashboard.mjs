/**
 * Smoke: login admin + GET /admin/dashboard (preview local).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) return {};
  const entries = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    entries[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return entries;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env.development.local") };
const base = process.env.API_BASE_URL ?? "http://localhost:3001";
const email = env.ADMIN_EMAIL?.trim();
const password = env.ADMIN_PASSWORD?.trim();

if (!email || !password) {
  console.error("ABORT: ADMIN_EMAIL e ADMIN_PASSWORD necessários no .env.local");
  process.exit(1);
}

const loginRes = await fetch(`${base}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

if (!loginRes.ok) {
  console.error(JSON.stringify({ ok: false, step: "login", status: loginRes.status }));
  process.exit(1);
}

const cookie = loginRes.headers.getSetCookie?.() ?? [];
const cookieHeader = cookie.map((c) => c.split(";")[0]).join("; ");

const dashRes = await fetch(`${base}/admin/dashboard`, {
  headers: cookieHeader ? { Cookie: cookieHeader } : {},
  redirect: "manual",
});

const body = await dashRes.text();
const hasRuntimeError =
  body.includes("permission denied") ||
  body.includes("Application error") ||
  body.includes("Runtime Error");

console.log(
  JSON.stringify({
    ok: dashRes.status === 200 && !hasRuntimeError,
    status: dashRes.status,
    hasDashboardTitle: body.includes("Dashboard") || body.includes("Operações"),
    hasRuntimeError,
  }),
);

if (!dashRes.ok || hasRuntimeError) process.exit(1);
