/**
 * PR.4 — verificação RPCs 039–043 (grants + SECURITY DEFINER).
 */
import { queryRows, withClient } from "./lib/pr4-db.mjs";

const RPCS = [
  "get_client_event_guests",
  "get_client_event_payments",
  "get_client_event_vendors",
  "get_client_event_checklist",
  "get_client_event_documents",
];

const CLIENT_EVENT_ID = process.env.PR4_CLIENT_EVENT_ID?.trim();

const rows = await withClient(async (client) => {
  const meta = await queryRows(
    client,
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

  let calls = null;
  if (CLIENT_EVENT_ID) {
    calls = {};
    for (const rpc of RPCS) {
      const result = await client.query(`SELECT public.${rpc}($1::uuid) AS payload`, [
        CLIENT_EVENT_ID,
      ]);
      calls[rpc] = { ok: true, hasPayload: result.rows[0]?.payload != null };
    }
  }

  return { meta, calls };
});

const pass =
  rows.meta.length === RPCS.length &&
  rows.meta.every(
    (r) =>
      r.security_definer === true &&
      r.service_role_execute === true &&
      r.authenticated_execute === false &&
      r.anon_execute === false,
  );

console.log(
  JSON.stringify(
    {
      pass,
      rpcs: rows.meta,
      calls: rows.calls,
      note: CLIENT_EVENT_ID ? null : "Set PR4_CLIENT_EVENT_ID to exercise RPC payloads.",
    },
    null,
    2,
  ),
);
process.exit(pass ? 0 : 1);
