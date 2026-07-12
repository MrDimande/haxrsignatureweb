/**
 * PR.4 — verificação pós-036 (Auth/RLS/trigger).
 */
import { queryOne, queryRows, withClient } from "./lib/pr4-db.mjs";

const TABLES = ["profiles", "client_events", "event_members", "event_onboarding_snapshots"];

const row = await withClient(async (client) => {
  const tables = await queryRows(
    client,
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name = ANY($1::text[])
     ORDER BY table_name`,
    [TABLES],
  );

  const rls = await queryRows(
    client,
    `SELECT c.relname, c.relrowsecurity
     FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relname = ANY($1::text[])
     ORDER BY c.relname`,
    [TABLES],
  );

  const policies = await queryRows(
    client,
    `SELECT tablename, COUNT(*)::int AS policy_count
     FROM pg_policies
     WHERE schemaname='public' AND tablename = ANY($1::text[])
     GROUP BY tablename
     ORDER BY tablename`,
    [TABLES],
  );

  const trigger = await queryOne(
    client,
    `SELECT COUNT(*)::int AS count
     FROM pg_trigger t
     JOIN pg_class c ON c.oid=t.tgrelid
     JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='auth' AND c.relname='users' AND t.tgname='on_auth_user_created'`,
  );

  const anonProfiles = await queryOne(
    client,
    `SELECT has_table_privilege('anon', 'public.profiles', 'SELECT') AS can_select,
            has_table_privilege('anon', 'public.profiles', 'INSERT') AS can_insert`,
  );

  return {
    tablesFound: tables.map((t) => t.table_name),
    rls,
    policies,
    authTrigger: trigger?.count === 1,
    anonProfiles,
    enums: await queryRows(
      client,
      `SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
       WHERE n.nspname='public' AND typname IN ('client_event_member_role','client_event_status','app_user_role')
       ORDER BY typname`,
    ),
  };
});

const pass =
  row.tablesFound.length === 4 &&
  row.rls.every((r) => r.relrowsecurity === true) &&
  row.authTrigger === true &&
  row.anonProfiles?.can_select === false &&
  row.anonProfiles?.can_insert === false &&
  row.enums.length === 3;

console.log(JSON.stringify({ pass, post036: row }, null, 2));
process.exit(pass ? 0 : 1);
