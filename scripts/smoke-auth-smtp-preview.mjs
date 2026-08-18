import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i);
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.development.local"),
};

const PREVIEW_REF = "uxleigndoomoezwsxlan";
const PROD_REF = "oxsrdmydlqyvnueedgtl";

function refFromUrl(url = "") {
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

const currentRef = refFromUrl(env.NEXT_PUBLIC_SUPABASE_URL);
const previewUrl = `https://${PREVIEW_REF}.supabase.co`;

console.log(
  JSON.stringify(
    {
      envRef: currentRef,
      hasResend: Boolean(env.RESEND_API_KEY),
      hasAnon: Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      siteUrl: env.NEXT_PUBLIC_SITE_URL ?? null,
      previewTarget: previewUrl,
      prodRef: PROD_REF,
    },
    null,
    2,
  ),
);

if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("MISSING_ANON_KEY");
  process.exit(1);
}

const supabaseUrl =
  currentRef === PREVIEW_REF
    ? env.NEXT_PUBLIC_SUPABASE_URL
    : previewUrl;

// If local .env points at production, we can only smoke preview if preview anon is same org —
// use current anon only when URL matches preview.
if (currentRef !== PREVIEW_REF) {
  console.log(
    JSON.stringify({
      smoke: "skipped",
      reason: "env_points_to_non_preview",
      envRef: currentRef,
    }),
  );
  process.exit(0);
}

const supabase = createClient(supabaseUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const testEmail = env.STAGING_TEST_EMAIL || "auth-smoke@haxrsignature.test";
const redirectTo = `${env.NEXT_PUBLIC_SITE_URL || "https://www.haxrsignature.com"}/auth/callback?next=%2Freset-password`;

const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
  redirectTo,
});

if (error) {
  console.log(JSON.stringify({ smoke: "failed", message: error.message }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      smoke: "ok",
      note: "resetPasswordForEmail accepted by Auth API (email may be silent if user absent)",
      redirectTo,
      testEmail,
    },
    null,
    2,
  ),
);
