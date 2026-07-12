/**
 * PR.3 — verificação pós-038 em produção (read-only).
 */
import { withProductionClient, queryOne } from "./lib/pr3-production-db.mjs";

const row = await withProductionClient(async (client) => {
  const provisionFn = await queryOne(
    client,
    `SELECT p.proname,
            pg_get_userbyid(p.proowner) AS owner,
            p.prosecdef AS security_definer,
            has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
            has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
            has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute
     FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname='provision_client_operational_event'`,
  );

  const serviceGrants = await client.query(
    `SELECT table_name,
            has_table_privilege('service_role', 'public.'||table_name, 'SELECT') AS sel,
            has_table_privilege('service_role', 'public.'||table_name, 'INSERT') AS ins
     FROM information_schema.tables
     WHERE table_schema='public'
       AND table_name IN ('profiles','client_events','event_members','event_onboarding_snapshots')
     ORDER BY table_name`,
  );

  return { provisionFn, serviceGrants: serviceGrants.rows };
});

const pass =
  row.provisionFn?.security_definer === true &&
  row.provisionFn?.service_role_execute === true &&
  row.provisionFn?.authenticated_execute === false &&
  row.provisionFn?.anon_execute === false &&
  row.serviceGrants.every((g) => g.sel && g.ins);

console.log(JSON.stringify({ pass, post038: row }, null, 2));
process.exit(pass ? 0 : 1);
