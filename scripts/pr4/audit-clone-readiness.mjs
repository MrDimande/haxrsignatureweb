/**
 * Read-only readiness audit for Supabase clone rkkxfrwtmsqzpnbkshnd.
 * Requires PR4_DATABASE_URL (libpq, no password) + PGPASSWORD.
 * Abort on production. Never prints secrets or connection strings.
 *
 * Usage (prefer interactive wrapper):
 *   pwsh -File scripts/pr4/run-clone-audit-interactive.ps1
 */
import {
  buildPgClientConfig,
  resolveLibpqDatabaseUrl,
  withClient,
  queryOne,
  queryRows,
} from "./lib/pr4-db.mjs";

const CLONE_REF = "rkkxfrwtmsqzpnbkshnd";
const PRODUCTION_REF = "oxsrdmydlqyvnueedgtl";
const EXPECTED_USER = `postgres.${CLONE_REF}`;
const EXPECTED_HOST = "aws-0-eu-central-1.pooler.supabase.com";
const EXPECTED_PORT = "5432";
const EXPECTED_DB = "postgres";

/** Params ordered as Core PR #7 / Edition PR #4 call them. */
const EXPECTED_RPC_ARGS = [
  "p_event_id",
  "p_name",
  "p_name_normalized",
  "p_attending",
  "p_party_size",
  "p_edition_slug",
  "p_email",
  "p_phone",
  "p_message_for_bride",
  "p_size",
  "p_dress_code_confirmed",
];

const REQUIRED_EVENT_COLS = [
  "id",
  "name",
  "is_active",
  "edition_registry_key",
  "find_seat_code",
];
const REQUIRED_GUEST_COLS = [
  "id",
  "event_id",
  "name",
  "name_normalized",
  "email",
  "phone",
  "status",
  "guest_source",
  "qr_token",
  "plus_ones",
  "guest_notes",
];

const MIGRATION_036_043 = ["036", "037", "038", "039", "040", "041", "042", "043"];

function fail(msg) {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

function out(key, value) {
  if (typeof value === "boolean" || typeof value === "number") {
    console.log(`${key}=${value}`);
    return;
  }
  if (value === null || value === undefined) {
    console.log(`${key}=`);
    return;
  }
  console.log(`${key}=${String(value)}`);
}

function verifyUrlIdentity() {
  const url = resolveLibpqDatabaseUrl();
  const parsed = new URL(url);

  if (url.includes(PRODUCTION_REF) || parsed.username.includes(PRODUCTION_REF)) {
    fail("ABORT: detecção de produção na URL");
  }
  if (!url.includes(CLONE_REF) || !parsed.username.includes(CLONE_REF)) {
    fail("ABORT: URL/user não pertencem ao clone");
  }
  if (parsed.password) {
    fail("ABORT: password embutida na URL");
  }
  if (parsed.username !== EXPECTED_USER) {
    fail(`ABORT: user esperado ${EXPECTED_USER}`);
  }
  if (parsed.hostname !== EXPECTED_HOST) {
    fail(`ABORT: host esperado ${EXPECTED_HOST}`);
  }
  if (parsed.port && parsed.port !== EXPECTED_PORT) {
    fail(`ABORT: porta esperada ${EXPECTED_PORT}`);
  }
  if (parsed.pathname.replace(/^\//, "") !== EXPECTED_DB) {
    fail(`ABORT: database esperada ${EXPECTED_DB}`);
  }

  return {
    host: parsed.hostname,
    user: parsed.username,
    port: parsed.port || EXPECTED_PORT,
    database: EXPECTED_DB,
    cloneRefInUrl: true,
    productionRefInUrl: false,
  };
}

async function main() {
  let urlIdentity;
  try {
    urlIdentity = verifyUrlIdentity();
    buildPgClientConfig();
  } catch (err) {
    fail(String(err?.message ?? err));
  }

  out("CLONE_REF", CLONE_REF);
  out("PRODUCTION_REF_BLOCKED", PRODUCTION_REF);
  out("URL_HOST_OK", urlIdentity.host === EXPECTED_HOST);
  out("URL_USER_OK", urlIdentity.user === EXPECTED_USER);
  out("URL_NO_PASSWORD", true);
  out("URL_NO_PRODUCTION_REF", true);

  const result = await withClient(async (client) => {
    const identity = await queryOne(
      client,
      `select current_database() as db,
              current_user as db_user,
              session_user as session_user,
              inet_server_addr()::text as server_addr,
              current_setting('server_version', true) as server_version`,
    );

    // Soft identity: pooler may not echo project ref in current_user for postgres role path.
    const dbUser = String(identity?.db_user ?? "");
    const identityLooksProd =
      dbUser.includes(PRODUCTION_REF) ||
      String(identity?.db ?? "").includes(PRODUCTION_REF);
    if (identityLooksProd) {
      fail("ABORT: identidade de sessão sugere produção");
    }

    const eventsExists = Boolean(
      (await queryOne(client, `select to_regclass('public.events') is not null as ok`))
        ?.ok,
    );
    const guestsExists = Boolean(
      (await queryOne(client, `select to_regclass('public.guests') is not null as ok`))
        ?.ok,
    );

    const rpcRows = await queryRows(
      client,
      `select
         p.oid::regprocedure::text as signature,
         pg_get_function_identity_arguments(p.oid) as args,
         p.prosecdef as security_definer,
         pg_get_userbyid(p.proowner) as owner,
         p.pronargs as nargs
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'submit_edition_rsvp'
       order by p.oid`,
    );

    const rpcArgsNamed = await queryRows(
      client,
      `select
         p.oid::bigint as oid,
         p.oid::regprocedure::text as signature,
         p.proargnames as arg_names,
         pg_get_function_identity_arguments(p.oid) as identity_args,
         pg_get_function_arguments(p.oid) as full_args,
         pg_get_function_result(p.oid) as result_type,
         p.pronargs as nargs,
         p.prosecdef as security_definer,
         pg_get_userbyid(p.proowner) as owner,
         coalesce(p.proacl::text, '') as proacl
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = 'submit_edition_rsvp'
       order by p.pronargs, p.oid`,
    );

    // Effective privileges via has_function_privilege + PUBLIC ACL (types-only sigs).
    const SIG8 =
      "public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)";
    const SIG11 =
      "public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)";
    const effectivePrivs = [];
    for (const sig of [SIG8, SIG11]) {
      for (const role of ["anon", "authenticated", "service_role", "postgres"]) {
        const row = await queryOne(
          client,
          `select has_function_privilege($1, $2::regprocedure, 'EXECUTE') as ok`,
          [role, sig],
        );
        effectivePrivs.push({
          sig,
          role,
          has_execute: Boolean(row?.ok),
        });
      }
      const pub = await queryOne(
        client,
        `select exists (
           select 1
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace,
           lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
           where n.nspname = 'public'
             and p.proname = 'submit_edition_rsvp'
             and p.oid = $1::regprocedure
             and a.grantee = 0
             and a.privilege_type = 'EXECUTE'
         ) as ok`,
        [sig],
      );
      effectivePrivs.push({
        sig,
        role: "PUBLIC",
        has_execute: Boolean(pub?.ok),
      });
    }

    // Keep information_schema snapshot for diagnostics only (not decisive).
    const rpcGrants = await queryRows(
      client,
      `select r.grantee::text as grantee, r.privilege_type::text as privilege_type
       from information_schema.routine_privileges r
       where r.specific_schema = 'public'
         and r.routine_name = 'submit_edition_rsvp'`,
    );

    const eventsRls = await queryOne(
      client,
      `select c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = 'events'`,
    );
    const guestsRls = await queryOne(
      client,
      `select c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = 'guests'`,
    );

    const policies = await queryRows(
      client,
      `select schemaname, tablename, policyname, permissive, roles::text as roles,
              cmd, qual is not null as has_using, with_check is not null as has_check
       from pg_policies
       where schemaname = 'public' and tablename in ('events','guests')
       order by tablename, policyname`,
    );

    const tableGrants = await queryRows(
      client,
      `select table_name, grantee,
              string_agg(privilege_type, ',' order by privilege_type) as privs
       from information_schema.role_table_grants
       where table_schema = 'public'
         and table_name in ('events','guests')
         and grantee in ('anon','authenticated','service_role','postgres')
       group by table_name, grantee
       order by table_name, grantee`,
    );

    const eventCols = await queryRows(
      client,
      `select column_name, data_type, is_nullable
       from information_schema.columns
       where table_schema='public' and table_name='events'
       order by ordinal_position`,
    );
    const guestCols = await queryRows(
      client,
      `select column_name, data_type, is_nullable
       from information_schema.columns
       where table_schema='public' and table_name='guests'
       order by ordinal_position`,
    );

    const indexes = await queryRows(
      client,
      `select tablename, indexname, indexdef
       from pg_indexes
       where schemaname='public' and tablename in ('events','guests')
       order by tablename, indexname`,
    );

    const constraints = await queryRows(
      client,
      `select tc.table_name, tc.constraint_name, tc.constraint_type,
              string_agg(kcu.column_name, ',' order by kcu.ordinal_position) as cols
       from information_schema.table_constraints tc
       left join information_schema.key_column_usage kcu
         on kcu.constraint_name = tc.constraint_name
        and kcu.table_schema = tc.table_schema
        and kcu.table_name = tc.table_name
       where tc.table_schema='public'
         and tc.table_name in ('events','guests')
       group by tc.table_name, tc.constraint_name, tc.constraint_type
       order by tc.table_name, tc.constraint_type, tc.constraint_name`,
    );

    let migrationHistory = [];
    try {
      migrationHistory = await queryRows(
        client,
        `select version::text as version, name::text as name
         from supabase_migrations.schema_migrations
         order by version`,
      );
    } catch {
      migrationHistory = [];
    }

    const clientAppObjects = await queryOne(
      client,
      `select
         to_regclass('public.profiles') is not null as profiles,
         to_regclass('public.client_events') is not null as client_events,
         to_regclass('public.event_members') is not null as event_members,
         to_regclass('public.event_onboarding_snapshots') is not null as event_onboarding_snapshots,
         to_regprocedure('public.provision_client_operational_event(uuid)') is not null
           as provision_rpc`,
    );

    const eventCounts = eventsExists
      ? await queryOne(
          client,
          `select
             count(*)::int as events_total,
             count(*) filter (where is_active)::int as events_active,
             count(*) filter (where coalesce(edition_registry_key,'') <> '')::int as with_registry
           from public.events`,
        )
      : { events_total: 0, events_active: 0, with_registry: 0 };

    const guestCounts = guestsExists
      ? await queryOne(
          client,
          `select
             count(*)::int as guests_total,
             count(*) filter (where guest_source::text = 'edition_rsvp')::int as edition_rsvp_guests
           from public.guests`,
        )
      : { guests_total: 0, edition_rsvp_guests: 0 };

    const protectedLike = eventsExists
      ? await queryRows(
          client,
          `select id::text as id,
                  left(coalesce(name,''), 80) as name,
                  coalesce(edition_registry_key,'') as registry_key,
                  is_active,
                  case when coalesce(find_seat_code,'') = '' then 'EMPTY' else 'SET' end as find_seat,
                  (select count(*)::int from public.guests g where g.event_id = e.id) as guest_count
           from public.events e
           where name ilike '%jessica%'
              or name ilike '%samuel%'
              or coalesce(edition_registry_key,'') = 'traditional-wedding'
           order by guest_count desc, e.created_at desc nulls last
           limit 20`,
        )
      : [];

    const safeSyntheticCandidates = eventsExists
      ? await queryRows(
          client,
          `select id::text as id,
                  left(coalesce(name,''), 80) as name,
                  coalesce(edition_registry_key,'') as registry_key,
                  is_active,
                  case when coalesce(find_seat_code,'') = '' then 'EMPTY' else 'SET' end as find_seat,
                  (select count(*)::int from public.guests g where g.event_id = e.id) as guest_count
           from public.events e
           where name ilike '%PR0%'
              or name ilike '%synthetic%'
              or name ilike '%clone test%'
              or name ilike '%preview integration%'
           order by e.created_at desc nulls last
           limit 10`,
        )
      : [];

    const emptySafeCandidates = eventsExists
      ? await queryRows(
          client,
          `select id::text as id,
                  left(coalesce(name,''), 80) as name,
                  coalesce(edition_registry_key,'') as registry_key,
                  is_active,
                  case when coalesce(find_seat_code,'') = '' then 'EMPTY' else 'SET' end as find_seat,
                  (select count(*)::int from public.guests g where g.event_id = e.id) as guest_count
           from public.events e
           where is_active = true
             and coalesce(find_seat_code,'') = ''
             and (select count(*) from public.guests g where g.event_id = e.id) = 0
             and name not ilike '%jessica%'
             and name not ilike '%samuel%'
           order by e.created_at desc nulls last
           limit 10`,
        )
      : [];

    const publicTables = await queryRows(
      client,
      `select table_name
       from information_schema.tables
       where table_schema='public' and table_type='BASE TABLE'
       order by table_name`,
    );

    return {
      identity,
      eventsExists,
      guestsExists,
      rpcRows,
      rpcArgsNamed,
      effectivePrivs,
      rpcGrants,
      eventsRls,
      guestsRls,
      policies,
      tableGrants,
      eventColNames: eventCols.map((c) => c.column_name),
      guestColNames: guestCols.map((c) => c.column_name),
      indexes,
      constraints,
      migrationHistory,
      clientAppObjects,
      eventCounts,
      guestCounts,
      protectedLike,
      safeSyntheticCandidates,
      emptySafeCandidates,
      publicTableCount: publicTables.length,
    };
  });

  // --- evaluations ---
  const missingEventCols = REQUIRED_EVENT_COLS.filter(
    (c) => !result.eventColNames.includes(c),
  );
  const missingGuestCols = REQUIRED_GUEST_COLS.filter(
    (c) => !result.guestColNames.includes(c),
  );
  const requiredColumnsPresent =
    missingEventCols.length === 0 && missingGuestCols.length === 0;

  const submitEditionRsvpPresent = result.rpcRows.length > 0;

  const primaryFull =
    result.rpcArgsNamed.find((r) => {
      const names = Array.isArray(r.arg_names) ? r.arg_names.filter(Boolean) : [];
      return EXPECTED_RPC_ARGS.every((a) => names.includes(a));
    }) ?? null;
  const primaryRpc = primaryFull ?? result.rpcArgsNamed[0] ?? null;
  const argNames = Array.isArray(primaryRpc?.arg_names)
    ? primaryRpc.arg_names.filter(Boolean)
    : [];
  const missingRpcArgs = EXPECTED_RPC_ARGS.filter((a) => !argNames.includes(a));
  const hasAttendingBoolean =
    typeof primaryRpc?.full_args === "string" &&
    /p_attending\s+boolean/i.test(primaryRpc.full_args);
  const rpcSignatureCompatible =
    submitEditionRsvpPresent &&
    Boolean(primaryFull) &&
    missingRpcArgs.length === 0 &&
    hasAttendingBoolean;
  const SIG11 =
    "public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text, text, text, boolean)";
  const SIG8 =
    "public.submit_edition_rsvp(uuid, text, text, boolean, integer, text, text, text)";

  const priv11 = Object.fromEntries(
    (result.effectivePrivs || [])
      .filter((p) => p.sig === SIG11)
      .map((p) => [p.role, p.has_execute]),
  );
  const priv8 = Object.fromEntries(
    (result.effectivePrivs || [])
      .filter((p) => p.sig === SIG8)
      .map((p) => [p.role, p.has_execute]),
  );

  // Enumerate all overloads later in print section
  out("RPC_COMPAT_OVERLOAD_SELECTED", Boolean(primaryFull));

  const hasServiceRoleExecute = Boolean(priv11.service_role);
  const hasAnonExecute = Boolean(priv11.anon);
  const hasAuthenticatedExecute = Boolean(priv11.authenticated);
  const hasPublicExecute = Boolean(priv11.PUBLIC);
  const hasPostgresExecute = Boolean(priv11.postgres);

  // 11-arg: service_role true; PUBLIC/anon/authenticated false; postgres/owner typically true
  // 8-arg: no API execute (PUBLIC/anon/authenticated/service_role false)
  const overload8Locked =
    !priv8.PUBLIC && !priv8.anon && !priv8.authenticated && !priv8.service_role;
  const rpcGrantsCompatible =
    hasServiceRoleExecute &&
    !hasAnonExecute &&
    !hasAuthenticatedExecute &&
    !hasPublicExecute &&
    overload8Locked;

  const securityDefiner = Boolean(
    (primaryFull ?? result.rpcArgsNamed.find((r) => r.nargs === 11) ?? result.rpcRows[0])
      ?.security_definer,
  );

  const eventsRlsOn = Boolean(result.eventsRls?.rls_enabled);
  const guestsRlsOn = Boolean(result.guestsRls?.rls_enabled);
  const rlsCompatible = eventsRlsOn && guestsRlsOn;

  const versions = result.migrationHistory.map((m) => String(m.version));
  const migrationMarkers = Object.fromEntries(
    MIGRATION_036_043.map((v) => [
      v,
      versions.some((x) => x === v || x.startsWith(v) || x.includes(`_${v}_`) || x.includes(v)),
    ]),
  );
  // Also detect by object presence after optional rollback
  const migrations036to043Present = MIGRATION_036_043.every((v) => migrationMarkers[v]);
  const clientAppPresent = Boolean(
    result.clientAppObjects?.profiles ||
      result.clientAppObjects?.client_events ||
      result.clientAppObjects?.provision_rpc,
  );

  const dedupeIndexes = result.indexes.filter((i) => {
    const def = String(i.indexdef || "").toLowerCase();
    return (
      i.tablename === "guests" &&
      (def.includes("name_normalized") ||
        def.includes("guest_source") ||
        def.includes("email") ||
        def.includes("phone") ||
        def.includes("qr_token"))
    );
  });

  const testEvent =
    result.safeSyntheticCandidates[0] ?? result.emptySafeCandidates[0] ?? null;
  const testEventAvailable = Boolean(testEvent);
  const protectedDataPresent = result.protectedLike.length > 0;
  const syntheticEventRequired = !testEventAvailable;

  const schemaCurrent =
    result.eventsExists &&
    result.guestsExists &&
    result.eventColNames.includes("edition_registry_key") &&
    result.eventColNames.includes("find_seat_code");

  const corePr7Compatible =
    schemaCurrent &&
    submitEditionRsvpPresent &&
    rpcSignatureCompatible &&
    rpcGrantsCompatible &&
    requiredColumnsPresent;

  // Edition PR #4 in proxy mode hits Core; still needs boolean attending + event id binding.
  const editionPr4Compatible =
    corePr7Compatible && hasAttendingBoolean;

  const blockers = [];
  if (!result.eventsExists) blockers.push("public.events ausente");
  if (!result.guestsExists) blockers.push("public.guests ausente");
  if (!submitEditionRsvpPresent) blockers.push("submit_edition_rsvp ausente");
  if (!rpcSignatureCompatible) {
    blockers.push(
      `RPC assinatura incompatível; missing=[${missingRpcArgs.join(",")}] attendingBoolean=${hasAttendingBoolean}`,
    );
  }
  if (!rpcGrantsCompatible) {
    blockers.push(
      `RPC grants incompatíveis service_role=${hasServiceRoleExecute} anon=${hasAnonExecute} authenticated=${hasAuthenticatedExecute} PUBLIC=${hasPublicExecute}`,
    );
  }
  if (!rlsCompatible) blockers.push("RLS events/guests incompleto");
  if (!requiredColumnsPresent) {
    blockers.push(
      `colunas em falta events=[${missingEventCols.join(",")}] guests=[${missingGuestCols.join(",")}]`,
    );
  }
  if (syntheticEventRequired) {
    blockers.push("sem evento seguro de teste — syntheticEventRequired=true");
  }

  const risks = [];
  if (protectedDataPresent) {
    risks.push(
      `${result.protectedLike.length} evento(s) Jessica/Samuel/traditional-wedding no clone (protegidos)`,
    );
  }
  if (!migrations036to043Present) {
    risks.push(
      "histórico 036–043 incompleto ou ausente (esperado se PR4.1 fez rollback)",
    );
  }
  if (clientAppPresent && !migrations036to043Present) {
    risks.push("objectos client-app presentes sem histórico 036–043 claro");
  }
  if (!clientAppPresent) {
    risks.push("objectos 036–043 client-app ausentes no clone (ok para Phase0 RSVP se 025/026 OK)");
  }
  if (dedupeIndexes.length === 0) {
    risks.push("sem índices óbvios de dedupe em guests (dedupe pode ser só na RPC/app)");
  }
  if (hasAuthenticatedExecute) {
    risks.push("authenticated tem EXECUTE em submit_edition_rsvp");
  }
  if (!securityDefiner) {
    risks.push("submit_edition_rsvp não é SECURITY DEFINER");
  }

  // Ready for Preview env config: schema/RPC OK. Test event can be created later with auth.
  // User asked testEventAvailable separately — cloneReady requires core compat; synthetic is a soft blocker for writes later not for env prep.
  const cloneReady =
    corePr7Compatible &&
    editionPr4Compatible &&
    rlsCompatible &&
    blockers.filter((b) => !b.includes("syntheticEventRequired")).length === 0;

  const previewEnvDecision = cloneReady
    ? syntheticEventRequired
      ? "GO_CONDITIONAL"
      : "GO"
    : "NO_GO";

  // --- human-readable lines ---
  out("cloneReachable", true);
  out("cloneIdentityVerified", true);
  out("current_database", result.identity?.db ?? "");
  out("current_user", result.identity?.db_user ?? "");
  out("session_user", result.identity?.session_user ?? "");
  out("server_version", result.identity?.server_version ?? "");
  out("schemaCurrent", schemaCurrent);
  out("publicTableCount", result.publicTableCount);
  out("eventsTablePresent", result.eventsExists);
  out("guestsTablePresent", result.guestsExists);
  out("submitEditionRsvpPresent", submitEditionRsvpPresent);
  out("rpcCount", result.rpcRows.length);
  out("RPC_OVERLOAD_COUNT", result.rpcArgsNamed.length);
  for (const o of result.rpcArgsNamed) {
    out(
      "RPC_OVERLOAD",
      `nargs=${o.nargs}|oid=${o.oid}|security_definer=${o.security_definer}|owner=${o.owner}|args=${o.identity_args || o.full_args}`,
    );
  }
  for (const p of result.effectivePrivs || []) {
    out("EFFECTIVE_PRIV", `${p.sig}|${p.role}|${p.has_execute}`);
  }
  out("EFFECTIVE_11_service_role", Boolean(priv11.service_role));
  out("EFFECTIVE_11_PUBLIC", Boolean(priv11.PUBLIC));
  out("EFFECTIVE_11_anon", Boolean(priv11.anon));
  out("EFFECTIVE_11_authenticated", Boolean(priv11.authenticated));
  out("EFFECTIVE_11_postgres", Boolean(priv11.postgres));
  out("EFFECTIVE_8_service_role", Boolean(priv8.service_role));
  out("EFFECTIVE_8_PUBLIC", Boolean(priv8.PUBLIC));
  out("OVERLOAD_8_LOCKED", overload8Locked);
  for (const r of result.rpcRows) {
    out("RPC_SIGNATURE", r.signature);
    out("RPC_OWNER", r.owner);
    out("RPC_SECURITY_DEFINER", Boolean(r.security_definer));
  }
  if (primaryRpc) {
    out("RPC_FULL_ARGS", primaryRpc.full_args);
    out("RPC_RESULT", primaryRpc.result_type);
    out("RPC_ARG_NAMES", argNames.join("|"));
  }
  out("rpcSignatureCompatible", rpcSignatureCompatible);
  out("rpcGrantsCompatible", rpcGrantsCompatible);
  out("RPC_GRANT_service_role_EXECUTE", hasServiceRoleExecute);
  out("RPC_GRANT_authenticated_EXECUTE", hasAuthenticatedExecute);
  out("RPC_GRANT_anon_EXECUTE", hasAnonExecute);
  out("RPC_GRANT_PUBLIC_EXECUTE", hasPublicExecute);
  out("rlsCompatible", rlsCompatible);
  out("EVENTS_RLS", JSON.stringify(result.eventsRls));
  out("GUESTS_RLS", JSON.stringify(result.guestsRls));
  out("POLICY_COUNT", result.policies.length);
  for (const p of result.policies) {
    out(
      "POLICY",
      `${p.tablename}|${p.policyname}|cmd=${p.cmd}|roles=${p.roles}|using=${p.has_using}|check=${p.has_check}`,
    );
  }
  for (const g of result.tableGrants) {
    out("TABLE_GRANT", `${g.table_name}|${g.grantee}|${g.privs}`);
  }
  out("requiredColumnsPresent", requiredColumnsPresent);
  out("EVENT_COLS_REQUIRED_OK", missingEventCols.length === 0);
  out("GUEST_COLS_REQUIRED_OK", missingGuestCols.length === 0);
  out("has_edition_registry_key", result.eventColNames.includes("edition_registry_key"));
  out("has_find_seat_code", result.eventColNames.includes("find_seat_code"));
  out("INDEX_COUNT_events_guests", result.indexes.length);
  out("DEDUPE_INDEX_HINT_COUNT", dedupeIndexes.length);
  for (const i of dedupeIndexes.slice(0, 12)) {
    out("DEDUPE_INDEX", `${i.tablename}|${i.indexname}`);
  }
  for (const c of result.constraints.filter((x) => x.constraint_type === "UNIQUE")) {
    out("UNIQUE_CONSTRAINT", `${c.table_name}|${c.constraint_name}|${c.cols}`);
  }
  out("migrations036to043Present", migrations036to043Present);
  out("MIGRATION_HISTORY_COUNT", result.migrationHistory.length);
  out(
    "MIGRATION_036_043_MARKERS",
    MIGRATION_036_043.map((v) => `${v}:${migrationMarkers[v]}`).join("|"),
  );
  out("CLIENT_APP_OBJECTS", JSON.stringify(result.clientAppObjects));
  out("EVENTS_TOTAL", result.eventCounts?.events_total ?? 0);
  out("EVENTS_ACTIVE", result.eventCounts?.events_active ?? 0);
  out("EVENTS_WITH_REGISTRY", result.eventCounts?.with_registry ?? 0);
  out("GUESTS_TOTAL", result.guestCounts?.guests_total ?? 0);
  out("GUESTS_EDITION_RSVP", result.guestCounts?.edition_rsvp_guests ?? 0);
  out("protectedDataPresent", protectedDataPresent);
  out("PROTECTED_LIKE_COUNT", result.protectedLike.length);
  for (const e of result.protectedLike.slice(0, 8)) {
    out(
      "PROTECTED_EVENT",
      `id=${e.id}|registry=${e.registry_key || "-"}|active=${e.is_active}|find_seat=${e.find_seat}|guests=${e.guest_count}|name=${e.name}`,
    );
  }
  out("testEventAvailable", testEventAvailable);
  out("syntheticEventRequired", syntheticEventRequired);
  if (testEvent) {
    out("TEST_EVENT_ID", testEvent.id);
    out("TEST_EVENT_REGISTRY", testEvent.registry_key || "");
    out("TEST_EVENT_FIND_SEAT", testEvent.find_seat);
    out("TEST_EVENT_GUESTS", testEvent.guest_count);
    out("TEST_EVENT_NAME", testEvent.name);
  } else {
    out("TEST_EVENT_ID", "NONE");
  }
  out("corePr7Compatible", corePr7Compatible);
  out("editionPr4Compatible", editionPr4Compatible);
  out("cloneReady", cloneReady);
  for (const b of blockers) out("BLOCKER", b);
  for (const r of risks) out("RISK", r);
  out("previewEnvDecision", previewEnvDecision);
  out("productionTouched", false);
  out("WRITE_OPERATIONS", "none");
  out("MCP_SUPABASE_USED", false);

  const report = {
    cloneReachable: true,
    cloneIdentityVerified: true,
    schemaCurrent,
    migrations036to043Present,
    eventsTablePresent: result.eventsExists,
    guestsTablePresent: result.guestsExists,
    submitEditionRsvpPresent,
    rpcSignatureCompatible,
    rpcGrantsCompatible,
    rlsCompatible,
    requiredColumnsPresent,
    testEventAvailable,
    protectedDataPresent,
    syntheticEventRequired,
    corePr7Compatible,
    editionPr4Compatible,
    cloneReady,
    blockers,
    risks,
    previewEnvDecision,
    productionTouched: false,
    testEventId: testEvent?.id ?? null,
    credentialsCleanup: "handled_by_wrapper",
  };
  console.log(`REPORT_JSON=${JSON.stringify(report)}`);
}

main().catch((err) => {
  console.error("FAIL unhandled", String(err?.message ?? err));
  process.exit(1);
});
