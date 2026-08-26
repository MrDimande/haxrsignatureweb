import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Pool } = pg;
const MIGRATION_BRANCH = "migration/supabase-to-neon";
const BRANCH_ALIAS = "https://haxrsignatureweb-git-migration-ce8d3d-alberto-dimandes-projects.vercel.app";

const isMigrationPreview =
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === MIGRATION_BRANCH;

if (!isMigrationPreview) {
  console.info("[neon-auth-canary] skipped outside migration Preview");
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("[neon-auth-canary] DATABASE_URL missing");

const vercelConfig = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
);
const authUrl = vercelConfig?.env?.NEON_AUTH_BASE_URL?.trim();
if (!authUrl) {
  throw new Error("[neon-auth-canary] NEON_AUTH_BASE_URL missing from vercel.json");
}

const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const email = `neon-auth-canary-${suffix}@haxr.invalid`;
const password = `Haxr!${randomBytes(24).toString("base64url")}`;
const name = "HAXR Neon Auth Canary";
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 10_000,
});

let userId = null;

function requestHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    Origin: BRANCH_ALIAS,
    Referer: `${BRANCH_ALIAS}/sign-in`,
    "x-neon-auth-middleware": "true",
    ...extra,
  };
}

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const combined = headers.get("set-cookie");
  return combined ? [combined] : [];
}

function buildCookieHeader(headers) {
  return getSetCookies(headers)
    .map((value) => value.split(";", 1)[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function authRequest(path, { method = "POST", body, cookie } = {}) {
  const response = await fetch(`${authUrl.replace(/\/$/, "")}/${path}`, {
    method,
    headers: requestHeaders(cookie ? { Cookie: cookie } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
    cache: "no-store",
  });
  return { response, payload: await readPayload(response) };
}

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM public.profiles
       WHERE id IN (SELECT id FROM neon_auth."user" WHERE lower(email)=lower($1))`,
      [email],
    );
    await client.query(
      `DELETE FROM app_private.legacy_auth_identity
       WHERE new_user_id IN (SELECT id FROM neon_auth."user" WHERE lower(email)=lower($1))`,
      [email],
    );
    await client.query(
      `DELETE FROM neon_auth.verification
       WHERE lower(identifier) LIKE '%' || lower($1) || '%'`,
      [email],
    );
    await client.query(`DELETE FROM neon_auth."user" WHERE lower(email)=lower($1)`, [email]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  const signUp = await authRequest("sign-up/email", {
    body: { email, password, name },
  });
  if (!signUp.response.ok) {
    throw new Error(
      `[neon-auth-canary] sign-up failed HTTP ${signUp.response.status}: ${JSON.stringify(signUp.payload)}`,
    );
  }

  const created = await pool.query(
    `SELECT u.id::text AS id, u."emailVerified" AS email_verified,
            EXISTS (
              SELECT 1 FROM neon_auth.account a
              WHERE a."userId"=u.id AND a."providerId"='credential'
            ) AS credential_account
     FROM neon_auth."user" u
     WHERE lower(u.email)=lower($1)
     LIMIT 1`,
    [email],
  );
  const row = created.rows[0];
  if (!row?.id || row.credential_account !== true) {
    throw new Error("[neon-auth-canary] sign-up did not create user + credential account");
  }
  userId = row.id;

  await pool.query(
    `UPDATE neon_auth."user"
     SET "emailVerified"=true, "updatedAt"=now()
     WHERE id=$1::uuid`,
    [userId],
  );

  const signIn = await authRequest("sign-in/email", {
    body: { email, password, rememberMe: false },
  });
  if (!signIn.response.ok) {
    throw new Error(
      `[neon-auth-canary] sign-in failed HTTP ${signIn.response.status}: ${JSON.stringify(signIn.payload)}`,
    );
  }

  const cookieHeader = buildCookieHeader(signIn.response.headers);
  if (!cookieHeader) throw new Error("[neon-auth-canary] sign-in returned no session cookie");

  const sessionCount = await pool.query(
    `SELECT count(*)::int AS count FROM neon_auth.session WHERE "userId"=$1::uuid`,
    [userId],
  );
  if ((sessionCount.rows[0]?.count ?? 0) < 1) {
    throw new Error("[neon-auth-canary] sign-in created no database session");
  }

  const getSession = await authRequest("get-session", {
    method: "GET",
    cookie: cookieHeader,
  });
  if (!getSession.response.ok) {
    throw new Error(`[neon-auth-canary] get-session failed HTTP ${getSession.response.status}`);
  }

  const sessionUser = getSession.payload?.user;
  if (
    !sessionUser ||
    sessionUser.id !== userId ||
    sessionUser.email !== email ||
    sessionUser.emailVerified !== true
  ) {
    throw new Error("[neon-auth-canary] get-session returned unexpected identity");
  }

  const signOut = await authRequest("sign-out", {
    body: {},
    cookie: cookieHeader,
  });
  if (!signOut.response.ok) {
    throw new Error(`[neon-auth-canary] sign-out failed HTTP ${signOut.response.status}`);
  }

  const sessionsAfterSignOut = await pool.query(
    `SELECT count(*)::int AS count FROM neon_auth.session WHERE "userId"=$1::uuid`,
    [userId],
  );

  console.info(
    "[neon-auth-canary]",
    JSON.stringify({
      signUp: true,
      credentialAccount: true,
      signIn: true,
      getSession: true,
      signOut: true,
      sessionsAfterSignOut: sessionsAfterSignOut.rows[0]?.count ?? null,
    }),
  );
} finally {
  const cleanupUserId = userId;
  try {
    await cleanup();
    const residual = await pool.query(
      `SELECT
         (SELECT count(*)::int FROM neon_auth."user" WHERE lower(email)=lower($1)) AS users,
         (SELECT count(*)::int FROM neon_auth.verification WHERE lower(identifier) LIKE '%' || lower($1) || '%') AS verifications,
         CASE WHEN $2::uuid IS NULL THEN 0 ELSE
           (SELECT count(*)::int FROM neon_auth.session WHERE "userId"=$2::uuid)
         END AS sessions,
         CASE WHEN $2::uuid IS NULL THEN 0 ELSE
           (SELECT count(*)::int FROM neon_auth.account WHERE "userId"=$2::uuid)
         END AS accounts`,
      [email, cleanupUserId],
    );
    const counts = residual.rows[0];
    console.info("[neon-auth-canary-cleanup]", JSON.stringify(counts));
    if (
      counts?.users !== 0 ||
      counts?.verifications !== 0 ||
      counts?.sessions !== 0 ||
      counts?.accounts !== 0
    ) {
      throw new Error("[neon-auth-canary] cleanup left residual auth data");
    }
  } finally {
    await pool.end();
  }
}
