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

console.log("URL:", env.NEXT_PUBLIC_SUPABASE_URL);
console.log("ANON (first 30):", env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 30));
console.log("SERVICE (first 30):", env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 30));
