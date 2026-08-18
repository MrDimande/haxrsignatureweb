/**
 * Fase 1 — inventário read-only dos overloads submit_edition_rsvp no clone.
 * Requer PR4_DATABASE_URL (libpq, sem password) + PGPASSWORD.
 * Nunca imprime secrets. Abort em produção.
 */
import {
  buildPgClientConfig,
  resolveLibpqDatabaseUrl,
  withClient,
  queryOne,
  queryRows,
} from "./lib/pr4-db.mjs";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CLONE_REF = "rkkxfrwtmsqzpnbkshnd";
const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
const EXPECTED_USER = `postgres.${CLONE_REF}`;
const EXPECTED_HOST = "aws-0-eu-central-1.pooler.supabase.com";

function fail(msg) {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

function out(k, v) {
  console.log(`${k}=${v}`);
}

function verifyUrl() {
  const url = resolveLibpqDatabaseUrl();
  const parsed = new URL(url);
  if (url.includes(PRODUCTION_REF) || parsed.username.includes(PRODUCTION_REF)) {
    fail("ABORT: production detected");
  }
  if (!url.includes(CLONE_REF) || parsed.username !== EXPECTED_USER) {
    fail("ABORT: clone user/host mismatch");
  }
  if (parsed.hostname !== EXPECTED_HOST) fail("ABORT: unexpected host");
  if (parsed.password) fail("ABORT: password in URL");
  buildPgClientConfig();
  return true;
}

async function main() {
  verifyUrl();

  const inventory = await withClient(async (client) => {
    const identity = await queryOne(
      client,
      `select current_database() as db, current_user as db_user,
              session_user as session_user,
              current_setting('server_version', true) as server_version`,
    );
    if (String(identity?.db_user ?? "").includes(PRODUCTION_REF)) {
      fail("ABORT: session identity looks like production");
    }

    const counts = await queryOne(
      client,
      `select
         (select count(*)::int from public.events) as events_total,
         (select count(*)::int from public.guests) as guests_total`,
    );

    const migrationCount = await queryOne(
      client,
      `select count(*)::int as n from supabase_migrations.schema_migrations`,
    ).catch(() => ({ n: null }));

    const overloads = await queryRows(
      client,
      `select
         p.oid::bigint as oid,
         n.nspname as schema_name,
         p.proname as name,
         pg_get_function_identity_arguments(p.oid) as identity_args,
         pg_get_function_arguments(p.oid) as full_args,
         pg_get_function_result(p.oid) as result_type,
         pg_get_userbyid(p.proowner) as owner,
         p.prosecdef as security_definer,
         coalesce(p.proconfig::text, '') as config,
         p.pronargs as nargs,
         p.proargnames as arg_names,
         coalesce(p.proacl::text, '') as proacl,
         obj_description(p.oid, 'pg_proc') as comment,
         pg_get_functiondef(p.oid) as definition
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'submit_edition_rsvp'
       order by p.pronargs, p.oid`,
    );

    const roles = ["anon", "authenticated", "service_role", "postgres", "PUBLIC"];
    const privileges = [];
    for (const fn of overloads) {
      const sig = `${fn.schema_name}.${fn.name}(${fn.identity_args})`;
      for (const role of roles) {
        const row = await queryOne(
          client,
          `select
             has_function_privilege($1, $2::regprocedure, 'EXECUTE') as has_execute`,
          [role === "PUBLIC" ? "public" : role, sig],
        ).catch(async () => {
          // PUBLIC is not a role name for has_function_privilege — use aclcontains / DISTINCT approach
          return null;
        });

        let hasExecute = row?.has_execute;
        if (role === "PUBLIC") {
          const acl = await queryOne(
            client,
            `select
               exists (
                 select 1
                 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                 where a.grantee = 0
                   and a.privilege_type = 'EXECUTE'
               ) as has_execute
             from pg_proc p
             where p.oid = $1`,
            [fn.oid],
          );
          hasExecute = Boolean(acl?.has_execute);
        }

        // Explicit grant vs PUBLIC inheritance: check ACL entries for exact grantee oid
        const explicit = await queryOne(
          client,
          `select
             exists (
               select 1
               from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               join pg_roles r on r.oid = a.grantee
               where p.oid = $1
                 and r.rolname = $2
                 and a.privilege_type = 'EXECUTE'
             ) as explicit_execute,
             exists (
               select 1
               from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               where p.oid = $1
                 and a.grantee = 0
                 and a.privilege_type = 'EXECUTE'
             ) as public_execute
           from pg_proc p
           where p.oid = $1`,
          [fn.oid, role === "PUBLIC" ? "postgres" : role],
        ).catch(() => ({ explicit_execute: null, public_execute: null }));

        privileges.push({
          oid: fn.oid,
          signature: sig,
          identity_args: fn.identity_args,
          nargs: fn.nargs,
          role,
          has_execute: Boolean(hasExecute),
          explicit_execute:
            role === "PUBLIC"
              ? Boolean(explicit?.public_execute)
              : Boolean(explicit?.explicit_execute),
          public_acl_execute: Boolean(explicit?.public_execute),
        });
      }
    }

    // Dependencies referencing these oids
    const deps = await queryRows(
      client,
      `select d.objid::regclass::text as dependent,
              d.deptype::text as deptype,
              p.oid::bigint as function_oid,
              pg_get_function_identity_arguments(p.oid) as identity_args
       from pg_depend d
       join pg_proc p on p.oid = d.refobjid
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'submit_edition_rsvp'
         and d.deptype in ('n','a')
       limit 50`,
    ).catch(() => []);

    return {
      identity,
      counts,
      migrationCount: migrationCount?.n,
      overloads,
      privileges,
      deps,
    };
  });

  out("CLONE_REF", CLONE_REF);
  out("productionTouched", false);
  out("current_database", inventory.identity.db);
  out("current_user", inventory.identity.db_user);
  out("EVENTS_TOTAL", inventory.counts.events_total);
  out("GUESTS_TOTAL", inventory.counts.guests_total);
  out("MIGRATION_HISTORY_COUNT", inventory.migrationCount);
  out("OVERLOAD_COUNT", inventory.overloads.length);

  const slimOverloads = [];
  for (const fn of inventory.overloads) {
    out("OID", fn.oid);
    out("SCHEMA", fn.schema_name);
    out("NAME", fn.name);
    out("IDENTITY_ARGS", fn.identity_args);
    out("FULL_ARGS", fn.full_args);
    out("RESULT", fn.result_type);
    out("OWNER", fn.owner);
    out("SECURITY_DEFINER", fn.security_definer);
    out("CONFIG", fn.config || "(none)");
    out("NARGS", fn.nargs);
    out("ARG_NAMES", Array.isArray(fn.arg_names) ? fn.arg_names.join("|") : "");
    out("PROACL", fn.proacl || "(null=acldefault)");
    out("COMMENT", fn.comment || "(none)");
    out("DEFINITION_CHARS", String(fn.definition || "").length);
    // Do not dump full function body to console by default (noise); store in JSON artifact.
    slimOverloads.push({
      oid: fn.oid,
      schema: fn.schema_name,
      name: fn.name,
      identity_args: fn.identity_args,
      full_args: fn.full_args,
      result_type: fn.result_type,
      owner: fn.owner,
      security_definer: fn.security_definer,
      config: fn.config,
      nargs: fn.nargs,
      arg_names: fn.arg_names,
      proacl: fn.proacl,
      comment: fn.comment,
      definition: fn.definition,
    });
  }

  for (const p of inventory.privileges) {
    out(
      "PRIV",
      `nargs=${p.nargs}|role=${p.role}|has_execute=${p.has_execute}|explicit=${p.explicit_execute}|public_acl=${p.public_acl_execute}|sig=${p.identity_args}`,
    );
  }

  out("DEPENDENCY_COUNT", inventory.deps.length);
  for (const d of inventory.deps.slice(0, 20)) {
    out("DEP", `fn_oid=${d.function_oid}|${d.dependent}|type=${d.deptype}`);
  }

  const artifact = {
    capturedAt: new Date().toISOString(),
    cloneRef: CLONE_REF,
    productionTouched: false,
    identity: inventory.identity,
    counts: inventory.counts,
    migrationHistoryCount: inventory.migrationCount,
    overloads: slimOverloads.map((o) => ({
      ...o,
      // keep definition in artifact for review/rollback only
    })),
    privileges: inventory.privileges,
    deps: inventory.deps,
  };

  const outPath = resolve(
    process.cwd(),
    "backups/clone-rpc-grant-precheck.json",
  );
  writeFileSync(outPath, JSON.stringify(artifact, null, 2), "utf8");
  out("ARTIFACT", outPath);
  out("WRITE_OPERATIONS", "none");
}

main().catch((err) => {
  console.error("FAIL", String(err?.message ?? err));
  process.exit(1);
});
