import fs from "node:fs";

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error("missing env file");
  process.exit(1);
}

const text = fs.readFileSync(file, "utf8");
const get = (name) => {
  const m = text.match(new RegExp(`^${name}=(.*)$`, "m"));
  return (m?.[1] || "").replace(/^"|"$/g, "").trim();
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
let host = "";
try {
  host = new URL(url).hostname;
} catch {
  host = "";
}
const ref = host.split(".")[0] || "";

console.log(`supabaseHost=${host || "(empty)"}`);
console.log(`projectRef=${ref || "(empty)"}`);
console.log(`isClone=${ref === "rkkxfrwtmsqzpnbkshnd"}`);
console.log(`isProd=${ref === "oxsrdmydlqyvnueedgtl"}`);
console.log(`proxySecretPresent=${Boolean(get("HAXR_EDITION_PROXY_SECRET"))}`);
console.log(`requireAuth=${get("HAXR_REQUIRE_EDITION_PROXY_AUTH") || "(unset)"}`);

try {
  fs.unlinkSync(file);
} catch {
  // ignore
}
