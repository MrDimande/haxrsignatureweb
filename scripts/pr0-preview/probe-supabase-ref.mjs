import { execFileSync } from "node:child_process";

const deployment = process.argv[2];
const path = process.argv[3] || "/";

if (!deployment) {
  console.error("usage: probe-supabase-ref.mjs <deployment-host> [path]");
  process.exit(2);
}

const out = execFileSync(
  "npx",
  ["vercel", "curl", "--deployment", deployment, "--yes", path],
  {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }
);

const clone = out.includes("rkkxfrwtmsqzpnbkshnd");
const prod = out.includes("oxsrdmydlqyvnueedgtl");
const uxlei = out.includes("uxleigndoomoezwsxlan");
const urls = [...new Set(out.match(/https:\/\/[a-z0-9]+\.supabase\.co/g) || [])];
const chunks = [...out.matchAll(/\/_next\/static\/[^"']+\.js/g)]
  .map((m) => m[0])
  .slice(0, 12);

console.log(`path=${path}`);
console.log(`len=${out.length}`);
console.log(`hasClone=${clone}`);
console.log(`hasProd=${prod}`);
console.log(`hasUxlei=${uxlei}`);
console.log(`supabaseUrls=${urls.join(",") || "(none)"}`);
console.log(`chunks=${chunks.join("|") || "(none)"}`);
