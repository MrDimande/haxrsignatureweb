/**
 * Apply clone-only GRANT/REVOKE patch for submit_edition_rsvp.
 * Requires env already set by interactive wrapper.
 * Abort on production. Single transaction. No DROP/CREATE.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildPgClientConfig,
  resolveLibpqDatabaseUrl,
  withClient,
  queryOne,
  queryRows,
} from "./lib/pr4-db.mjs";

const CLONE_REF = "rkkxfrwtmsqzpnbkshnd";
const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
const SIG8 =
  "public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)";
const SIG11 =
  "public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)";

function fail(msg) {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

function out(k, v) {
  console.log(`${k}=${v}`);
}

async function privilegeMatrix(client, label) {
  const roles = ["anon", "authenticated", "service_role", "postgres"];
  for (const sig of [SIG8, SIG11]) {
    for (const role of roles) {
      const row = await queryOne(
        client,
        `select has_function_privilege($1, $2::regprocedure, 'EXECUTE') as ok`,
        [role, sig],
      );
      out(`HAS_EXECUTE_${label}`, `${sig}|${role}|${Boolean(row?.ok)}`);
    }
    const pub = await queryOne(
      client,
      `select exists (
         select 1
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace,
         lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
         where n.nspname='public' and p.proname='submit_edition_rsvp'
           and p.oid = $1::regprocedure
           and a.grantee = 0
           and a.privilege_type = 'EXECUTE'
       ) as ok`,
      [sig],
    );
    out(`PUBLIC_ACL_${label}`, `${sig}|${Boolean(pub?.ok)}`);
  }
}

async function main() {
  const url = resolveLibpqDatabaseUrl();
  if (url.includes(PRODUCTION_REF)) fail("ABORT: production");
  if (!url.includes(CLONE_REF)) fail("ABORT: not clone");
  if (new URL(url).password) fail("ABORT: password in URL");
  buildPgClientConfig();

  const patchPath = resolve(
    process.cwd(),
    "scripts/pr4/sql/clone_harden_submit_edition_rsvp_grants.sql",
  );
  const sql = readFileSync(patchPath, "utf8");
  // Strip BEGIN/COMMIT — we drive the transaction in code for ON_ERROR_STOP semantics.
  const body = sql
    .replace(/^\s*BEGIN\s*;/im, "")
    .replace(/\s*COMMIT\s*;\s*$/im, "")
    .trim();

  const started = new Date().toISOString();
  out("APPLY_STARTED_AT", started);
  out("CLONE_REF", CLONE_REF);

  await withClient(async (client) => {
    const id = await queryOne(
      client,
      `select current_database() as db, current_user as u`,
    );
    out("current_database", id.db);
    out("current_user", id.u);
    if (String(id.u).includes(PRODUCTION_REF)) fail("ABORT: prod identity");

    const beforeCounts = await queryOne(
      client,
      `select
         (select count(*)::int from public.events) as events,
         (select count(*)::int from public.guests) as guests,
         (select count(*)::int from supabase_migrations.schema_migrations) as migrations`,
    );
    out("BEFORE_EVENTS", beforeCounts.events);
    out("BEFORE_GUESTS", beforeCounts.guests);
    out("BEFORE_MIGRATIONS", beforeCounts.migrations);

    await privilegeMatrix(client, "BEFORE");

    try {
      await client.query("BEGIN");
      await client.query(body);
      await client.query("COMMIT");
      out("APPLY_RESULT", "COMMITTED");
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore
      }
      out("APPLY_RESULT", "ROLLED_BACK");
      fail(String(err?.message ?? err));
    }

    await privilegeMatrix(client, "AFTER");

    const afterCounts = await queryOne(
      client,
      `select
         (select count(*)::int from public.events) as events,
         (select count(*)::int from public.guests) as guests,
         (select count(*)::int from supabase_migrations.schema_migrations) as migrations`,
    );
    out("AFTER_EVENTS", afterCounts.events);
    out("AFTER_GUESTS", afterCounts.guests);
    out("AFTER_MIGRATIONS", afterCounts.migrations);
    out(
      "COUNTS_UNCHANGED",
      beforeCounts.events === afterCounts.events &&
        beforeCounts.guests === afterCounts.guests &&
        beforeCounts.migrations === afterCounts.migrations,
    );

    const stillThere = await queryRows(
      client,
      `select pg_get_function_identity_arguments(p.oid) as args, p.pronargs as nargs
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname='public' and p.proname='submit_edition_rsvp'
       order by p.pronargs`,
    );
    out("OVERLOADS_AFTER", stillThere.map((r) => `${r.nargs}:${r.args}`).join(" || "));
  });

  out("productionTouched", false);
  out("APPLY_FINISHED_AT", new Date().toISOString());
}

main().catch((err) => {
  console.error("FAIL", String(err?.message ?? err));
  process.exit(1);
});
