/**
 * Phase D preview smoke — simulates performOnboardingSync against local dev server.
 * Preview only. Never production.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ONBOARDING_KEYS } from "../src/lib/auth/onboarding-storage.ts";
import { ONBOARDING_COMPLETE_KEY } from "../src/lib/auth/onboarding-status.ts";
import { performOnboardingSync } from "../src/lib/auth/onboarding-sync.ts";

const PREVIEW_REF = "uxleigndoomoezwsxlan";
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:3001";

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

if (!env.NEXT_PUBLIC_SUPABASE_URL?.includes(PREVIEW_REF)) {
  console.error(`ABORT: preview ref ${PREVIEW_REF} required.`);
  process.exit(1);
}

if (env.NEXT_PUBLIC_SUPABASE_URL.includes("oxsrdmydlqyvnueedgtl")) {
  console.error("ABORT: production ref detected.");
  process.exit(1);
}

class MemoryStorage {
  data = new Map();

  getItem(key) {
    return this.data.get(key) ?? null;
  }

  setItem(key, value) {
    this.data.set(key, value);
  }

  removeItem(key) {
    this.data.delete(key);
  }
}

function seedOnboarding(store) {
  store.setItem(ONBOARDING_KEYS.role, "noiva");
  store.setItem(ONBOARDING_KEYS.bride, "Staging");
  store.setItem(ONBOARDING_KEYS.groom, "A");
  store.setItem(ONBOARDING_KEYS.date, "2026-12-20");
  store.setItem(ONBOARDING_KEYS.location, "Maputo");
  store.setItem(ONBOARDING_KEYS.guests, "150");
  store.setItem(ONBOARDING_KEYS.budget, "150000");
  store.setItem(ONBOARDING_KEYS.phone, "840000000");
  store.setItem(ONBOARDING_COMPLETE_KEY, "true");
}

const nodeSha256 = (material) =>
  createHash("sha256").update(material, "utf8").digest("hex");

const store = new MemoryStorage();
seedOnboarding(store);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: "staging-a@haxrsignature.test",
  password: "HaxrStaging#2026!",
});

if (authError) {
  console.error("AUTH FAIL:", authError.message);
  process.exit(1);
}

const token = auth.session?.access_token;
if (!token) {
  console.error("AUTH FAIL: missing access token");
  process.exit(1);
}

let postCount = 0;
const redirects = [];

const first = await performOnboardingSync({
  store,
  hashFingerprint: nodeSha256,
  fetchFn: async (url, init) => {
    postCount += 1;
    return fetch(`${API_BASE}${url}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
  },
  redirect: (url) => redirects.push(url),
});

const second = await performOnboardingSync({
  store,
  hashFingerprint: nodeSha256,
  fetchFn: async () => {
    postCount += 1;
    return new Response("{}", { status: 500 });
  },
});

const pass =
  (first.action === "success" || first.action === "redirect") &&
  second.action === "skipped" &&
  second.reason === "already_synced" &&
  postCount === 1 &&
  store.getItem("haxr_onboarding_synced_event_id");

console.log(
  JSON.stringify(
    {
      pass,
      first,
      second,
      postCount,
      redirects,
      syncedEventId: store.getItem("haxr_onboarding_synced_event_id"),
      syncStatus: store.getItem("haxr_onboarding_sync_status"),
      fingerprint: store.getItem("haxr_onboarding_local_fingerprint"),
    },
    null,
    2,
  ),
);

process.exit(pass ? 0 : 1);
