/**
 * PR.3 — verificação RPCs 039–043 em produção (read-only).
 */
import { withProductionClient } from "./lib/pr3-production-db.mjs";

const RPCS = [
  "get_client_event_guests",
  "get_client_event_payments",
  "get_client_event_vendors",
  "get_client_event_checklist",
  "get_client_event_documents",
];

const rows = await withProductionClient(async (client) => {
  const result = await client.query(
    `SELECT p.proname,
            pg_get_userbyid(p.proowner) AS owner,
            p.prosecdef AS security_definer,
            has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute,
            has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
            has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute
     FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname = ANY($1::text[])
     ORDER BY p.proname`,
    [RPCS],
  );
  return result.rows;
});

const pass =
  rows.length === RPCS.length &&
  rows.every(
    (r) =>
      r.security_definer === true &&
      r.service_role_execute === true &&
      r.authenticated_execute === false &&
      r.anon_execute === false,
  );

console.log(JSON.stringify({ pass, rpcs: rows }, null, 2));
process.exit(pass ? 0 : 1);
